<?php
spl_autoload_register(function ($class) {
    $file = __DIR__ . '/../' . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

use App\Core\Database;

header('Content-Type: application/json');

try {
    $db = Database::getInstance();

    // Chercher Jean Marc
    $stmt = $db->prepare("SELECT id, first_name, last_name, email, is_verified, is_available FROM providers WHERE first_name LIKE ? OR last_name LIKE ?");
    $stmt->execute(['%Jean%', '%Marc%']);
    $jeanMarc = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$jeanMarc) {
        echo json_encode(['success' => false, 'message' => 'Jean Marc non trouve']);
        exit;
    }

    // Compter ses notifications
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM notifications WHERE recipient_type = 'provider' AND recipient_id = ?");
    $stmt->execute([$jeanMarc['id']]);
    $totalNotifs = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // Compter les non lues
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM notifications WHERE recipient_type = 'provider' AND recipient_id = ? AND is_read = FALSE");
    $stmt->execute([$jeanMarc['id']]);
    $unreadNotifs = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // Recuperer quelques notifications
    $stmt = $db->prepare("SELECT id, notification_type, title, message, is_read, created_at FROM notifications WHERE recipient_type = 'provider' AND recipient_id = ? ORDER BY created_at DESC LIMIT 5");
    $stmt->execute([$jeanMarc['id']]);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'provider' => $jeanMarc,
        'total_notifications' => $totalNotifs,
        'unread_notifications' => $unreadNotifs,
        'recent_notifications' => $notifications
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
