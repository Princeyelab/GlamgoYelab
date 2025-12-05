<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Provider;
use App\Models\ProviderBlock;
use App\Models\Review;
use PDO;

/**
 * Controleur pour la gestion de la priorite et du blocage des prestataires
 */
class ProviderPriorityController extends Controller
{
    private Provider $providerModel;
    private ?ProviderBlock $blockModel = null;
    private ?Review $reviewModel = null;
    private PDO $db;

    // Configuration des seuils
    const EXCELLENT_RATING = 4.5;
    const GOOD_RATING = 4.0;
    const AVERAGE_RATING = 3.5;
    const LOW_RATING = 3.0;
    const BLOCK_RATING_THRESHOLD = 2.5;
    const MIN_REVIEWS_FOR_BLOCK = 5;
    const CONSECUTIVE_BAD_REVIEWS = 3;

    // Delais de priorite (en secondes)
    const PRIORITY_DELAYS = [
        'EXCELLENT' => 0,
        'GOOD' => 30,
        'AVERAGE' => 60,
        'LOW' => 120,
        'CRITICAL' => 300
    ];

    // Durees de blocage (en jours)
    const BLOCK_DURATIONS = [
        'FIRST' => 7,
        'SECOND' => 14,
        'THIRD' => 30,
        'PERMANENT' => -1
    ];

    public function __construct()
    {
        $this->providerModel = new Provider();
        $this->db = \App\Core\Database::getInstance();

        // Initialiser les modeles optionnels
        if (class_exists('App\Models\ProviderBlock')) {
            $this->blockModel = new ProviderBlock();
        }
        if (class_exists('App\Models\Review')) {
            $this->reviewModel = new Review();
        }
    }

    /**
     * (Provider) Recuperer son statut de priorite
     */
    public function getMyPriorityStatus(): void
    {
        $providerId = $_SERVER['USER_ID'];

        $provider = $this->providerModel->find($providerId);
        if (!$provider) {
            $this->error('Prestataire non trouve', 404);
        }

        $rating = floatval($provider['rating'] ?? 0);
        $reviewCount = intval($provider['total_reviews'] ?? 0);

        // Calculer le niveau de priorite
        $priority = $this->calculatePriorityLevel($rating, $reviewCount);

        // Recuperer l'historique des notes
        $ratingHistory = $this->getRatingHistory($providerId, 30);

        // Verifier le statut de blocage
        $blockStatus = $this->checkBlockStatus($providerId, $rating, $reviewCount);

        // Statistiques supplementaires
        $stats = $this->getProviderStats($providerId);

        $this->success([
            'priority' => $priority,
            'rating' => $rating,
            'total_reviews' => $reviewCount,
            'rating_history' => $ratingHistory,
            'block_status' => $blockStatus,
            'stats' => $stats,
            'thresholds' => [
                'excellent' => self::EXCELLENT_RATING,
                'good' => self::GOOD_RATING,
                'average' => self::AVERAGE_RATING,
                'low' => self::LOW_RATING,
                'block' => self::BLOCK_RATING_THRESHOLD
            ]
        ]);
    }

    /**
     * (Provider) Recuperer l'historique de ses notes
     */
    public function getRatingHistoryEndpoint(): void
    {
        $providerId = $_SERVER['USER_ID'];
        $days = intval($_GET['days'] ?? 30);

        $history = $this->getRatingHistory($providerId, $days);

        $this->success([
            'history' => $history,
            'period_days' => $days
        ]);
    }

    /**
     * (Admin) Recuperer la liste des prestataires avec leur priorite
     */
    public function getProvidersPriority(): void
    {
        $sortBy = $_GET['sort_by'] ?? 'rating';
        $order = strtoupper($_GET['order'] ?? 'DESC');
        $status = $_GET['status'] ?? null;
        $minRating = isset($_GET['min_rating']) ? floatval($_GET['min_rating']) : null;
        $maxRating = isset($_GET['max_rating']) ? floatval($_GET['max_rating']) : null;
        $page = intval($_GET['page'] ?? 1);
        $limit = intval($_GET['limit'] ?? 20);
        $offset = ($page - 1) * $limit;

        // Construction de la requete
        $sql = "SELECT p.*,
                       COALESCE(p.rating, 0) as rating,
                       COALESCE(p.total_reviews, 0) as total_reviews,
                       (SELECT COUNT(*) FROM orders WHERE provider_id = p.id AND status = 'completed') as completed_orders,
                       (SELECT COUNT(*) FROM orders WHERE provider_id = p.id AND status = 'cancelled' AND cancelled_by = 'provider') as cancelled_orders
                FROM providers p
                WHERE 1=1";

        $params = [];

        if ($status === 'blocked') {
            $sql .= " AND (p.is_blocked = 1 OR (p.blocked_until IS NOT NULL AND p.blocked_until > NOW()))";
        } elseif ($status === 'active') {
            $sql .= " AND (p.is_blocked = 0 OR p.is_blocked IS NULL) AND (p.blocked_until IS NULL OR p.blocked_until <= NOW())";
        }

        if ($minRating !== null) {
            $sql .= " AND COALESCE(p.rating, 0) >= :min_rating";
            $params['min_rating'] = $minRating;
        }

        if ($maxRating !== null) {
            $sql .= " AND COALESCE(p.rating, 0) <= :max_rating";
            $params['max_rating'] = $maxRating;
        }

        // Tri
        $allowedSorts = ['rating', 'total_reviews', 'created_at', 'first_name'];
        $sortBy = in_array($sortBy, $allowedSorts) ? $sortBy : 'rating';
        $order = $order === 'ASC' ? 'ASC' : 'DESC';

        $sql .= " ORDER BY $sortBy $order LIMIT :limit OFFSET :offset";

        $stmt = $this->db->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue(":$key", $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $providers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Ajouter le niveau de priorite a chaque prestataire
        foreach ($providers as &$provider) {
            $provider['priority'] = $this->calculatePriorityLevel(
                floatval($provider['rating']),
                intval($provider['total_reviews'])
            );
            unset($provider['password']);
        }

        // Compter le total
        $countSql = "SELECT COUNT(*) FROM providers p WHERE 1=1";
        if ($status === 'blocked') {
            $countSql .= " AND (p.is_blocked = 1 OR (p.blocked_until IS NOT NULL AND p.blocked_until > NOW()))";
        } elseif ($status === 'active') {
            $countSql .= " AND (p.is_blocked = 0 OR p.is_blocked IS NULL) AND (p.blocked_until IS NULL OR p.blocked_until <= NOW())";
        }
        $countStmt = $this->db->query($countSql);
        $total = $countStmt->fetchColumn();

        $this->success([
            'providers' => $providers,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);
    }

    /**
     * (Admin) Bloquer un prestataire
     */
    public function blockProvider(int $providerId): void
    {
        $data = $this->getJsonInput();

        $errors = $this->validate($data, [
            'reason' => 'required|min:10',
            'block_type' => 'required'
        ]);

        if (!empty($errors)) {
            $this->error('Erreurs de validation', 422, $errors);
        }

        $provider = $this->providerModel->find($providerId);
        if (!$provider) {
            $this->error('Prestataire non trouve', 404);
        }

        // Determiner la duree du blocage
        $blockType = $data['block_type'];
        $durationDays = $data['duration_days'] ?? null;
        $blockedUntil = null;

        if ($blockType === 'temporary' && $durationDays) {
            $blockedUntil = date('Y-m-d H:i:s', strtotime("+$durationDays days"));
        }

        // Mettre a jour le prestataire
        $updateData = [
            'is_blocked' => $blockType === 'permanent' ? 1 : 0,
            'blocked_until' => $blockedUntil,
            'block_reason' => $data['reason']
        ];

        $this->providerModel->update($providerId, $updateData);

        // Enregistrer dans l'historique de blocage
        $this->recordBlockHistory($providerId, [
            'action' => 'block',
            'block_type' => $blockType,
            'reason' => $data['reason'],
            'duration_days' => $durationDays,
            'blocked_until' => $blockedUntil,
            'admin_id' => $_SERVER['USER_ID'] ?? null
        ]);

        // Envoyer une notification au prestataire
        $this->sendBlockNotification($providerId, $data['reason'], $blockType, $durationDays);

        $this->success([
            'provider_id' => $providerId,
            'block_type' => $blockType,
            'blocked_until' => $blockedUntil,
            'reason' => $data['reason']
        ], 'Prestataire bloque avec succes');
    }

    /**
     * (Admin) Debloquer un prestataire
     */
    public function unblockProvider(int $providerId): void
    {
        $data = $this->getJsonInput();

        $provider = $this->providerModel->find($providerId);
        if (!$provider) {
            $this->error('Prestataire non trouve', 404);
        }

        // Mettre a jour le prestataire
        $this->providerModel->update($providerId, [
            'is_blocked' => 0,
            'blocked_until' => null,
            'block_reason' => null
        ]);

        // Enregistrer dans l'historique
        $this->recordBlockHistory($providerId, [
            'action' => 'unblock',
            'reason' => $data['reason'] ?? 'Deblocage administratif',
            'admin_id' => $_SERVER['USER_ID'] ?? null
        ]);

        // Envoyer une notification au prestataire
        $this->sendUnblockNotification($providerId);

        $this->success([
            'provider_id' => $providerId
        ], 'Prestataire debloque avec succes');
    }

    /**
     * (Admin) Recuperer l'historique de blocage d'un prestataire
     */
    public function getBlockHistory(int $providerId): void
    {
        $provider = $this->providerModel->find($providerId);
        if (!$provider) {
            $this->error('Prestataire non trouve', 404);
        }

        $sql = "SELECT * FROM provider_block_history
                WHERE provider_id = :provider_id
                ORDER BY created_at DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['provider_id' => $providerId]);
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $this->success([
            'provider_id' => $providerId,
            'provider_name' => $provider['first_name'] . ' ' . $provider['last_name'],
            'current_status' => [
                'is_blocked' => (bool) $provider['is_blocked'],
                'blocked_until' => $provider['blocked_until'],
                'block_reason' => $provider['block_reason']
            ],
            'history' => $history
        ]);
    }

    /**
     * (Admin) Verifier et bloquer automatiquement les prestataires sous le seuil
     */
    public function checkAndBlockLowRated(): void
    {
        $sql = "SELECT id, first_name, last_name, email, rating, total_reviews
                FROM providers
                WHERE rating < :threshold
                AND total_reviews >= :min_reviews
                AND (is_blocked = 0 OR is_blocked IS NULL)
                AND (blocked_until IS NULL OR blocked_until <= NOW())";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'threshold' => self::BLOCK_RATING_THRESHOLD,
            'min_reviews' => self::MIN_REVIEWS_FOR_BLOCK
        ]);

        $providers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $blocked = [];
        $warned = [];

        foreach ($providers as $provider) {
            // Compter les blocages precedents
            $blockCount = $this->countPreviousBlocks($provider['id']);

            // Determiner le type de blocage
            $blockType = $this->determineBlockType($blockCount);
            $durationDays = $this->getBlockDuration($blockCount);

            $blockedUntil = null;
            if ($blockType === 'temporary' && $durationDays > 0) {
                $blockedUntil = date('Y-m-d H:i:s', strtotime("+$durationDays days"));
            }

            // Appliquer le blocage
            $this->providerModel->update($provider['id'], [
                'is_blocked' => $blockType === 'permanent' ? 1 : 0,
                'blocked_until' => $blockedUntil,
                'block_reason' => 'Blocage automatique: note moyenne inferieure a ' . self::BLOCK_RATING_THRESHOLD
            ]);

            // Enregistrer dans l'historique
            $this->recordBlockHistory($provider['id'], [
                'action' => 'block',
                'block_type' => $blockType,
                'reason' => 'Blocage automatique: note moyenne (' . $provider['rating'] . ') inferieure au seuil',
                'duration_days' => $durationDays,
                'blocked_until' => $blockedUntil,
                'admin_id' => null,
                'is_automatic' => 1
            ]);

            // Envoyer notification
            $this->sendBlockNotification($provider['id'],
                'Votre compte a ete suspendu en raison d\'une note moyenne trop basse (' . $provider['rating'] . '/5).',
                $blockType,
                $durationDays
            );

            $blocked[] = [
                'id' => $provider['id'],
                'name' => $provider['first_name'] . ' ' . $provider['last_name'],
                'rating' => $provider['rating'],
                'block_type' => $blockType,
                'duration_days' => $durationDays
            ];
        }

        // Verifier aussi les prestataires a risque (avis consecutifs negatifs)
        $atRisk = $this->checkConsecutiveBadReviews();

        $this->success([
            'blocked_count' => count($blocked),
            'blocked_providers' => $blocked,
            'at_risk_count' => count($atRisk),
            'at_risk_providers' => $atRisk
        ], 'Verification terminee');
    }

    /**
     * (Admin) Recuperer les prestataires a risque
     */
    public function getAtRiskProviders(): void
    {
        $atRisk = [];

        // 1. Prestataires avec note proche du seuil de blocage
        $sql = "SELECT id, first_name, last_name, email, rating, total_reviews
                FROM providers
                WHERE rating BETWEEN :low_threshold AND :high_threshold
                AND total_reviews >= :min_reviews
                AND (is_blocked = 0 OR is_blocked IS NULL)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'low_threshold' => self::BLOCK_RATING_THRESHOLD,
            'high_threshold' => self::LOW_RATING,
            'min_reviews' => 3
        ]);

        $lowRated = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($lowRated as $provider) {
            $provider['risk_type'] = 'low_rating';
            $provider['risk_message'] = 'Note proche du seuil de blocage';
            $atRisk[] = $provider;
        }

        // 2. Prestataires avec avis consecutifs negatifs
        $consecutiveBad = $this->checkConsecutiveBadReviews();
        foreach ($consecutiveBad as $provider) {
            $provider['risk_type'] = 'consecutive_bad_reviews';
            $provider['risk_message'] = 'Avis consecutifs negatifs';
            $atRisk[] = $provider;
        }

        // 3. Prestataires avec baisse de note significative
        $ratingDrop = $this->checkRatingDrop();
        foreach ($ratingDrop as $provider) {
            $provider['risk_type'] = 'rating_drop';
            $provider['risk_message'] = 'Baisse de note significative';
            $atRisk[] = $provider;
        }

        $this->success([
            'count' => count($atRisk),
            'providers' => $atRisk
        ]);
    }

    /**
     * (Admin) Envoyer un avertissement a un prestataire
     */
    public function sendWarning(int $providerId): void
    {
        $data = $this->getJsonInput();

        $errors = $this->validate($data, [
            'message' => 'required|min:10',
            'warning_type' => 'required'
        ]);

        if (!empty($errors)) {
            $this->error('Erreurs de validation', 422, $errors);
        }

        $provider = $this->providerModel->find($providerId);
        if (!$provider) {
            $this->error('Prestataire non trouve', 404);
        }

        // Enregistrer l'avertissement
        $sql = "INSERT INTO provider_warnings (provider_id, warning_type, message, admin_id, created_at)
                VALUES (:provider_id, :warning_type, :message, :admin_id, NOW())";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'provider_id' => $providerId,
            'warning_type' => $data['warning_type'],
            'message' => $data['message'],
            'admin_id' => $_SERVER['USER_ID'] ?? null
        ]);

        // Envoyer notification au prestataire
        $this->sendWarningNotification($providerId, $data['message'], $data['warning_type']);

        $this->success([
            'provider_id' => $providerId,
            'warning_type' => $data['warning_type']
        ], 'Avertissement envoye');
    }

    /**
     * Recuperer les prestataires tries par priorite pour une commande
     */
    public function getProvidersByPriorityForOrder(int $orderId): void
    {
        // Recuperer les infos de la commande
        $orderSql = "SELECT * FROM orders WHERE id = :order_id";
        $orderStmt = $this->db->prepare($orderSql);
        $orderStmt->execute(['order_id' => $orderId]);
        $order = $orderStmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            $this->error('Commande non trouvee', 404);
        }

        // Recuperer les prestataires disponibles et non bloques
        $sql = "SELECT p.*,
                       COALESCE(p.rating, 0) as rating,
                       COALESCE(p.total_reviews, 0) as total_reviews
                FROM providers p
                INNER JOIN provider_services ps ON p.id = ps.provider_id
                WHERE ps.service_id = :service_id
                AND p.is_available = 1
                AND (p.is_blocked = 0 OR p.is_blocked IS NULL)
                AND (p.blocked_until IS NULL OR p.blocked_until <= NOW())
                ORDER BY p.rating DESC, p.total_reviews DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['service_id' => $order['service_id']]);
        $providers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Ajouter la priorite et le delai a chaque prestataire
        foreach ($providers as &$provider) {
            $priority = $this->calculatePriorityLevel(
                floatval($provider['rating']),
                intval($provider['total_reviews'])
            );
            $provider['priority'] = $priority;
            $provider['notification_delay'] = $priority['delay'];
            unset($provider['password']);
        }

        $this->success([
            'order_id' => $orderId,
            'providers' => $providers
        ]);
    }

    // ==================== METHODES PRIVEES ====================

    /**
     * Calcule le niveau de priorite
     */
    private function calculatePriorityLevel(float $rating, int $reviewCount): array
    {
        if ($reviewCount < 3) {
            return [
                'level' => 'NEW',
                'label' => 'Nouveau prestataire',
                'delay' => self::PRIORITY_DELAYS['AVERAGE'],
                'color' => '#6c757d',
                'icon' => 'new'
            ];
        }

        if ($rating >= self::EXCELLENT_RATING) {
            return [
                'level' => 'EXCELLENT',
                'label' => 'Priorite maximale',
                'delay' => self::PRIORITY_DELAYS['EXCELLENT'],
                'color' => '#28a745',
                'icon' => 'star'
            ];
        }

        if ($rating >= self::GOOD_RATING) {
            return [
                'level' => 'GOOD',
                'label' => 'Priorite haute',
                'delay' => self::PRIORITY_DELAYS['GOOD'],
                'color' => '#20c997',
                'icon' => 'thumbs-up'
            ];
        }

        if ($rating >= self::AVERAGE_RATING) {
            return [
                'level' => 'AVERAGE',
                'label' => 'Priorite normale',
                'delay' => self::PRIORITY_DELAYS['AVERAGE'],
                'color' => '#ffc107',
                'icon' => 'minus'
            ];
        }

        if ($rating >= self::LOW_RATING) {
            return [
                'level' => 'LOW',
                'label' => 'Priorite basse',
                'delay' => self::PRIORITY_DELAYS['LOW'],
                'color' => '#fd7e14',
                'icon' => 'warning'
            ];
        }

        return [
            'level' => 'CRITICAL',
            'label' => 'Priorite critique',
            'delay' => self::PRIORITY_DELAYS['CRITICAL'],
            'color' => '#dc3545',
            'icon' => 'alert'
        ];
    }

    /**
     * Recupere l'historique des notes
     */
    private function getRatingHistory(int $providerId, int $days): array
    {
        $sql = "SELECT DATE(created_at) as date,
                       AVG(rating) as avg_rating,
                       COUNT(*) as total_reviews
                FROM reviews
                WHERE provider_id = :provider_id
                AND created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
                GROUP BY DATE(created_at)
                ORDER BY date ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':provider_id', $providerId, PDO::PARAM_INT);
        $stmt->bindValue(':days', $days, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Verifie le statut de blocage
     */
    private function checkBlockStatus(int $providerId, float $rating, int $reviewCount): array
    {
        $provider = $this->providerModel->find($providerId);

        // Verifier si deja bloque
        if ($provider['is_blocked']) {
            return [
                'is_blocked' => true,
                'block_type' => 'permanent',
                'reason' => $provider['block_reason'] ?? 'Blocage permanent'
            ];
        }

        if ($provider['blocked_until'] && strtotime($provider['blocked_until']) > time()) {
            return [
                'is_blocked' => true,
                'block_type' => 'temporary',
                'blocked_until' => $provider['blocked_until'],
                'reason' => $provider['block_reason'] ?? 'Suspension temporaire'
            ];
        }

        // Verifier si a risque de blocage
        if ($reviewCount >= self::MIN_REVIEWS_FOR_BLOCK && $rating < self::BLOCK_RATING_THRESHOLD) {
            return [
                'is_blocked' => false,
                'at_risk' => true,
                'reason' => 'Note moyenne en dessous du seuil de blocage'
            ];
        }

        return [
            'is_blocked' => false,
            'at_risk' => false
        ];
    }

    /**
     * Recupere les statistiques du prestataire
     */
    private function getProviderStats(int $providerId): array
    {
        $sql = "SELECT
                    (SELECT COUNT(*) FROM orders WHERE provider_id = :pid1 AND status = 'completed') as completed_orders,
                    (SELECT COUNT(*) FROM orders WHERE provider_id = :pid2 AND status = 'cancelled' AND cancelled_by = 'provider') as cancelled_orders,
                    (SELECT COUNT(*) FROM orders WHERE provider_id = :pid3) as total_orders";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'pid1' => $providerId,
            'pid2' => $providerId,
            'pid3' => $providerId
        ]);

        $stats = $stmt->fetch(PDO::FETCH_ASSOC);

        // Calculer le taux d'annulation
        $totalOrders = intval($stats['total_orders']);
        $cancelledOrders = intval($stats['cancelled_orders']);
        $stats['cancellation_rate'] = $totalOrders > 0
            ? round(($cancelledOrders / $totalOrders) * 100, 1)
            : 0;

        return $stats;
    }

    /**
     * Verifie les avis consecutifs negatifs
     */
    private function checkConsecutiveBadReviews(): array
    {
        $sql = "SELECT p.id, p.first_name, p.last_name, p.email, p.rating,
                       (SELECT GROUP_CONCAT(r.rating ORDER BY r.created_at DESC)
                        FROM reviews r
                        WHERE r.provider_id = p.id
                        ORDER BY r.created_at DESC
                        LIMIT " . self::CONSECUTIVE_BAD_REVIEWS . ") as recent_ratings
                FROM providers p
                WHERE (p.is_blocked = 0 OR p.is_blocked IS NULL)
                HAVING recent_ratings IS NOT NULL";

        $stmt = $this->db->query($sql);
        $providers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $atRisk = [];
        foreach ($providers as $provider) {
            if ($provider['recent_ratings']) {
                $ratings = explode(',', $provider['recent_ratings']);
                $allBad = true;
                foreach ($ratings as $rating) {
                    if (floatval($rating) >= 3) {
                        $allBad = false;
                        break;
                    }
                }
                if ($allBad && count($ratings) >= self::CONSECUTIVE_BAD_REVIEWS) {
                    unset($provider['recent_ratings']);
                    $atRisk[] = $provider;
                }
            }
        }

        return $atRisk;
    }

    /**
     * Verifie les baisses de note significatives
     */
    private function checkRatingDrop(): array
    {
        $sql = "SELECT p.id, p.first_name, p.last_name, p.email, p.rating as current_rating,
                       (SELECT AVG(r.rating)
                        FROM reviews r
                        WHERE r.provider_id = p.id
                        AND r.created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)) as old_rating
                FROM providers p
                WHERE (p.is_blocked = 0 OR p.is_blocked IS NULL)
                HAVING old_rating IS NOT NULL AND (old_rating - current_rating) >= 1.0";

        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Compte les blocages precedents
     */
    private function countPreviousBlocks(int $providerId): int
    {
        $sql = "SELECT COUNT(*) FROM provider_block_history
                WHERE provider_id = :provider_id AND action = 'block'";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['provider_id' => $providerId]);
        return intval($stmt->fetchColumn());
    }

    /**
     * Determine le type de blocage
     */
    private function determineBlockType(int $blockCount): string
    {
        return $blockCount >= 3 ? 'permanent' : 'temporary';
    }

    /**
     * Obtient la duree de blocage
     */
    private function getBlockDuration(int $blockCount): int
    {
        switch ($blockCount) {
            case 0: return self::BLOCK_DURATIONS['FIRST'];
            case 1: return self::BLOCK_DURATIONS['SECOND'];
            case 2: return self::BLOCK_DURATIONS['THIRD'];
            default: return self::BLOCK_DURATIONS['PERMANENT'];
        }
    }

    /**
     * Enregistre dans l'historique de blocage
     */
    private function recordBlockHistory(int $providerId, array $data): void
    {
        $sql = "INSERT INTO provider_block_history
                (provider_id, action, block_type, reason, duration_days, blocked_until, admin_id, is_automatic, created_at)
                VALUES (:provider_id, :action, :block_type, :reason, :duration_days, :blocked_until, :admin_id, :is_automatic, NOW())";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'provider_id' => $providerId,
            'action' => $data['action'],
            'block_type' => $data['block_type'] ?? null,
            'reason' => $data['reason'],
            'duration_days' => $data['duration_days'] ?? null,
            'blocked_until' => $data['blocked_until'] ?? null,
            'admin_id' => $data['admin_id'] ?? null,
            'is_automatic' => $data['is_automatic'] ?? 0
        ]);
    }

    /**
     * Envoie une notification de blocage
     */
    private function sendBlockNotification(int $providerId, string $reason, string $blockType, ?int $durationDays): void
    {
        $message = $blockType === 'permanent'
            ? "Votre compte a ete suspendu definitivement. Raison: $reason"
            : "Votre compte a ete suspendu pour $durationDays jours. Raison: $reason";

        $sql = "INSERT INTO provider_notifications (provider_id, type, title, message, created_at)
                VALUES (:provider_id, 'account_blocked', 'Compte suspendu', :message, NOW())";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'provider_id' => $providerId,
            'message' => $message
        ]);
    }

    /**
     * Envoie une notification de deblocage
     */
    private function sendUnblockNotification(int $providerId): void
    {
        $sql = "INSERT INTO provider_notifications (provider_id, type, title, message, created_at)
                VALUES (:provider_id, 'account_unblocked', 'Compte reactive', 'Votre compte a ete reactive. Vous pouvez a nouveau recevoir des commandes.', NOW())";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['provider_id' => $providerId]);
    }

    /**
     * Envoie une notification d'avertissement
     */
    private function sendWarningNotification(int $providerId, string $message, string $warningType): void
    {
        $title = 'Avertissement';
        switch ($warningType) {
            case 'rating_drop':
                $title = 'Attention: Baisse de note';
                break;
            case 'bad_reviews':
                $title = 'Attention: Avis negatifs';
                break;
            case 'cancellation':
                $title = 'Attention: Taux d\'annulation eleve';
                break;
        }

        $sql = "INSERT INTO provider_notifications (provider_id, type, title, message, created_at)
                VALUES (:provider_id, 'warning', :title, :message, NOW())";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'provider_id' => $providerId,
            'title' => $title,
            'message' => $message
        ]);
    }
}
