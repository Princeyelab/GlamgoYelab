<?php
/**
 * Debug Provider Status - Check why a provider is not appearing in search
 */

require_once __DIR__ . '/../vendor/autoload.php';

use App\Core\Database;

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    $db = Database::getInstance();

    // Get provider name from query param or default to search all
    $searchName = $_GET['name'] ?? 'bamba';

    // Find providers matching the name
    $stmt = $db->prepare("
        SELECT
            p.id,
            p.first_name,
            p.last_name,
            p.email,
            p.phone,
            p.account_status,
            p.is_available,
            p.is_verified,
            p.latitude,
            p.longitude,
            p.current_latitude,
            p.current_longitude,
            p.intervention_radius_km,
            p.created_at,
            p.updated_at
        FROM providers p
        WHERE LOWER(p.first_name) LIKE LOWER(:name)
           OR LOWER(p.last_name) LIKE LOWER(:name)
           OR LOWER(p.email) LIKE LOWER(:name)
        ORDER BY p.id DESC
    ");
    $stmt->execute(['name' => '%' . $searchName . '%']);
    $providers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $result = [];

    foreach ($providers as $provider) {
        // Check services associated with this provider
        $stmtServices = $db->prepare("
            SELECT s.id, s.name, s.price
            FROM provider_services ps
            JOIN services s ON ps.service_id = s.id
            WHERE ps.provider_id = :provider_id
        ");
        $stmtServices->execute(['provider_id' => $provider['id']]);
        $services = $stmtServices->fetchAll(PDO::FETCH_ASSOC);

        // Build status check
        $issues = [];

        if ($provider['account_status'] !== 'active') {
            $issues[] = "account_status = '{$provider['account_status']}' (doit etre 'active')";
        }
        if (!$provider['is_available']) {
            $issues[] = "is_available = FALSE (doit etre TRUE)";
        }
        if (!$provider['is_verified']) {
            $issues[] = "is_verified = FALSE (doit etre TRUE)";
        }
        if (empty($provider['latitude']) && empty($provider['current_latitude'])) {
            $issues[] = "Pas de coordonnees GPS (latitude/longitude manquantes)";
        }
        if (empty($services)) {
            $issues[] = "Aucun service associe (table provider_services vide)";
        }

        $result[] = [
            'provider' => [
                'id' => $provider['id'],
                'name' => $provider['first_name'] . ' ' . $provider['last_name'],
                'email' => $provider['email'],
                'phone' => $provider['phone'],
            ],
            'status_fields' => [
                'account_status' => $provider['account_status'],
                'is_available' => (bool) $provider['is_available'],
                'is_verified' => (bool) $provider['is_verified'],
            ],
            'location' => [
                'latitude' => $provider['latitude'] ?: $provider['current_latitude'],
                'longitude' => $provider['longitude'] ?: $provider['current_longitude'],
                'intervention_radius_km' => $provider['intervention_radius_km'],
            ],
            'services_count' => count($services),
            'services' => $services,
            'issues' => $issues,
            'can_appear_in_search' => empty($issues),
        ];
    }

    echo json_encode([
        'success' => true,
        'search_term' => $searchName,
        'providers_found' => count($result),
        'data' => $result,
        'fix_commands' => [
            'activate_provider' => "UPDATE providers SET account_status = 'active', is_available = TRUE, is_verified = TRUE WHERE id = <PROVIDER_ID>;",
            'add_service' => "INSERT INTO provider_services (provider_id, service_id) VALUES (<PROVIDER_ID>, <SERVICE_ID>);",
        ]
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
