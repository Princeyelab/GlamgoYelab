<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Notification;

class ProviderNotificationController extends Controller
{
    private Notification $notificationModel;

    public function __construct()
    {
        $this->notificationModel = new Notification();
    }

    /**
     * Récupère les notifications du prestataire connecté
     */
    public function index(): void
    {
        $providerId = $_SERVER['USER_ID'];
        $queryParams = $this->getQueryParams();
        $limit = isset($queryParams['limit']) ? (int) $queryParams['limit'] : 50;

        $notifications = $this->notificationModel->getProviderNotifications($providerId, $limit);
        $unreadCount = $this->notificationModel->getUnreadCount('provider', $providerId);

        $this->success([
            'notifications' => $notifications,
            'unread_count' => $unreadCount
        ]);
    }

    /**
     * Marque une notification comme lue
     */
    public function markAsRead(string $id): void
    {
        $providerId = $_SERVER['USER_ID'];

        // Vérifier que la notification appartient au prestataire
        $notification = $this->notificationModel->find((int) $id);
        if (!$notification) {
            $this->error('Notification non trouvée', 404);
        }

        if ($notification['recipient_type'] !== 'provider' || $notification['recipient_id'] != $providerId) {
            $this->error('Accès refusé', 403);
        }

        $this->notificationModel->markAsRead((int) $id);
        $this->success(null, 'Notification marquée comme lue');
    }

    /**
     * Marque toutes les notifications comme lues
     */
    public function markAllAsRead(): void
    {
        $providerId = $_SERVER['USER_ID'];
        $this->notificationModel->markAllAsRead('provider', $providerId);
        $this->success(null, 'Toutes les notifications ont été marquées comme lues');
    }

    /**
     * Compte les notifications non lues
     */
    public function unreadCount(): void
    {
        $providerId = $_SERVER['USER_ID'];
        $count = $this->notificationModel->getUnreadCount('provider', $providerId);
        $this->success(['count' => $count]);
    }
}
