<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Database;
use App\Helpers\PaymentGateway;
use App\Helpers\PaymentLogger;
use PDO;

/**
 * PaymentController - Gestion complète des paiements
 *
 * Fonctionnalités :
 * - Validation carte bancaire (clients + prestataires)
 * - Enregistrement IBAN prestataires
 * - Traitement paiements (CB + Cash)
 * - Historique transactions
 * - Gestion méthodes de paiement
 *
 * Commission GlamGo : 20% sur toutes les transactions
 *
 * @package GlamGo\Controllers
 * @author Claude Code
 */
class PaymentController extends Controller
{
    private $db;
    private $logger;

    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->logger = PaymentLogger::getInstance();
    }

    /**
     * POST /api/payment/validate-card
     * Valider et enregistrer une carte bancaire
     *
     * Body: {
     *   card_number: string,
     *   card_exp_month: int,
     *   card_exp_year: int,
     *   card_cvv: string
     * }
     */
    public function validateCard()
    {
        $data = $this->getJsonInput();

        // Récupérer l'utilisateur authentifié depuis le middleware JWT
        $user_type = $_SERVER['USER_TYPE'] ?? null;
        $authenticated_id = $_SERVER['USER_ID'] ?? null;

        if (!$authenticated_id) {
            return $this->error('Non authentifié', 401);
        }

        // Déterminer si c'est un client ou prestataire
        $user_id = ($user_type === 'user') ? $authenticated_id : null;
        $provider_id = ($user_type === 'provider') ? $authenticated_id : null;

        // Validation des données
        $errors = $this->validate($data, [
            'card_number' => 'required',
            'card_exp_month' => 'required|numeric',
            'card_exp_year' => 'required|numeric',
            'card_cvv' => 'required'
        ]);

        if (!empty($errors)) {
            return $this->error('Données invalides', 400, $errors);
        }

        try {
            // Appeler PaymentGateway pour tokeniser la carte
            $tokenResponse = PaymentGateway::tokenizeCard([
                'card_number' => $data['card_number'],
                'exp_month' => $data['card_exp_month'],
                'exp_year' => $data['card_exp_year'],
                'cvv' => $data['card_cvv']
            ]);

            if (!$tokenResponse['success']) {
                $this->logger->log('card_validation_failed', [
                    'user_id' => $user_id,
                    'provider_id' => $provider_id,
                    'error' => $tokenResponse['error']
                ]);

                return $this->error($tokenResponse['error'], 400);
            }

            $card_token = $tokenResponse['token'];
            $card_last4 = substr($data['card_number'], -4);
            $card_brand = $this->detectCardBrand($data['card_number']);
            $card_fingerprint = PaymentGateway::generateCardFingerprint(
                $data['card_number'],
                $data['card_exp_month'],
                $data['card_exp_year']
            );

            // Vérifier si carte déjà enregistrée (même empreinte)
            $existing = $this->checkExistingCard($card_fingerprint, $user_id, $provider_id);
            if ($existing) {
                return $this->error('Cette carte est déjà enregistrée', 400);
            }

            // Enregistrer dans payment_methods
            $stmt = $this->db->prepare("
                INSERT INTO payment_methods (
                    user_id,
                    provider_id,
                    card_last4,
                    card_brand,
                    card_exp_month,
                    card_exp_year,
                    card_token,
                    card_fingerprint,
                    is_default,
                    last_used_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW())
            ");

            $stmt->execute([
                $user_id,
                $provider_id,
                $card_last4,
                $card_brand,
                $data['card_exp_month'],
                $data['card_exp_year'],
                $card_token,
                $card_fingerprint
            ]);

            $payment_method_id = $this->db->lastInsertId();

            // Mettre à jour users ou providers
            if ($user_id) {
                $stmt = $this->db->prepare("
                    UPDATE users
                    SET payment_method_validated = TRUE,
                        card_last4 = ?,
                        card_brand = ?,
                        card_token = ?,
                        card_added_at = NOW()
                    WHERE id = ?
                ");
                $stmt->execute([$card_last4, $card_brand, $card_token, $user_id]);
            }

            if ($provider_id) {
                $stmt = $this->db->prepare("
                    UPDATE providers
                    SET payment_method_validated = TRUE
                    WHERE id = ?
                ");
                $stmt->execute([$provider_id]);
            }

            // Log succès
            $this->logger->log('card_validation_success', [
                'user_id' => $user_id,
                'provider_id' => $provider_id,
                'card_last4' => $card_last4,
                'card_brand' => $card_brand
            ]);

            return $this->success([
                'payment_method_id' => $payment_method_id,
                'card_last4' => $card_last4,
                'card_brand' => $card_brand,
                'is_mock' => $tokenResponse['mock'] ?? false
            ], 'Carte validée avec succès');

        } catch (\Exception $e) {
            $this->logger->alertAdmin('card_validation_error', $e->getMessage(), [
                'user_id' => $user_id,
                'provider_id' => $provider_id
            ]);

            return $this->error('Erreur lors de la validation de la carte', 500);
        }
    }

    /**
     * POST /api/payment/process
     * Traiter un paiement pour une commande
     *
     * Body: {
     *   order_id: int,
     *   payment_method: 'card' | 'cash'
     * }
     */
    public function processPayment()
    {
        $data = $this->getJsonInput();

        // Récupérer l'utilisateur authentifié depuis le middleware JWT
        $user_type = $_SERVER['USER_TYPE'] ?? null;
        $user_id = $_SERVER['USER_ID'] ?? null;

        if (!$user_id || $user_type !== 'user') {
            return $this->error('Non authentifié en tant que client', 401);
        }

        // Validation
        $errors = $this->validate($data, [
            'order_id' => 'required|numeric',
            'payment_method' => 'required'
        ]);

        if (!empty($errors)) {
            return $this->error('Données invalides', 400, $errors);
        }

        if (!in_array($data['payment_method'], ['card', 'cash'])) {
            return $this->error('Méthode de paiement invalide', 400);
        }

        try {
            // Récupérer la commande
            $stmt = $this->db->prepare("
                SELECT * FROM orders WHERE id = ? AND user_id = ?
            ");
            $stmt->execute([$data['order_id'], $user_id]);
            $order = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$order) {
                return $this->error('Commande introuvable', 404);
            }

            // Vérifier si déjà payée
            if ($order['payment_status'] === 'paid') {
                return $this->error('Cette commande est déjà payée', 400);
            }

            // Calculer commission GlamGo (20%)
            $total_amount = floatval($order['total_price']);
            $commission_glamgo = round($total_amount * 0.20, 2);
            $provider_amount = $total_amount - $commission_glamgo;

            // Créer transaction
            $stmt = $this->db->prepare("
                INSERT INTO transactions (
                    order_id,
                    user_id,
                    provider_id,
                    amount,
                    commission_glamgo,
                    provider_amount,
                    payment_method,
                    status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
            ");

            $stmt->execute([
                $order['id'],
                $user_id,
                $order['provider_id'],
                $total_amount,
                $commission_glamgo,
                $provider_amount,
                $data['payment_method']
            ]);

            $transaction_id = $this->db->lastInsertId();

            // Log création transaction
            $this->logger->log('payment_initiated', [
                'transaction_id' => $transaction_id,
                'user_id' => $user_id,
                'order_id' => $order['id'],
                'amount' => $total_amount,
                'payment_method' => $data['payment_method']
            ], $transaction_id);

            // Si paiement CB, traiter immédiatement
            if ($data['payment_method'] === 'card') {
                return $this->processCardPayment($transaction_id, $order, $user_id, $total_amount);
            }

            // Si cash, transaction reste pending
            $this->updateOrderPaymentStatus($order['id'], 'unpaid', $transaction_id);

            return $this->success([
                'transaction_id' => $transaction_id,
                'payment_method' => 'cash',
                'status' => 'pending',
                'breakdown' => [
                    'total' => $total_amount,
                    'commission_glamgo' => $commission_glamgo,
                    'montant_prestataire' => $provider_amount
                ]
            ], 'Transaction enregistrée (paiement en espèces)');

        } catch (\Exception $e) {
            $this->logger->alertAdmin('payment_processing_error', $e->getMessage(), [
                'user_id' => $user_id,
                'order_id' => $data['order_id']
            ]);

            return $this->error('Erreur lors du traitement du paiement', 500);
        }
    }

    /**
     * GET /api/payment/methods
     * Liste des méthodes de paiement de l'utilisateur
     */
    public function getMethods()
    {
        // Récupérer l'utilisateur authentifié depuis le middleware JWT
        $user_type = $_SERVER['USER_TYPE'] ?? null;
        $user_id = $_SERVER['USER_ID'] ?? null;

        if (!$user_id || $user_type !== 'user') {
            return $this->error('Non authentifié en tant que client', 401);
        }

        try {
            $stmt = $this->db->prepare("
                SELECT
                    id,
                    card_last4,
                    card_brand,
                    card_exp_month,
                    card_exp_year,
                    is_default,
                    created_at,
                    last_used_at
                FROM payment_methods
                WHERE user_id = ? AND is_active = TRUE
                ORDER BY is_default DESC, created_at DESC
            ");
            $stmt->execute([$user_id]);
            $methods = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return $this->success([
                'methods' => $methods,
                'count' => count($methods)
            ]);

        } catch (\Exception $e) {
            return $this->error('Erreur lors de la récupération des méthodes', 500);
        }
    }

    /**
     * DELETE /api/payment/methods/{id}
     * Supprimer une méthode de paiement
     */
    public function deleteMethod($id)
    {
        // Récupérer l'utilisateur authentifié depuis le middleware JWT
        $user_type = $_SERVER['USER_TYPE'] ?? null;
        $user_id = $_SERVER['USER_ID'] ?? null;

        if (!$user_id || $user_type !== 'user') {
            return $this->error('Non authentifié en tant que client', 401);
        }

        try {
            $stmt = $this->db->prepare("
                UPDATE payment_methods
                SET is_active = FALSE
                WHERE id = ? AND user_id = ?
            ");
            $stmt->execute([$id, $user_id]);

            if ($stmt->rowCount() === 0) {
                return $this->error('Méthode de paiement introuvable', 404);
            }

            return $this->success(null, 'Méthode de paiement supprimée');

        } catch (\Exception $e) {
            return $this->error('Erreur lors de la suppression', 500);
        }
    }

    /**
     * GET /api/payment/transactions
     * Historique des transactions de l'utilisateur
     */
    public function getTransactions()
    {
        // Récupérer l'utilisateur authentifié depuis le middleware JWT
        $user_type = $_SERVER['USER_TYPE'] ?? null;
        $user_id = $_SERVER['USER_ID'] ?? null;

        if (!$user_id || $user_type !== 'user') {
            return $this->error('Non authentifié en tant que client', 401);
        }

        try {
            $stmt = $this->db->prepare("
                SELECT
                    t.*,
                    o.service_id,
                    s.name as service_name,
                    p.name as provider_name
                FROM transactions t
                JOIN orders o ON t.order_id = o.id
                JOIN services s ON o.service_id = s.id
                JOIN providers p ON t.provider_id = p.id
                WHERE t.user_id = ?
                ORDER BY t.created_at DESC
                LIMIT 50
            ");
            $stmt->execute([$user_id]);
            $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return $this->success([
                'transactions' => $transactions,
                'count' => count($transactions)
            ]);

        } catch (\Exception $e) {
            return $this->error('Erreur lors de la récupération des transactions', 500);
        }
    }

    /**
     * GET /api/payment/transaction/{id}
     * Détails d'une transaction
     */
    public function getTransaction($id)
    {
        // Récupérer l'utilisateur authentifié depuis le middleware JWT
        $user_type = $_SERVER['USER_TYPE'] ?? null;
        $user_id = $_SERVER['USER_ID'] ?? null;

        if (!$user_id || $user_type !== 'user') {
            return $this->error('Non authentifié en tant que client', 401);
        }

        try {
            $stmt = $this->db->prepare("
                SELECT
                    t.*,
                    o.service_id,
                    s.name as service_name,
                    p.name as provider_name,
                    p.phone as provider_phone
                FROM transactions t
                JOIN orders o ON t.order_id = o.id
                JOIN services s ON o.service_id = s.id
                JOIN providers p ON t.provider_id = p.id
                WHERE t.id = ? AND t.user_id = ?
            ");
            $stmt->execute([$id, $user_id]);
            $transaction = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$transaction) {
                return $this->error('Transaction introuvable', 404);
            }

            // Récupérer logs de la transaction
            $logs = $this->logger->getTransactionLogs($id);

            return $this->success([
                'transaction' => $transaction,
                'logs' => $logs
            ]);

        } catch (\Exception $e) {
            return $this->error('Erreur lors de la récupération de la transaction', 500);
        }
    }

    /**
     * POST /api/provider/payment/bank-account
     * Prestataire enregistre son IBAN
     */
    public function registerBankAccount()
    {
        // Récupérer le prestataire authentifié depuis le middleware JWT
        $user_type = $_SERVER['USER_TYPE'] ?? null;
        $provider_id = $_SERVER['USER_ID'] ?? null;

        if (!$provider_id || $user_type !== 'provider') {
            return $this->error('Non authentifié en tant que prestataire', 401);
        }

        $data = $this->getJsonInput();

        // Validation
        $errors = $this->validate($data, [
            'iban' => 'required',
            'bank_name' => 'required'
        ]);

        if (!empty($errors)) {
            return $this->error('Données invalides', 400, $errors);
        }

        // Valider format IBAN Maroc (MA + 24 chiffres)
        $iban = strtoupper(str_replace(' ', '', $data['iban']));
        if (!preg_match('/^MA\d{24}$/', $iban)) {
            return $this->error('Format IBAN invalide pour le Maroc (MA + 24 chiffres)', 400);
        }

        try {
            $stmt = $this->db->prepare("
                UPDATE providers
                SET bank_account_iban = ?,
                    bank_name = ?,
                    bank_account_validated = TRUE,
                    bank_account_added_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$iban, $data['bank_name'], $provider_id]);

            $this->logger->log('bank_account_registered', [
                'provider_id' => $provider_id,
                'bank_name' => $data['bank_name'],
                'iban' => substr($iban, 0, 6) . '****' . substr($iban, -4)
            ]);

            return $this->success([
                'iban_last4' => substr($iban, -4),
                'bank_name' => $data['bank_name']
            ], 'Compte bancaire enregistré avec succès');

        } catch (\Exception $e) {
            return $this->error('Erreur lors de l\'enregistrement du compte bancaire', 500);
        }
    }

    /**
     * GET /api/provider/payment/earnings
     * Gains du prestataire
     */
    public function getProviderEarnings()
    {
        // Récupérer le prestataire authentifié depuis le middleware JWT
        $user_type = $_SERVER['USER_TYPE'] ?? null;
        $provider_id = $_SERVER['USER_ID'] ?? null;

        if (!$provider_id || $user_type !== 'provider') {
            return $this->error('Non authentifié en tant que prestataire', 401);
        }

        try {
            // Total gains
            $stmt = $this->db->prepare("
                SELECT
                    SUM(provider_amount) as total_earnings,
                    COUNT(*) as total_transactions,
                    SUM(CASE WHEN status = 'completed' THEN provider_amount ELSE 0 END) as completed_earnings,
                    SUM(CASE WHEN status = 'pending' THEN provider_amount ELSE 0 END) as pending_earnings
                FROM transactions
                WHERE provider_id = ?
            ");
            $stmt->execute([$provider_id]);
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);

            // Dernières transactions
            $stmt = $this->db->prepare("
                SELECT
                    t.*,
                    o.service_id,
                    s.name as service_name,
                    u.name as client_name
                FROM transactions t
                JOIN orders o ON t.order_id = o.id
                JOIN services s ON o.service_id = s.id
                JOIN users u ON t.user_id = u.id
                WHERE t.provider_id = ?
                ORDER BY t.created_at DESC
                LIMIT 20
            ");
            $stmt->execute([$provider_id]);
            $recent_transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return $this->success([
                'stats' => $stats,
                'recent_transactions' => $recent_transactions
            ]);

        } catch (\Exception $e) {
            return $this->error('Erreur lors de la récupération des gains', 500);
        }
    }

    // =====================================================
    // HELPER METHODS
    // =====================================================

    /**
     * Traiter paiement par carte
     */
    private function processCardPayment($transaction_id, $order, $user_id, $amount)
    {
        // Récupérer carte de l'utilisateur
        $stmt = $this->db->prepare("
            SELECT card_token, card_last4, card_brand
            FROM users
            WHERE id = ?
        ");
        $stmt->execute([$user_id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || !$user['card_token']) {
            $this->updateTransactionStatus($transaction_id, 'failed', 'Aucune carte enregistrée');
            return $this->error('Aucune carte bancaire enregistrée', 400);
        }

        // Appeler PaymentGateway
        $paymentResponse = PaymentGateway::charge([
            'amount' => $amount,
            'card_token' => $user['card_token'],
            'description' => "Commande #{$order['id']} - GlamGo",
            'order_id' => $order['id']
        ]);

        if ($paymentResponse['success']) {
            // Paiement réussi
            $stmt = $this->db->prepare("
                UPDATE transactions
                SET status = 'completed',
                    completed_at = NOW(),
                    payment_gateway_id = ?,
                    card_last4 = ?,
                    card_brand = ?,
                    payment_gateway_response = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $paymentResponse['transaction_id'],
                $user['card_last4'],
                $user['card_brand'],
                json_encode($paymentResponse),
                $transaction_id
            ]);

            // Mettre à jour statut commande
            $this->updateOrderPaymentStatus($order['id'], 'paid', $transaction_id);

            // Log
            $this->logger->log('payment_success', [
                'transaction_id' => $transaction_id,
                'order_id' => $order['id'],
                'amount' => $amount,
                'gateway_transaction_id' => $paymentResponse['transaction_id']
            ], $transaction_id);

            return $this->success([
                'transaction_id' => $transaction_id,
                'gateway_transaction_id' => $paymentResponse['transaction_id'],
                'status' => 'completed',
                'is_mock' => $paymentResponse['mock'] ?? false
            ], 'Paiement effectué avec succès');

        } else {
            // Paiement échoué
            $this->updateTransactionStatus($transaction_id, 'failed', $paymentResponse['error']);

            $this->logger->log('payment_failed', [
                'transaction_id' => $transaction_id,
                'order_id' => $order['id'],
                'amount' => $amount,
                'error' => $paymentResponse['error']
            ], $transaction_id);

            return $this->error($paymentResponse['error'], 400);
        }
    }

    /**
     * Mettre à jour statut transaction
     */
    private function updateTransactionStatus($transaction_id, $status, $failure_reason = null)
    {
        $stmt = $this->db->prepare("
            UPDATE transactions
            SET status = ?,
                failure_reason = ?,
                failed_at = IF(? = 'failed', NOW(), failed_at)
            WHERE id = ?
        ");
        $stmt->execute([$status, $failure_reason, $status, $transaction_id]);
    }

    /**
     * Mettre à jour statut paiement commande
     */
    private function updateOrderPaymentStatus($order_id, $payment_status, $transaction_id)
    {
        $stmt = $this->db->prepare("
            UPDATE orders
            SET payment_status = ?,
                transaction_id = ?,
                payment_completed_at = IF(? = 'paid', NOW(), payment_completed_at)
            WHERE id = ?
        ");
        $stmt->execute([$payment_status, $transaction_id, $payment_status, $order_id]);
    }

    /**
     * Vérifier si carte déjà enregistrée
     */
    private function checkExistingCard($fingerprint, $user_id, $provider_id)
    {
        $stmt = $this->db->prepare("
            SELECT id FROM payment_methods
            WHERE card_fingerprint = ?
            AND (user_id = ? OR provider_id = ?)
            AND is_active = TRUE
        ");
        $stmt->execute([$fingerprint, $user_id, $provider_id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Détecter type de carte
     */
    private function detectCardBrand($card_number)
    {
        $number = preg_replace('/\s/', '', $card_number);
        $first_digit = substr($number, 0, 1);
        $first_two = substr($number, 0, 2);

        if ($first_digit == '4') return 'Visa';
        if (in_array($first_two, ['51', '52', '53', '54', '55'])) return 'Mastercard';
        if (in_array($first_two, ['34', '37'])) return 'American Express';

        return 'Unknown';
    }

    /**
     * POST /api/payment/demo/validate-card
     * DEMO PUBLIQUE - Validation carte sans authentification
     * Retourne seulement une simulation, n'enregistre rien en DB
     */
    public function validateCardDemo()
    {
        $data = $this->getJsonInput();

        // Validation des données
        $errors = $this->validate($data, [
            'card_number' => 'required',
            'card_exp_month' => 'required|numeric',
            'card_exp_year' => 'required|numeric',
            'card_cvv' => 'required'
        ]);

        if (!empty($errors)) {
            return $this->error('Données invalides', 400, $errors);
        }

        try {
            // Appeler PaymentGateway pour tokeniser la carte (simulation)
            $tokenResponse = PaymentGateway::tokenizeCard([
                'card_number' => $data['card_number'],
                'exp_month' => $data['card_exp_month'],
                'exp_year' => $data['card_exp_year'],
                'cvv' => $data['card_cvv']
            ]);

            if (!$tokenResponse['success']) {
                return $this->error($tokenResponse['error'], 400);
            }

            $card_last4 = substr($data['card_number'], -4);
            $card_brand = $this->detectCardBrand($data['card_number']);

            return $this->success([
                'card_last4' => $card_last4,
                'card_brand' => $card_brand,
                'is_mock' => true,
                'demo_mode' => true,
                'message' => 'Validation réussie (mode démonstration - aucune donnée enregistrée)'
            ], 'Carte validée avec succès');

        } catch (\Exception $e) {
            return $this->error('Erreur lors de la validation de la carte', 500);
        }
    }
}
