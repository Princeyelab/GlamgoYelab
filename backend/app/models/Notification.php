<?php

namespace App\Models;

use App\Core\Model;

class Notification extends Model
{
    protected string $table = 'notifications';

    /**
     * Crée une notification
     */
    public function createNotification(array $data): int
    {
        $notificationData = [
            'recipient_type' => $data['recipient_type'],
            'recipient_id' => $data['recipient_id'],
            'order_id' => $data['order_id'] ?? null,
            'notification_type' => $data['notification_type'],
            'title' => $data['title'],
            'message' => $data['message'],
            'data' => isset($data['data']) ? json_encode($data['data']) : null
        ];

        return $this->create($notificationData);
    }

    /**
     * Récupère les notifications d'un utilisateur
     */
    public function getUserNotifications(int $userId, int $limit = 50): array
    {
        $stmt = $this->db->prepare(
            "SELECT n.*,
                    CASE
                        WHEN n.order_id IS NOT NULL THEN o.status
                        ELSE NULL
                    END as order_status
             FROM {$this->table} n
             LEFT JOIN orders o ON n.order_id = o.id
             WHERE n.recipient_type = 'user' AND n.recipient_id = ?
             ORDER BY n.created_at DESC
             LIMIT ?"
        );
        $stmt->execute([$userId, $limit]);
        return $stmt->fetchAll();
    }

    /**
     * Récupère les notifications d'un prestataire
     */
    public function getProviderNotifications(int $providerId, int $limit = 50): array
    {
        $stmt = $this->db->prepare(
            "SELECT n.*,
                    CASE
                        WHEN n.order_id IS NOT NULL THEN o.status
                        ELSE NULL
                    END as order_status
             FROM {$this->table} n
             LEFT JOIN orders o ON n.order_id = o.id
             WHERE n.recipient_type = 'provider' AND n.recipient_id = ?
             ORDER BY n.created_at DESC
             LIMIT ?"
        );
        $stmt->execute([$providerId, $limit]);
        return $stmt->fetchAll();
    }

    /**
     * Compte les notifications non lues
     */
    public function getUnreadCount(string $recipientType, int $recipientId): int
    {
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) as count
             FROM {$this->table}
             WHERE recipient_type = ? AND recipient_id = ? AND is_read = FALSE"
        );
        $stmt->execute([$recipientType, $recipientId]);
        $result = $stmt->fetch();
        return (int) $result['count'];
    }

    /**
     * Marque une notification comme lue
     */
    public function markAsRead(int $notificationId): bool
    {
        return $this->update($notificationId, [
            'is_read' => 1,
            'read_at' => date('Y-m-d H:i:s')
        ]);
    }

    /**
     * Marque toutes les notifications comme lues
     */
    public function markAllAsRead(string $recipientType, int $recipientId): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table}
             SET is_read = TRUE, read_at = NOW()
             WHERE recipient_type = ? AND recipient_id = ? AND is_read = FALSE"
        );
        return $stmt->execute([$recipientType, $recipientId]);
    }

    /**
     * Notifie les prestataires disponibles pour un nouveau service
     */
    public function notifyProvidersForNewOrder(array $order): void
    {
        error_log("🔔 [NOTIFICATION] Starting notification process for order #{$order['id']}");
        error_log("🔔 [NOTIFICATION] Service ID: {$order['service_id']}");
        error_log("🔔 [NOTIFICATION] Service Name: " . ($order['service_name'] ?? 'N/A'));

        $providerModel = new Provider();

        // MODE TEST: Désactiver la vérification is_verified pour le développement
        $testMode = true; // Mettre à false en production

        // Récupérer les prestataires qui offrent ce service
        if ($testMode) {
            // Mode test: inclure tous les prestataires avec ce service (même non vérifiés)
            $stmt = $this->db->prepare(
                "SELECT p.id, p.first_name, p.last_name
                 FROM providers p
                 INNER JOIN provider_services ps ON p.id = ps.provider_id
                 WHERE ps.service_id = ?"
            );
        } else {
            $stmt = $this->db->prepare(
                "SELECT p.id, p.first_name, p.last_name
                 FROM providers p
                 INNER JOIN provider_services ps ON p.id = ps.provider_id
                 WHERE ps.service_id = ? AND p.is_verified = TRUE AND p.is_available = TRUE"
            );
        }
        $stmt->execute([$order['service_id']]);
        $providers = $stmt->fetchAll();

        error_log("🔔 [NOTIFICATION] Found " . count($providers) . " providers with this service (testMode=$testMode)");

        // Si aucun prestataire avec ce service, notifier tous les prestataires disponibles
        if (empty($providers)) {
            error_log("🔔 [NOTIFICATION] No providers found for this service, notifying all available providers");
            if ($testMode) {
                // Mode test: tous les prestataires
                $stmt = $this->db->prepare(
                    "SELECT id, first_name, last_name FROM providers"
                );
            } else {
                $stmt = $this->db->prepare(
                    "SELECT id, first_name, last_name
                     FROM providers
                     WHERE is_verified = TRUE AND is_available = TRUE"
                );
            }
            $stmt->execute();
            $providers = $stmt->fetchAll();
            error_log("🔔 [NOTIFICATION] Found " . count($providers) . " available providers");
        }

        // Créer une notification pour chaque prestataire
        foreach ($providers as $provider) {
            error_log("🔔 [NOTIFICATION] Creating notification for provider #{$provider['id']} ({$provider['first_name']} {$provider['last_name']})");
            try {
                $notificationId = $this->createNotification([
                    'recipient_type' => 'provider',
                    'recipient_id' => $provider['id'],
                    'order_id' => $order['id'],
                    'notification_type' => 'new_order',
                    'title' => 'Nouvelle commande disponible',
                    'message' => "Une nouvelle commande pour {$order['service_name']} est disponible.",
                    'data' => [
                        'order_id' => $order['id'],
                        'service_name' => $order['service_name'],
                        'scheduled_at' => $order['scheduled_at'] ?? null
                    ]
                ]);
                error_log("🔔 [NOTIFICATION] ✅ Notification #{$notificationId} created successfully");
            } catch (\Exception $e) {
                error_log("🔔 [NOTIFICATION] ❌ Error creating notification: " . $e->getMessage());
            }
        }

        error_log("🔔 [NOTIFICATION] Notification process completed");
    }

    /**
     * Notifie le client qu'un prestataire a annulé sa commande
     */
    public function notifyUserProviderCancellation(array $order, string $reason, float $cancellationFee): void
    {
        $feeMessage = $cancellationFee > 0
            ? " Des frais d'annulation de {$cancellationFee} MAD seront appliqués au prestataire."
            : "";

        $this->createNotification([
            'recipient_type' => 'user',
            'recipient_id' => $order['user_id'],
            'order_id' => $order['id'],
            'notification_type' => 'provider_cancelled',
            'title' => 'Prestataire indisponible',
            'message' => "Le prestataire ne peut pas assurer votre commande #{$order['id']}. Nous recherchons un remplaçant.{$feeMessage}",
            'data' => [
                'order_id' => $order['id'],
                'reason' => $reason,
                'cancellation_fee' => $cancellationFee,
                'status' => 'pending'
            ]
        ]);

        error_log("🔔 [NOTIFICATION] Client notified of provider cancellation for order #{$order['id']}");
    }

    /**
     * Notifie le client d'un changement de statut
     */
    public function notifyUserOrderStatusChange(array $order, string $newStatus): void
    {
        $titles = [
            'accepted' => 'Commande acceptée',
            'on_way' => 'Prestataire en route',
            'in_progress' => 'Service en cours',
            'completed' => 'Service terminé',
            'cancelled' => 'Commande annulée'
        ];

        $messages = [
            'accepted' => "Votre commande #{$order['id']} a été acceptée par un prestataire.",
            'on_way' => "Le prestataire est en route pour votre commande #{$order['id']}.",
            'in_progress' => "Le service pour votre commande #{$order['id']} a commencé.",
            'completed' => "Votre commande #{$order['id']} est terminée. Merci de votre confiance !",
            'cancelled' => "Votre commande #{$order['id']} a été annulée."
        ];

        if (!isset($titles[$newStatus])) {
            return;
        }

        $this->createNotification([
            'recipient_type' => 'user',
            'recipient_id' => $order['user_id'],
            'order_id' => $order['id'],
            'notification_type' => 'order_' . $newStatus,
            'title' => $titles[$newStatus],
            'message' => $messages[$newStatus],
            'data' => [
                'order_id' => $order['id'],
                'status' => $newStatus
            ]
        ]);
    }

    /**
     * Supprime les anciennes notifications (plus de 30 jours)
     */
    public function cleanOldNotifications(): int
    {
        $stmt = $this->db->prepare(
            "DELETE FROM {$this->table}
             WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY) AND is_read = TRUE"
        );
        $stmt->execute();
        return $stmt->rowCount();
    }
}
