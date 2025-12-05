<?php

/**
 * Order - Modèle pour les commandes de services
 *
 * Gère les opérations liées aux commandes passées par les utilisateurs
 */
class Order
{
    /**
     * Crée une nouvelle commande
     *
     * @param array $data Données de la commande
     * @return int ID de la commande créée
     */
    public static function create(array $data): int
    {
        $db = Database::getInstance();

        $sql = "INSERT INTO orders (
                    user_id,
                    service_id,
                    address_id,
                    status,
                    order_time,
                    scheduled_time,
                    final_price,
                    provider_id,
                    tip_amount
                ) VALUES (
                    :user_id,
                    :service_id,
                    :address_id,
                    :status,
                    :order_time,
                    :scheduled_time,
                    :final_price,
                    :provider_id,
                    :tip_amount
                )";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            'user_id' => $data['user_id'],
            'service_id' => $data['service_id'],
            'address_id' => $data['address_id'],
            'status' => $data['status'] ?? 'pending',
            'order_time' => $data['order_time'] ?? date('Y-m-d H:i:s'),
            'scheduled_time' => $data['scheduled_time'] ?? null,
            'final_price' => $data['final_price'],
            'provider_id' => $data['provider_id'] ?? null,
            'tip_amount' => $data['tip_amount'] ?? 0.00
        ]);

        return (int) $db->lastInsertId();
    }

    /**
     * Récupère une commande par son ID
     *
     * @param int $id ID de la commande
     * @return array|null Données de la commande ou null si non trouvée
     */
    public static function findById(int $id): ?array
    {
        $db = Database::getInstance();

        $sql = "SELECT
                    o.id,
                    o.user_id,
                    o.provider_id,
                    o.service_id,
                    o.address_id,
                    o.status,
                    o.order_time,
                    o.scheduled_time,
                    o.final_price,
                    o.tip_amount,
                    o.cancellation_reason,
                    o.created_at,
                    o.updated_at,
                    s.name as service_name,
                    s.description as service_description,
                    s.duration_minutes,
                    u.first_name as user_first_name,
                    u.last_name as user_last_name,
                    u.email as user_email,
                    u.phone as user_phone,
                    a.full_address,
                    a.lat,
                    a.lon
                FROM orders o
                INNER JOIN services s ON o.service_id = s.id
                INNER JOIN users u ON o.user_id = u.id
                INNER JOIN addresses a ON o.address_id = a.id
                WHERE o.id = :id";

        $stmt = $db->prepare($sql);
        $stmt->execute(['id' => $id]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result ?: null;
    }

    /**
     * Récupère toutes les commandes d'un utilisateur
     *
     * @param int $userId ID de l'utilisateur
     * @return array Liste des commandes
     */
    public static function findByUserId(int $userId): array
    {
        $db = Database::getInstance();

        $sql = "SELECT
                    o.id,
                    o.user_id,
                    o.provider_id,
                    o.service_id,
                    o.address_id,
                    o.status,
                    o.order_time,
                    o.scheduled_time,
                    o.final_price,
                    o.tip_amount,
                    o.created_at,
                    o.updated_at,
                    s.name as service_name,
                    s.image_url as service_image_url,
                    a.full_address
                FROM orders o
                INNER JOIN services s ON o.service_id = s.id
                INNER JOIN addresses a ON o.address_id = a.id
                WHERE o.user_id = :user_id
                ORDER BY o.created_at DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute(['user_id' => $userId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Récupère toutes les commandes d'un prestataire
     *
     * @param int $providerId ID du prestataire
     * @return array Liste des commandes
     */
    public static function findByProviderId(int $providerId): array
    {
        $db = Database::getInstance();

        $sql = "SELECT
                    o.id,
                    o.user_id,
                    o.provider_id,
                    o.service_id,
                    o.address_id,
                    o.status,
                    o.order_time,
                    o.scheduled_time,
                    o.final_price,
                    o.tip_amount,
                    o.created_at,
                    o.updated_at,
                    s.name as service_name,
                    s.image_url as service_image_url,
                    u.first_name as user_first_name,
                    u.last_name as user_last_name,
                    a.full_address,
                    a.lat,
                    a.lon
                FROM orders o
                INNER JOIN services s ON o.service_id = s.id
                INNER JOIN users u ON o.user_id = u.id
                INNER JOIN addresses a ON o.address_id = a.id
                WHERE o.provider_id = :provider_id
                ORDER BY o.created_at DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute(['provider_id' => $providerId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Met à jour le statut d'une commande
     *
     * @param int $orderId ID de la commande
     * @param string $status Nouveau statut
     * @return bool True si succès
     */
    public static function updateStatus(int $orderId, string $status): bool
    {
        $db = Database::getInstance();

        $sql = "UPDATE orders
                SET status = :status,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :order_id";

        $stmt = $db->prepare($sql);

        return $stmt->execute([
            'order_id' => $orderId,
            'status' => $status
        ]);
    }

    /**
     * Assigne un prestataire à une commande
     *
     * @param int $orderId ID de la commande
     * @param int $providerId ID du prestataire
     * @return bool True si succès
     */
    public static function assignProvider(int $orderId, int $providerId): bool
    {
        $db = Database::getInstance();

        $sql = "UPDATE orders
                SET provider_id = :provider_id,
                    status = 'accepted',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :order_id";

        $stmt = $db->prepare($sql);

        return $stmt->execute([
            'order_id' => $orderId,
            'provider_id' => $providerId
        ]);
    }

    /**
     * Récupère les commandes en attente (sans prestataire)
     *
     * @return array Liste des commandes en attente
     */
    public static function getPendingOrders(): array
    {
        $db = Database::getInstance();

        $sql = "SELECT
                    o.id,
                    o.user_id,
                    o.service_id,
                    o.address_id,
                    o.status,
                    o.order_time,
                    o.scheduled_time,
                    o.final_price,
                    o.created_at,
                    s.name as service_name,
                    s.category_id,
                    u.first_name as user_first_name,
                    u.last_name as user_last_name,
                    a.full_address,
                    a.lat,
                    a.lon
                FROM orders o
                INNER JOIN services s ON o.service_id = s.id
                INNER JOIN users u ON o.user_id = u.id
                INNER JOIN addresses a ON o.address_id = a.id
                WHERE o.status = 'pending' AND o.provider_id IS NULL
                ORDER BY o.created_at ASC";

        $stmt = $db->query($sql);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
