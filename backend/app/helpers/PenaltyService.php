<?php

namespace App\Helpers;

use App\Core\Database;

/**
 * Service de gestion des pénalités prestataires
 */
class PenaltyService
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Ajoute une pénalité à un prestataire
     *
     * @param int $providerId ID du prestataire
     * @param string $type Type de pénalité (cancellation, no_show, late, bad_service)
     * @param int $points Nombre de points
     * @param int|null $orderId ID de la commande associée
     * @param string|null $reason Raison détaillée
     * @return array Résultat de l'opération
     */
    public function addPenalty(int $providerId, string $type, int $points, ?int $orderId = null, ?string $reason = null): array
    {
        // Déterminer la sévérité
        $severity = $this->determineSeverity($points);

        // Insérer la pénalité
        $stmt = $this->db->prepare(
            "INSERT INTO provider_penalties
             (provider_id, order_id, penalty_type, severity, points, reason, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())"
        );
        $stmt->execute([$providerId, $orderId, $type, $severity, $points, $reason]);
        $penaltyId = $this->db->lastInsertId();

        // Mettre à jour les points du prestataire
        $stmt = $this->db->prepare(
            "UPDATE providers
             SET penalty_points = penalty_points + ?,
                 total_cancellations = total_cancellations + ?
             WHERE id = ?"
        );
        $isCancellation = in_array($type, ['cancellation', 'no_show']) ? 1 : 0;
        $stmt->execute([$points, $isCancellation, $providerId]);

        // Vérifier si une suspension est nécessaire
        $suspensionResult = $this->checkAndApplySuspension($providerId);

        return [
            'success' => true,
            'penalty_id' => $penaltyId,
            'points_added' => $points,
            'severity' => $severity,
            'suspension' => $suspensionResult
        ];
    }

    /**
     * Détermine la sévérité d'une pénalité
     */
    private function determineSeverity(int $points): string
    {
        if ($points >= 10) return 'critical';
        if ($points >= 5) return 'major';
        if ($points >= 2) return 'minor';
        return 'warning';
    }

    /**
     * Vérifie et applique une suspension si nécessaire
     */
    public function checkAndApplySuspension(int $providerId): array
    {
        // Récupérer les points actuels
        $stmt = $this->db->prepare("SELECT penalty_points FROM providers WHERE id = ?");
        $stmt->execute([$providerId]);
        $provider = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$provider) {
            return ['action' => 'none', 'reason' => 'provider_not_found'];
        }

        $currentPoints = (int)$provider['penalty_points'];

        // Chercher le seuil applicable
        $stmt = $this->db->prepare(
            "SELECT * FROM penalty_thresholds
             WHERE points_min <= ? AND points_max >= ?
             ORDER BY points_min DESC
             LIMIT 1"
        );
        $stmt->execute([$currentPoints, $currentPoints]);
        $threshold = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$threshold) {
            return ['action' => 'none', 'reason' => 'no_threshold_matched'];
        }

        $action = $threshold['action'];
        $suspensionHours = $threshold['suspension_hours'];

        // Appliquer l'action
        if ($action === 'warning') {
            $this->sendWarningNotification($providerId, $currentPoints);
            return [
                'action' => 'warning',
                'current_points' => $currentPoints,
                'message' => $threshold['description']
            ];
        }

        if ($action === 'permanent_ban') {
            $this->suspendProvider($providerId, null, 'Bannissement permanent - trop de pénalités');
            return [
                'action' => 'permanent_ban',
                'current_points' => $currentPoints,
                'message' => 'Compte banni définitivement'
            ];
        }

        // Suspension temporaire
        if ($suspensionHours > 0) {
            $suspendUntil = date('Y-m-d H:i:s', time() + ($suspensionHours * 3600));
            $this->suspendProvider($providerId, $suspendUntil, $threshold['description']);
            return [
                'action' => $action,
                'current_points' => $currentPoints,
                'suspended_until' => $suspendUntil,
                'hours' => $suspensionHours,
                'message' => $threshold['description']
            ];
        }

        return ['action' => 'none', 'current_points' => $currentPoints];
    }

    /**
     * Suspend un prestataire
     */
    public function suspendProvider(int $providerId, ?string $until, string $reason): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE providers
             SET is_suspended = true,
                 suspended_until = ?,
                 suspension_reason = ?
             WHERE id = ?"
        );
        return $stmt->execute([$until, $reason, $providerId]);
    }

    /**
     * Lève une suspension (si la date est passée ou manuellement)
     */
    public function liftSuspension(int $providerId, ?string $reason = null): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE providers
             SET is_suspended = false,
                 suspended_until = NULL,
                 suspension_reason = NULL
             WHERE id = ?"
        );
        return $stmt->execute([$providerId]);
    }

    /**
     * Vérifie et lève automatiquement les suspensions expirées
     */
    public function autoLiftExpiredSuspensions(): int
    {
        $stmt = $this->db->prepare(
            "UPDATE providers
             SET is_suspended = false,
                 suspended_until = NULL,
                 suspension_reason = NULL
             WHERE is_suspended = true
             AND suspended_until IS NOT NULL
             AND suspended_until < NOW()"
        );
        $stmt->execute();
        return $stmt->rowCount();
    }

    /**
     * Envoie une notification d'avertissement
     */
    private function sendWarningNotification(int $providerId, int $currentPoints): void
    {
        // Créer une notification pour le prestataire
        $stmt = $this->db->prepare(
            "INSERT INTO notifications
             (provider_id, type, title, message, created_at)
             VALUES (?, 'warning', ?, ?, NOW())"
        );
        $stmt->execute([
            $providerId,
            'Avertissement - Points de pénalité',
            "Vous avez accumulé $currentPoints points de pénalité. Au-delà de 10 points, votre compte sera suspendu temporairement."
        ]);
    }

    /**
     * Récupère l'historique des pénalités d'un prestataire
     */
    public function getProviderPenalties(int $providerId, int $limit = 20): array
    {
        $stmt = $this->db->prepare(
            "SELECT pp.*, o.id as order_id
             FROM provider_penalties pp
             LEFT JOIN orders o ON pp.order_id = o.id
             WHERE pp.provider_id = ?
             ORDER BY pp.created_at DESC
             LIMIT ?"
        );
        $stmt->execute([$providerId, $limit]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * Récupère les statistiques de pénalités d'un prestataire
     */
    public function getProviderPenaltyStats(int $providerId): array
    {
        $stmt = $this->db->prepare(
            "SELECT
                SUM(points) as total_points,
                COUNT(*) as total_penalties,
                SUM(CASE WHEN penalty_type = 'cancellation' THEN 1 ELSE 0 END) as cancellation_count,
                SUM(CASE WHEN penalty_type = 'no_show' THEN 1 ELSE 0 END) as no_show_count,
                SUM(CASE WHEN penalty_type = 'late' THEN 1 ELSE 0 END) as late_count,
                SUM(CASE WHEN penalty_type = 'bad_service' THEN 1 ELSE 0 END) as bad_service_count
             FROM provider_penalties
             WHERE provider_id = ?"
        );
        $stmt->execute([$providerId]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: [];
    }

    /**
     * Calcule le taux d'annulation d'un prestataire
     */
    public function updateCancellationRate(int $providerId): float
    {
        // Compter les commandes totales et annulées par le prestataire
        $stmt = $this->db->prepare(
            "SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'cancelled' AND cancelled_by = 'provider' THEN 1 ELSE 0 END) as cancelled
             FROM orders
             WHERE provider_id = ? AND status IN ('completed', 'cancelled')"
        );
        $stmt->execute([$providerId]);
        $stats = $stmt->fetch(\PDO::FETCH_ASSOC);

        $total = (int)($stats['total'] ?? 0);
        $cancelled = (int)($stats['cancelled'] ?? 0);
        $rate = $total > 0 ? ($cancelled / $total) * 100 : 0;

        // Mettre à jour le taux
        $stmt = $this->db->prepare(
            "UPDATE providers SET cancellation_rate = ? WHERE id = ?"
        );
        $stmt->execute([round($rate, 2), $providerId]);

        return round($rate, 2);
    }
}
