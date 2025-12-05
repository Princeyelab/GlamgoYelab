<?php

namespace App\Models;

use App\Core\Model;

class EmergencyReport extends Model
{
    protected string $table = 'emergency_reports';

    /**
     * Labels des raisons d'urgence
     */
    const REASON_LABELS = [
        'behavior' => 'Comportement inapproprie du prestataire',
        'safety' => 'Je ne me sens pas en securite',
        'service_issue' => 'Probleme grave avec le service',
        'fraud' => 'Tentative de fraude ou arnaque',
        'other' => 'Autre urgence'
    ];

    /**
     * Priorites par defaut selon la raison
     */
    const REASON_PRIORITIES = [
        'safety' => 'critical',
        'fraud' => 'high',
        'behavior' => 'high',
        'service_issue' => 'medium',
        'other' => 'medium'
    ];

    /**
     * Cree un nouveau signalement d'urgence
     */
    public function createReport(array $data): int
    {
        $insertData = [
            'order_id' => $data['order_id'],
            'user_id' => $data['user_id'],
            'provider_id' => $data['provider_id'],
            'reason' => $data['reason'],
            'reason_label' => self::REASON_LABELS[$data['reason']] ?? 'Autre urgence',
            'additional_info' => $data['additional_info'] ?? null,
            'status' => 'pending',
            'priority' => self::REASON_PRIORITIES[$data['reason']] ?? 'medium',
            'client_latitude' => $data['client_latitude'] ?? null,
            'client_longitude' => $data['client_longitude'] ?? null,
            'provider_latitude' => $data['provider_latitude'] ?? null,
            'provider_longitude' => $data['provider_longitude'] ?? null,
            'police_notified' => $data['police_notified'] ?? 0,
            'police_notified_at' => $data['police_notified'] ? date('Y-m-d H:i:s') : null
        ];

        return $this->create($insertData);
    }

    /**
     * Recupere un signalement par ID avec details
     */
    public function getReportWithDetails(int $id): ?array
    {
        $sql = "
            SELECT
                er.*,
                o.service_id,
                o.scheduled_at,
                o.status as order_status,
                ua.address_line,
                ua.city as address_city,
                u.first_name as client_first_name,
                u.last_name as client_last_name,
                u.phone as client_phone,
                u.email as client_email,
                p.first_name as provider_first_name,
                p.last_name as provider_last_name,
                p.phone as provider_phone,
                p.email as provider_email,
                s.name as service_name
            FROM emergency_reports er
            JOIN orders o ON er.order_id = o.id
            JOIN users u ON er.user_id = u.id
            JOIN providers p ON er.provider_id = p.id
            LEFT JOIN services s ON o.service_id = s.id
            LEFT JOIN user_addresses ua ON o.address_id = ua.id
            WHERE er.id = ?
        ";

        $result = $this->query($sql, [$id]);
        return $result[0] ?? null;
    }

    /**
     * Recupere les signalements pour une commande
     */
    public function getByOrder(int $orderId): array
    {
        return $this->where('order_id', $orderId);
    }

    /**
     * Recupere les signalements en attente
     */
    public function getPendingReports(int $limit = 50): array
    {
        $sql = "
            SELECT
                er.*,
                u.first_name as client_first_name,
                u.last_name as client_last_name,
                u.phone as client_phone,
                p.first_name as provider_first_name,
                p.last_name as provider_last_name,
                p.phone as provider_phone,
                s.name as service_name
            FROM emergency_reports er
            JOIN orders o ON er.order_id = o.id
            JOIN users u ON er.user_id = u.id
            JOIN providers p ON er.provider_id = p.id
            LEFT JOIN services s ON o.service_id = s.id
            WHERE er.status IN ('pending', 'in_review')
            ORDER BY
                CASE er.priority
                    WHEN 'critical' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'medium' THEN 3
                    ELSE 4
                END,
                er.created_at DESC
            LIMIT ?
        ";

        return $this->query($sql, [$limit]);
    }

    /**
     * Met a jour le statut d'un signalement
     */
    public function updateStatus(int $id, string $status, ?string $notes = null, ?int $assignedTo = null): bool
    {
        $data = [
            'status' => $status,
            'updated_at' => date('Y-m-d H:i:s')
        ];

        if ($notes !== null) {
            $data['resolution_notes'] = $notes;
        }

        if ($assignedTo !== null) {
            $data['assigned_to'] = $assignedTo;
        }

        if ($status === 'resolved') {
            $data['resolved_at'] = date('Y-m-d H:i:s');
        }

        return $this->update($id, $data);
    }

    /**
     * Compte les signalements par prestataire
     */
    public function countByProvider(int $providerId): int
    {
        $sql = "SELECT COUNT(*) as count FROM {$this->table} WHERE provider_id = ?";
        $result = $this->query($sql, [$providerId]);
        return (int) ($result[0]['count'] ?? 0);
    }

    /**
     * Verifie si un signalement existe deja pour cette commande (eviter doublons)
     */
    public function hasActiveReport(int $orderId, int $userId): bool
    {
        $sql = "
            SELECT COUNT(*) as count
            FROM {$this->table}
            WHERE order_id = ?
            AND user_id = ?
            AND status IN ('pending', 'in_review')
        ";
        $result = $this->query($sql, [$orderId, $userId]);
        return (int) ($result[0]['count'] ?? 0) > 0;
    }
}
