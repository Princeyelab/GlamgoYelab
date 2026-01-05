<?php
/**
 * SubscriptionController - Gestion des abonnements prestataires
 *
 * Endpoints:
 * - GET /api/subscription-plans - Liste des plans disponibles
 * - GET /api/provider/subscription - Abonnement actuel du prestataire
 * - POST /api/provider/subscription - Souscrire a un plan
 * - PUT /api/provider/subscription/cancel - Annuler l'abonnement
 * - POST /api/provider/subscription/renew - Renouveler l'abonnement
 *
 * @package GlamGo\Controllers
 */

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Database;
use App\Helpers\PaymentGateway;
use App\Helpers\PaymentLogger;
use PDO;

class SubscriptionController extends Controller
{
    private $db;
    private $logger;

    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->logger = PaymentLogger::getInstance();
    }

    /**
     * GET /api/subscription-plans
     * Liste des plans d'abonnement disponibles
     */
    public function getPlans(): void
    {
        try {
            $stmt = $this->db->prepare("
                SELECT
                    id,
                    name,
                    slug,
                    description,
                    price,
                    duration_days,
                    features,
                    visibility_boost,
                    priority_level,
                    commission_rate,
                    max_services,
                    max_photos,
                    can_access_stats,
                    can_access_chat,
                    can_urgent_bookings,
                    badge_type,
                    is_recommended,
                    sort_order
                FROM subscription_plans
                WHERE is_active = TRUE
                ORDER BY sort_order ASC
            ");
            $stmt->execute();
            $plans = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Decoder les features JSON
            foreach ($plans as &$plan) {
                $plan['features'] = json_decode($plan['features'] ?? '[]', true);
                $plan['price'] = floatval($plan['price']);
                $plan['commission_rate'] = floatval($plan['commission_rate']);
                $plan['visibility_boost'] = intval($plan['visibility_boost']);
                $plan['priority_level'] = intval($plan['priority_level']);
                $plan['max_services'] = $plan['max_services'] ? intval($plan['max_services']) : null;
                $plan['max_photos'] = intval($plan['max_photos']);
                $plan['can_access_stats'] = (bool) $plan['can_access_stats'];
                $plan['can_access_chat'] = (bool) $plan['can_access_chat'];
                $plan['can_urgent_bookings'] = (bool) $plan['can_urgent_bookings'];
                $plan['is_recommended'] = (bool) $plan['is_recommended'];
            }

            $this->success([
                'plans' => $plans,
                'currency' => 'MAD',
                'billing_period' => 'monthly'
            ]);

        } catch (\Exception $e) {
            $this->error('Erreur lors de la recuperation des plans', 500);
        }
    }

    /**
     * GET /api/provider/subscription
     * Abonnement actuel du prestataire connecte
     */
    public function getCurrentSubscription(): void
    {
        $providerId = $_SERVER['USER_ID'] ?? null;
        $userType = $_SERVER['USER_TYPE'] ?? null;

        if (!$providerId || $userType !== 'provider') {
            $this->error('Non authentifie en tant que prestataire', 401);
            return;
        }

        try {
            // Recuperer l'abonnement actif
            $stmt = $this->db->prepare("
                SELECT
                    ps.id,
                    ps.provider_id,
                    ps.plan_id,
                    ps.status,
                    ps.started_at,
                    ps.expires_at,
                    ps.payment_status,
                    ps.payment_method,
                    ps.auto_renew,
                    sp.name as plan_name,
                    sp.slug as plan_slug,
                    sp.description as plan_description,
                    sp.price as plan_price,
                    sp.features,
                    sp.visibility_boost,
                    sp.priority_level,
                    sp.commission_rate,
                    sp.max_services,
                    sp.badge_type,
                    EXTRACT(DAY FROM (ps.expires_at - NOW()))::int as days_remaining
                FROM provider_subscriptions ps
                JOIN subscription_plans sp ON ps.plan_id = sp.id
                WHERE ps.provider_id = ?
                AND ps.status IN ('active', 'pending_payment')
                ORDER BY ps.created_at DESC
                LIMIT 1
            ");
            $stmt->execute([$providerId]);
            $subscription = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($subscription) {
                $subscription['features'] = json_decode($subscription['features'] ?? '[]', true);
                $subscription['plan_price'] = floatval($subscription['plan_price']);
                $subscription['commission_rate'] = floatval($subscription['commission_rate']);
                $subscription['days_remaining'] = intval($subscription['days_remaining']);
                $subscription['auto_renew'] = (bool) $subscription['auto_renew'];
            }

            // Recuperer l'historique des abonnements
            $stmt = $this->db->prepare("
                SELECT
                    ps.id,
                    ps.status,
                    ps.started_at,
                    ps.expires_at,
                    ps.payment_amount,
                    sp.name as plan_name
                FROM provider_subscriptions ps
                JOIN subscription_plans sp ON ps.plan_id = sp.id
                WHERE ps.provider_id = ?
                ORDER BY ps.created_at DESC
                LIMIT 10
            ");
            $stmt->execute([$providerId]);
            $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $this->success([
                'current' => $subscription,
                'history' => $history,
                'has_active_subscription' => $subscription && $subscription['status'] === 'active'
            ]);

        } catch (\Exception $e) {
            $this->error('Erreur lors de la recuperation de l\'abonnement', 500);
        }
    }

    /**
     * POST /api/provider/subscription
     * Souscrire a un plan
     *
     * Body: {
     *   plan_id: int,
     *   payment_method: 'card' | 'cash' | 'transfer' | 'free'
     * }
     */
    public function subscribe(): void
    {
        $providerId = $_SERVER['USER_ID'] ?? null;
        $userType = $_SERVER['USER_TYPE'] ?? null;

        if (!$providerId || $userType !== 'provider') {
            $this->error('Non authentifie en tant que prestataire', 401);
            return;
        }

        $data = $this->getJsonInput();

        // Validation
        $errors = $this->validate($data, [
            'plan_id' => 'required|numeric'
        ]);

        if (!empty($errors)) {
            $this->error('Donnees invalides', 400, $errors);
            return;
        }

        try {
            // Verifier que le plan existe
            $stmt = $this->db->prepare("
                SELECT * FROM subscription_plans WHERE id = ? AND is_active = TRUE
            ");
            $stmt->execute([$data['plan_id']]);
            $plan = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$plan) {
                $this->error('Plan non trouve', 404);
                return;
            }

            // Verifier s'il y a deja un abonnement actif et l'annuler automatiquement
            $stmt = $this->db->prepare("
                SELECT id, plan_id FROM provider_subscriptions
                WHERE provider_id = ? AND status IN ('active', 'pending_payment')
            ");
            $stmt->execute([$providerId]);
            $existingSubscription = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($existingSubscription) {
                // Annuler l'ancien abonnement pour permettre le changement de plan
                $stmt = $this->db->prepare("
                    UPDATE provider_subscriptions
                    SET status = 'cancelled',
                        cancelled_at = NOW(),
                        auto_renew = FALSE
                    WHERE id = ?
                ");
                $stmt->execute([$existingSubscription['id']]);

                $this->logger->log('subscription_auto_cancelled_for_upgrade', [
                    'provider_id' => $providerId,
                    'old_subscription_id' => $existingSubscription['id'],
                    'old_plan_id' => $existingSubscription['plan_id'],
                    'new_plan_id' => $data['plan_id']
                ]);
            }

            // Determiner le mode de paiement
            $paymentMethod = $data['payment_method'] ?? 'card';
            if ($plan['price'] == 0) {
                $paymentMethod = 'free';
            }

            // Calculer les dates
            $startedAt = date('Y-m-d H:i:s');
            $expiresAt = date('Y-m-d H:i:s', strtotime("+{$plan['duration_days']} days"));

            // Determiner le statut initial
            $status = ($paymentMethod === 'free' || $plan['price'] == 0) ? 'active' : 'pending_payment';
            $paymentStatus = ($paymentMethod === 'free' || $plan['price'] == 0) ? 'paid' : 'pending';

            // Creer l'abonnement
            $stmt = $this->db->prepare("
                INSERT INTO provider_subscriptions (
                    provider_id,
                    plan_id,
                    status,
                    started_at,
                    expires_at,
                    payment_method,
                    payment_status,
                    payment_amount
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $providerId,
                $plan['id'],
                $status,
                $startedAt,
                $expiresAt,
                $paymentMethod,
                $paymentStatus,
                $plan['price']
            ]);

            $subscriptionId = $this->db->lastInsertId();

            // Mettre a jour le provider si plan gratuit ou paiement confirme
            if ($status === 'active') {
                $stmt = $this->db->prepare("
                    UPDATE providers SET
                        subscription_plan_id = ?,
                        subscription_status = 'active',
                        subscription_expires_at = ?,
                        badge_type = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $plan['id'],
                    $expiresAt,
                    $plan['badge_type'],
                    $providerId
                ]);
            }

            $this->logger->log('subscription_created', [
                'provider_id' => $providerId,
                'plan_id' => $plan['id'],
                'plan_name' => $plan['name'],
                'amount' => $plan['price'],
                'status' => $status
            ]);

            $this->success([
                'subscription_id' => $subscriptionId,
                'plan' => [
                    'id' => $plan['id'],
                    'name' => $plan['name'],
                    'price' => floatval($plan['price'])
                ],
                'status' => $status,
                'payment_status' => $paymentStatus,
                'started_at' => $startedAt,
                'expires_at' => $expiresAt,
                'requires_payment' => $status === 'pending_payment'
            ], 'Abonnement cree avec succes');

        } catch (\Exception $e) {
            $this->error('Erreur lors de la creation de l\'abonnement: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/provider/subscription/confirm-payment
     * Confirmer le paiement d'un abonnement
     *
     * Body: {
     *   subscription_id: int,
     *   payment_method: 'card',
     *   card_token?: string
     * }
     */
    public function confirmPayment(): void
    {
        $providerId = $_SERVER['USER_ID'] ?? null;
        $userType = $_SERVER['USER_TYPE'] ?? null;

        if (!$providerId || $userType !== 'provider') {
            $this->error('Non authentifie en tant que prestataire', 401);
            return;
        }

        $data = $this->getJsonInput();

        // Validation
        $errors = $this->validate($data, [
            'subscription_id' => 'required|numeric'
        ]);

        if (!empty($errors)) {
            $this->error('Donnees invalides', 400, $errors);
            return;
        }

        try {
            // Recuperer l'abonnement
            $stmt = $this->db->prepare("
                SELECT ps.*, sp.name as plan_name, sp.price as plan_price, sp.badge_type
                FROM provider_subscriptions ps
                JOIN subscription_plans sp ON ps.plan_id = sp.id
                WHERE ps.id = ? AND ps.provider_id = ? AND ps.status = 'pending_payment'
            ");
            $stmt->execute([$data['subscription_id'], $providerId]);
            $subscription = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$subscription) {
                $this->error('Abonnement non trouve ou deja paye', 404);
                return;
            }

            // Simuler le traitement du paiement (a remplacer par vrai gateway)
            $paymentResult = PaymentGateway::charge([
                'amount' => $subscription['plan_price'],
                'card_token' => $data['card_token'] ?? 'mock_token',
                'description' => "Abonnement GlamGo - {$subscription['plan_name']}",
                'provider_id' => $providerId
            ]);

            if (!$paymentResult['success']) {
                // Mettre a jour le statut en echec
                $stmt = $this->db->prepare("
                    UPDATE provider_subscriptions
                    SET payment_status = 'failed'
                    WHERE id = ?
                ");
                $stmt->execute([$subscription['id']]);

                $this->error($paymentResult['error'] ?? 'Paiement echoue', 400);
                return;
            }

            // Mettre a jour l'abonnement
            $stmt = $this->db->prepare("
                UPDATE provider_subscriptions
                SET status = 'active',
                    payment_status = 'paid',
                    transaction_id = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $paymentResult['transaction_id'] ?? 'MOCK_' . time(),
                $subscription['id']
            ]);

            // Mettre a jour le provider
            $stmt = $this->db->prepare("
                UPDATE providers SET
                    subscription_plan_id = ?,
                    subscription_status = 'active',
                    subscription_expires_at = ?,
                    badge_type = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $subscription['plan_id'],
                $subscription['expires_at'],
                $subscription['badge_type'],
                $providerId
            ]);

            $this->logger->log('subscription_payment_confirmed', [
                'provider_id' => $providerId,
                'subscription_id' => $subscription['id'],
                'amount' => $subscription['plan_price']
            ]);

            $this->success([
                'subscription_id' => $subscription['id'],
                'status' => 'active',
                'payment_status' => 'paid',
                'expires_at' => $subscription['expires_at']
            ], 'Paiement confirme, abonnement active');

        } catch (\Exception $e) {
            $this->error('Erreur lors de la confirmation du paiement', 500);
        }
    }

    /**
     * PUT /api/provider/subscription/cancel
     * Annuler l'abonnement actuel
     */
    public function cancel(): void
    {
        $providerId = $_SERVER['USER_ID'] ?? null;
        $userType = $_SERVER['USER_TYPE'] ?? null;

        if (!$providerId || $userType !== 'provider') {
            $this->error('Non authentifie en tant que prestataire', 401);
            return;
        }

        try {
            // Recuperer l'abonnement actif
            $stmt = $this->db->prepare("
                SELECT id FROM provider_subscriptions
                WHERE provider_id = ? AND status = 'active'
            ");
            $stmt->execute([$providerId]);
            $subscription = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$subscription) {
                $this->error('Aucun abonnement actif a annuler', 404);
                return;
            }

            // Annuler l'abonnement
            $stmt = $this->db->prepare("
                UPDATE provider_subscriptions
                SET status = 'cancelled',
                    cancelled_at = NOW(),
                    auto_renew = FALSE
                WHERE id = ?
            ");
            $stmt->execute([$subscription['id']]);

            // Mettre a jour le provider
            $stmt = $this->db->prepare("
                UPDATE providers SET
                    subscription_status = 'none',
                    badge_type = NULL
                WHERE id = ?
            ");
            $stmt->execute([$providerId]);

            $this->logger->log('subscription_cancelled', [
                'provider_id' => $providerId,
                'subscription_id' => $subscription['id']
            ]);

            $this->success(null, 'Abonnement annule avec succes');

        } catch (\Exception $e) {
            $this->error('Erreur lors de l\'annulation', 500);
        }
    }

    /**
     * GET /api/provider/subscription/benefits
     * Avantages de l'abonnement actuel
     */
    public function getBenefits(): void
    {
        $providerId = $_SERVER['USER_ID'] ?? null;
        $userType = $_SERVER['USER_TYPE'] ?? null;

        if (!$providerId || $userType !== 'provider') {
            $this->error('Non authentifie en tant que prestataire', 401);
            return;
        }

        try {
            $stmt = $this->db->prepare("
                SELECT
                    sp.name as plan_name,
                    sp.visibility_boost,
                    sp.priority_level,
                    sp.commission_rate,
                    sp.max_services,
                    sp.max_photos,
                    sp.can_access_stats,
                    sp.can_urgent_bookings,
                    sp.badge_type,
                    sp.features,
                    ps.expires_at,
                    EXTRACT(DAY FROM (ps.expires_at - NOW()))::int as days_remaining
                FROM provider_subscriptions ps
                JOIN subscription_plans sp ON ps.plan_id = sp.id
                WHERE ps.provider_id = ? AND ps.status = 'active'
            ");
            $stmt->execute([$providerId]);
            $benefits = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$benefits) {
                // Retourner les avantages du plan gratuit par defaut
                $this->success([
                    'plan_name' => 'Decouverte',
                    'visibility_boost' => 0,
                    'priority_level' => 0,
                    'commission_rate' => 20.0,
                    'max_services' => 3,
                    'max_photos' => 3,
                    'can_access_stats' => false,
                    'can_urgent_bookings' => false,
                    'badge_type' => null,
                    'features' => ['Profil basique', '3 services maximum'],
                    'is_free_plan' => true
                ]);
                return;
            }

            $benefits['features'] = json_decode($benefits['features'] ?? '[]', true);
            $benefits['commission_rate'] = floatval($benefits['commission_rate']);
            $benefits['can_access_stats'] = (bool) $benefits['can_access_stats'];
            $benefits['can_urgent_bookings'] = (bool) $benefits['can_urgent_bookings'];
            $benefits['is_free_plan'] = false;

            $this->success($benefits);

        } catch (\Exception $e) {
            $this->error('Erreur lors de la recuperation des avantages', 500);
        }
    }
}
