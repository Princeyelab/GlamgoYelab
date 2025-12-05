<?php

/**
 * SatisfactionController
 * Gestion des questionnaires de satisfaction post-prestation
 *
 * Workflow:
 * 1. Prestataire clique "Terminer" -> order.status = 'completed_pending_review'
 * 2. Client recoit notification
 * 3. Client remplit questionnaire obligatoire
 * 4. Validation = liberation paiement + commission GlamGo
 *
 * GlamGo - Marrakech
 * @since 2025-11-28
 */

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Order;
use App\Models\SatisfactionSurvey;
use App\Models\Notification;
use App\Models\Provider;
use App\Helpers\AutoPayment;

class SatisfactionController extends Controller
{
    private Order $orderModel;
    private SatisfactionSurvey $surveyModel;
    private Notification $notificationModel;
    private Provider $providerModel;

    public function __construct()
    {
        $this->orderModel = new Order();
        $this->surveyModel = new SatisfactionSurvey();
        $this->notificationModel = new Notification();
        $this->providerModel = new Provider();
    }

    /**
     * POST /api/provider/orders/{id}/complete-service
     * Prestataire signale la fin de la prestation
     *
     * Passe le statut de 'in_progress' a 'completed_pending_review'
     * et envoie une notification au client pour remplir le questionnaire.
     */
    public function markCompletedByProvider(string $orderId): void
    {
        // Le middleware met user_id dans USER_ID pour les providers aussi
        // On verifie que c'est bien un provider via le role dans le token
        $providerId = $_SERVER['USER_ID'] ?? null;

        if (!$providerId) {
            $this->error('Authentification prestataire requise', 401);
        }

        $order = $this->orderModel->find((int)$orderId);

        if (!$order) {
            $this->error('Commande introuvable', 404);
        }

        // Verifier que la commande appartient au prestataire
        if ($order['provider_id'] != $providerId) {
            $this->error('Cette commande ne vous appartient pas', 403);
        }

        // Verifier le statut actuel
        if ($order['status'] !== 'in_progress') {
            $this->error('Cette commande n\'est pas en cours. Statut actuel: ' . $order['status'], 400);
        }

        // Mettre a jour le statut
        $updated = $this->orderModel->update((int)$orderId, [
            'status' => 'completed_pending_review',
            'provider_completed_at' => date('Y-m-d H:i:s')
        ]);

        if (!$updated) {
            $this->error('Erreur lors de la mise a jour de la commande', 500);
        }

        // Recuperer les details pour la notification
        $orderDetails = $this->orderModel->getDetailedOrder((int)$orderId);

        // Creer notification pour le client
        $this->notificationModel->createNotification([
            'recipient_type' => 'user',
            'recipient_id' => $order['user_id'],
            'order_id' => (int)$orderId,
            'notification_type' => 'satisfaction_request',
            'title' => 'Prestation terminee - Evaluez le service',
            'message' => 'Votre prestation est terminee. Merci d\'evaluer le service recu pour liberer le paiement.',
            'data' => [
                'order_id' => (int)$orderId,
                'service_name' => $orderDetails['service_name'] ?? 'Service',
                'provider_name' => ($orderDetails['provider_first_name'] ?? '') . ' ' . ($orderDetails['provider_last_name'] ?? ''),
                'requires_review' => true
            ]
        ]);

        error_log("[SATISFACTION] Order #{$orderId} marked as completed_pending_review by provider #{$providerId}");

        $this->success([
            'message' => 'Prestation signalee comme terminee',
            'order_id' => (int)$orderId,
            'new_status' => 'completed_pending_review',
            'next_step' => 'Le client va recevoir une demande d\'evaluation'
        ]);
    }

    /**
     * POST /api/orders/{id}/satisfaction
     * Client soumet le questionnaire de satisfaction
     *
     * Declenche:
     * - Enregistrement du questionnaire
     * - Passage status 'completed_pending_review' -> 'completed'
     * - Liberation du paiement
     * - Mise a jour stats prestataire
     */
    public function submitSatisfaction(string $orderId): void
    {
        $userId = $_SERVER['USER_ID'] ?? null;

        if (!$userId) {
            $this->error('Authentification requise', 401);
        }

        $data = $this->getJsonInput();

        // Validation des donnees obligatoires
        $errors = $this->validate($data, [
            'quality_rating' => 'required|numeric',
        ]);

        if (!empty($errors)) {
            $this->error('Donnees invalides', 422, $errors);
        }

        // Validation manuelle des champs specifiques
        $quality_rating = intval($data['quality_rating'] ?? 0);
        if ($quality_rating < 1 || $quality_rating > 5) {
            $this->error('La note de qualite doit etre entre 1 et 5', 422);
        }

        if (!isset($data['punctuality']) || !is_bool($data['punctuality'])) {
            // Accepter aussi les strings 'true'/'false' et 0/1
            if (isset($data['punctuality'])) {
                $data['punctuality'] = filter_var($data['punctuality'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            }
            if ($data['punctuality'] === null) {
                $this->error('Veuillez indiquer si le prestataire etait ponctuel', 422);
            }
        }

        if (!isset($data['price_respected']) || !is_bool($data['price_respected'])) {
            if (isset($data['price_respected'])) {
                $data['price_respected'] = filter_var($data['price_respected'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            }
            if ($data['price_respected'] === null) {
                $this->error('Veuillez indiquer si le prix a ete respecte', 422);
            }
        }

        // Verifier la commande
        $order = $this->orderModel->find((int)$orderId);

        if (!$order) {
            $this->error('Commande introuvable', 404);
        }

        if ($order['user_id'] != $userId) {
            $this->error('Cette commande ne vous appartient pas', 403);
        }

        if ($order['status'] !== 'completed_pending_review') {
            if ($order['status'] === 'completed') {
                $this->error('Vous avez deja evalue cette prestation', 400);
            }
            $this->error('Cette commande n\'est pas en attente d\'evaluation. Statut: ' . $order['status'], 400);
        }

        // Verifier qu'un questionnaire n'existe pas deja
        if ($this->surveyModel->existsForOrder((int)$orderId)) {
            $this->error('Un questionnaire a deja ete soumis pour cette commande', 400);
        }

        // Creer le questionnaire
        $surveyData = [
            'order_id' => (int)$orderId,
            'user_id' => (int)$userId,
            'provider_id' => $order['provider_id'],
            'quality_rating' => $quality_rating,
            'punctuality' => (bool)$data['punctuality'],
            'price_respected' => (bool)$data['price_respected'],
            'professionalism_rating' => isset($data['professionalism_rating']) ? intval($data['professionalism_rating']) : null,
            'comment' => $data['comment'] ?? null,
            'photos' => $data['photos'] ?? [],
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null
        ];

        // Valider professionalism_rating si present
        if ($surveyData['professionalism_rating'] !== null) {
            if ($surveyData['professionalism_rating'] < 1 || $surveyData['professionalism_rating'] > 5) {
                $this->error('La note de professionnalisme doit etre entre 1 et 5', 422);
            }
        }

        // Valider longueur commentaire
        if (!empty($surveyData['comment']) && strlen($surveyData['comment']) > 1000) {
            $this->error('Le commentaire ne doit pas depasser 1000 caracteres', 422);
        }

        try {
            // Enregistrer le questionnaire
            $surveyId = $this->surveyModel->createSurvey($surveyData);

            error_log("[SATISFACTION] Survey #{$surveyId} created for order #{$orderId}");

            // Traiter le pourboire si présent (uniquement pour paiement carte)
            $tipAmount = 0;
            if (isset($data['tip']) && $data['tip'] > 0 && $order['payment_method'] === 'card') {
                $tipAmount = floatval($data['tip']);
                // Limiter le pourboire à 500 MAD max
                $tipAmount = min($tipAmount, 500);

                // Mettre à jour le pourboire et le total
                $newTotal = floatval($order['total']) + $tipAmount;
                $this->orderModel->update((int)$orderId, [
                    'tip' => $tipAmount,
                    'total' => $newTotal
                ]);

                error_log("[SATISFACTION] Tip of {$tipAmount} MAD added to order #{$orderId}. New total: {$newTotal}");
            }

            // Mettre a jour le statut de la commande
            $this->orderModel->update((int)$orderId, [
                'status' => 'completed',
                'completed_at' => date('Y-m-d H:i:s')
            ]);

            // Declencher le paiement automatique (inclut le pourboire si ajouté)
            $paymentResult = AutoPayment::processPayment((int)$orderId);

            error_log("[SATISFACTION] Payment result for order #{$orderId}: " . json_encode($paymentResult));

            // Mettre a jour les statistiques du prestataire (fait par trigger SQL aussi)
            $this->updateProviderStats($order['provider_id'], $quality_rating);

            // Notifier le prestataire
            $notificationMessage = "Vous avez recu {$quality_rating}/5 etoiles pour votre prestation.";
            if ($tipAmount > 0) {
                $notificationMessage .= " Le client vous a laisse un pourboire de {$tipAmount} MAD !";
            }

            $this->notificationModel->createNotification([
                'recipient_type' => 'provider',
                'recipient_id' => $order['provider_id'],
                'order_id' => (int)$orderId,
                'notification_type' => 'satisfaction_received',
                'title' => $tipAmount > 0 ? 'Evaluation recue + Pourboire !' : 'Evaluation recue',
                'message' => $notificationMessage,
                'data' => [
                    'order_id' => (int)$orderId,
                    'rating' => $quality_rating,
                    'survey_id' => $surveyId,
                    'tip' => $tipAmount,
                    'payment_processed' => $paymentResult['success'] ?? false
                ]
            ]);

            $this->success([
                'message' => $tipAmount > 0
                    ? "Merci pour votre evaluation et votre pourboire de {$tipAmount} MAD !"
                    : 'Merci pour votre evaluation !',
                'survey_id' => $surveyId,
                'order_status' => 'completed',
                'tip' => $tipAmount > 0 ? [
                    'amount' => $tipAmount,
                    'message' => "Pourboire de {$tipAmount} MAD ajouté au paiement"
                ] : null,
                'payment' => [
                    'processed' => $paymentResult['success'] ?? false,
                    'message' => $paymentResult['message'] ?? 'Paiement en cours de traitement',
                    'data' => $paymentResult['data'] ?? null
                ]
            ]);

        } catch (\Exception $e) {
            error_log("[SATISFACTION] Error creating survey: " . $e->getMessage());
            $this->error('Erreur lors de l\'enregistrement de l\'evaluation', 500);
        }
    }

    /**
     * GET /api/orders/{id}/satisfaction-status
     * Verifie le statut du questionnaire pour une commande
     */
    public function getSatisfactionStatus(string $orderId): void
    {
        $userId = $_SERVER['USER_ID'] ?? null;

        if (!$userId) {
            $this->error('Authentification requise', 401);
        }

        $order = $this->orderModel->find((int)$orderId);

        if (!$order) {
            $this->error('Commande introuvable', 404);
        }

        if ($order['user_id'] != $userId) {
            $this->error('Cette commande ne vous appartient pas', 403);
        }

        $survey = $this->surveyModel->findByOrderId((int)$orderId);

        $this->success([
            'order_id' => (int)$orderId,
            'order_status' => $order['status'],
            'pending_review' => $order['status'] === 'completed_pending_review',
            'survey_submitted' => $survey !== null,
            'survey' => $survey ? [
                'id' => $survey['id'],
                'quality_rating' => $survey['quality_rating'],
                'punctuality' => (bool)$survey['punctuality'],
                'price_respected' => (bool)$survey['price_respected'],
                'professionalism_rating' => $survey['professionalism_rating'],
                'comment' => $survey['comment'],
                'submitted_at' => $survey['submitted_at']
            ] : null
        ]);
    }

    /**
     * GET /api/user/pending-reviews
     * Liste les commandes en attente d'evaluation pour l'utilisateur
     */
    public function getPendingReviews(): void
    {
        $userId = $_SERVER['USER_ID'] ?? null;

        if (!$userId) {
            $this->error('Authentification requise', 401);
        }

        $pendingOrders = $this->surveyModel->getPendingReviews((int)$userId);
        $count = count($pendingOrders);

        $this->success([
            'count' => $count,
            'orders' => $pendingOrders,
            'has_pending' => $count > 0
        ]);
    }

    /**
     * GET /api/provider/satisfaction-stats
     * Statistiques de satisfaction pour le prestataire connecte
     */
    public function getProviderSatisfactionStats(): void
    {
        $providerId = $_SERVER['USER_ID'] ?? null;

        if (!$providerId) {
            $this->error('Authentification prestataire requise', 401);
        }

        $stats = $this->surveyModel->getProviderStats((int)$providerId);
        $recentReviews = $this->surveyModel->getLatestReviewsWithComments((int)$providerId, 5);

        $this->success([
            'stats' => $stats,
            'recent_reviews' => $recentReviews
        ]);
    }

    /**
     * GET /api/providers/{id}/satisfaction
     * Statistiques de satisfaction publiques d'un prestataire
     */
    public function getPublicProviderStats(string $providerId): void
    {
        $provider = $this->providerModel->find((int)$providerId);

        if (!$provider) {
            $this->error('Prestataire introuvable', 404);
        }

        $stats = $this->surveyModel->getProviderStats((int)$providerId);
        $recentReviews = $this->surveyModel->getLatestReviewsWithComments((int)$providerId, 10);

        $this->success([
            'provider' => [
                'id' => $provider['id'],
                'first_name' => $provider['first_name'],
                'last_name' => $provider['last_name'],
                'avatar' => $provider['avatar'],
                'rating' => $provider['rating']
            ],
            'satisfaction' => [
                'total_reviews' => $stats['total_reviews'],
                'avg_rating' => $stats['avg_quality_rating'],
                'punctuality_rate' => $stats['punctuality_rate'],
                'price_respect_rate' => $stats['price_respect_rate'],
                'rating_distribution' => [
                    5 => $stats['five_stars'] ?? 0,
                    4 => $stats['four_stars'] ?? 0,
                    3 => $stats['three_stars'] ?? 0,
                    2 => $stats['two_stars'] ?? 0,
                    1 => $stats['one_star'] ?? 0
                ]
            ],
            'recent_reviews' => array_map(function($review) {
                return [
                    'rating' => $review['quality_rating'],
                    'comment' => $review['comment'],
                    'service_name' => $review['service_name'],
                    'user_name' => $review['first_name'] . ' ' . substr($review['last_name'], 0, 1) . '.',
                    'date' => $review['submitted_at']
                ];
            }, $recentReviews)
        ]);
    }

    /**
     * Met a jour les statistiques du prestataire
     * Note: Le trigger SQL fait deja une partie du travail
     */
    private function updateProviderStats(int $providerId, int $newRating): void
    {
        try {
            // Recalculer le rating moyen
            $stats = $this->surveyModel->getProviderStats($providerId);

            if ($stats['avg_quality_rating']) {
                $this->providerModel->update($providerId, [
                    'rating' => $stats['avg_quality_rating']
                ]);

                error_log("[SATISFACTION] Provider #{$providerId} rating updated to {$stats['avg_quality_rating']}");
            }
        } catch (\Exception $e) {
            error_log("[SATISFACTION] Error updating provider stats: " . $e->getMessage());
        }
    }
}
