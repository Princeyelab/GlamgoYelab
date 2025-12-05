<?php

namespace App\Models;

use App\Core\Model;
use PDO;

class Review extends Model
{
    protected string $table = 'reviews';

    /**
     * Créer un nouvel avis
     */
    public function createReview(array $data): ?array
    {
        $sql = "INSERT INTO {$this->table}
                (order_id, user_id, provider_id, rating, comment, service_quality, punctuality, professionalism)
                VALUES (:order_id, :user_id, :provider_id, :rating, :comment, :service_quality, :punctuality, :professionalism)";

        $stmt = $this->db->prepare($sql);
        $result = $stmt->execute([
            'order_id' => $data['order_id'],
            'user_id' => $data['user_id'],
            'provider_id' => $data['provider_id'],
            'rating' => $data['rating'],
            'comment' => $data['comment'] ?? null,
            'service_quality' => $data['service_quality'] ?? null,
            'punctuality' => $data['punctuality'] ?? null,
            'professionalism' => $data['professionalism'] ?? null
        ]);

        if ($result) {
            $reviewId = $this->db->lastInsertId();

            // Marquer la commande comme ayant un avis
            $this->markOrderAsReviewed($data['order_id']);

            // Mettre à jour la note moyenne du prestataire
            $this->updateProviderRating($data['provider_id']);

            return $this->getReviewById($reviewId);
        }

        return null;
    }

    /**
     * Obtenir un avis par ID
     */
    public function getReviewById(int $id): ?array
    {
        $sql = "SELECT r.*,
                       u.first_name as user_first_name,
                       u.last_name as user_last_name,
                       p.first_name as provider_first_name,
                       p.last_name as provider_last_name
                FROM {$this->table} r
                JOIN users u ON r.user_id = u.id
                JOIN providers p ON r.provider_id = p.id
                WHERE r.id = :id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);
        $review = $stmt->fetch(PDO::FETCH_ASSOC);

        return $review ?: null;
    }

    /**
     * Obtenir l'avis d'une commande
     */
    public function getReviewByOrderId(int $orderId): ?array
    {
        $sql = "SELECT r.*,
                       u.first_name as user_first_name,
                       u.last_name as user_last_name
                FROM {$this->table} r
                JOIN users u ON r.user_id = u.id
                WHERE r.order_id = :order_id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['order_id' => $orderId]);
        $review = $stmt->fetch(PDO::FETCH_ASSOC);

        return $review ?: null;
    }

    /**
     * Obtenir tous les avis d'un prestataire
     */
    public function getProviderReviews(int $providerId, int $limit = 20, int $offset = 0): array
    {
        $sql = "SELECT r.*,
                       u.first_name as user_first_name,
                       u.last_name as user_last_name,
                       o.id as order_id,
                       s.name as service_name
                FROM {$this->table} r
                JOIN users u ON r.user_id = u.id
                JOIN orders o ON r.order_id = o.id
                JOIN services s ON o.service_id = s.id
                WHERE r.provider_id = :provider_id
                ORDER BY r.created_at DESC
                LIMIT :limit OFFSET :offset";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue('provider_id', $providerId, PDO::PARAM_INT);
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue('offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Obtenir les statistiques d'avis d'un prestataire
     */
    public function getProviderReviewStats(int $providerId): array
    {
        $sql = "SELECT
                    COUNT(*) as total_reviews,
                    AVG(rating) as average_rating,
                    AVG(service_quality) as avg_service_quality,
                    AVG(punctuality) as avg_punctuality,
                    AVG(professionalism) as avg_professionalism,
                    SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_stars,
                    SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_stars,
                    SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_stars,
                    SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_stars,
                    SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
                FROM {$this->table}
                WHERE provider_id = :provider_id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['provider_id' => $providerId]);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);

        return $stats ?: [
            'total_reviews' => 0,
            'average_rating' => 0,
            'avg_service_quality' => 0,
            'avg_punctuality' => 0,
            'avg_professionalism' => 0,
            'five_stars' => 0,
            'four_stars' => 0,
            'three_stars' => 0,
            'two_stars' => 0,
            'one_star' => 0
        ];
    }

    /**
     * Vérifier si une commande a déjà été évaluée
     */
    public function hasReview(int $orderId): bool
    {
        $sql = "SELECT COUNT(*) FROM {$this->table} WHERE order_id = :order_id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['order_id' => $orderId]);
        return $stmt->fetchColumn() > 0;
    }

    /**
     * Marquer une commande comme ayant un avis
     */
    private function markOrderAsReviewed(int $orderId): void
    {
        $sql = "UPDATE orders SET has_review = TRUE WHERE id = :order_id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['order_id' => $orderId]);
    }

    /**
     * Mettre à jour la note moyenne du prestataire
     */
    public function updateProviderRating(int $providerId): void
    {
        $stats = $this->getProviderReviewStats($providerId);
        $averageRating = $stats['average_rating'] ?? 0;

        $sql = "UPDATE providers SET rating = :rating WHERE id = :provider_id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'rating' => round($averageRating, 2),
            'provider_id' => $providerId
        ]);
    }

    /**
     * Obtenir les avis récents (pour affichage public)
     */
    public function getRecentReviews(int $limit = 10): array
    {
        $sql = "SELECT r.*,
                       u.first_name as user_first_name,
                       u.last_name as user_last_name,
                       p.first_name as provider_first_name,
                       p.last_name as provider_last_name,
                       s.name as service_name
                FROM {$this->table} r
                JOIN users u ON r.user_id = u.id
                JOIN providers p ON r.provider_id = p.id
                JOIN orders o ON r.order_id = o.id
                JOIN services s ON o.service_id = s.id
                WHERE r.rating >= 4
                ORDER BY r.created_at DESC
                LIMIT :limit";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
