<?php

/**
 * Message - Modèle pour les messages de chat
 *
 * Gère les opérations liées aux messages entre utilisateurs et prestataires
 * avec support de la traduction automatique
 */
class Message
{
    /**
     * Récupère tous les messages d'une commande (conversation)
     *
     * @param int $orderId ID de la commande
     * @return array Liste des messages
     */
    public static function getByOrderId(int $orderId): array
    {
        $db = Database::getInstance();

        $sql = "SELECT
                    m.*,
                    CASE
                        WHEN m.sender_type = 'user' THEN u.first_name
                        WHEN m.sender_type = 'provider' THEN p.first_name
                    END as sender_first_name,
                    CASE
                        WHEN m.sender_type = 'user' THEN u.last_name
                        WHEN m.sender_type = 'provider' THEN p.last_name
                    END as sender_last_name
                FROM messages m
                LEFT JOIN users u ON m.sender_type = 'user' AND m.sender_id = u.id
                LEFT JOIN providers p ON m.sender_type = 'provider' AND m.sender_id = p.id
                WHERE m.order_id = :order_id
                ORDER BY m.created_at ASC";

        $stmt = $db->prepare($sql);
        $stmt->execute(['order_id' => $orderId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Crée un nouveau message
     *
     * @param array $data Données du message
     * @return int ID du message créé
     */
    public static function create(array $data): int
    {
        $db = Database::getInstance();

        $sql = "INSERT INTO messages (
                    order_id,
                    sender_type,
                    sender_id,
                    content,
                    translated_content,
                    target_lang
                ) VALUES (
                    :order_id,
                    :sender_type,
                    :sender_id,
                    :content,
                    :translated_content,
                    :target_lang
                )";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            'order_id' => $data['order_id'],
            'sender_type' => $data['sender_type'],
            'sender_id' => $data['sender_id'],
            'content' => $data['content'],
            'translated_content' => $data['translated_content'] ?? null,
            'target_lang' => $data['target_lang'] ?? 'fr'
        ]);

        return (int) $db->lastInsertId();
    }

    /**
     * Récupère un message par son ID
     *
     * @param int $id ID du message
     * @return array|null Message trouvé ou null
     */
    public static function findById(int $id): ?array
    {
        $db = Database::getInstance();

        $sql = "SELECT
                    m.*,
                    CASE
                        WHEN m.sender_type = 'user' THEN u.first_name
                        WHEN m.sender_type = 'provider' THEN p.first_name
                    END as sender_first_name,
                    CASE
                        WHEN m.sender_type = 'user' THEN u.last_name
                        WHEN m.sender_type = 'provider' THEN p.last_name
                    END as sender_last_name
                FROM messages m
                LEFT JOIN users u ON m.sender_type = 'user' AND m.sender_id = u.id
                LEFT JOIN providers p ON m.sender_type = 'provider' AND m.sender_id = p.id
                WHERE m.id = :id
                LIMIT 1";

        $stmt = $db->prepare($sql);
        $stmt->execute(['id' => $id]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result ?: null;
    }

    /**
     * Compte le nombre de messages dans une conversation
     *
     * @param int $orderId ID de la commande
     * @return int Nombre de messages
     */
    public static function countByOrderId(int $orderId): int
    {
        $db = Database::getInstance();

        $sql = "SELECT COUNT(*) FROM messages WHERE order_id = :order_id";
        $stmt = $db->prepare($sql);
        $stmt->execute(['order_id' => $orderId]);

        return (int) $stmt->fetchColumn();
    }

    /**
     * Récupère le dernier message d'une conversation
     *
     * @param int $orderId ID de la commande
     * @return array|null Dernier message ou null
     */
    public static function getLastMessage(int $orderId): ?array
    {
        $db = Database::getInstance();

        $sql = "SELECT
                    m.*,
                    CASE
                        WHEN m.sender_type = 'user' THEN u.first_name
                        WHEN m.sender_type = 'provider' THEN p.first_name
                    END as sender_first_name,
                    CASE
                        WHEN m.sender_type = 'user' THEN u.last_name
                        WHEN m.sender_type = 'provider' THEN p.last_name
                    END as sender_last_name
                FROM messages m
                LEFT JOIN users u ON m.sender_type = 'user' AND m.sender_id = u.id
                LEFT JOIN providers p ON m.sender_type = 'provider' AND m.sender_id = p.id
                WHERE m.order_id = :order_id
                ORDER BY m.created_at DESC
                LIMIT 1";

        $stmt = $db->prepare($sql);
        $stmt->execute(['order_id' => $orderId]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result ?: null;
    }

    /**
     * Supprime tous les messages d'une commande
     *
     * @param int $orderId ID de la commande
     * @return bool True si succès
     */
    public static function deleteByOrderId(int $orderId): bool
    {
        $db = Database::getInstance();

        $sql = "DELETE FROM messages WHERE order_id = :order_id";
        $stmt = $db->prepare($sql);

        return $stmt->execute(['order_id' => $orderId]);
    }
}
