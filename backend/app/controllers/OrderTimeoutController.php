<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Database;
use App\Models\Order;
use App\Models\Notification;

/**
 * Gestion des timeouts de commandes
 * Auto-expire les commandes pending sans reponse apres 4 minutes
 */
class OrderTimeoutController extends Controller
{
    private Order $orderModel;
    private Notification $notificationModel;

    // Timeout en secondes (4 minutes)
    private const TIMEOUT_SECONDS = 240;

    public function __construct()
    {
        $this->orderModel = new Order();
        $this->notificationModel = new Notification();
    }

    /**
     * GET /api/cron/expire-orders
     * Endpoint appele par un cron externe pour expirer les commandes
     * Protection par token simple pour eviter les appels non autorises
     */
    public function expireOrders(): void
    {
        // Verification token securise
        $token = $_GET['token'] ?? '';
        $expectedToken = $_ENV['CRON_SECRET'] ?? 'be8b8ce10efc2c402291cf424fcdce36c440566376878d74e2eed5782feab60b';

        if ($token !== $expectedToken) {
            $this->error('Token invalide', 401);
            return;
        }

        $db = Database::getInstance();
        $timeoutMinutes = self::TIMEOUT_SECONDS / 60;

        try {
            // Trouver les commandes pending avec provider_id assigne
            // qui ont ete creees il y a plus de 4 minutes
            $stmt = $db->prepare("
                SELECT o.*, s.name as service_name,
                       pcs.name as custom_service_name,
                       u.first_name as user_first_name,
                       u.last_name as user_last_name,
                       p.first_name as provider_first_name,
                       p.last_name as provider_last_name
                FROM orders o
                LEFT JOIN services s ON o.service_id = s.id
                LEFT JOIN provider_custom_services pcs ON o.custom_service_id = pcs.id
                LEFT JOIN users u ON o.user_id = u.id
                LEFT JOIN providers p ON o.provider_id = p.id
                WHERE o.status = 'pending'
                AND o.provider_id IS NOT NULL
                AND o.created_at < NOW() - INTERVAL '{$timeoutMinutes} minutes'
            ");
            $stmt->execute();
            $expiredOrders = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            $expiredCount = 0;
            $results = [];

            foreach ($expiredOrders as $order) {
                // Annuler la commande
                $updateStmt = $db->prepare("
                    UPDATE orders
                    SET status = 'cancelled',
                        cancellation_reason = 'Delai de reponse depasse (4 minutes)',
                        cancelled_by = 'system',
                        updated_at = NOW()
                    WHERE id = ? AND status = 'pending'
                ");
                $updateStmt->execute([$order['id']]);

                if ($updateStmt->rowCount() > 0) {
                    $expiredCount++;

                    $serviceName = $order['custom_service_name'] ?? $order['service_name'] ?? 'Service';
                    $providerName = trim(($order['provider_first_name'] ?? '') . ' ' . ($order['provider_last_name'] ?? ''));

                    // Notifier le client
                    $this->notificationModel->createNotification([
                        'recipient_type' => 'user',
                        'recipient_id' => $order['user_id'],
                        'order_id' => (int)$order['id'],
                        'notification_type' => 'order_expired',
                        'title' => 'Demande expiree',
                        'message' => "Le prestataire n'a pas repondu a temps. Votre demande pour \"{$serviceName}\" a ete annulee. Veuillez choisir un autre prestataire.",
                        'data' => [
                            'order_id' => (int)$order['id'],
                            'service_id' => $order['service_id'],
                            'custom_service_id' => $order['custom_service_id'],
                            'reason' => 'timeout',
                            'action' => 'retry_booking'
                        ]
                    ]);

                    // Notifier le prestataire (optionnel - pour tracking)
                    if ($order['provider_id']) {
                        $this->notificationModel->createNotification([
                            'recipient_type' => 'provider',
                            'recipient_id' => $order['provider_id'],
                            'order_id' => (int)$order['id'],
                            'notification_type' => 'order_missed',
                            'title' => 'Commande manquee',
                            'message' => "Vous n'avez pas repondu a la demande de \"{$serviceName}\" dans les 4 minutes. La commande a ete annulee.",
                            'data' => [
                                'order_id' => (int)$order['id'],
                                'reason' => 'no_response'
                            ]
                        ]);
                    }

                    $results[] = [
                        'order_id' => $order['id'],
                        'service' => $serviceName,
                        'provider_id' => $order['provider_id'],
                        'created_at' => $order['created_at']
                    ];

                    error_log("[TIMEOUT] Order #{$order['id']} expired - No provider response");
                }
            }

            $this->success([
                'expired_count' => $expiredCount,
                'checked_at' => date('Y-m-d H:i:s'),
                'timeout_minutes' => $timeoutMinutes,
                'orders' => $results
            ], "Verification terminee: {$expiredCount} commande(s) expiree(s)");

        } catch (\Exception $e) {
            error_log("[TIMEOUT] Error: " . $e->getMessage());
            $this->error('Erreur lors de la verification: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/orders/{id}/timeout-status
     * Renvoie le temps restant avant expiration d'une commande pending
     */
    public function getTimeoutStatus(string $orderId): void
    {
        $userId = $_SERVER['USER_ID'] ?? null;

        $order = $this->orderModel->find((int)$orderId);

        if (!$order) {
            $this->error('Commande non trouvee', 404);
        }

        // Verifier l'acces
        if ($order['user_id'] != $userId && $order['provider_id'] != $userId) {
            $this->error('Acces refuse', 403);
        }

        if ($order['status'] !== 'pending') {
            $this->success([
                'is_pending' => false,
                'status' => $order['status'],
                'remaining_seconds' => 0,
                'expired' => $order['status'] === 'cancelled'
            ]);
            return;
        }

        // Calculer le temps restant
        $createdAt = strtotime($order['created_at']);
        $now = time();
        $elapsed = $now - $createdAt;
        $remaining = max(0, self::TIMEOUT_SECONDS - $elapsed);

        $this->success([
            'is_pending' => true,
            'status' => 'pending',
            'remaining_seconds' => $remaining,
            'timeout_seconds' => self::TIMEOUT_SECONDS,
            'created_at' => $order['created_at'],
            'expires_at' => date('Y-m-d H:i:s', $createdAt + self::TIMEOUT_SECONDS),
            'expired' => $remaining <= 0
        ]);
    }
}
