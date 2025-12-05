<?php

namespace App\Models;

use App\Core\Model;
use PDO;

/**
 * Modele Message - Chat interne renforce
 * Version amelioree pour communication securisee
 */
class Message extends Model
{
    protected string $table = 'messages';

    /**
     * Retourne l'instance de la base de donnees
     */
    public function getDatabase(): PDO
    {
        return $this->db;
    }

    /**
     * Cree un message avec support pour images et types
     */
    public function createMessage(
        int $orderId,
        string $senderType,
        int $senderId,
        string $content,
        ?string $translatedContent = null,
        string $messageType = 'text',
        ?string $attachmentUrl = null
    ): int {
        return $this->create([
            'order_id' => $orderId,
            'sender_type' => $senderType,
            'sender_id' => $senderId,
            'content' => $content,
            'translated_content' => $translatedContent,
            'message_type' => $messageType,
            'attachment_url' => $attachmentUrl,
            'is_read' => false,
            'is_blocked' => false
        ]);
    }

    /**
     * Cree un message bloque (tentative de partage de coordonnees)
     */
    public function createBlockedMessage(
        int $orderId,
        string $senderType,
        int $senderId,
        string $filteredContent,
        string $blockedReason
    ): int {
        return $this->create([
            'order_id' => $orderId,
            'sender_type' => $senderType,
            'sender_id' => $senderId,
            'content' => $filteredContent,
            'message_type' => 'text',
            'is_read' => false,
            'is_blocked' => true,
            'blocked_reason' => $blockedReason
        ]);
    }

    /**
     * Recupere les messages d'une commande
     * @param bool $includeBlocked Inclure les messages bloques
     */
    public function getOrderMessages(int $orderId, bool $includeBlocked = false): array
    {
        $blockedClause = $includeBlocked ? '' : 'AND m.is_blocked = FALSE';

        return $this->query(
            "SELECT m.*,
                    CASE
                        WHEN m.sender_type = 'user' THEN u.first_name
                        ELSE p.first_name
                    END as sender_name,
                    CASE
                        WHEN m.sender_type = 'user' THEN u.avatar
                        ELSE p.avatar
                    END as sender_avatar
             FROM messages m
             LEFT JOIN users u ON m.sender_type = 'user' AND m.sender_id = u.id
             LEFT JOIN providers p ON m.sender_type = 'provider' AND m.sender_id = p.id
             WHERE m.order_id = ? {$blockedClause}
             ORDER BY m.created_at ASC",
            [$orderId]
        );
    }

    /**
     * Marque les messages comme lus avec timestamp
     */
    public function markAsRead(int $orderId, string $recipientType): bool
    {
        $senderType = $recipientType === 'user' ? 'provider' : 'user';

        return $this->execute(
            "UPDATE messages SET is_read = TRUE, read_at = NOW()
             WHERE order_id = ? AND sender_type = ? AND is_read = FALSE",
            [$orderId, $senderType]
        );
    }

    /**
     * Compte les messages non lus pour une commande
     */
    public function countUnread(int $orderId, string $recipientType): int
    {
        $senderType = $recipientType === 'user' ? 'provider' : 'user';

        $stmt = $this->db->prepare(
            "SELECT COUNT(*) FROM messages
             WHERE order_id = ? AND sender_type = ? AND is_read = FALSE AND is_blocked = FALSE"
        );
        $stmt->execute([$orderId, $senderType]);
        return (int)$stmt->fetchColumn();
    }

    /**
     * Compte tous les messages non lus pour un utilisateur (toutes commandes)
     */
    public function countAllUnreadForUser(int $userId): int
    {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM messages m
            JOIN orders o ON m.order_id = o.id
            WHERE o.user_id = ?
              AND m.sender_type = 'provider'
              AND m.is_read = FALSE
              AND m.is_blocked = FALSE
        ");
        $stmt->execute([$userId]);
        return (int)$stmt->fetchColumn();
    }

    /**
     * Compte tous les messages non lus pour un prestataire (toutes commandes)
     */
    public function countAllUnreadForProvider(int $providerId): int
    {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM messages m
            JOIN orders o ON m.order_id = o.id
            WHERE o.provider_id = ?
              AND m.sender_type = 'user'
              AND m.is_read = FALSE
              AND m.is_blocked = FALSE
        ");
        $stmt->execute([$providerId]);
        return (int)$stmt->fetchColumn();
    }

    /**
     * Met a jour le statut de presence (en ligne)
     */
    public function updatePresence(string $userType, int $userId): bool
    {
        if ($userType === 'user') {
            return $this->execute(
                "UPDATE users SET last_seen_at = NOW() WHERE id = ?",
                [$userId]
            );
        } else {
            return $this->execute(
                "UPDATE providers SET last_seen_at = NOW() WHERE id = ?",
                [$userId]
            );
        }
    }

    /**
     * Recupere les commandes avec messages non lus pour un utilisateur
     */
    public function getOrdersWithUnreadForUser(int $userId): array
    {
        return $this->query("
            SELECT o.id, o.status, COUNT(m.id) as unread_count
            FROM orders o
            JOIN messages m ON m.order_id = o.id
            WHERE o.user_id = ?
              AND m.sender_type = 'provider'
              AND m.is_read = FALSE
              AND m.is_blocked = FALSE
            GROUP BY o.id
        ", [$userId]);
    }

    /**
     * Recupere les commandes avec messages non lus pour un prestataire
     */
    public function getOrdersWithUnreadForProvider(int $providerId): array
    {
        return $this->query("
            SELECT o.id, o.status, COUNT(m.id) as unread_count
            FROM orders o
            JOIN messages m ON m.order_id = o.id
            WHERE o.provider_id = ?
              AND m.sender_type = 'user'
              AND m.is_read = FALSE
              AND m.is_blocked = FALSE
            GROUP BY o.id
        ", [$providerId]);
    }
}
