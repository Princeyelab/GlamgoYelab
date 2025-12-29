<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Database;
use App\Models\Order;
use App\Models\Notification;

/**
 * Contrôleur pour la gestion des litiges
 */
class DisputeController extends Controller
{
    private \PDO $db;
    private Order $orderModel;
    private Notification $notificationModel;

    // Catégories de litiges disponibles
    private array $categories = [
        'service_quality' => 'Qualité du service insatisfaisante',
        'no_show' => 'Prestataire non présenté',
        'overcharge' => 'Surfacturation',
        'damage' => 'Dommages causés',
        'harassment' => 'Comportement inapproprié',
        'other' => 'Autre'
    ];

    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->orderModel = new Order();
        $this->notificationModel = new Notification();
    }

    /**
     * Crée un nouveau litige (côté client)
     */
    public function create(): void
    {
        $userId = $_SERVER['USER_ID'];
        $data = $this->getJsonInput();

        // Validation
        if (empty($data['order_id'])) {
            $this->error('ID de commande requis', 422);
        }
        if (empty($data['category'])) {
            $this->error('Catégorie requise', 422);
        }
        if (empty($data['description'])) {
            $this->error('Description requise', 422);
        }

        // Vérifier la catégorie
        if (!array_key_exists($data['category'], $this->categories)) {
            $this->error('Catégorie invalide', 422);
        }

        // Vérifier que la commande existe et appartient à l'utilisateur
        $order = $this->orderModel->getDetailedOrder((int)$data['order_id']);
        if (!$order) {
            $this->error('Commande non trouvée', 404);
        }
        if ($order['user_id'] != $userId) {
            $this->error('Accès refusé', 403);
        }

        // Vérifier que la commande est terminée
        if ($order['status'] !== 'completed') {
            $this->error('Les litiges ne peuvent être ouverts que pour les commandes terminées', 400);
        }

        // Vérifier le délai (48h après complétion)
        $completedAt = strtotime($order['completed_at']);
        $deadline = $completedAt + (48 * 3600);
        if (time() > $deadline) {
            $this->error('Le délai pour ouvrir un litige est dépassé (48h après le service)', 400);
        }

        // Vérifier qu'il n'y a pas déjà un litige ouvert
        $existingDispute = $this->getExistingDispute((int)$data['order_id']);
        if ($existingDispute) {
            $this->error('Un litige existe déjà pour cette commande', 400);
        }

        // Créer le litige
        $stmt = $this->db->prepare(
            "INSERT INTO disputes
             (order_id, opened_by_type, opened_by_id, category, description, evidence_urls, status, priority, expires_at, created_at)
             VALUES (?, 'client', ?, ?, ?, ?, 'open', ?, ?, NOW())"
        );

        $priority = $this->determinePriority($data['category']);
        $expiresAt = date('Y-m-d H:i:s', time() + (7 * 24 * 3600)); // 7 jours pour traiter
        $evidenceUrls = isset($data['evidence_urls']) ? json_encode($data['evidence_urls']) : null;

        $stmt->execute([
            $data['order_id'],
            $userId,
            $data['category'],
            $data['description'],
            $evidenceUrls,
            $priority,
            $expiresAt
        ]);

        $disputeId = $this->db->lastInsertId();

        // Notifier le prestataire
        if ($order['provider_id']) {
            $this->notificationModel->create([
                'provider_id' => $order['provider_id'],
                'type' => 'dispute_opened',
                'title' => 'Litige ouvert',
                'message' => "Un litige a été ouvert pour la commande #{$data['order_id']}: {$this->categories[$data['category']]}",
                'data' => json_encode(['dispute_id' => $disputeId, 'order_id' => $data['order_id']])
            ]);
        }

        $this->success([
            'dispute_id' => $disputeId,
            'status' => 'open',
            'expires_at' => $expiresAt,
            'message' => 'Litige créé avec succès. Notre équipe l\'examinera sous 48-72h.'
        ], 'Litige créé');
    }

    /**
     * Récupère les litiges de l'utilisateur
     */
    public function index(): void
    {
        $userId = $_SERVER['USER_ID'];

        $stmt = $this->db->prepare(
            "SELECT d.*, o.service_id,
                    s.name as service_name,
                    p.first_name as provider_first_name, p.last_name as provider_last_name
             FROM disputes d
             INNER JOIN orders o ON d.order_id = o.id
             INNER JOIN services s ON o.service_id = s.id
             LEFT JOIN providers p ON o.provider_id = p.id
             WHERE d.opened_by_type = 'client' AND d.opened_by_id = ?
             ORDER BY d.created_at DESC"
        );
        $stmt->execute([$userId]);
        $disputes = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $this->success(['disputes' => $disputes]);
    }

    /**
     * Récupère un litige spécifique
     */
    public function show(string $id): void
    {
        $userId = $_SERVER['USER_ID'];

        $dispute = $this->getDispute((int)$id);

        if (!$dispute) {
            $this->error('Litige non trouvé', 404);
        }

        // Vérifier l'accès
        if ($dispute['opened_by_type'] === 'client' && $dispute['opened_by_id'] != $userId) {
            $this->error('Accès refusé', 403);
        }

        // Récupérer les messages
        $messages = $this->getDisputeMessages((int)$id);

        $this->success([
            'dispute' => $dispute,
            'messages' => $messages,
            'categories' => $this->categories
        ]);
    }

    /**
     * Ajoute un message à un litige
     */
    public function addMessage(string $id): void
    {
        $userId = $_SERVER['USER_ID'];
        $data = $this->getJsonInput();

        if (empty($data['message'])) {
            $this->error('Message requis', 422);
        }

        $dispute = $this->getDispute((int)$id);

        if (!$dispute) {
            $this->error('Litige non trouvé', 404);
        }

        // Vérifier l'accès
        if ($dispute['opened_by_type'] === 'client' && $dispute['opened_by_id'] != $userId) {
            $this->error('Accès refusé', 403);
        }

        // Vérifier que le litige est toujours ouvert
        if (in_array($dispute['status'], ['resolved', 'closed'])) {
            $this->error('Ce litige est fermé', 400);
        }

        // Ajouter le message
        $stmt = $this->db->prepare(
            "INSERT INTO dispute_messages
             (dispute_id, sender_type, sender_id, message, attachment_url, created_at)
             VALUES (?, 'client', ?, ?, ?, NOW())"
        );
        $stmt->execute([
            $id,
            $userId,
            $data['message'],
            $data['attachment_url'] ?? null
        ]);

        $this->success(['message' => 'Message ajouté']);
    }

    /**
     * Ferme un litige (par le client s'il est satisfait)
     */
    public function close(string $id): void
    {
        $userId = $_SERVER['USER_ID'];
        $data = $this->getJsonInput();

        $dispute = $this->getDispute((int)$id);

        if (!$dispute) {
            $this->error('Litige non trouvé', 404);
        }

        if ($dispute['opened_by_type'] === 'client' && $dispute['opened_by_id'] != $userId) {
            $this->error('Accès refusé', 403);
        }

        if (in_array($dispute['status'], ['resolved', 'closed'])) {
            $this->error('Ce litige est déjà fermé', 400);
        }

        $stmt = $this->db->prepare(
            "UPDATE disputes
             SET status = 'closed',
                 resolution_notes = ?,
                 resolved_at = NOW(),
                 updated_at = NOW()
             WHERE id = ?"
        );
        $stmt->execute([
            $data['resolution_notes'] ?? 'Fermé par le client',
            $id
        ]);

        $this->success(['message' => 'Litige fermé']);
    }

    // ========== Méthodes privées ==========

    private function getDispute(int $id): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT d.*, o.user_id, o.provider_id, o.service_id,
                    s.name as service_name
             FROM disputes d
             INNER JOIN orders o ON d.order_id = o.id
             INNER JOIN services s ON o.service_id = s.id
             WHERE d.id = ?"
        );
        $stmt->execute([$id]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    private function getExistingDispute(int $orderId): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM disputes WHERE order_id = ? AND status NOT IN ('closed', 'resolved')"
        );
        $stmt->execute([$orderId]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    private function getDisputeMessages(int $disputeId): array
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM dispute_messages WHERE dispute_id = ? ORDER BY created_at ASC"
        );
        $stmt->execute([$disputeId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    private function determinePriority(string $category): string
    {
        $highPriority = ['harassment', 'damage', 'no_show'];
        $normalPriority = ['service_quality', 'overcharge'];

        if (in_array($category, $highPriority)) {
            return 'high';
        }
        return 'normal';
    }
}
