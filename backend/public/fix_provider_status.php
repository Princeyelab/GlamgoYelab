<?php
/**
 * Fix Provider Status - Activer un prestataire pour qu'il apparaisse dans les recherches
 */

// Autoloader
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $baseDir = __DIR__ . '/../app/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) return;
    $relativeClass = substr($class, $len);
    $parts = explode('\\', $relativeClass);
    $className = array_pop($parts);
    $path = '';
    foreach ($parts as $part) {
        $path .= strtolower($part) . '/';
    }
    $file = $baseDir . $path . $className . '.php';
    if (file_exists($file)) require $file;
});

use App\Core\Database;

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    $db = Database::getInstance();

    $email = $_GET['email'] ?? null;
    $name = $_GET['name'] ?? null;

    if (!$email && !$name) {
        echo json_encode([
            'success' => false,
            'error' => 'Parametres requis: email ou name',
            'usage' => '/fix_provider_status.php?name=bamba'
        ]);
        exit;
    }

    // Find provider
    if ($email) {
        $stmt = $db->prepare("SELECT * FROM providers WHERE email = :email");
        $stmt->execute(['email' => $email]);
    } else {
        $stmt = $db->prepare("
            SELECT * FROM providers
            WHERE LOWER(first_name) LIKE LOWER(:name)
               OR LOWER(last_name) LIKE LOWER(:name)
            ORDER BY id DESC LIMIT 1
        ");
        $stmt->execute(['name' => '%' . $name . '%']);
    }

    $provider = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$provider) {
        echo json_encode(['success' => false, 'error' => 'Prestataire non trouve']);
        exit;
    }

    // Get current status
    $beforeStatus = [
        'account_status' => $provider['account_status'],
        'is_available' => (bool) $provider['is_available'],
        'is_verified' => (bool) $provider['is_verified'],
        'has_lat' => !empty($provider['latitude']) || !empty($provider['current_latitude']),
        'has_lng' => !empty($provider['longitude']) || !empty($provider['current_longitude']),
    ];

    // Fix provider status
    $updateStmt = $db->prepare("
        UPDATE providers SET
            account_status = 'active',
            is_available = TRUE,
            is_verified = TRUE,
            updated_at = NOW()
        WHERE id = :id
    ");
    $updateStmt->execute(['id' => $provider['id']]);

    // Check services
    $stmtServices = $db->prepare("SELECT COUNT(*) as count FROM provider_services WHERE provider_id = :provider_id");
    $stmtServices->execute(['provider_id' => $provider['id']]);
    $servicesCount = $stmtServices->fetch(PDO::FETCH_ASSOC)['count'];

    // If no services, add all active services
    $servicesAdded = [];
    if ($servicesCount == 0) {
        $stmtAllServices = $db->query("SELECT id, name FROM services WHERE is_active = true LIMIT 10");
        $allServices = $stmtAllServices->fetchAll(PDO::FETCH_ASSOC);

        foreach ($allServices as $service) {
            try {
                $insertStmt = $db->prepare("
                    INSERT INTO provider_services (provider_id, service_id, created_at)
                    VALUES (:provider_id, :service_id, NOW())
                    ON CONFLICT DO NOTHING
                ");
                $insertStmt->execute([
                    'provider_id' => $provider['id'],
                    'service_id' => $service['id']
                ]);
                $servicesAdded[] = $service['name'];
            } catch (Exception $e) {
                // Ignore duplicate errors
            }
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Prestataire active avec succes',
        'provider' => [
            'id' => $provider['id'],
            'name' => $provider['first_name'] . ' ' . $provider['last_name'],
            'email' => $provider['email'],
        ],
        'before' => $beforeStatus,
        'services_count_before' => $servicesCount,
        'services_added' => $servicesAdded,
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
