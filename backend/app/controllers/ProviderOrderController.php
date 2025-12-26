<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Order;
use App\Models\Notification;
use App\Helpers\AutoPayment;
use App\Helpers\CancellationService;
use App\Helpers\PenaltyService;

class ProviderOrderController extends Controller
{
    private Order $orderModel;
    private Notification $notificationModel;

    public function __construct()
    {
        $this->orderModel = new Order();
        $this->notificationModel = new Notification();
    }

    /**
     * Liste les commandes du prestataire
     */
    public function index(): void
    {
        $providerId = $_SERVER['USER_ID'];
        $queryParams = $this->getQueryParams();

        $status = $queryParams['status'] ?? null;
        $orders = $this->orderModel->getProviderOrders($providerId, $status);

        $this->success($orders);
    }

    /**
     * Recupere les details d'une commande du prestataire
     */
    public function show(string $orderId): void
    {
        $providerId = $_SERVER['USER_ID'];
        $order = $this->orderModel->getDetailedOrder((int)$orderId);

        if (!$order) {
            $this->error('Commande non trouvee', 404);
        }

        // Verifier que la commande appartient au prestataire
        // Soit le prestataire est assigne, soit la commande est en attente (bidding)
        if ($order['provider_id'] != $providerId && $order['status'] !== 'pending') {
            $this->error('Acces refuse', 403);
        }

        $this->success($order);
    }

    /**
     * Accepte une commande
     */
    public function accept(string $orderId): void
    {
        $providerId = $_SERVER['USER_ID'];

        // Vérifier si le prestataire a déjà une commande active
        $activeOrder = $this->orderModel->hasActiveOrder($providerId);
        if ($activeOrder) {
            $statusLabels = [
                'accepted' => 'acceptée',
                'on_way' => 'en route',
                'in_progress' => 'en cours'
            ];
            $statusLabel = $statusLabels[$activeOrder['status']] ?? $activeOrder['status'];
            $this->error(
                "Vous avez déjà une commande {$statusLabel} (#{$activeOrder['id']} - {$activeOrder['service_name']}). Terminez-la avant d'en accepter une nouvelle.",
                400
            );
        }

        $order = $this->orderModel->find((int)$orderId);

        if (!$order) {
            $this->error('Commande non trouvée', 404);
        }

        if ($order['status'] !== 'pending') {
            $this->error('Cette commande ne peut plus être acceptée', 400);
        }

        // Assigner le prestataire et changer le statut
        $this->orderModel->assignProvider((int)$orderId, $providerId);

        $updatedOrder = $this->orderModel->getDetailedOrder((int)$orderId);

        // Notifier le client
        $this->notificationModel->notifyUserOrderStatusChange($updatedOrder, 'accepted');

        $this->success($updatedOrder, 'Commande acceptée');
    }

    /**
     * Indique que le prestataire est en route
     */
    public function start(string $orderId): void
    {
        $providerId = $_SERVER['USER_ID'];

        $order = $this->orderModel->find((int)$orderId);

        if (!$order) {
            $this->error('Commande non trouvée', 404);
        }

        if ($order['provider_id'] != $providerId) {
            $this->error('Accès refusé', 403);
        }

        if ($order['status'] !== 'accepted') {
            $this->error('La commande doit être acceptée avant de commencer', 400);
        }

        $this->orderModel->updateStatus((int)$orderId, 'on_way');

        // Notifier le client
        $updatedOrder = $this->orderModel->getDetailedOrder((int)$orderId);
        $this->notificationModel->notifyUserOrderStatusChange($updatedOrder, 'on_way');

        $this->success(null, 'Statut mis à jour : en route');
    }

    /**
     * Indique que le prestataire est arrivé (attend confirmation client)
     */
    public function arrive(string $orderId): void
    {
        $providerId = $_SERVER['USER_ID'];
        error_log("[ARRIVE] Provider $providerId calling arrive for order $orderId");

        $order = $this->orderModel->find((int)$orderId);

        if (!$order) {
            error_log("[ARRIVE] Order $orderId not found");
            $this->error('Commande non trouvée', 404);
        }

        error_log("[ARRIVE] Order found: status={$order['status']}, provider_id={$order['provider_id']}");

        if ($order['provider_id'] != $providerId) {
            error_log("[ARRIVE] Access denied: order provider={$order['provider_id']}, request provider=$providerId");
            $this->error('Accès refusé', 403);
        }

        if ($order['status'] !== 'on_way') {
            error_log("[ARRIVE] Wrong status: expected on_way, got {$order['status']}");
            $this->error('Vous devez être en route pour marquer votre arrivée', 400);
        }

        error_log("[ARRIVE] Updating status to arrived...");
        $result = $this->orderModel->updateStatus((int)$orderId, 'arrived');
        error_log("[ARRIVE] Update result: " . ($result ? 'success' : 'failed'));

        // Notifier le client pour confirmation
        $updatedOrder = $this->orderModel->getDetailedOrder((int)$orderId);
        $this->notificationModel->createNotification([
            "recipient_type" => "user",
            "recipient_id" => $order["user_id"],
            "order_id" => (int)$orderId,
            "notification_type" => "provider_arrived",
            "title" => "Votre prestataire est arrivé !",
            "message" => "Veuillez confirmer son arrivée pour démarrer la prestation."
        ]);

        $this->success($updatedOrder, 'En attente de confirmation du client');
    }

    /**
     * Marque la commande comme terminée et déclenche le paiement automatique
     */
    public function complete(string $orderId): void
    {
        $providerId = $_SERVER['USER_ID'];

        $order = $this->orderModel->find((int)$orderId);

        if (!$order) {
            $this->error('Commande non trouvée', 404);
        }

        if ($order['provider_id'] != $providerId) {
            $this->error('Accès refusé', 403);
        }

        if (!in_array($order['status'], ['on_way', 'in_progress'])) {
            $this->error('Impossible de terminer cette commande', 400);
        }

        // Mettre à jour le statut
        $this->orderModel->updateStatus((int)$orderId, 'completed');

        // Déclencher le paiement automatique
        $paymentResult = AutoPayment::processPayment((int)$orderId);

        // Notifier le client
        $updatedOrder = $this->orderModel->getDetailedOrder((int)$orderId);
        $this->notificationModel->notifyUserOrderStatusChange($updatedOrder, 'completed');

        // Ajouter notification de paiement si succès
        if ($paymentResult['success'] && isset($paymentResult['data']['amount'])) {
            $paymentMethod = $paymentResult['data']['payment_method'] ?? 'card';
            $amount = $paymentResult['data']['amount'];

            if ($paymentMethod === 'card') {
                $this->notificationModel->createNotification([
                    "recipient_type" => "user",
                    "recipient_id" => $order["user_id"],
                    "order_id" => (int)$orderId,
                    "notification_type" => "payment_completed",
                    "title" => "Paiement effectué",
                    "message" => "Le paiement de {$amount} MAD a été effectué automatiquement."
                ]);
            }
        }

        $this->success([
            'order' => $updatedOrder,
            'payment' => $paymentResult
        ], 'Commande terminée' . ($paymentResult['success'] ? ' - ' . $paymentResult['message'] : ''));
    }

    /**
     * Annule une commande acceptée par le prestataire
     * Applique des pénalités et recherche un remplacement
     */
    public function cancel(string $orderId): void
    {
        $providerId = $_SERVER['USER_ID'];
        $data = $this->getJsonInput();

        $order = $this->orderModel->getDetailedOrder((int)$orderId);

        if (!$order) {
            $this->error('Commande non trouvée', 404);
        }

        if ($order['provider_id'] != $providerId) {
            $this->error('Accès refusé', 403);
        }

        // Seules les commandes acceptées ou en route peuvent être annulées par le prestataire
        if (!in_array($order['status'], ['accepted', 'on_way'])) {
            $this->error('Impossible d\'annuler cette commande', 400);
        }

        $reason = $data['reason'] ?? 'Non spécifié';

        // Calculer les pénalités avec le CancellationService
        $cancellationService = new CancellationService();
        $penaltyInfo = $cancellationService->calculateCancellationFee($order, 'provider');

        // Appliquer les pénalités
        $penaltyService = new PenaltyService();
        $penaltyResult = null;

        if ($penaltyInfo['penalty_points'] > 0) {
            $penaltyResult = $penaltyService->addPenalty(
                $providerId,
                'cancellation',
                $penaltyInfo['penalty_points'],
                (int)$orderId,
                "Annulation de commande ({$order['status']}): $reason"
            );
        }

        // Enregistrer l'annulation avec les détails
        $cancellationData = [
            'cancelled_by' => 'provider',
            'cancelled_at' => date('Y-m-d H:i:s'),
            'cancellation_reason' => $reason,
            'provider_id' => null, // Libérer la commande
            'status' => 'pending'  // Remettre en attente pour un autre prestataire
        ];

        $this->orderModel->update((int)$orderId, $cancellationData);

        // Récupérer les détails complets de la commande
        $updatedOrder = $this->orderModel->getDetailedOrder((int)$orderId);

        // Notifier le client de l'annulation
        $this->notificationModel->notifyUserProviderCancellation($updatedOrder, $reason, 0);

        // Notifier les autres prestataires disponibles (re-diffuser la commande)
        $this->notificationModel->notifyProvidersForNewOrder($updatedOrder);

        // Mettre à jour le taux d'annulation du prestataire
        $penaltyService->updateCancellationRate($providerId);

        $response = [
            'order' => $updatedOrder,
            'message' => 'Commande annulée. Un autre prestataire sera recherché.'
        ];

        // Ajouter les infos de pénalité si applicable
        if ($penaltyResult) {
            $response['penalty'] = [
                'points_added' => $penaltyInfo['penalty_points'],
                'action' => $penaltyResult['suspension']['action'] ?? 'none',
                'message' => $penaltyResult['suspension']['message'] ?? null
            ];

            // Avertir si proche de la suspension
            if ($penaltyResult['suspension']['action'] === 'warning') {
                $response['warning'] = 'Attention: vous accumulez des points de pénalité. Trop d\'annulations entraînera une suspension de votre compte.';
            }
        }

        $this->success($response, 'Annulation enregistrée');
    }

    /**
     * Incrémente le compteur d'annulations d'un prestataire
     */
    private function incrementProviderCancellations(int $providerId): void
    {
        try {
            $db = \App\Core\Database::getInstance();
            $stmt = $db->prepare(
                "UPDATE providers SET cancellation_count = COALESCE(cancellation_count, 0) + 1 WHERE id = ?"
            );
            $stmt->execute([$providerId]);
        } catch (\Exception $e) {
            // Ignorer les erreurs si la colonne n'existe pas encore
            error_log("Note: cancellation_count column may not exist: " . $e->getMessage());
        }
    }
}
