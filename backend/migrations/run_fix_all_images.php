<?php

require_once __DIR__ . '/../app/core/Database.php';

use App\Core\Database;

echo "🔧 Migration des images - Début\n";
echo str_repeat("=", 60) . "\n\n";

try {
    $pdo = Database::getInstance();

    // Lire le fichier SQL
    $sqlFile = __DIR__ . '/fix_all_images.sql';
    if (!file_exists($sqlFile)) {
        throw new Exception("Fichier SQL introuvable: $sqlFile");
    }

    $sql = file_get_contents($sqlFile);
    echo "✓ Fichier SQL chargé\n\n";

    // Séparer les requêtes
    $statements = explode(';', $sql);
    $statements = array_filter(array_map('trim', $statements), function($stmt) {
        return !empty($stmt) &&
               !str_starts_with($stmt, '--') &&
               $stmt !== 'SET NAMES utf8mb4';
    });

    echo "📝 Exécution de " . count($statements) . " requêtes...\n\n";

    $successCount = 0;
    $errorCount = 0;
    $totalUpdated = 0;

    foreach ($statements as $stmt) {
        try {
            $result = $pdo->exec($stmt);

            if (stripos($stmt, 'UPDATE') === 0) {
                if ($result > 0) {
                    $successCount++;
                    $totalUpdated += $result;

                    // Extraire le nom du service du slug
                    if (preg_match("/slug = '([^']+)'/", $stmt, $matches)) {
                        $slug = $matches[1];
                        echo "  ✓ $result service(s) mis à jour (slug: $slug)\n";
                    } else {
                        echo "  ✓ $result service(s) mis à jour\n";
                    }
                }
            } elseif (stripos($stmt, 'SELECT') === 0) {
                echo "  ✓ Vérification OK\n";
            }
        } catch (PDOException $e) {
            $errorCount++;
            echo "  ✗ Erreur: " . $e->getMessage() . "\n";
            echo "    SQL: " . substr($stmt, 0, 100) . "...\n";
        }
    }

    echo "\n" . str_repeat("=", 60) . "\n";
    echo "✅ Migration terminée!\n";
    echo "   - Requêtes réussies: $successCount\n";
    echo "   - Total de services mis à jour: $totalUpdated\n";
    echo "   - Erreurs: $errorCount\n";
    echo str_repeat("=", 60) . "\n";

} catch (Exception $e) {
    echo "\n❌ Erreur fatale: " . $e->getMessage() . "\n";
    exit(1);
}
