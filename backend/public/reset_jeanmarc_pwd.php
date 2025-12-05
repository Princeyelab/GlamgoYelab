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

    $newPassword = 'Test123!';
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

    $stmt = $db->prepare("UPDATE providers SET password = ? WHERE email = ?");
    $stmt->execute([$hashedPassword, 'm.bi@hotmail.fr']);

    echo json_encode([
        'success' => true,
        'message' => 'Password updated',
        'new_password' => $newPassword,
        'email' => 'm.bi@hotmail.fr'
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
