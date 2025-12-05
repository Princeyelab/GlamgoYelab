<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Notification;

class NotificationController extends Controller
{
    private Notification $notificationModel;

    public function __construct()
    {
        $this->notificationModel = new Notification();
    }

    /**
     * Récupère les notifications de l'utilisateur connecté
     */
    public function index(): void
    {
        $userId = $_SERVER['USER_ID'];
        $queryParams = $this->getQueryParams();
        $limit = isset($queryParams['limit']) ? (int) $queryParams['limit'] : 50;

        $notifications = $this->notificationModel->getUserNotifications($userId, $limit);
        $unreadCount = $this->notificationModel->getUnreadCount('user', $userId);

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
        $userId = $_SERVER['USER_ID'];

        // Vérifier que la notification appartient à l'utilisateur
        $notification = $this->notificationModel->find((int) $id);
        if (!$notification) {
            $this->error('Notification non trouvée', 404);
        }

        if ($notification['recipient_type'] !== 'user' || $notification['recipient_id'] != $userId) {
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
        $userId = $_SERVER['USER_ID'];
        $this->notificationModel->markAllAsRead('user', $userId);
        $this->success(null, 'Toutes les notifications ont été marquées comme lues');
    }

    /**
     * Compte les notifications non lues
     */
    public function unreadCount(): void
    {
        $userId = $_SERVER['USER_ID'];
        $count = $this->notificationModel->getUnreadCount('user', $userId);
        $this->success(['count' => $count]);
    }
}
