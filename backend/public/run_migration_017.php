<?php
/**
 * Endpoint web pour exécuter la migration 017 (ajout statut arrived)
 * URL: https://glamgo-api.fly.dev/run_migration_017.php
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../vendor/autoload.php';

use App\Core\Database;

$results = [];

try {
    $db = Database::getInstance();

    $results[] = "=== Migration 017: Ajout statut 'arrived' ===";

    // 1. Modifier l'ENUM du statut
    $results[] = "1. Modification ENUM status...";
    try {
        $db->exec("ALTER TABLE orders MODIFY COLUMN status ENUM(
            'pending',
            'accepted',
            'on_way',
            'arrived',
            'in_progress',
            'completed',
            'cancelled'
        ) DEFAULT 'pending'");
        $results[] = "   ✓ ENUM modifié avec succès";
    } catch (PDOException $e) {
        $results[] = "   ⚠ " . $e->getMessage();
    }

    // 2. Ajouter la colonne arrived_at
    $results[] = "2. Ajout colonne arrived_at...";
    try {
        // Vérifier si la colonne existe déjà
        $check = $db->query("SHOW COLUMNS FROM orders LIKE 'arrived_at'")->fetch();
        if ($check) {
            $results[] = "   ⚠ Colonne déjà existante";
        } else {
            $db->exec("ALTER TABLE orders ADD COLUMN arrived_at TIMESTAMP NULL DEFAULT NULL AFTER started_at");
            $results[] = "   ✓ Colonne ajoutée";
        }
    } catch (PDOException $e) {
        // Essayer sans AFTER si started_at n'existe pas
        try {
            $db->exec("ALTER TABLE orders ADD COLUMN arrived_at TIMESTAMP NULL DEFAULT NULL");
            $results[] = "   ✓ Colonne ajoutée (sans position)";
        } catch (PDOException $e2) {
            if (strpos($e2->getMessage(), 'Duplicate') !== false) {
                $results[] = "   ⚠ Colonne déjà existante";
            } else {
                $results[] = "   ✗ Erreur: " . $e2->getMessage();
            }
        }
    }

    // 3. Vérification finale
    $results[] = "3. Vérification...";
    $statusColumn = $db->query("SHOW COLUMNS FROM orders WHERE Field = 'status'")->fetch();
    $results[] = "   Type status: " . ($statusColumn['Type'] ?? 'Non trouvé');

    $arrivedColumn = $db->query("SHOW COLUMNS FROM orders LIKE 'arrived_at'")->fetch();
    $results[] = "   Colonne arrived_at: " . ($arrivedColumn ? 'Présente' : 'Absente');

    $results[] = "";
    $results[] = "=== Migration terminée! ===";

    echo json_encode([
        'success' => true,
        'message' => 'Migration 017 exécutée',
        'details' => $results
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'details' => $results
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
