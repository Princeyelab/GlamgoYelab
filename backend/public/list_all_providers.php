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

    // Récupérer tous les prestataires avec leurs notifications
    $stmt = $db->query("
        SELECT
            p.id,
            p.first_name,
            p.last_name,
            p.email,
            p.is_verified,
            p.is_available,
            (SELECT COUNT(*) FROM notifications WHERE recipient_type = 'provider' AND recipient_id = p.id AND is_read = FALSE) as unread_count,
            (SELECT COUNT(*) FROM notifications WHERE recipient_type = 'provider' AND recipient_id = p.id) as total_count
        FROM providers p
        ORDER BY p.id
    ");
    $providers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'providers' => $providers
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
