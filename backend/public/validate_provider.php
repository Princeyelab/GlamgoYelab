<?php
/**
 * Script de validation/invalidation d'un prestataire
 * Usage:
 *   Valider:   /validate_provider.php?email=test@example.com
 *   Invalider: /validate_provider.php?email=test@example.com&action=invalidate
 *   Lister:    /validate_provider.php?list=1
 */

spl_autoload_register(function ($class) {
    $file = __DIR__ . '/../' . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

use App\Core\Database;

header('Content-Type: application/json; charset=utf-8');

try {
    $db = Database::getInstance();

    // Mode liste: afficher tous les prestataires
    if (isset($_GET['list'])) {
        $stmt = $db->query("SELECT id, email, first_name, last_name, is_verified, is_available, created_at FROM providers ORDER BY id DESC");
        $providers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'count' => count($providers),
            'providers' => $providers
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Mode validation/invalidation
    $email = $_GET['email'] ?? null;
    $action = $_GET['action'] ?? 'validate';

    if (!$email) {
        echo json_encode([
            'success' => false,
            'message' => 'Parametre email requis',
            'usage' => [
                'valider' => '/validate_provider.php?email=test@example.com',
                'invalider' => '/validate_provider.php?email=test@example.com&action=invalidate',
                'lister' => '/validate_provider.php?list=1',
            ]
        ], JSON_PRETTY_PRINT);
        exit;
    }

    // Trouver le prestataire
    $stmt = $db->prepare("SELECT id, email, first_name, last_name, is_verified FROM providers WHERE email = ?");
    $stmt->execute([$email]);
    $provider = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$provider) {
        echo json_encode([
            'success' => false,
            'message' => "Aucun prestataire trouve avec l'email: $email"
        ], JSON_PRETTY_PRINT);
        exit;
    }

    $isVerified = ($action === 'validate') ? true : false;

    $stmt = $db->prepare("UPDATE providers SET is_verified = ?, updated_at = NOW() WHERE id = ?");
    $stmt->execute([$isVerified, $provider['id']]);

    echo json_encode([
        'success' => true,
        'message' => $isVerified
            ? "Prestataire {$provider['first_name']} {$provider['last_name']} VALIDE avec succes"
            : "Prestataire {$provider['first_name']} {$provider['last_name']} INVALIDE avec succes",
        'provider' => [
            'id' => $provider['id'],
            'email' => $provider['email'],
            'name' => "{$provider['first_name']} {$provider['last_name']}",
            'is_verified' => $isVerified,
        ]
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erreur: ' . $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
