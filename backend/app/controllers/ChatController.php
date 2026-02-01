<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Message;
use App\Models\Order;
use App\Helpers\Translator;
use App\Helpers\MessageFilter;

/**
 * Gestion du chat interne renforce
 * Version amelioree sans WhatsApp - Communication securisee
 */
class ChatController extends Controller
{
    private Message $messageModel;
    private Order $orderModel;

    public function __construct()
    {
        $this->messageModel = new Message();
        $this->orderModel = new Order();
    }

    /**
     * GET /api/chat/conversations
     * Liste toutes les conversations actives de l'utilisateur
     */
    public function getConversations(): void
    {
        $userId = $_SERVER['USER_ID'] ?? null;
        $userType = $_SERVER['USER_TYPE'] ?? 'user';

        if (!$userId) {
            $this->error('Non authentifié', 401);
            return;
        }

        try {
            $db = $this->messageModel->getDatabase();

            if ($userType === 'user') {
                // Client: récupérer les commandes avec messages
                $stmt = $db->prepare("
                    SELECT
                        o.id,
                        o.status,
                        o.created_at,
                        o.provider_id,
                        p.first_name as provider_first_name,
                        p.last_name as provider_last_name,
                        p.avatar as provider_avatar,
                        s.name as service_name,
                        COALESCE(unread.cnt, 0) as unread_count,
                        last_msg.content as last_message,
                        last_msg.created_at as last_message_at
                    FROM orders o
                    LEFT JOIN providers p ON o.provider_id = p.id
                    LEFT JOIN services s ON o.service_id = s.id
                    LEFT JOIN LATERAL (
                        SELECT COUNT(*) as cnt
                        FROM messages m
                        WHERE m.order_id = o.id AND m.is_read = FALSE AND m.sender_type = 'provider'
                    ) unread ON true
                    LEFT JOIN LATERAL (
                        SELECT content, created_at
                        FROM messages m
                        WHERE m.order_id = o.id
                        ORDER BY m.created_at DESC
                        LIMIT 1
                    ) last_msg ON true
                    WHERE o.user_id = ?
                    AND o.provider_id IS NOT NULL
                    AND EXISTS (SELECT 1 FROM messages m WHERE m.order_id = o.id)
                    ORDER BY last_msg.created_at DESC NULLS LAST
                    LIMIT 50
                ");
                $stmt->execute([$userId]);
            } else {
                // Provider: récupérer les commandes avec messages
                $stmt = $db->prepare("
                    SELECT
                        o.id,
                        o.status,
                        o.created_at,
                        o.user_id as client_id,
                        u.first_name as client_first_name,
                        u.last_name as client_last_name,
                        u.avatar as client_avatar,
                        s.name as service_name,
                        COALESCE(unread.cnt, 0) as unread_count,
                        last_msg.content as last_message,
                        last_msg.created_at as last_message_at
                    FROM orders o
                    LEFT JOIN users u ON o.user_id = u.id
                    LEFT JOIN services s ON o.service_id = s.id
                    LEFT JOIN LATERAL (
                        SELECT COUNT(*) as cnt
                        FROM messages m
                        WHERE m.order_id = o.id AND m.is_read = FALSE AND m.sender_type = 'user'
                    ) unread ON true
                    LEFT JOIN LATERAL (
                        SELECT content, created_at
                        FROM messages m
                        WHERE m.order_id = o.id
                        ORDER BY m.created_at DESC
                        LIMIT 1
                    ) last_msg ON true
                    WHERE o.provider_id = ?
                    AND EXISTS (SELECT 1 FROM messages m WHERE m.order_id = o.id)
                    ORDER BY last_msg.created_at DESC NULLS LAST
                    LIMIT 50
                ");
                $stmt->execute([$userId]);
            }

            $conversations = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            // Formater les conversations
            $formatted = array_map(function($conv) use ($userType) {
                return [
                    'id' => $conv['id'],
                    'order_id' => $conv['id'],
                    'status' => $conv['status'],
                    'service_name' => $conv['service_name'],
                    'other_party' => $userType === 'user' ? [
                        'id' => $conv['provider_id'],
                        'name' => trim(($conv['provider_first_name'] ?? '') . ' ' . ($conv['provider_last_name'] ?? '')),
                        'avatar' => $conv['provider_avatar']
                    ] : [
                        'id' => $conv['client_id'],
                        'name' => trim(($conv['client_first_name'] ?? '') . ' ' . ($conv['client_last_name'] ?? '')),
                        'avatar' => $conv['client_avatar']
                    ],
                    'last_message' => $conv['last_message'],
                    'last_message_at' => $conv['last_message_at'],
                    'unread_count' => (int)$conv['unread_count'],
                    'created_at' => $conv['created_at']
                ];
            }, $conversations);

            $this->success([
                'conversations' => $formatted,
                'total' => count($formatted)
            ]);

        } catch (\Exception $e) {
            error_log("Erreur getConversations: " . $e->getMessage());
            $this->error('Erreur lors de la récupération des conversations', 500);
        }
    }

    /**
     * GET /api/orders/{id}/messages
     * Recupere les messages d'une commande
     */
    public function getMessages(string $orderId): void
    {
        $userId = $_SERVER['USER_ID'] ?? null;
        $userType = $_SERVER['USER_TYPE'] ?? 'user';

        $order = $this->orderModel->find((int)$orderId);
        if (!$order) {
            $this->error('Commande non trouvee', 404);
        }

        if ($userType === 'user' && $order['user_id'] != $userId) {
            $this->error('Acces refuse', 403);
        }

        if ($userType === 'provider' && $order['provider_id'] != $userId) {
            $this->error('Acces refuse', 403);
        }

        $messages = $this->messageModel->getOrderMessages((int)$orderId, false);
        $this->messageModel->markAsRead((int)$orderId, $userType);
        $chatStatus = MessageFilter::isChatActive($order);

        $this->success([
            'messages' => $messages,
            'order' => [
                'id' => $order['id'],
                'status' => $order['status'],
                'provider_id' => $order['provider_id']
            ],
            'chat_active' => $chatStatus['is_active'],
            'chat_disabled_reason' => $chatStatus['reason']
        ]);
    }

    /**
     * POST /api/orders/{id}/messages
     * Envoie un message dans le chat d'une commande
     */
    public function sendMessage(string $orderId): void
    {
        $userId = $_SERVER['USER_ID'] ?? null;
        $userType = $_SERVER['USER_TYPE'] ?? 'user';
        $data = $this->getJsonInput();

        $errors = $this->validate($data, [
            'content' => 'required|max:1000'
        ]);

        if (!empty($errors)) {
            $this->error('Erreurs de validation', 422, $errors);
        }

        $order = $this->orderModel->find((int)$orderId);
        if (!$order) {
            $this->error('Commande non trouvee', 404);
        }

        if ($userType === 'user' && $order['user_id'] != $userId) {
            $this->error('Acces refuse', 403);
        }

        if ($userType === 'provider' && $order['provider_id'] != $userId) {
            $this->error('Acces refuse', 403);
        }

        $chatStatus = MessageFilter::isChatActive($order);
        if (!$chatStatus['is_active']) {
            $this->error($chatStatus['reason'], 403);
        }

        $filterResult = MessageFilter::checkMessage($data['content']);

        if (!$filterResult['is_clean']) {
            $warningMessage = MessageFilter::getWarningMessage($filterResult['violations']);
            $this->messageModel->createBlockedMessage(
                (int)$orderId,
                $userType,
                (int)$userId,
                $filterResult['filtered_content'],
                implode(', ', $filterResult['violations'])
            );
            $this->error($warningMessage, 400);
        }

        $translatedContent = Translator::translate($data['content']);
        $messageType = $data['message_type'] ?? 'text';
        $attachmentUrl = $data['attachment_url'] ?? null;

        $messageId = $this->messageModel->createMessage(
            (int)$orderId,
            $userType,
            (int)$userId,
            $data['content'],
            $translatedContent,
            $messageType,
            $attachmentUrl
        );

        $message = $this->messageModel->find($messageId);
        $this->notifyRecipient($order, $userType, $userId, $data['content']);
        $this->success($message, 'Message envoye', 201);
    }

    /**
     * POST /api/orders/{id}/messages/upload
     * Upload une image dans le chat
     */
    public function uploadImage(string $orderId): void
    {
        $userId = $_SERVER['USER_ID'] ?? null;
        $userType = $_SERVER['USER_TYPE'] ?? 'user';

        $order = $this->orderModel->find((int)$orderId);
        if (!$order) {
            $this->error('Commande non trouvee', 404);
        }

        if ($userType === 'user' && $order['user_id'] != $userId) {
            $this->error('Acces refuse', 403);
        }

        if ($userType === 'provider' && $order['provider_id'] != $userId) {
            $this->error('Acces refuse', 403);
        }

        $chatStatus = MessageFilter::isChatActive($order);
        if (!$chatStatus['is_active']) {
            $this->error($chatStatus['reason'], 403);
        }

        if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
            $this->error('Fichier image requis', 400);
        }

        $file = $_FILES['image'];
        $allowedTypes = MessageFilter::getAllowedImageTypes();
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mimeType, $allowedTypes)) {
            $this->error('Format non autorise. Utilisez JPG, PNG ou WEBP', 400);
        }

        $maxSize = MessageFilter::getMaxImageSize();
        if ($file['size'] > $maxSize) {
            $this->error('Fichier trop volumineux (max 5 MB)', 400);
        }

        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'chat_' . $orderId . '_' . time() . '_' . uniqid() . '.' . $extension;

        $uploadDir = __DIR__ . '/../../public/uploads/chat/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $destination = $uploadDir . $filename;

        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            $this->error('Erreur lors de l\'upload', 500);
        }

        // Vérifier le nom de fichier suspect
        $filenameCheck = MessageFilter::checkFilename($file['name']);
        if (!$filenameCheck['is_safe']) {
            @unlink($destination);
            $this->error($filenameCheck['reason'], 400);
        }

        // Analyser le contenu de l'image pour détecter du contenu inapproprié
        $imageAnalysis = MessageFilter::analyzeImage($destination);
        if (!$imageAnalysis['is_safe']) {
            @unlink($destination);
            error_log("[Chat] Image bloquée - Skin: {$imageAnalysis['skin_percentage']}% - Order: {$orderId}");
            $this->error($imageAnalysis['reason'], 400);
        }

        $imageUrl = '/uploads/chat/' . $filename;

        $messageId = $this->messageModel->createMessage(
            (int)$orderId,
            $userType,
            (int)$userId,
            '[Image]',
            null,
            'image',
            $imageUrl
        );

        $message = $this->messageModel->find($messageId);
        $this->notifyRecipient($order, $userType, $userId, '[Image envoyee]');

        $this->success([
            'message' => $message,
            'image_url' => $imageUrl
        ], 'Image envoyee', 201);
    }

    /**
     * GET /api/chat/unread-count
     */
    public function getUnreadCount(): void
    {
        $userId = $_SERVER['USER_ID'] ?? null;
        $userType = $_SERVER['USER_TYPE'] ?? 'user';

        if ($userType === 'user') {
            $count = $this->messageModel->countAllUnreadForUser((int)$userId);
        } else {
            $count = $this->messageModel->countAllUnreadForProvider((int)$userId);
        }

        $this->success(['unread_count' => $count]);
    }

    /**
     * POST /api/presence/update
     */
    public function updatePresence(): void
    {
        $userId = $_SERVER['USER_ID'] ?? null;
        $userType = $_SERVER['USER_TYPE'] ?? 'user';

        $this->messageModel->updatePresence($userType, (int)$userId);
        $this->success(['status' => 'updated']);
    }

    /**
     * GET /api/orders/{id}/chat-status
     */
    public function getChatStatus(string $orderId): void
    {
        $userId = $_SERVER['USER_ID'] ?? null;
        $userType = $_SERVER['USER_TYPE'] ?? 'user';

        $order = $this->orderModel->find((int)$orderId);
        if (!$order) {
            $this->error('Commande non trouvee', 404);
        }

        if ($userType === 'user' && $order['user_id'] != $userId) {
            $this->error('Acces refuse', 403);
        }

        if ($userType === 'provider' && $order['provider_id'] != $userId) {
            $this->error('Acces refuse', 403);
        }

        $chatStatus = MessageFilter::isChatActive($order);
        $unreadCount = $this->messageModel->countUnread((int)$orderId, $userType);
        $otherPartyOnline = $this->getOtherPartyOnlineStatus($order, $userType);

        $this->success([
            'chat_active' => $chatStatus['is_active'],
            'disabled_reason' => $chatStatus['reason'],
            'unread_count' => $unreadCount,
            'other_party_online' => $otherPartyOnline
        ]);
    }

    private function notifyRecipient(array $order, string $senderType, int $senderId, string $content): void
    {
        try {
            $db = $this->messageModel->getDatabase();

            if ($senderType === 'user') {
                $stmt = $db->prepare("
                    INSERT INTO provider_notifications (
                        provider_id, type, title, message, data, created_at
                    ) VALUES (?, 'new_message', ?, ?, ?, NOW())
                ");
                $stmt->execute([
                    $order['provider_id'],
                    'Nouveau message',
                    mb_substr($content, 0, 100),
                    json_encode(['order_id' => $order['id']])
                ]);
            } else {
                $stmt = $db->prepare("
                    INSERT INTO notifications (
                        user_id, type, title, message, data, created_at
                    ) VALUES (?, 'new_message', ?, ?, ?, NOW())
                ");
                $stmt->execute([
                    $order['user_id'],
                    'Nouveau message',
                    mb_substr($content, 0, 100),
                    json_encode(['order_id' => $order['id']])
                ]);
            }
        } catch (\Exception $e) {
            error_log("Erreur notification chat: " . $e->getMessage());
        }
    }

    private function getOtherPartyOnlineStatus(array $order, string $userType): bool
    {
        try {
            $db = $this->messageModel->getDatabase();

            if ($userType === 'user') {
                $stmt = $db->prepare("
                    SELECT last_seen_at FROM providers
                    WHERE id = ? AND last_seen_at > NOW() - INTERVAL '5 minutes'
                ");
                $stmt->execute([$order['provider_id']]);
            } else {
                $stmt = $db->prepare("
                    SELECT last_seen_at FROM users
                    WHERE id = ? AND last_seen_at > NOW() - INTERVAL '5 minutes'
                ");
                $stmt->execute([$order['user_id']]);
            }

            return $stmt->fetch() !== false;
        } catch (\Exception $e) {
            return false;
        }
    }
}
