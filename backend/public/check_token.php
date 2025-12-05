<?php
spl_autoload_register(function ($class) {
    $file = __DIR__ . '/../' . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

use App\Core\Database;

header('Content-Type: application/json');

// Récupérer le token depuis l'header
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

if (empty($authHeader) || !preg_match('/Bearer\s+(.+)/', $authHeader, $matches)) {
    echo json_encode(['success' => false, 'message' => 'No token provided']);
    exit;
}

$token = $matches[1];

// Décoder le JWT (simple décodage sans vérification pour debug)
$parts = explode('.', $token);
if (count($parts) !== 3) {
    echo json_encode(['success' => false, 'message' => 'Invalid token format']);
    exit;
}

$payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);

try {
    $db = Database::getInstance();

    // Récupérer les infos du prestataire
    $stmt = $db->prepare("SELECT id, first_name, last_name, email FROM providers WHERE id = ?");
    $stmt->execute([$payload['user_id']]);
    $provider = $stmt->fetch(PDO::FETCH_ASSOC);

    // Compter ses notifications
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM notifications WHERE recipient_type = 'provider' AND recipient_id = ? AND is_read = FALSE");
    $stmt->execute([$payload['user_id']]);
    $unreadCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

    echo json_encode([
        'success' => true,
        'token_payload' => $payload,
        'provider' => $provider,
        'unread_notifications' => $unreadCount
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
