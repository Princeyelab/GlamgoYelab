<?php
/**
 * Script pour ajouter des services a Pascal
 * Usage: Acceder a /fix_provider_services_pascal.php
 */

require_once __DIR__ . '/../bootstrap.php';

header('Content-Type: application/json');

try {
    $db = \App\Core\Database::getInstance()->getConnection();

    // Trouver Pascal par email
    $stmt = $db->prepare("SELECT id, email, first_name, last_name FROM providers WHERE email LIKE '%doudou%' OR first_name = 'Pascal' OR email LIKE '%pascal%' LIMIT 1");
    $stmt->execute();
    $pascal = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$pascal) {
        // Lister tous les prestataires
        $stmt = $db->query("SELECT id, email, first_name, last_name FROM providers LIMIT 10");
        $providers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => false,
            'message' => 'Pascal non trouve',
            'available_providers' => $providers
        ], JSON_PRETTY_PRINT);
        exit;
    }

    $providerId = $pascal['id'];

    // Recuperer tous les services disponibles
    $stmt = $db->query("SELECT id, title, category_id FROM services WHERE is_active = 1 LIMIT 20");
    $services = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Verifier les services deja ajoutes
    $stmt = $db->prepare("SELECT service_id FROM provider_services WHERE provider_id = ?");
    $stmt->execute([$providerId]);
    $existingServices = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // Ajouter tous les services manquants
    $added = [];
    $errors = [];

    foreach ($services as $service) {
        if (!in_array($service['id'], $existingServices)) {
            try {
                $stmt = $db->prepare("INSERT INTO provider_services (provider_id, service_id, created_at) VALUES (?, ?, NOW())");
                $stmt->execute([$providerId, $service['id']]);
                $added[] = $service['title'];
            } catch (Exception $e) {
                $errors[] = "Service {$service['id']}: " . $e->getMessage();
            }
        }
    }

    // Mettre a jour la position de Pascal a Villeurbanne
    $stmt = $db->prepare("UPDATE providers SET current_latitude = 45.7676, current_longitude = 4.8799, is_available = 1 WHERE id = ?");
    $stmt->execute([$providerId]);

    // Recuperer les services actuels de Pascal
    $stmt = $db->prepare("
        SELECT s.id, s.title, s.category_id
        FROM services s
        INNER JOIN provider_services ps ON s.id = ps.service_id
        WHERE ps.provider_id = ?
    ");
    $stmt->execute([$providerId]);
    $currentServices = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'provider' => $pascal,
        'services_added' => $added,
        'current_services' => $currentServices,
        'total_services' => count($currentServices),
        'location_updated' => 'Villeurbanne (45.7676, 4.8799)',
        'errors' => $errors
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
