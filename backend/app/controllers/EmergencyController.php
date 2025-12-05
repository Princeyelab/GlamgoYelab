<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Models\EmergencyReport;
use App\Models\Order;
use App\Models\Notification;

/**
 * Controleur pour la gestion des signalements d'urgence
 * Permet aux clients de signaler un probleme pendant une prestation
 */
class EmergencyController extends Controller
{
    private EmergencyReport $emergencyModel;
    private Order $orderModel;

    // Numeros d'urgence Maroc
    const POLICE_NUMBER = '19';
    const GENDARMERIE_NUMBER = '177';
    const SAMU_NUMBER = '15';
    const GLAMGO_SUPPORT = '+212522000000';

    public function __construct()
    {
        $this->emergencyModel = new EmergencyReport();
        $this->orderModel = new Order();
    }

    /**
     * Signaler une urgence pour une commande
     * POST /api/orders/{id}/emergency
     */
    public function report(int $id): void
    {
        $userId = $_SERVER['USER_ID'];
        $userType = $_SERVER['USER_TYPE'] ?? 'user';

        // Verifier que c'est bien un client
        if ($userType !== 'user') {
            $this->error('Seul le client peut signaler une urgence', 403);
        }

        // Recuperer la commande
        $order = $this->orderModel->find($id);
        if (!$order) {
            $this->error('Commande introuvable', 404);
        }

        // Verifier que le client est bien le proprietaire de la commande
        if ((int) $order['user_id'] !== (int) $userId) {
            $this->error('Vous n\'etes pas autorise a signaler cette commande', 403);
        }

        // Verifier que la commande est en cours (on_way ou in_progress)
        $allowedStatuses = ['on_way', 'in_progress', 'accepted'];
        if (!in_array($order['status'], $allowedStatuses)) {
            $this->error('Le signalement n\'est possible que pendant une prestation active', 400);
        }

        // Verifier qu'il n'y a pas deja un signalement actif
        if ($this->emergencyModel->hasActiveReport($id, $userId)) {
            $this->error('Un signalement est deja en cours pour cette commande', 409);
        }

        // Recuperer les donnees du signalement
        $data = $this->getJsonInput();

        // Valider la raison
        $validReasons = ['behavior', 'safety', 'service_issue', 'fraud', 'other'];
        if (!isset($data['reason']) || !in_array($data['reason'], $validReasons)) {
            $this->error('Raison de signalement invalide', 400);
        }

        // Creer le signalement
        $reportData = [
            'order_id' => $id,
            'user_id' => $userId,
            'provider_id' => $order['provider_id'],
            'reason' => $data['reason'],
            'additional_info' => $data['additional_info'] ?? null,
            'client_latitude' => $data['client_latitude'] ?? null,
            'client_longitude' => $data['client_longitude'] ?? null,
            'provider_latitude' => $order['provider_latitude'] ?? null,
            'provider_longitude' => $order['provider_longitude'] ?? null,
            'police_notified' => !empty($data['notify_police']) ? 1 : 0
        ];

        $reportId = $this->emergencyModel->createReport($reportData);

        // Recuperer le rapport complet
        $report = $this->emergencyModel->getReportWithDetails($reportId);

        // Envoyer une notification au support GlamGo
        $this->notifySupport($report);

        // Preparer la reponse
        $response = [
            'id' => $reportId,
            'status' => 'pending',
            'priority' => $report['priority'],
            'message' => 'Votre signalement a ete enregistre. Notre equipe vous contactera rapidement.',
            'support_number' => self::GLAMGO_SUPPORT,
            'emergency_numbers' => [
                'police' => self::POLICE_NUMBER,
                'gendarmerie' => self::GENDARMERIE_NUMBER,
                'samu' => self::SAMU_NUMBER
            ]
        ];

        // Si la police a ete notifiee
        if (!empty($data['notify_police'])) {
            $response['police_notified'] = true;
            $response['police_message'] = 'Nous avons note votre demande d\'alerte police. En cas de danger immediat, appelez le ' . self::POLICE_NUMBER;
        }

        // Si c'est une urgence critique (safety), suspendre temporairement la commande
        if ($data['reason'] === 'safety') {
            $this->orderModel->update($id, [
                'status' => 'paused',
                'notes' => 'Commande suspendue suite a un signalement de securite'
            ]);
            $response['order_paused'] = true;
            $response['message'] = 'URGENT: Votre signalement de securite a ete pris en compte. La prestation est suspendue. Notre equipe vous contacte immediatement.';
        }

        $this->success($response, 'Signalement enregistre');
    }

    /**
     * Recuperer les numeros d'urgence
     * GET /api/emergency/numbers
     */
    public function getEmergencyNumbers(): void
    {
        $this->success([
            'morocco' => [
                'police' => [
                    'number' => self::POLICE_NUMBER,
                    'label' => 'Police',
                    'description' => 'Police nationale - Urgences'
                ],
                'gendarmerie' => [
                    'number' => self::GENDARMERIE_NUMBER,
                    'label' => 'Gendarmerie Royale',
                    'description' => 'Gendarmerie - Zones rurales'
                ],
                'samu' => [
                    'number' => self::SAMU_NUMBER,
                    'label' => 'SAMU',
                    'description' => 'Urgences medicales'
                ],
                'pompiers' => [
                    'number' => '15',
                    'label' => 'Pompiers',
                    'description' => 'Protection civile'
                ]
            ],
            'glamgo_support' => [
                'number' => self::GLAMGO_SUPPORT,
                'label' => 'Support GlamGo',
                'description' => 'Assistance 24h/24'
            ]
        ]);
    }

    /**
     * Recuperer les signalements d'un utilisateur
     * GET /api/user/emergency-reports
     */
    public function getUserReports(): void
    {
        $userId = $_SERVER['USER_ID'];

        $sql = "
            SELECT
                er.*,
                s.name as service_name,
                CONCAT(p.first_name, ' ', p.last_name) as provider_name
            FROM emergency_reports er
            JOIN orders o ON er.order_id = o.id
            JOIN providers p ON er.provider_id = p.id
            LEFT JOIN services s ON o.service_id = s.id
            WHERE er.user_id = ?
            ORDER BY er.created_at DESC
        ";

        $reports = $this->emergencyModel->query($sql, [$userId]);

        $this->success($reports);
    }

    /**
     * [ADMIN] Recuperer tous les signalements en attente
     * GET /api/admin/emergencies
     */
    public function getAdminReports(): void
    {
        // TODO: Verifier que l'utilisateur est admin

        $status = $_GET['status'] ?? null;
        $priority = $_GET['priority'] ?? null;
        $limit = (int) ($_GET['limit'] ?? 50);

        if ($status || $priority) {
            $conditions = [];
            $params = [];

            if ($status) {
                $conditions[] = "er.status = ?";
                $params[] = $status;
            }
            if ($priority) {
                $conditions[] = "er.priority = ?";
                $params[] = $priority;
            }

            $whereClause = "WHERE " . implode(" AND ", $conditions);

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
                {$whereClause}
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
            $params[] = $limit;

            $reports = $this->emergencyModel->query($sql, $params);
        } else {
            $reports = $this->emergencyModel->getPendingReports($limit);
        }

        $this->success($reports);
    }

    /**
     * [ADMIN] Mettre a jour le statut d'un signalement
     * PATCH /api/admin/emergencies/{id}
     */
    public function updateReport(int $id): void
    {
        // TODO: Verifier que l'utilisateur est admin

        $report = $this->emergencyModel->find($id);
        if (!$report) {
            $this->error('Signalement introuvable', 404);
        }

        $data = $this->getJsonInput();

        $validStatuses = ['pending', 'in_review', 'resolved', 'dismissed'];
        if (isset($data['status']) && !in_array($data['status'], $validStatuses)) {
            $this->error('Statut invalide', 400);
        }

        $this->emergencyModel->updateStatus(
            $id,
            $data['status'] ?? $report['status'],
            $data['resolution_notes'] ?? null,
            $data['assigned_to'] ?? null
        );

        // Si resolu, reprendre la commande si elle etait en pause
        if (($data['status'] ?? '') === 'resolved') {
            $order = $this->orderModel->find($report['order_id']);
            if ($order && $order['status'] === 'paused') {
                $this->orderModel->update($order['id'], [
                    'status' => 'in_progress',
                    'notes' => 'Commande reprise apres resolution du signalement'
                ]);
            }
        }

        $this->success(
            $this->emergencyModel->getReportWithDetails($id),
            'Signalement mis a jour'
        );
    }

    /**
     * Notifie le support GlamGo d'un nouveau signalement
     */
    private function notifySupport(array $report): void
    {
        // Ici on pourrait envoyer un email, SMS, ou notification push au support
        // Pour l'instant, on log simplement

        $priority = $report['priority'];
        $reason = $report['reason_label'];
        $clientName = $report['client_first_name'] . ' ' . $report['client_last_name'];
        $providerName = $report['provider_first_name'] . ' ' . $report['provider_last_name'];

        error_log("[EMERGENCY] Nouveau signalement #{$report['id']}");
        error_log("[EMERGENCY] Priorite: {$priority}");
        error_log("[EMERGENCY] Raison: {$reason}");
        error_log("[EMERGENCY] Client: {$clientName} - Tel: {$report['client_phone']}");
        error_log("[EMERGENCY] Prestataire: {$providerName} - Tel: {$report['provider_phone']}");

        if ($report['police_notified']) {
            error_log("[EMERGENCY] !!! POLICE DEMANDEE !!!");
        }

        // TODO: Implementer l'envoi de notifications reelles
        // - Email au support
        // - SMS d'alerte
        // - Notification push admin
    }
}
