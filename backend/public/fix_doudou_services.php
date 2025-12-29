<?php
/**
 * Script pour ajouter des services au prestataire Doudou
 * et activer son compte pour les tests
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../app/core/Database.php';

use App\Core\Database;

try {
    $pdo = Database::getInstance();
    $result = [];

    // 1. Trouver Doudou (provider_id = 2)
    $providerId = 2;

    // 2. Récupérer quelques services à ajouter (premiers 5)
    $stmt = $pdo->query("SELECT id, name FROM services LIMIT 5");
    $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $result['services_to_add'] = $services;

    // 3. Ajouter les services au prestataire
    $addedCount = 0;
    foreach ($services as $service) {
        // Vérifier si déjà ajouté
        $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM provider_services WHERE provider_id = ? AND service_id = ?");
        $checkStmt->execute([$providerId, $service['id']]);
        $exists = $checkStmt->fetchColumn() > 0;

        if (!$exists) {
            $insertStmt = $pdo->prepare("INSERT INTO provider_services (provider_id, service_id) VALUES (?, ?)");
            $insertStmt->execute([$providerId, $service['id']]);
            $addedCount++;
        }
    }
    $result['services_added'] = $addedCount;

    // 4. Activer le prestataire (is_available = true, is_verified = true)
    $updateStmt = $pdo->prepare("UPDATE providers SET is_available = true, is_verified = true WHERE id = ?");
    $updateStmt->execute([$providerId]);
    $result['provider_activated'] = true;

    // 5. Vérifier le résultat
    $verifyStmt = $pdo->prepare("SELECT id, first_name, last_name, is_available, is_verified FROM providers WHERE id = ?");
    $verifyStmt->execute([$providerId]);
    $result['provider_status'] = $verifyStmt->fetch(PDO::FETCH_ASSOC);

    // 6. Compter les services liés
    $countStmt = $pdo->prepare("SELECT COUNT(*) as count FROM provider_services WHERE provider_id = ?");
    $countStmt->execute([$providerId]);
    $result['total_services_linked'] = $countStmt->fetch(PDO::FETCH_ASSOC)['count'];

    $result['success'] = true;
    $result['message'] = "Doudou (ID: $providerId) a été activé avec $addedCount nouveaux services";

    echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
