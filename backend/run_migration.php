<?php
/**
 * Script pour exécuter les migrations
 */

require_once __DIR__ . '/vendor/autoload.php';

use App\Core\Database;

// Charger les variables d'environnement
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

try {
    $db = Database::getInstance();

    // Lire le fichier de migration
    $migrationFile = __DIR__ . '/database/migrations/002_add_notifications.sql';

    if (!file_exists($migrationFile)) {
        die("Fichier de migration non trouvé: $migrationFile\n");
    }

    $sql = file_get_contents($migrationFile);

    // Exécuter la migration
    $db->exec($sql);

    echo "✅ Migration exécutée avec succès!\n";
    echo "Table 'notifications' créée.\n";

    // Vérifier que la table existe
    $stmt = $db->query("SHOW TABLES LIKE 'notifications'");
    if ($stmt->rowCount() > 0) {
        echo "✅ Table 'notifications' vérifiée.\n";
    } else {
        echo "❌ La table n'a pas été créée.\n";
    }

} catch (Exception $e) {
    echo "❌ Erreur lors de la migration: " . $e->getMessage() . "\n";
    exit(1);
}
