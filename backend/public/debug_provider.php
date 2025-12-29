<?php
/**
 * Debug temporaire pour vérifier les prestataires
 * À SUPPRIMER après le debug
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Charger directement les fichiers nécessaires
require_once __DIR__ . '/../app/core/Database.php';

use App\Core\Database;

try {
    $pdo = Database::getInstance();

    $result = [];

    // 1. Trouver le prestataire doudou
    $stmt = $pdo->query("SELECT id, first_name, last_name, email, phone, latitude, longitude, current_latitude, current_longitude, is_available, is_verified, account_status, city, address FROM providers WHERE LOWER(first_name) LIKE '%doudou%' OR LOWER(last_name) LIKE '%doudou%' OR LOWER(email) LIKE '%doudou%'");
    $providers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $result['1_provider_doudou'] = $providers;

    // Si pas trouvé, lister tous les prestataires
    if (empty($providers)) {
        $stmt = $pdo->query("SELECT id, first_name, last_name, email, is_verified, is_available FROM providers ORDER BY id DESC LIMIT 10");
        $result['1b_all_recent_providers'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    if (!empty($providers)) {
        $providerId = $providers[0]['id'];

        // 2. Vérifier les services de ce prestataire
        $stmt = $pdo->prepare("SELECT ps.provider_id, ps.service_id, s.id as real_service_id, s.name as service_name FROM provider_services ps JOIN services s ON ps.service_id = s.id WHERE ps.provider_id = ?");
        $stmt->execute([$providerId]);
        $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $result['2_provider_services'] = $services;
        $result['2b_services_count'] = count($services);
    }

    // 3. Tous les prestataires avec coordonnées
    $stmt = $pdo->query("SELECT id, first_name, last_name, latitude, longitude, current_latitude, current_longitude, is_verified, is_available FROM providers WHERE (latitude IS NOT NULL OR current_latitude IS NOT NULL) LIMIT 10");
    $allProviders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $result['3_providers_with_coords'] = $allProviders;

    // 4. Nombre total de provider_services
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM provider_services");
    $result['4_total_provider_services'] = $stmt->fetch(PDO::FETCH_ASSOC);

    // 5. Liste des services disponibles (premiers 10)
    $stmt = $pdo->query("SELECT id, name, category_id FROM services LIMIT 10");
    $result['5_sample_services'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
}
