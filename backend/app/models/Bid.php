<?php

namespace App\Models;

use App\Core\Model;
use App\Core\Database;

class Bid extends Model
{
    protected string $table = 'bids';

    /**
     * Créer une nouvelle offre
     * @param array $data
     * @return int ID de l'offre créée
     */
    public static function createBid(array $data): int
    {
        $db = Database::getInstance();

        // Démarrer une transaction
        $db->beginTransaction();

        try {
            // Créer l'offre
            $stmt = $db->prepare(
                "INSERT INTO bids (order_id, provider_id, proposed_price, estimated_arrival_minutes, message, status, created_at)
                 VALUES (?, ?, ?, ?, ?, 'pending', NOW())"
            );
            $stmt->execute([
                $data['order_id'],
                $data['provider_id'],
                $data['proposed_price'],
                $data['estimated_arrival_minutes'] ?? null,
                $data['message'] ?? null
            ]);

            $bidId = (int) $db->lastInsertId();

            // Mettre à jour les statistiques du prestataire
            self::updateProviderStats($data['provider_id'], false);

            // Créer une notification pour l'utilisateur
            self::notifyUserNewBid($data['order_id'], $bidId);

            $db->commit();

            return $bidId;
        } catch (\Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }

    /**
     * Récupérer une offre par son ID avec les infos du prestataire
     * @param int $id
     * @return array|null
     */
    public static function findById(int $id): ?array
    {
        $db = Database::getInstance();
        $stmt = $db->prepare(
            "SELECT b.*,
                    p.first_name, p.last_name, p.phone, p.avatar, p.rating,
                    ps.acceptance_rate, ps.total_bids
             FROM bids b
             INNER JOIN providers p ON b.provider_id = p.id
             LEFT JOIN provider_stats ps ON p.id = ps.provider_id
             WHERE b.id = ?"
        );
        $stmt->execute([$id]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);

        return $result ?: null;
    }

    /**
     * Récupérer toutes les offres d'une commande
     * @param int $orderId
     * @return array
     */
    public static function getByOrderId(int $orderId): array
    {
        $db = Database::getInstance();
        $stmt = $db->prepare(
            "SELECT b.*,
                    p.first_name, p.last_name, p.phone, p.avatar, p.rating,
                    ps.acceptance_rate, ps.total_bids,
                    (SELECT AVG(r.rating) FROM reviews r WHERE r.provider_id = p.id) as avg_rating,
                    CONCAT(p.first_name, ' ', p.last_name) as provider_name
             FROM bids b
             INNER JOIN providers p ON b.provider_id = p.id
             LEFT JOIN provider_stats ps ON p.id = ps.provider_id
             WHERE b.order_id = ?
             ORDER BY b.proposed_price ASC, b.created_at ASC"
        );
        $stmt->execute([$orderId]);

        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * Récupérer les offres actives d'un prestataire
     * @param int $providerId
     * @return array
     */
    public static function getActiveByProviderId(int $providerId): array
    {
        $db = Database::getInstance();
        $stmt = $db->prepare(
            "SELECT b.*,
                    o.status as order_status, o.user_proposed_price, o.scheduled_at,
                    s.name as service_name, s.image as service_image,
                    u.first_name as user_first_name, u.last_name as user_last_name,
                    a.address_line, a.city, a.latitude, a.longitude,
                    CONCAT(u.first_name, ' ', u.last_name) as user_name
             FROM bids b
             INNER JOIN orders o ON b.order_id = o.id
             INNER JOIN services s ON o.service_id = s.id
             INNER JOIN users u ON o.user_id = u.id
             INNER JOIN user_addresses a ON o.address_id = a.id
             WHERE b.provider_id = ?
               AND b.status = 'pending'
               AND o.status = 'pending'
             ORDER BY b.created_at DESC"
        );
        $stmt->execute([$providerId]);

        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * Accepter une offre (transaction complète)
     * @param int $bidId
     * @param int $userId
     * @return bool
     * @throws \Exception
     */
    public static function acceptBid(int $bidId, int $userId): bool
    {
        $db = Database::getInstance();

        // Démarrer une transaction
        $db->beginTransaction();

        try {
            // Récupérer l'offre
            $bid = self::findById($bidId);
            if (!$bid) {
                throw new \Exception("Offre introuvable");
            }

            // Récupérer la commande
            $stmtOrder = $db->prepare("SELECT * FROM orders WHERE id = ?");
            $stmtOrder->execute([$bid['order_id']]);
            $order = $stmtOrder->fetch(\PDO::FETCH_ASSOC);

            if (!$order) {
                throw new \Exception("Commande introuvable");
            }

            // Vérifier que l'utilisateur est bien le propriétaire
            if ($order['user_id'] != $userId) {
                throw new \Exception("Vous n'êtes pas autorisé à accepter cette offre");
            }

            // Vérifier que la commande est en attente
            if ($order['status'] !== 'pending') {
                throw new \Exception("Cette commande n'est plus disponible");
            }

            // Mettre à jour l'offre acceptée
            $stmtAccept = $db->prepare(
                "UPDATE bids SET status = 'accepted', updated_at = NOW() WHERE id = ?"
            );
            $stmtAccept->execute([$bidId]);

            // Rejeter toutes les autres offres
            $stmtReject = $db->prepare(
                "UPDATE bids SET status = 'rejected', updated_at = NOW()
                 WHERE order_id = ? AND id != ? AND status = 'pending'"
            );
            $stmtReject->execute([$bid['order_id'], $bidId]);

            // Mettre à jour la commande
            $stmtUpdateOrder = $db->prepare(
                "UPDATE orders
                 SET provider_id = ?,
                     status = 'accepted',
                     accepted_bid_id = ?,
                     price = ?,
                     total = ?,
                     accepted_at = NOW()
                 WHERE id = ?"
            );
            $stmtUpdateOrder->execute([
                $bid['provider_id'],
                $bidId,
                $bid['proposed_price'],
                $bid['proposed_price'], // Sans pourboire pour l'instant
                $bid['order_id']
            ]);

            // Mettre à jour les stats du prestataire accepté
            self::updateProviderStats($bid['provider_id'], true);

            // Créer des notifications
            self::notifyProviderAcceptedBid($bid['provider_id'], $bidId);
            self::notifyRejectedProviders($bid['order_id'], $bidId);

            $db->commit();

            return true;
        } catch (\Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }

    /**
     * Retirer une offre (prestataire)
     * @param int $bidId
     * @param int $providerId
     * @return bool
     */
    public static function withdrawBid(int $bidId, int $providerId): bool
    {
        $db = Database::getInstance();

        // Vérifier que l'offre appartient au prestataire
        $stmt = $db->prepare("SELECT * FROM bids WHERE id = ? AND provider_id = ?");
        $stmt->execute([$bidId, $providerId]);
        $bid = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$bid) {
            return false;
        }

        // Ne peut retirer que si l'offre est en attente
        if ($bid['status'] !== 'pending') {
            return false;
        }

        // Mettre à jour le statut
        $stmtUpdate = $db->prepare(
            "UPDATE bids SET status = 'withdrawn', updated_at = NOW() WHERE id = ?"
        );

        return $stmtUpdate->execute([$bidId]);
    }

    /**
     * Compter les offres actives pour une commande
     * @param int $orderId
     * @return int
     */
    public static function countActiveByOrderId(int $orderId): int
    {
        $db = Database::getInstance();
        $stmt = $db->prepare(
            "SELECT COUNT(*) as count FROM bids WHERE order_id = ? AND status = 'pending'"
        );
        $stmt->execute([$orderId]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);

        return (int) $result['count'];
    }

    /**
     * Expirer les offres anciennes (pour cron job)
     * @param int $hoursOld
     * @return int Nombre d'offres expirées
     */
    public static function expireOldBids(int $hoursOld = 24): int
    {
        $db = Database::getInstance();
        $stmt = $db->prepare(
            "UPDATE bids b
             INNER JOIN orders o ON b.order_id = o.id
             SET b.status = 'expired', b.updated_at = NOW()
             WHERE b.status = 'pending'
               AND b.created_at < DATE_SUB(NOW(), INTERVAL ? HOUR)
               AND o.status = 'pending'"
        );
        $stmt->execute([$hoursOld]);

        return $stmt->rowCount();
    }

    // =========================================
    // MÉTHODES PRIVÉES (HELPERS)
    // =========================================

    /**
     * Mettre à jour les statistiques d'un prestataire
     * @param int $providerId
     * @param bool $accepted
     * @return void
     */
    private static function updateProviderStats(int $providerId, bool $accepted = false): void
    {
        $db = Database::getInstance();

        if ($accepted) {
            $stmt = $db->prepare(
                "UPDATE provider_stats
                 SET accepted_bids = accepted_bids + 1,
                     acceptance_rate = (accepted_bids + 1) / total_bids * 100
                 WHERE provider_id = ?"
            );
        } else {
            $stmt = $db->prepare(
                "UPDATE provider_stats
                 SET total_bids = total_bids + 1,
                     last_bid_at = NOW(),
                     acceptance_rate = accepted_bids / (total_bids + 1) * 100
                 WHERE provider_id = ?"
            );
        }

        $stmt->execute([$providerId]);
    }

    /**
     * Notifier l'utilisateur d'une nouvelle offre
     * @param int $orderId
     * @param int $bidId
     * @return void
     */
    private static function notifyUserNewBid(int $orderId, int $bidId): void
    {
        $db = Database::getInstance();

        // Récupérer les infos de la commande
        $stmt = $db->prepare("SELECT user_id FROM orders WHERE id = ?");
        $stmt->execute([$orderId]);
        $order = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$order) {
            return;
        }

        // Créer la notification
        $stmtNotif = $db->prepare(
            "INSERT INTO notifications (recipient_type, recipient_id, order_id, notification_type, title, message, data, created_at)
             VALUES ('user', ?, ?, 'new_bid', 'Nouvelle offre reçue',
                     'Un prestataire a fait une offre pour votre commande', ?, NOW())"
        );
        $data = json_encode(['bid_id' => $bidId]);
        $stmtNotif->execute([$order['user_id'], $orderId, $data]);
    }

    /**
     * Notifier le prestataire que son offre a été acceptée
     * @param int $providerId
     * @param int $bidId
     * @return void
     */
    private static function notifyProviderAcceptedBid(int $providerId, int $bidId): void
    {
        $db = Database::getInstance();

        // Récupérer l'order_id depuis le bid
        $stmtBid = $db->prepare("SELECT order_id FROM bids WHERE id = ?");
        $stmtBid->execute([$bidId]);
        $bid = $stmtBid->fetch(\PDO::FETCH_ASSOC);

        if (!$bid) {
            return;
        }

        $stmt = $db->prepare(
            "INSERT INTO notifications (recipient_type, recipient_id, order_id, notification_type, title, message, data, created_at)
             VALUES ('provider', ?, ?, 'bid_accepted', 'Offre acceptée!',
                     'Votre offre a été acceptée par le client', ?, NOW())"
        );
        $data = json_encode(['bid_id' => $bidId]);
        $stmt->execute([$providerId, $bid['order_id'], $data]);
    }

    /**
     * Notifier les prestataires dont les offres ont été rejetées
     * @param int $orderId
     * @param int $acceptedBidId
     * @return void
     */
    private static function notifyRejectedProviders(int $orderId, int $acceptedBidId): void
    {
        $db = Database::getInstance();

        // Récupérer tous les prestataires rejetés avec leur bid_id
        $stmt = $db->prepare(
            "SELECT id as bid_id, provider_id FROM bids
             WHERE order_id = ? AND id != ? AND status = 'rejected'"
        );
        $stmt->execute([$orderId, $acceptedBidId]);
        $providers = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Créer des notifications
        foreach ($providers as $provider) {
            $stmtNotif = $db->prepare(
                "INSERT INTO notifications (recipient_type, recipient_id, order_id, notification_type, title, message, data, created_at)
                 VALUES ('provider', ?, ?, 'bid_rejected', 'Offre non retenue',
                         'Le client a choisi une autre offre pour cette commande', ?, NOW())"
            );
            $data = json_encode(['bid_id' => $provider['bid_id'], 'accepted_bid_id' => $acceptedBidId]);
            $stmtNotif->execute([$provider['provider_id'], $orderId, $data]);
        }
    }
}
