<?php
/**
 * AutoPayment - Service de paiement automatique
 *
 * Traite les paiements automatiquement quand une commande est terminée.
 * Commission GlamGo : 20%
 *
 * @package GlamGo\Helpers
 */

namespace App\Helpers;

use App\Core\Database;
use PDO;

class AutoPayment
{
    /**
     * Traiter le paiement automatiquement quand une commande est terminée
     *
     * @param int $orderId ID de la commande
     * @return array ['success' => bool, 'message' => string, 'data' => array|null]
     */
    public static function processPayment(int $orderId): array
    {
        $db = Database::getInstance();
        $logger = PaymentLogger::getInstance();

        try {
            // Récupérer la commande avec les infos utilisateur
            $stmt = $db->prepare("
                SELECT o.*, u.card_token, u.card_last4, u.card_brand
                FROM orders o
                JOIN users u ON o.user_id = u.id
                WHERE o.id = ?
            ");
            $stmt->execute([$orderId]);
            $order = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$order) {
                return ['success' => false, 'message' => 'Commande introuvable', 'data' => null];
            }

            // Vérifier si déjà payée
            if (isset($order['payment_status']) && $order['payment_status'] === 'paid') {
                return ['success' => true, 'message' => 'Commande déjà payée', 'data' => ['already_paid' => true]];
            }

            // Récupérer le montant (utiliser total ou price)
            $total_amount = floatval($order['total'] ?? $order['price'] ?? 0);

            if ($total_amount <= 0) {
                return ['success' => false, 'message' => 'Montant invalide', 'data' => null];
            }

            // Calculer commission GlamGo (20%)
            $commission_glamgo = round($total_amount * 0.20, 2);
            $provider_amount = $total_amount - $commission_glamgo;

            // Vérifier si table transactions existe
            try {
                $stmt = $db->prepare("
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

                $payment_method = $order['payment_method'] ?? 'cash';
                $stmt->execute([
                    $orderId,
                    $order['user_id'],
                    $order['provider_id'],
                    $total_amount,
                    $commission_glamgo,
                    $provider_amount,
                    $payment_method
                ]);

                $transaction_id = $db->lastInsertId();
            } catch (\Exception $e) {
                // Table transactions n'existe peut-être pas, continuer sans
                $transaction_id = null;
                $payment_method = $order['payment_method'] ?? 'cash';
            }

            // Log création transaction
            if ($logger && $transaction_id) {
                $logger->log('auto_payment_initiated', [
                    'transaction_id' => $transaction_id,
                    'order_id' => $orderId,
                    'amount' => $total_amount,
                    'payment_method' => $payment_method
                ], $transaction_id);
            }

            // Si paiement par carte, traiter immédiatement
            if ($payment_method === 'card') {
                // Vérifier si le client a une carte enregistrée
                if (empty($order['card_token'])) {
                    if ($transaction_id) {
                        $stmt = $db->prepare("
                            UPDATE transactions SET status = 'failed', failure_reason = 'Aucune carte enregistrée', failed_at = NOW()
                            WHERE id = ?
                        ");
                        $stmt->execute([$transaction_id]);
                    }

                    $stmt = $db->prepare("UPDATE orders SET payment_status = 'failed' WHERE id = ?");
                    $stmt->execute([$orderId]);

                    return [
                        'success' => false,
                        'message' => 'Aucune carte bancaire enregistrée pour ce client',
                        'data' => ['transaction_id' => $transaction_id]
                    ];
                }

                // Appeler PaymentGateway pour charger la carte
                $paymentResponse = PaymentGateway::charge([
                    'amount' => $total_amount,
                    'card_token' => $order['card_token'],
                    'description' => "Commande #{$orderId} - GlamGo (Auto)",
                    'order_id' => $orderId
                ]);

                if ($paymentResponse['success']) {
                    // Paiement réussi
                    if ($transaction_id) {
                        $stmt = $db->prepare("
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
                            $paymentResponse['transaction_id'] ?? null,
                            $order['card_last4'],
                            $order['card_brand'],
                            json_encode($paymentResponse),
                            $transaction_id
                        ]);
                    }

                    $stmt = $db->prepare("
                        UPDATE orders
                        SET payment_status = 'paid',
                            transaction_id = ?,
                            payment_completed_at = NOW()
                        WHERE id = ?
                    ");
                    $stmt->execute([$transaction_id, $orderId]);

                    if ($logger && $transaction_id) {
                        $logger->log('auto_payment_success', [
                            'transaction_id' => $transaction_id,
                            'order_id' => $orderId,
                            'amount' => $total_amount
                        ], $transaction_id);
                    }

                    return [
                        'success' => true,
                        'message' => 'Paiement effectué avec succès',
                        'data' => [
                            'transaction_id' => $transaction_id,
                            'amount' => $total_amount,
                            'commission_glamgo' => $commission_glamgo,
                            'provider_amount' => $provider_amount,
                            'is_mock' => $paymentResponse['mock'] ?? false
                        ]
                    ];
                } else {
                    // Paiement échoué
                    if ($transaction_id) {
                        $stmt = $db->prepare("
                            UPDATE transactions SET status = 'failed', failure_reason = ?, failed_at = NOW()
                            WHERE id = ?
                        ");
                        $stmt->execute([$paymentResponse['error'] ?? 'Erreur inconnue', $transaction_id]);
                    }

                    $stmt = $db->prepare("UPDATE orders SET payment_status = 'failed' WHERE id = ?");
                    $stmt->execute([$orderId]);

                    return [
                        'success' => false,
                        'message' => $paymentResponse['error'] ?? 'Erreur de paiement',
                        'data' => ['transaction_id' => $transaction_id]
                    ];
                }
            }

            // Si paiement en espèces, la transaction reste pending
            $updateSql = "UPDATE orders SET payment_status = 'pending'";
            if ($transaction_id) {
                $updateSql .= ", transaction_id = ?";
            }
            $updateSql .= " WHERE id = ?";

            $stmt = $db->prepare($updateSql);
            if ($transaction_id) {
                $stmt->execute([$transaction_id, $orderId]);
            } else {
                $stmt->execute([$orderId]);
            }

            return [
                'success' => true,
                'message' => 'Transaction enregistrée (paiement en espèces)',
                'data' => [
                    'transaction_id' => $transaction_id,
                    'payment_method' => 'cash',
                    'amount' => $total_amount,
                    'commission_glamgo' => $commission_glamgo,
                    'provider_amount' => $provider_amount
                ]
            ];

        } catch (\Exception $e) {
            error_log("AutoPayment Error: " . $e->getMessage());

            if (isset($logger)) {
                $logger->alertAdmin('auto_payment_error', $e->getMessage(), ['order_id' => $orderId]);
            }

            return [
                'success' => false,
                'message' => 'Erreur paiement automatique: ' . $e->getMessage(),
                'data' => null
            ];
        }
    }
}
