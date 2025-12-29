<?php
/**
 * Debug: Vérifier les prestataires et leurs coordonnées
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Charger la config comme le fait Database.php
$config = require __DIR__ . '/../config/config.php';
$db_config = $config['database'];

$driver = $db_config['driver'] ?? 'pgsql';
$port = $db_config['port'] ?? ($driver === 'pgsql' ? '5432' : '3306');

try {
    if ($driver === 'pgsql') {
        $dsn = "pgsql:host={$db_config['host']};port={$port};dbname={$db_config['name']}";
    } else {
        $dsn = "mysql:host={$db_config['host']};port={$port};dbname={$db_config['name']};charset={$db_config['charset']}";
    }

    $db = new PDO($dsn, $db_config['user'], $db_config['password']);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $result = [];

    // 1. Compter tous les prestataires
    $stmt = $db->query("SELECT COUNT(*) as total FROM providers");
    $result['1_total_providers'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // 2. Prestataires avec coordonnées
    $stmt = $db->query("
        SELECT COUNT(*) as total
        FROM providers
        WHERE (latitude IS NOT NULL AND longitude IS NOT NULL)
           OR (current_latitude IS NOT NULL AND current_longitude IS NOT NULL)
    ");
    $result['2_providers_with_coords'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // 3. Prestataires vérifiés
    $stmt = $db->query("SELECT COUNT(*) as total FROM providers WHERE is_verified = TRUE");
    $result['3_verified_providers'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // 4. Prestataires disponibles
    $stmt = $db->query("SELECT COUNT(*) as total FROM providers WHERE is_available = TRUE");
    $result['4_available_providers'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // 5. Liste des prestataires avec leurs coordonnées
    $stmt = $db->query("
        SELECT id, first_name, last_name,
               latitude, longitude,
               current_latitude, current_longitude,
               is_available, is_verified, account_status
        FROM providers
        LIMIT 20
    ");
    $result['5_providers_list'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 6. Vérifier les associations provider_services
    $stmt = $db->query("SELECT COUNT(*) as total FROM provider_services");
    $result['6_total_provider_services'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // 7. Services avec prestataires associés
    $stmt = $db->query("
        SELECT s.id, s.name, COUNT(ps.provider_id) as provider_count
        FROM services s
        LEFT JOIN provider_services ps ON s.id = ps.service_id
        GROUP BY s.id, s.name
        HAVING COUNT(ps.provider_id) > 0
        ORDER BY COUNT(ps.provider_id) DESC
        LIMIT 20
    ");
    $result['7_services_with_providers'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 8. Prestataires avec services et coordonnées
    $stmt = $db->query("
        SELECT p.id, p.first_name, p.last_name,
               COALESCE(p.current_latitude, p.latitude) as lat,
               COALESCE(p.current_longitude, p.longitude) as lng,
               p.is_available, p.is_verified,
               STRING_AGG(s.name, ', ') as services
        FROM providers p
        LEFT JOIN provider_services ps ON p.id = ps.provider_id
        LEFT JOIN services s ON ps.service_id = s.id
        WHERE (p.latitude IS NOT NULL OR p.current_latitude IS NOT NULL)
        GROUP BY p.id, p.first_name, p.last_name, p.current_latitude, p.latitude, p.current_longitude, p.longitude, p.is_available, p.is_verified
        LIMIT 20
    ");
    $result['8_providers_with_services'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        'error' => $e->getMessage(),
        'db_host' => $db_config['host'] ?? 'not set',
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
}
