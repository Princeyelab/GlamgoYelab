<?php
/**
 * Script de diagnostic pour les prestataires du service Chef à domicile
 */

require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $db = Database::getInstance();

    // Trouver l'ID du service "Chef à domicile"
    $stmt = $db->prepare("
        SELECT id, name, slug
        FROM services
        WHERE LOWER(name) LIKE '%chef%' OR LOWER(slug) LIKE '%chef%'
    ");
    $stmt->execute();
    $chefServices = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $results = [];

    foreach ($chefServices as $service) {
        $serviceId = $service['id'];

        // Trouver tous les prestataires qui offrent ce service
        $stmt = $db->prepare("
            SELECT
                p.id,
                p.first_name,
                p.last_name,
                p.email,
                p.phone,
                p.is_available,
                p.is_verified,
                p.account_status,
                p.latitude,
                p.longitude,
                p.current_latitude,
                p.current_longitude,
                p.last_seen_at,
                p.intervention_radius_km,
                ps.service_id,
                s.name as service_name,
                CASE
                    WHEN p.last_seen_at >= NOW() - INTERVAL '7 days' THEN 'Actif (7j)'
                    WHEN p.last_seen_at >= NOW() - INTERVAL '30 days' THEN 'Inactif (30j)'
                    WHEN p.last_seen_at IS NULL THEN 'Jamais connecté'
                    ELSE 'Inactif (>30j)'
                END as activity_status
            FROM providers p
            LEFT JOIN provider_services ps ON p.id = ps.provider_id
            LEFT JOIN services s ON ps.service_id = s.id
            WHERE ps.service_id = :service_id
            ORDER BY p.last_seen_at DESC NULLS LAST
        ");
        $stmt->execute(['service_id' => $serviceId]);
        $providers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $results[$service['name']] = [
            'service_id' => $serviceId,
            'service_name' => $service['name'],
            'total_providers' => count($providers),
            'providers' => []
        ];

        foreach ($providers as $provider) {
            $issues = [];

            // Vérifier les problèmes potentiels
            if (!$provider['is_available']) {
                $issues[] = '❌ Non disponible (is_available = FALSE)';
            }
            if (!$provider['latitude'] && !$provider['current_latitude']) {
                $issues[] = '❌ Pas de coordonnées GPS';
            }
            if ($provider['last_seen_at'] === null) {
                $issues[] = '⚠️ Jamais connecté (last_seen_at NULL)';
            } elseif (strtotime($provider['last_seen_at']) < strtotime('-7 days')) {
                $issues[] = '⚠️ Dernière connexion > 7 jours';
            }
            if ($provider['account_status'] !== 'active') {
                $issues[] = '❌ Compte non actif: ' . $provider['account_status'];
            }

            $results[$service['name']]['providers'][] = [
                'id' => $provider['id'],
                'name' => $provider['first_name'] . ' ' . $provider['last_name'],
                'email' => $provider['email'],
                'phone' => $provider['phone'],
                'is_available' => $provider['is_available'] ? 'OUI' : 'NON',
                'is_verified' => $provider['is_verified'] ? 'OUI' : 'NON',
                'account_status' => $provider['account_status'],
                'has_coordinates' => ($provider['latitude'] || $provider['current_latitude']) ? 'OUI' : 'NON',
                'coordinates' => [
                    'latitude' => $provider['current_latitude'] ?? $provider['latitude'],
                    'longitude' => $provider['current_longitude'] ?? $provider['longitude']
                ],
                'last_seen_at' => $provider['last_seen_at'],
                'activity_status' => $provider['activity_status'],
                'intervention_radius_km' => $provider['intervention_radius_km'] ?? 10,
                'issues' => $issues,
                'can_be_found' => empty($issues) ? '✅ OUI' : '❌ NON'
            ];
        }
    }

    echo json_encode([
        'success' => true,
        'timestamp' => date('Y-m-d H:i:s'),
        'results' => $results,
        'summary' => [
            'total_chef_services' => count($chefServices),
            'message' => 'Pour qu\'un prestataire soit trouvé, il doit:',
            'requirements' => [
                '1. is_available = TRUE',
                '2. Avoir des coordonnées GPS (latitude/longitude)',
                '3. S\'être connecté dans les 7 derniers jours',
                '4. account_status = active',
                '5. Être lié au service dans provider_services'
            ]
        ]
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
