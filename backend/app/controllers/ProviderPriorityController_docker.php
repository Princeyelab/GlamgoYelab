<?php

/**
 * Controleur pour la gestion de la priorite et du blocage des prestataires
 * Version adaptee pour Docker
 */
class ProviderPriorityController extends BaseController
{
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
        parent::__construct();
        $this->db = Database::getInstance();
    }

    /**
     * (Provider) Recuperer son statut de priorite
     * GET /api/provider/priority-status
     */
    public function getMyPriorityStatus(array $params): void
    {
        $providerId = $this->getAuthUserId();
        if (!$providerId) {
            $this->sendError('Non autorise', 401);
            return;
        }

        $sql = "SELECT * FROM providers WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $providerId]);
        $provider = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$provider) {
            $this->sendError('Prestataire non trouve', 404);
            return;
        }

        $rating = floatval($provider['rating'] ?? 0);
        $reviewCount = intval($provider['total_reviews'] ?? 0);

        // Calculer le niveau de priorite
        $priority = $this->calculatePriorityLevel($rating, $reviewCount);

        // Recuperer l'historique des notes
        $ratingHistory = $this->getRatingHistory($providerId, 30);

        // Verifier le statut de blocage
        $blockStatus = $this->checkBlockStatus($provider, $rating, $reviewCount);

        // Statistiques
        $stats = $this->getProviderStats($providerId);

        $this->sendSuccess([
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
     * GET /api/provider/rating-history
     */
    public function getRatingHistoryEndpoint(array $params): void
    {
        $providerId = $this->getAuthUserId();
        if (!$providerId) {
            $this->sendError('Non autorise', 401);
            return;
        }

        $days = intval($_GET['days'] ?? 30);
        $history = $this->getRatingHistory($providerId, $days);

        $this->sendSuccess([
            'history' => $history,
            'period_days' => $days
        ]);
    }

    /**
     * (Admin) Recuperer la liste des prestataires avec leur priorite
     * GET /api/admin/providers/priority
     */
    public function getProvidersPriority(array $params): void
    {
        $sortBy = $_GET['sort_by'] ?? 'rating';
        $order = strtoupper($_GET['order'] ?? 'DESC');
        $status = $_GET['status'] ?? null;
        $minRating = isset($_GET['min_rating']) ? floatval($_GET['min_rating']) : null;
        $maxRating = isset($_GET['max_rating']) ? floatval($_GET['max_rating']) : null;
        $page = intval($_GET['page'] ?? 1);
        $limit = intval($_GET['limit'] ?? 20);
        $offset = ($page - 1) * $limit;

        $sql = "SELECT p.*,
                       COALESCE(p.rating, 0) as rating,
                       COALESCE(p.total_reviews, 0) as total_reviews,
                       (SELECT COUNT(*) FROM orders WHERE provider_id = p.id AND status = 'completed') as completed_orders,
                       (SELECT COUNT(*) FROM orders WHERE provider_id = p.id AND status = 'cancelled') as cancelled_orders
                FROM providers p
                WHERE 1=1";

        $params_sql = [];

        if ($status === 'blocked') {
            $sql .= " AND (p.is_blocked = 1 OR (p.blocked_until IS NOT NULL AND p.blocked_until > NOW()))";
        } elseif ($status === 'active') {
            $sql .= " AND (p.is_blocked = 0 OR p.is_blocked IS NULL) AND (p.blocked_until IS NULL OR p.blocked_until <= NOW())";
        }

        if ($minRating !== null) {
            $sql .= " AND COALESCE(p.rating, 0) >= :min_rating";
            $params_sql['min_rating'] = $minRating;
        }

        if ($maxRating !== null) {
            $sql .= " AND COALESCE(p.rating, 0) <= :max_rating";
            $params_sql['max_rating'] = $maxRating;
        }

        $allowedSorts = ['rating', 'total_reviews', 'created_at', 'first_name'];
        $sortBy = in_array($sortBy, $allowedSorts) ? $sortBy : 'rating';
        $order = $order === 'ASC' ? 'ASC' : 'DESC';

        $sql .= " ORDER BY $sortBy $order LIMIT $limit OFFSET $offset";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params_sql);
        $providers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($providers as &$provider) {
            $provider['priority'] = $this->calculatePriorityLevel(
                floatval($provider['rating']),
                intval($provider['total_reviews'])
            );
            unset($provider['password']);
        }

        $countSql = "SELECT COUNT(*) FROM providers";
        $total = $this->db->query($countSql)->fetchColumn();

        $this->sendSuccess([
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
     * POST /api/admin/providers/{id}/block
     */
    public function blockProvider(array $params): void
    {
        $providerId = $params['id'] ?? null;
        if (!$providerId) {
            $this->sendError('ID prestataire requis', 400);
            return;
        }

        $data = $this->getJsonInput();

        if (empty($data['reason'])) {
            $this->sendError('La raison est requise', 400);
            return;
        }

        $blockType = $data['block_type'] ?? 'temporary';
        $durationDays = $data['duration_days'] ?? 7;
        $blockedUntil = null;

        if ($blockType === 'temporary' && $durationDays) {
            $blockedUntil = date('Y-m-d H:i:s', strtotime("+$durationDays days"));
        }

        $sql = "UPDATE providers SET
                is_blocked = :is_blocked,
                blocked_until = :blocked_until,
                block_reason = :block_reason
                WHERE id = :id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'is_blocked' => $blockType === 'permanent' ? 1 : 0,
            'blocked_until' => $blockedUntil,
            'block_reason' => $data['reason'],
            'id' => $providerId
        ]);

        // Enregistrer dans l'historique
        $this->recordBlockHistory($providerId, [
            'action' => 'block',
            'block_type' => $blockType,
            'reason' => $data['reason'],
            'duration_days' => $durationDays,
            'blocked_until' => $blockedUntil
        ]);

        $this->sendSuccess([
            'provider_id' => $providerId,
            'block_type' => $blockType,
            'blocked_until' => $blockedUntil
        ], 'Prestataire bloque avec succes');
    }

    /**
     * (Admin) Debloquer un prestataire
     * POST /api/admin/providers/{id}/unblock
     */
    public function unblockProvider(array $params): void
    {
        $providerId = $params['id'] ?? null;
        if (!$providerId) {
            $this->sendError('ID prestataire requis', 400);
            return;
        }

        $data = $this->getJsonInput();

        $sql = "UPDATE providers SET
                is_blocked = 0,
                blocked_until = NULL,
                block_reason = NULL
                WHERE id = :id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $providerId]);

        $this->recordBlockHistory($providerId, [
            'action' => 'unblock',
            'reason' => $data['reason'] ?? 'Deblocage administratif'
        ]);

        $this->sendSuccess([
            'provider_id' => $providerId
        ], 'Prestataire debloque avec succes');
    }

    /**
     * (Admin) Recuperer l'historique de blocage
     * GET /api/admin/providers/{id}/block-history
     */
    public function getBlockHistory(array $params): void
    {
        $providerId = $params['id'] ?? null;
        if (!$providerId) {
            $this->sendError('ID prestataire requis', 400);
            return;
        }

        $sql = "SELECT * FROM provider_block_history
                WHERE provider_id = :provider_id
                ORDER BY created_at DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['provider_id' => $providerId]);
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $this->sendSuccess([
            'provider_id' => $providerId,
            'history' => $history
        ]);
    }

    /**
     * (Admin) Verifier et bloquer automatiquement les prestataires sous le seuil
     * POST /api/admin/providers/check-ratings
     */
    public function checkAndBlockLowRated(array $params): void
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

        foreach ($providers as $provider) {
            $blockCount = $this->countPreviousBlocks($provider['id']);
            $blockType = $blockCount >= 3 ? 'permanent' : 'temporary';
            $durationDays = $this->getBlockDuration($blockCount);

            $blockedUntil = null;
            if ($blockType === 'temporary' && $durationDays > 0) {
                $blockedUntil = date('Y-m-d H:i:s', strtotime("+$durationDays days"));
            }

            $updateSql = "UPDATE providers SET
                          is_blocked = :is_blocked,
                          blocked_until = :blocked_until,
                          block_reason = :block_reason
                          WHERE id = :id";

            $updateStmt = $this->db->prepare($updateSql);
            $updateStmt->execute([
                'is_blocked' => $blockType === 'permanent' ? 1 : 0,
                'blocked_until' => $blockedUntil,
                'block_reason' => 'Blocage automatique: note moyenne inferieure a ' . self::BLOCK_RATING_THRESHOLD,
                'id' => $provider['id']
            ]);

            $this->recordBlockHistory($provider['id'], [
                'action' => 'block',
                'block_type' => $blockType,
                'reason' => 'Blocage automatique: note moyenne (' . $provider['rating'] . ') inferieure au seuil',
                'duration_days' => $durationDays,
                'blocked_until' => $blockedUntil,
                'is_automatic' => 1
            ]);

            $blocked[] = [
                'id' => $provider['id'],
                'name' => $provider['first_name'] . ' ' . $provider['last_name'],
                'rating' => $provider['rating'],
                'block_type' => $blockType
            ];
        }

        $this->sendSuccess([
            'blocked_count' => count($blocked),
            'blocked_providers' => $blocked
        ], 'Verification terminee');
    }

    /**
     * (Admin) Recuperer les prestataires a risque
     * GET /api/admin/providers/at-risk
     */
    public function getAtRiskProviders(array $params): void
    {
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

        $atRisk = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($atRisk as &$provider) {
            $provider['risk_type'] = 'low_rating';
            $provider['risk_message'] = 'Note proche du seuil de blocage';
        }

        $this->sendSuccess([
            'count' => count($atRisk),
            'providers' => $atRisk
        ]);
    }

    /**
     * (Admin) Envoyer un avertissement
     * POST /api/admin/providers/{id}/warning
     */
    public function sendWarning(array $params): void
    {
        $providerId = $params['id'] ?? null;
        if (!$providerId) {
            $this->sendError('ID prestataire requis', 400);
            return;
        }

        $data = $this->getJsonInput();

        if (empty($data['message'])) {
            $this->sendError('Le message est requis', 400);
            return;
        }

        $sql = "INSERT INTO provider_warnings (provider_id, warning_type, message, created_at)
                VALUES (:provider_id, :warning_type, :message, NOW())";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'provider_id' => $providerId,
            'warning_type' => $data['warning_type'] ?? 'other',
            'message' => $data['message']
        ]);

        $this->sendSuccess([
            'provider_id' => $providerId
        ], 'Avertissement envoye');
    }

    /**
     * Recuperer les prestataires par priorite pour une commande
     * GET /api/orders/{id}/providers-by-priority
     */
    public function getProvidersByPriorityForOrder(array $params): void
    {
        $orderId = $params['id'] ?? null;
        if (!$orderId) {
            $this->sendError('ID commande requis', 400);
            return;
        }

        $orderSql = "SELECT * FROM orders WHERE id = :order_id";
        $orderStmt = $this->db->prepare($orderSql);
        $orderStmt->execute(['order_id' => $orderId]);
        $order = $orderStmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            $this->sendError('Commande non trouvee', 404);
            return;
        }

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

        foreach ($providers as &$provider) {
            $priority = $this->calculatePriorityLevel(
                floatval($provider['rating']),
                intval($provider['total_reviews'])
            );
            $provider['priority'] = $priority;
            $provider['notification_delay'] = $priority['delay'];
            unset($provider['password']);
        }

        $this->sendSuccess([
            'order_id' => $orderId,
            'providers' => $providers
        ]);
    }

    // ==================== METHODES PRIVEES ====================

    private function calculatePriorityLevel(float $rating, int $reviewCount): array
    {
        if ($reviewCount < 3) {
            return [
                'level' => 'NEW',
                'label' => 'Nouveau prestataire',
                'delay' => self::PRIORITY_DELAYS['AVERAGE'],
                'color' => '#6c757d'
            ];
        }

        if ($rating >= self::EXCELLENT_RATING) {
            return [
                'level' => 'EXCELLENT',
                'label' => 'Priorite maximale',
                'delay' => self::PRIORITY_DELAYS['EXCELLENT'],
                'color' => '#28a745'
            ];
        }

        if ($rating >= self::GOOD_RATING) {
            return [
                'level' => 'GOOD',
                'label' => 'Priorite haute',
                'delay' => self::PRIORITY_DELAYS['GOOD'],
                'color' => '#20c997'
            ];
        }

        if ($rating >= self::AVERAGE_RATING) {
            return [
                'level' => 'AVERAGE',
                'label' => 'Priorite normale',
                'delay' => self::PRIORITY_DELAYS['AVERAGE'],
                'color' => '#ffc107'
            ];
        }

        if ($rating >= self::LOW_RATING) {
            return [
                'level' => 'LOW',
                'label' => 'Priorite basse',
                'delay' => self::PRIORITY_DELAYS['LOW'],
                'color' => '#fd7e14'
            ];
        }

        return [
            'level' => 'CRITICAL',
            'label' => 'Priorite critique',
            'delay' => self::PRIORITY_DELAYS['CRITICAL'],
            'color' => '#dc3545'
        ];
    }

    private function getRatingHistory(int $providerId, int $days): array
    {
        $sql = "SELECT DATE(recorded_at) as date, rating, review_count
                FROM provider_rating_history
                WHERE provider_id = :provider_id
                AND recorded_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
                ORDER BY recorded_at ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':provider_id', $providerId, PDO::PARAM_INT);
        $stmt->bindValue(':days', $days, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function checkBlockStatus(array $provider, float $rating, int $reviewCount): array
    {
        if (!empty($provider['is_blocked']) && $provider['is_blocked'] == 1) {
            return [
                'is_blocked' => true,
                'block_type' => 'permanent',
                'reason' => $provider['block_reason'] ?? 'Blocage permanent'
            ];
        }

        if (!empty($provider['blocked_until']) && strtotime($provider['blocked_until']) > time()) {
            return [
                'is_blocked' => true,
                'block_type' => 'temporary',
                'blocked_until' => $provider['blocked_until'],
                'reason' => $provider['block_reason'] ?? 'Suspension temporaire'
            ];
        }

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

    private function getProviderStats(int $providerId): array
    {
        $sql = "SELECT
                    (SELECT COUNT(*) FROM orders WHERE provider_id = :pid1 AND status = 'completed') as completed_orders,
                    (SELECT COUNT(*) FROM orders WHERE provider_id = :pid2 AND status = 'cancelled') as cancelled_orders,
                    (SELECT COUNT(*) FROM orders WHERE provider_id = :pid3) as total_orders";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'pid1' => $providerId,
            'pid2' => $providerId,
            'pid3' => $providerId
        ]);

        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        $totalOrders = intval($stats['total_orders']);
        $cancelledOrders = intval($stats['cancelled_orders']);
        $stats['cancellation_rate'] = $totalOrders > 0
            ? round(($cancelledOrders / $totalOrders) * 100, 1)
            : 0;

        return $stats;
    }

    private function countPreviousBlocks(int $providerId): int
    {
        $sql = "SELECT COUNT(*) FROM provider_block_history
                WHERE provider_id = :provider_id AND action = 'block'";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['provider_id' => $providerId]);
        return intval($stmt->fetchColumn());
    }

    private function getBlockDuration(int $blockCount): int
    {
        switch ($blockCount) {
            case 0: return self::BLOCK_DURATIONS['FIRST'];
            case 1: return self::BLOCK_DURATIONS['SECOND'];
            case 2: return self::BLOCK_DURATIONS['THIRD'];
            default: return self::BLOCK_DURATIONS['PERMANENT'];
        }
    }

    private function recordBlockHistory(int $providerId, array $data): void
    {
        $sql = "INSERT INTO provider_block_history
                (provider_id, action, block_type, reason, duration_days, blocked_until, is_automatic, created_at)
                VALUES (:provider_id, :action, :block_type, :reason, :duration_days, :blocked_until, :is_automatic, NOW())";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'provider_id' => $providerId,
            'action' => $data['action'],
            'block_type' => $data['block_type'] ?? null,
            'reason' => $data['reason'],
            'duration_days' => $data['duration_days'] ?? null,
            'blocked_until' => $data['blocked_until'] ?? null,
            'is_automatic' => $data['is_automatic'] ?? 0
        ]);
    }
}
