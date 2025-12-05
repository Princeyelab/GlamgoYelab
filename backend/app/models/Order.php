<?php

namespace App\Models;

use App\Core\Model;

class Order extends Model
{
    protected string $table = 'orders';

    /**
     * Récupère les commandes d'un utilisateur
     */
    public function getUserOrders(int $userId, ?string $status = null): array
    {
        if ($status) {
            return $this->query(
                "SELECT o.*, s.name as service_name, s.image as service_image,
                        p.first_name as provider_first_name, p.last_name as provider_last_name,
                        p.phone as provider_phone, p.avatar as provider_avatar,
                        a.address_line, a.city
                 FROM orders o
                 INNER JOIN services s ON o.service_id = s.id
                 LEFT JOIN providers p ON o.provider_id = p.id
                 INNER JOIN user_addresses a ON o.address_id = a.id
                 WHERE o.user_id = ? AND o.status = ?
                 ORDER BY o.created_at DESC",
                [$userId, $status]
            );
        }

        return $this->query(
            "SELECT o.*, s.name as service_name, s.image as service_image,
                    p.first_name as provider_first_name, p.last_name as provider_last_name,
                    p.avatar as provider_avatar
             FROM orders o
             INNER JOIN services s ON o.service_id = s.id
             LEFT JOIN providers p ON o.provider_id = p.id
             WHERE o.user_id = ?
             ORDER BY o.created_at DESC",
            [$userId]
        );
    }

    /**
     * Récupère les commandes d'un prestataire (incluant les commandes disponibles)
     */
    public function getProviderOrders(int $providerId, ?string $status = null): array
    {
        if ($status) {
            return $this->query(
                "SELECT o.*, s.name as service_name,
                        u.first_name as user_first_name, u.last_name as user_last_name,
                        u.phone as user_phone, u.avatar as user_avatar,
                        COALESCE(a.address_line, 'Adresse non disponible') as address_line,
                        a.city, a.latitude, a.longitude,
                        CONCAT(u.first_name, ' ', u.last_name) as user_name
                 FROM orders o
                 INNER JOIN services s ON o.service_id = s.id
                 INNER JOIN users u ON o.user_id = u.id
                 LEFT JOIN user_addresses a ON o.address_id = a.id
                 WHERE (o.provider_id = ? OR (o.provider_id IS NULL AND o.status = 'pending'))
                       AND o.status = ?
                 ORDER BY o.created_at DESC",
                [$providerId, $status]
            );
        }

        // Retourne toutes les commandes assignées au prestataire + les commandes en attente disponibles
        return $this->query(
            "SELECT o.*, s.name as service_name,
                    u.first_name as user_first_name, u.last_name as user_last_name,
                    COALESCE(a.address_line, 'Adresse non disponible') as address_line,
                    a.city, a.latitude, a.longitude,
                    CONCAT(u.first_name, ' ', u.last_name) as user_name
             FROM orders o
             INNER JOIN services s ON o.service_id = s.id
             INNER JOIN users u ON o.user_id = u.id
             LEFT JOIN user_addresses a ON o.address_id = a.id
             WHERE o.provider_id = ?
                   OR (o.provider_id IS NULL AND o.status = 'pending')
             ORDER BY
                CASE WHEN o.status = 'pending' THEN 0 ELSE 1 END,
                o.created_at DESC",
            [$providerId]
        );
    }

    /**
     * Récupère les commandes en attente pour un service
     */
    public function getPendingOrdersForService(int $serviceId): array
    {
        return $this->query(
            "SELECT o.*, s.name as service_name,
                    u.first_name as user_first_name, u.last_name as user_last_name,
                    a.address_line, a.city, a.latitude, a.longitude
             FROM orders o
             INNER JOIN services s ON o.service_id = s.id
             INNER JOIN users u ON o.user_id = u.id
             INNER JOIN user_addresses a ON o.address_id = a.id
             WHERE o.service_id = ? AND o.status = 'pending'
             ORDER BY o.created_at ASC",
            [$serviceId]
        );
    }

    /**
     * Récupère une commande détaillée
     */
    public function getDetailedOrder(int $orderId): ?array
    {
        $result = $this->query(
            "SELECT o.*,
                    s.name as service_name, s.description as service_description,
                    s.image as service_image, s.duration_minutes, s.slug as service_slug,
                    c.name as category_name,
                    u.first_name as user_first_name, u.last_name as user_last_name,
                    u.phone as user_phone, u.email as user_email, u.avatar as user_avatar,
                    p.first_name as provider_first_name, p.last_name as provider_last_name,
                    p.phone as provider_phone, p.avatar as provider_avatar, p.rating as provider_rating,
                    a.label as address_label, a.address_line, a.city, a.postal_code,
                    a.latitude, a.longitude,
                    CONCAT(p.first_name, ' ', p.last_name) as provider_name
             FROM orders o
             INNER JOIN services s ON o.service_id = s.id
             LEFT JOIN categories c ON s.category_id = c.id
             INNER JOIN users u ON o.user_id = u.id
             LEFT JOIN providers p ON o.provider_id = p.id
             INNER JOIN user_addresses a ON o.address_id = a.id
             WHERE o.id = ?",
            [$orderId]
        );

        return $result[0] ?? null;
    }

    /**
     * Change le statut d'une commande
     */
    public function updateStatus(int $orderId, string $status, ?array $extraData = null): bool
    {
        $updateFields = ['status' => $status];

        // Champs de timestamp selon le statut
        switch ($status) {
            case 'accepted':
                $updateFields['accepted_at'] = date('Y-m-d H:i:s');
                break;
            case 'in_progress':
                $updateFields['started_at'] = date('Y-m-d H:i:s');
                break;
            case 'completed':
                $updateFields['completed_at'] = date('Y-m-d H:i:s');
                break;
        }

        // Données supplémentaires
        if ($extraData) {
            $updateFields = array_merge($updateFields, $extraData);
        }

        return $this->update($orderId, $updateFields);
    }

    /**
     * Assigne un prestataire à une commande
     */
    public function assignProvider(int $orderId, int $providerId): bool
    {
        return $this->update($orderId, [
            'provider_id' => $providerId,
            'status' => 'accepted',
            'accepted_at' => date('Y-m-d H:i:s')
        ]);
    }

    /**
     * Ajoute un pourboire
     */
    public function addTip(int $orderId, float $tip): bool
    {
        $order = $this->find($orderId);
        if (!$order) {
            return false;
        }

        $newTotal = $order['price'] + $tip;

        return $this->update($orderId, [
            'tip' => $tip,
            'total' => $newTotal
        ]);
    }

    /**
     * Récupère les commandes disponibles en mode enchères pour un prestataire
     * @param array $serviceIds Liste des IDs de services proposés par le prestataire
     * @param int|null $excludeProviderId ID du prestataire pour exclure ses propres offres
     * @return array Liste des commandes disponibles
     */
    public static function getAvailableBiddingOrders($serviceIds, ?int $excludeProviderId = null): array
    {
        $db = \App\Core\Database::getInstance();

        // Construction de la requête de base
        $sql = "SELECT o.*,
                       s.name as service_name, s.image as service_image,
                       s.min_suggested_price, s.max_suggested_price,
                       u.first_name as user_first_name, u.last_name as user_last_name,
                       u.avatar as user_avatar,
                       a.address_line, a.city, a.latitude, a.longitude,
                       CONCAT(u.first_name, ' ', u.last_name) as user_name,
                       (SELECT COUNT(*) FROM bids WHERE order_id = o.id AND status = 'pending') as bid_count
                FROM orders o
                INNER JOIN services s ON o.service_id = s.id
                INNER JOIN users u ON o.user_id = u.id
                INNER JOIN user_addresses a ON o.address_id = a.id
                WHERE o.pricing_mode = 'bidding'
                  AND o.status = 'pending'
                  AND (o.bid_expiry_time IS NULL OR o.bid_expiry_time > NOW())";

        $params = [];

        // Si des services sont spécifiés, filtrer par service_id
        // Sinon, retourner TOUTES les commandes (logique InDriver)
        if ($serviceIds !== null && !empty($serviceIds)) {
            $placeholders = implode(',', array_fill(0, count($serviceIds), '?'));
            $sql .= " AND o.service_id IN ($placeholders)";
            $params = $serviceIds;
        }

        // Exclure les commandes où le prestataire a déjà fait une offre
        if ($excludeProviderId !== null) {
            $sql .= " AND o.id NOT IN (
                        SELECT DISTINCT order_id
                        FROM bids
                        WHERE provider_id = ?
                      )";
            $params[] = $excludeProviderId;
        }

        $sql .= " ORDER BY o.created_at DESC
                  LIMIT 20";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
}
