<?php
/**
 * Script pour exécuter la migration 017 (ajout statut arrived)
 * Exécuter via: php run_migration_017.php
 */

require_once __DIR__ . '/vendor/autoload.php';

use App\Core\Database;

try {
    $db = Database::getInstance();

    echo "=== Migration 017: Ajout statut 'arrived' ===\n\n";

    // Lire le fichier de migration
    $migrationFile = __DIR__ . '/database/migrations/017_add_arrived_status.sql';

    if (!file_exists($migrationFile)) {
        throw new Exception("Fichier de migration non trouvé: $migrationFile");
    }

    $sql = file_get_contents($migrationFile);

    // Séparer les requêtes
    $queries = array_filter(
        array_map('trim', explode(';', $sql)),
        fn($q) => !empty($q) && !str_starts_with($q, '--')
    );

    foreach ($queries as $query) {
        // Ignorer les commentaires
        if (str_starts_with(trim($query), '--')) {
            continue;
        }

        echo "Exécution: " . substr($query, 0, 60) . "...\n";

        try {
            $db->exec($query);
            echo "✓ OK\n";
        } catch (PDOException $e) {
            // Ignorer les erreurs "column already exists"
            if (strpos($e->getMessage(), 'Duplicate column') !== false ||
                strpos($e->getMessage(), 'already exists') !== false) {
                echo "⚠ Déjà existant, ignoré\n";
            } else {
                throw $e;
            }
        }
    }

    echo "\n=== Migration terminée avec succès! ===\n";

    // Vérifier le résultat
    $result = $db->query("SHOW COLUMNS FROM orders WHERE Field = 'status'")->fetch();
    echo "\nNouveau type ENUM: " . ($result['Type'] ?? 'Non trouvé') . "\n";

} catch (Exception $e) {
    echo "ERREUR: " . $e->getMessage() . "\n";
    exit(1);
}
