<?php

namespace App\Helpers;

/**
 * PaymentGateway - Système de paiement GlamGo
 *
 * VERSION MOCK pour développement
 * Simule les 3 scénarios :
 *   - ✅ Paiement réussi (80%)
 *   - ❌ Carte refusée (15%)
 *   - ⚠️ Erreur technique (5%)
 *
 * PRODUCTION : Remplacer par vraie intégration CMI/Stripe
 *
 * @package GlamGo
 * @author Claude Code
 * @version 1.0.0 MOCK
 */
class PaymentGateway
{
    private static $config = [];
    private static $logger;

    /**
     * Initialisation de la passerelle
     */
    public static function init()
    {
        // Charger config
        self::$config = [
            'mode' => getenv('PAYMENT_GATEWAY_MODE') ?: 'mock',
            'api_key' => getenv('PAYMENT_GATEWAY_API_KEY') ?: 'mock_api_key',
            'api_secret' => getenv('PAYMENT_GATEWAY_SECRET') ?: 'mock_secret',
            'base_url' => getenv('PAYMENT_GATEWAY_URL') ?: 'https://api-mock.glamgo.ma',
        ];

        // Initialiser logger
        self::$logger = PaymentLogger::getInstance();
    }

    /**
     * Tokeniser une carte bancaire
     *
     * @param array $card_data ['card_number', 'exp_month', 'exp_year', 'cvv']
     * @return array ['success' => bool, 'token' => string|null, 'error' => string|null]
     */
    public static function tokenizeCard($card_data)
    {
        self::init();

        // Validation basique
        $validation = self::validateCardData($card_data);
        if (!$validation['valid']) {
            self::$logger->log('card_validation_failed', [
                'reason' => $validation['error'],
                'card_last4' => substr($card_data['card_number'], -4)
            ]);

            return [
                'success' => false,
                'token' => null,
                'error' => $validation['error']
            ];
        }

        // MODE MOCK : Simulation
        if (self::$config['mode'] === 'mock') {
            return self::mockTokenizeCard($card_data);
        }

        // MODE PRODUCTION : CMI/Stripe
        if (self::$config['mode'] === 'production') {
            return self::cmiTokenizeCard($card_data);
        }

        return [
            'success' => false,
            'token' => null,
            'error' => 'Mode passerelle invalide'
        ];
    }

    /**
     * Effectuer un paiement
     *
     * @param array $payment_data ['amount', 'card_token', 'description', 'order_id']
     * @return array ['success' => bool, 'transaction_id' => string|null, 'error' => string|null]
     */
    public static function charge($payment_data)
    {
        self::init();

        // Validation montant
        $amount = floatval($payment_data['amount']);
        if ($amount <= 0) {
            self::$logger->log('payment_failed', [
                'reason' => 'Montant invalide',
                'amount' => $amount
            ]);

            return [
                'success' => false,
                'transaction_id' => null,
                'error' => 'Montant invalide'
            ];
        }

        self::$logger->log('payment_initiated', [
            'amount' => $amount,
            'description' => $payment_data['description'],
            'order_id' => $payment_data['order_id'] ?? null
        ]);

        // MODE MOCK
        if (self::$config['mode'] === 'mock') {
            return self::mockCharge($payment_data);
        }

        // MODE PRODUCTION
        if (self::$config['mode'] === 'production') {
            return self::cmiCharge($payment_data);
        }

        return [
            'success' => false,
            'transaction_id' => null,
            'error' => 'Mode passerelle invalide'
        ];
    }

    /**
     * Transférer de l'argent au prestataire
     *
     * @param int $provider_id
     * @param float $amount
     * @param int $order_id
     * @return array ['success' => bool, 'transfer_id' => string|null, 'error' => string|null]
     */
    public static function transferToProvider($provider_id, $amount, $order_id)
    {
        self::init();

        // Récupérer IBAN prestataire
        $db = \App\Core\Database::getInstance();
        $stmt = $db->prepare("
            SELECT bank_account_iban, bank_name, bank_account_validated
            FROM providers
            WHERE id = ?
        ");
        $stmt->execute([$provider_id]);
        $provider = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$provider) {
            return [
                'success' => false,
                'transfer_id' => null,
                'error' => 'Prestataire introuvable'
            ];
        }

        if (!$provider['bank_account_validated'] || !$provider['bank_account_iban']) {
            return [
                'success' => false,
                'transfer_id' => null,
                'error' => 'IBAN non configuré ou non validé'
            ];
        }

        self::$logger->log('transfer_initiated', [
            'provider_id' => $provider_id,
            'amount' => $amount,
            'order_id' => $order_id,
            'iban' => self::maskIBAN($provider['bank_account_iban'])
        ]);

        // MODE MOCK
        if (self::$config['mode'] === 'mock') {
            return self::mockTransfer($provider, $amount, $order_id);
        }

        // MODE PRODUCTION
        if (self::$config['mode'] === 'production') {
            return self::cmiTransfer($provider, $amount, $order_id);
        }

        return [
            'success' => false,
            'transfer_id' => null,
            'error' => 'Mode passerelle invalide'
        ];
    }

    /**
     * Rembourser une transaction
     *
     * @param string $transaction_id
     * @param float $amount
     * @param string $reason
     * @return array
     */
    public static function refund($transaction_id, $amount, $reason = '')
    {
        self::init();

        self::$logger->log('refund_initiated', [
            'transaction_id' => $transaction_id,
            'amount' => $amount,
            'reason' => $reason
        ]);

        // MODE MOCK
        if (self::$config['mode'] === 'mock') {
            return self::mockRefund($transaction_id, $amount, $reason);
        }

        // MODE PRODUCTION
        if (self::$config['mode'] === 'production') {
            return self::cmiRefund($transaction_id, $amount, $reason);
        }

        return [
            'success' => false,
            'refund_id' => null,
            'error' => 'Mode passerelle invalide'
        ];
    }

    // =====================================================
    // MOCK METHODS - Simulation pour développement
    // =====================================================

    /**
     * MOCK : Tokeniser carte
     */
    private static function mockTokenizeCard($card_data)
    {
        // Simuler délai réseau
        usleep(500000); // 500ms

        // CARTE DE TEST : Toujours réussir avec 4242 4242 4242 4242
        $test_number = preg_replace('/\s/', '', $card_data['card_number']);
        if ($test_number === '4242424242424242') {
            $token = 'tok_mock_' . bin2hex(random_bytes(16));

            self::$logger->log('card_validation_success', [
                'token' => $token,
                'card_last4' => '4242',
                'card_brand' => 'Visa',
                'test_card' => true
            ]);

            return [
                'success' => true,
                'token' => $token,
                'error' => null,
                'mock' => true,
                'scenario' => 'test_card_success'
            ];
        }

        // Scénarios aléatoires :
        // 80% succès, 15% refus, 5% erreur technique
        $scenario = rand(1, 100);

        // ✅ SUCCÈS (80%)
        if ($scenario <= 80) {
            $token = 'tok_mock_' . bin2hex(random_bytes(16));

            self::$logger->log('card_validation_success', [
                'token' => $token,
                'card_last4' => substr($card_data['card_number'], -4),
                'card_brand' => self::detectCardBrand($card_data['card_number'])
            ]);

            return [
                'success' => true,
                'token' => $token,
                'error' => null,
                'mock' => true,
                'scenario' => 'success'
            ];
        }

        // ❌ CARTE REFUSÉE (15%)
        if ($scenario <= 95) {
            $errors = [
                'Carte expirée',
                'Carte désactivée par la banque',
                'Fonds insuffisants',
                'Carte signalée volée ou perdue',
                'CVV incorrect'
            ];
            $error = $errors[array_rand($errors)];

            self::$logger->log('card_validation_failed', [
                'reason' => $error,
                'card_last4' => substr($card_data['card_number'], -4)
            ]);

            return [
                'success' => false,
                'token' => null,
                'error' => $error,
                'mock' => true,
                'scenario' => 'card_declined'
            ];
        }

        // ⚠️ ERREUR TECHNIQUE (5%)
        $technical_errors = [
            'Connexion à la banque impossible',
            'Timeout réseau',
            'Service temporairement indisponible',
            'Erreur interne passerelle'
        ];
        $error = $technical_errors[array_rand($technical_errors)];

        self::$logger->log('gateway_error', [
            'error' => $error,
            'error_code' => 'MOCK_TECH_ERROR_' . rand(1000, 9999)
        ]);

        return [
            'success' => false,
            'token' => null,
            'error' => $error,
            'mock' => true,
            'scenario' => 'technical_error'
        ];
    }

    /**
     * MOCK : Effectuer paiement
     */
    private static function mockCharge($payment_data)
    {
        usleep(800000); // 800ms

        $scenario = rand(1, 100);

        // ✅ SUCCÈS (80%)
        if ($scenario <= 80) {
            $transaction_id = 'txn_mock_' . time() . '_' . bin2hex(random_bytes(8));

            self::$logger->log('payment_success', [
                'transaction_id' => $transaction_id,
                'amount' => $payment_data['amount'],
                'order_id' => $payment_data['order_id'] ?? null
            ]);

            return [
                'success' => true,
                'transaction_id' => $transaction_id,
                'error' => null,
                'mock' => true,
                'scenario' => 'success',
                'timestamp' => time()
            ];
        }

        // ❌ PAIEMENT REFUSÉ (15%)
        if ($scenario <= 95) {
            $errors = [
                'Carte expirée',
                'Fonds insuffisants',
                'Limite de paiement dépassée',
                'Paiement bloqué par la banque',
                'Carte désactivée'
            ];
            $error = $errors[array_rand($errors)];

            self::$logger->log('payment_failed', [
                'reason' => $error,
                'amount' => $payment_data['amount'],
                'order_id' => $payment_data['order_id'] ?? null
            ]);

            return [
                'success' => false,
                'transaction_id' => null,
                'error' => $error,
                'mock' => true,
                'scenario' => 'payment_declined'
            ];
        }

        // ⚠️ ERREUR TECHNIQUE (5%)
        $error = 'Erreur technique lors du paiement';

        self::$logger->log('gateway_error', [
            'error' => $error,
            'amount' => $payment_data['amount']
        ]);

        return [
            'success' => false,
            'transaction_id' => null,
            'error' => $error,
            'mock' => true,
            'scenario' => 'technical_error'
        ];
    }

    /**
     * MOCK : Transférer au prestataire
     */
    private static function mockTransfer($provider, $amount, $order_id)
    {
        usleep(600000); // 600ms

        // Succès systématique en mode mock
        $transfer_id = 'trf_mock_' . time() . '_' . bin2hex(random_bytes(8));

        self::$logger->log('transfer_success', [
            'transfer_id' => $transfer_id,
            'amount' => $amount,
            'order_id' => $order_id,
            'iban' => self::maskIBAN($provider['bank_account_iban'])
        ]);

        return [
            'success' => true,
            'transfer_id' => $transfer_id,
            'error' => null,
            'mock' => true,
            'estimated_arrival' => date('Y-m-d', strtotime('+3 days'))
        ];
    }

    /**
     * MOCK : Remboursement
     */
    private static function mockRefund($transaction_id, $amount, $reason)
    {
        usleep(700000); // 700ms

        $scenario = rand(1, 100);

        if ($scenario <= 90) {
            $refund_id = 'ref_mock_' . time() . '_' . bin2hex(random_bytes(8));

            self::$logger->log('refund_completed', [
                'refund_id' => $refund_id,
                'transaction_id' => $transaction_id,
                'amount' => $amount,
                'reason' => $reason
            ]);

            return [
                'success' => true,
                'refund_id' => $refund_id,
                'error' => null,
                'mock' => true
            ];
        }

        return [
            'success' => false,
            'refund_id' => null,
            'error' => 'Remboursement refusé par la banque',
            'mock' => true
        ];
    }

    // =====================================================
    // CMI METHODS - Production (stubs pour l'instant)
    // =====================================================

    private static function cmiTokenizeCard($card_data)
    {
        // TODO: Implémenter vraie intégration CMI
        throw new \Exception('CMI integration not implemented yet. Use mock mode.');
    }

    private static function cmiCharge($payment_data)
    {
        // TODO: Implémenter vraie intégration CMI
        throw new \Exception('CMI integration not implemented yet. Use mock mode.');
    }

    private static function cmiTransfer($provider, $amount, $order_id)
    {
        // TODO: Implémenter vraie intégration CMI
        throw new \Exception('CMI integration not implemented yet. Use mock mode.');
    }

    private static function cmiRefund($transaction_id, $amount, $reason)
    {
        // TODO: Implémenter vraie intégration CMI
        throw new \Exception('CMI integration not implemented yet. Use mock mode.');
    }

    // =====================================================
    // HELPER METHODS
    // =====================================================

    /**
     * Valider données carte
     */
    private static function validateCardData($card_data)
    {
        // Numéro carte
        $card_number = preg_replace('/\s/', '', $card_data['card_number']);
        if (!preg_match('/^\d{13,19}$/', $card_number)) {
            return ['valid' => false, 'error' => 'Numéro de carte invalide'];
        }

        // Algorithme Luhn
        if (!self::luhnCheck($card_number)) {
            return ['valid' => false, 'error' => 'Numéro de carte invalide (checksum)'];
        }

        // Mois expiration
        $month = intval($card_data['exp_month']);
        if ($month < 1 || $month > 12) {
            return ['valid' => false, 'error' => 'Mois d\'expiration invalide'];
        }

        // Année expiration
        $year = intval($card_data['exp_year']);
        $current_year = intval(date('Y'));
        if ($year < $current_year || $year > $current_year + 20) {
            return ['valid' => false, 'error' => 'Année d\'expiration invalide'];
        }

        // Carte expirée ?
        if ($year == $current_year && $month < intval(date('m'))) {
            return ['valid' => false, 'error' => 'Carte expirée'];
        }

        // CVV
        if (!preg_match('/^\d{3,4}$/', $card_data['cvv'])) {
            return ['valid' => false, 'error' => 'CVV invalide'];
        }

        return ['valid' => true];
    }

    /**
     * Algorithme Luhn (validation numéro carte)
     */
    private static function luhnCheck($number)
    {
        $sum = 0;
        $length = strlen($number);
        $parity = $length % 2;

        for ($i = 0; $i < $length; $i++) {
            $digit = intval($number[$i]);
            if ($i % 2 == $parity) {
                $digit *= 2;
            }
            if ($digit > 9) {
                $digit -= 9;
            }
            $sum += $digit;
        }

        return ($sum % 10) == 0;
    }

    /**
     * Détecter type de carte
     */
    private static function detectCardBrand($card_number)
    {
        $number = preg_replace('/\s/', '', $card_number);
        $first_digit = substr($number, 0, 1);
        $first_two = substr($number, 0, 2);
        $first_four = substr($number, 0, 4);

        if ($first_digit == '4') {
            return 'Visa';
        }

        if (in_array($first_two, ['51', '52', '53', '54', '55']) ||
            (intval($first_four) >= 2221 && intval($first_four) <= 2720)) {
            return 'Mastercard';
        }

        if (in_array($first_two, ['34', '37'])) {
            return 'American Express';
        }

        if ($first_four == '6011' || $first_two == '65' ||
            (intval($first_four) >= 644 && intval($first_four) <= 649)) {
            return 'Discover';
        }

        return 'Unknown';
    }

    /**
     * Masquer IBAN pour logs
     */
    private static function maskIBAN($iban)
    {
        if (strlen($iban) < 8) return '****';
        return substr($iban, 0, 4) . '****' . substr($iban, -4);
    }

    /**
     * Générer empreinte carte (pour détecter doublons)
     */
    public static function generateCardFingerprint($card_number, $exp_month, $exp_year)
    {
        $clean_number = preg_replace('/\s/', '', $card_number);
        $data = $clean_number . '-' . $exp_month . '-' . $exp_year;
        return hash('sha256', $data);
    }
}
