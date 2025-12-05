<?php

/**
 * Modèle SatisfactionSurvey
 * Gestion des questionnaires de satisfaction post-prestation
 *
 * GlamGo - Marrakech
 * @since 2025-11-28
 */

namespace App\Models;

use App\Core\Model;
use App\Core\Database;
use PDO;

class SatisfactionSurvey extends Model
{
    protected string $table = 'satisfaction_surveys';

    /**
     * Crée un nouveau questionnaire de satisfaction
     *
     * @param array $data Données du questionnaire
     * @return int ID du questionnaire créé
     */
    public function createSurvey(array $data): int
    {
        return $this->create([
            'order_id' => $data['order_id'],
            'user_id' => $data['user_id'],
            'provider_id' => $data['provider_id'],
            'quality_rating' => $data['quality_rating'],
            'punctuality' => $data['punctuality'] ? 1 : 0,
            'price_respected' => $data['price_respected'] ? 1 : 0,
            'professionalism_rating' => $data['professionalism_rating'] ?? null,
            'comment' => $data['comment'] ?? null,
            'photos' => isset($data['photos']) ? json_encode($data['photos']) : null,
            'ip_address' => $data['ip_address'] ?? null
        ]);
    }

    /**
     * Récupère un questionnaire par order_id
     *
     * @param int $orderId ID de la commande
     * @return array|null Questionnaire ou null
     */
    public function findByOrderId(int $orderId): ?array
    {
        return $this->findBy('order_id', $orderId);
    }

    /**
     * Vérifie si un questionnaire existe pour une commande
     *
     * @param int $orderId ID de la commande
     * @return bool
     */
    public function existsForOrder(int $orderId): bool
    {
        $result = $this->query(
            "SELECT COUNT(*) as count FROM {$this->table} WHERE order_id = ?",
            [$orderId]
        );
        return ($result[0]['count'] ?? 0) > 0;
    }

    /**
     * Récupère les questionnaires d'un utilisateur
     *
     * @param int $userId ID utilisateur
     * @param int $limit Limite
     * @return array Liste des questionnaires
     */
    public function getUserSurveys(int $userId, int $limit = 20): array
    {
        return $this->query(
            "SELECT ss.*,
                    o.id as order_id, o.created_at as order_date,
                    s.name as service_name,
                    p.first_name as provider_first_name, p.last_name as provider_last_name
             FROM {$this->table} ss
             INNER JOIN orders o ON ss.order_id = o.id
             INNER JOIN services s ON o.service_id = s.id
             INNER JOIN providers p ON ss.provider_id = p.id
             WHERE ss.user_id = ?
             ORDER BY ss.submitted_at DESC
             LIMIT ?",
            [$userId, $limit]
        );
    }

    /**
     * Récupère les questionnaires d'un prestataire
     *
     * @param int $providerId ID prestataire
     * @param int $limit Limite
     * @return array Liste des questionnaires
     */
    public function getProviderSurveys(int $providerId, int $limit = 50): array
    {
        return $this->query(
            "SELECT ss.*,
                    o.id as order_id, o.created_at as order_date,
                    s.name as service_name,
                    u.first_name as user_first_name, u.last_name as user_last_name,
                    u.avatar as user_avatar
             FROM {$this->table} ss
             INNER JOIN orders o ON ss.order_id = o.id
             INNER JOIN services s ON o.service_id = s.id
             INNER JOIN users u ON ss.user_id = u.id
             WHERE ss.provider_id = ?
             ORDER BY ss.submitted_at DESC
             LIMIT ?",
            [$providerId, $limit]
        );
    }

    /**
     * Calcule les statistiques de satisfaction d'un prestataire
     *
     * @param int $providerId ID prestataire
     * @return array Statistiques agrégées
     */
    public function getProviderStats(int $providerId): array
    {
        $result = $this->query(
            "SELECT
                COUNT(*) as total_reviews,
                ROUND(AVG(quality_rating), 2) as avg_quality_rating,
                ROUND(AVG(professionalism_rating), 2) as avg_professionalism,
                ROUND((SUM(CASE WHEN punctuality = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) as punctuality_rate,
                ROUND((SUM(CASE WHEN price_respected = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) as price_respect_rate,
                SUM(CASE WHEN quality_rating = 5 THEN 1 ELSE 0 END) as five_stars,
                SUM(CASE WHEN quality_rating = 4 THEN 1 ELSE 0 END) as four_stars,
                SUM(CASE WHEN quality_rating = 3 THEN 1 ELSE 0 END) as three_stars,
                SUM(CASE WHEN quality_rating = 2 THEN 1 ELSE 0 END) as two_stars,
                SUM(CASE WHEN quality_rating = 1 THEN 1 ELSE 0 END) as one_star
             FROM {$this->table}
             WHERE provider_id = ?",
            [$providerId]
        );

        return $result[0] ?? [
            'total_reviews' => 0,
            'avg_quality_rating' => null,
            'avg_professionalism' => null,
            'punctuality_rate' => null,
            'price_respect_rate' => null,
            'five_stars' => 0,
            'four_stars' => 0,
            'three_stars' => 0,
            'two_stars' => 0,
            'one_star' => 0
        ];
    }

    /**
     * Récupère les derniers avis avec commentaires
     *
     * @param int $providerId ID prestataire
     * @param int $limit Limite
     * @return array Avis avec commentaires
     */
    public function getLatestReviewsWithComments(int $providerId, int $limit = 10): array
    {
        return $this->query(
            "SELECT ss.*,
                    u.first_name, u.last_name, u.avatar,
                    s.name as service_name
             FROM {$this->table} ss
             INNER JOIN users u ON ss.user_id = u.id
             INNER JOIN orders o ON ss.order_id = o.id
             INNER JOIN services s ON o.service_id = s.id
             WHERE ss.provider_id = ?
               AND ss.comment IS NOT NULL
               AND ss.comment != ''
             ORDER BY ss.submitted_at DESC
             LIMIT ?",
            [$providerId, $limit]
        );
    }

    /**
     * Récupère le questionnaire détaillé avec infos liées
     *
     * @param int $surveyId ID questionnaire
     * @return array|null Questionnaire détaillé
     */
    public function getDetailedSurvey(int $surveyId): ?array
    {
        $result = $this->query(
            "SELECT ss.*,
                    o.id as order_id, o.price as order_price, o.created_at as order_date,
                    o.completed_at as order_completed_at,
                    s.name as service_name, s.image as service_image,
                    u.first_name as user_first_name, u.last_name as user_last_name,
                    u.avatar as user_avatar,
                    p.first_name as provider_first_name, p.last_name as provider_last_name,
                    p.avatar as provider_avatar
             FROM {$this->table} ss
             INNER JOIN orders o ON ss.order_id = o.id
             INNER JOIN services s ON o.service_id = s.id
             INNER JOIN users u ON ss.user_id = u.id
             INNER JOIN providers p ON ss.provider_id = p.id
             WHERE ss.id = ?",
            [$surveyId]
        );

        return $result[0] ?? null;
    }

    /**
     * Décode le JSON photos
     *
     * @param array $survey Données questionnaire
     * @return array Photos décodées
     */
    public static function getPhotosArray(array $survey): array
    {
        if (empty($survey['photos'])) {
            return [];
        }
        return json_decode($survey['photos'], true) ?? [];
    }

    /**
     * Compte les commandes en attente d'évaluation pour un utilisateur
     *
     * @param int $userId ID utilisateur
     * @return int Nombre de commandes en attente
     */
    public function getPendingReviewsCount(int $userId): int
    {
        $result = $this->query(
            "SELECT COUNT(*) as count
             FROM orders
             WHERE user_id = ?
               AND status = 'completed_pending_review'",
            [$userId]
        );
        return (int)($result[0]['count'] ?? 0);
    }

    /**
     * Récupère les commandes en attente d'évaluation pour un utilisateur
     *
     * @param int $userId ID utilisateur
     * @return array Liste des commandes
     */
    public function getPendingReviews(int $userId): array
    {
        return $this->query(
            "SELECT o.*,
                    s.name as service_name, s.image as service_image,
                    p.first_name as provider_first_name, p.last_name as provider_last_name,
                    p.avatar as provider_avatar,
                    CONCAT(p.first_name, ' ', p.last_name) as provider_name
             FROM orders o
             INNER JOIN services s ON o.service_id = s.id
             INNER JOIN providers p ON o.provider_id = p.id
             WHERE o.user_id = ?
               AND o.status = 'completed_pending_review'
             ORDER BY o.provider_completed_at ASC",
            [$userId]
        );
    }
}
