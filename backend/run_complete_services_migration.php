<?php

/**
 * Script pour exécuter la migration des données complètes des services
 * Ce script insère les 5 catégories populaires avec tous leurs services
 */

// Encodage UTF-8
mb_internal_encoding('UTF-8');
mb_http_output('UTF-8');

echo "\n";
echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║  Migration des Données Complètes - GlamGo                 ║\n";
echo "║  5 Catégories Populaires + Services                       ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n";
echo "\n";

// Configuration de la base de données
$host = getenv('DB_HOST') ?: 'localhost';
$dbname = getenv('DB_NAME') ?: 'glamgo';
$username = getenv('DB_USER') ?: 'glamgo_user';
$password = getenv('DB_PASSWORD') ?: 'glamgo_password';

try {
    // Connexion à la base de données
    echo "📡 Connexion à la base de données...\n";
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
        ]
    );
    echo "✅ Connecté avec succès!\n\n";

    // Vérifier si des données existent déjà
    echo "🔍 Vérification des données existantes...\n";
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM categories WHERE parent_id IS NULL");
    $result = $stmt->fetch();
    $existingCategories = $result['count'];

    $stmt = $pdo->query("SELECT COUNT(*) as count FROM services");
    $result = $stmt->fetch();
    $existingServices = $result['count'];

    echo "   📊 Catégories existantes : $existingCategories\n";
    echo "   📊 Services existants : $existingServices\n\n";

    if ($existingCategories > 0 || $existingServices > 0) {
        echo "⚠️  ATTENTION : Des données existent déjà dans la base!\n";
        echo "   Options :\n";
        echo "   1. Ajouter les nouvelles données (recommandé)\n";
        echo "   2. Supprimer et réinitialiser TOUTES les données\n";
        echo "   3. Annuler\n\n";
        echo "Votre choix (1/2/3) : ";

        $handle = fopen("php://stdin", "r");
        $choice = trim(fgets($handle));
        fclose($handle);

        if ($choice === '2') {
            echo "\n⚠️  DERNIÈRE CONFIRMATION : Supprimer TOUTES les catégories et services? (oui/non) : ";
            $handle = fopen("php://stdin", "r");
            $confirm = strtolower(trim(fgets($handle)));
            fclose($handle);

            if ($confirm === 'oui') {
                echo "\n🗑️  Suppression des données existantes...\n";
                $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
                $pdo->exec("DELETE FROM services WHERE id > 0");
                $pdo->exec("DELETE FROM categories WHERE id > 0");
                $pdo->exec("ALTER TABLE categories AUTO_INCREMENT = 1");
                $pdo->exec("ALTER TABLE services AUTO_INCREMENT = 1");
                $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
                echo "✅ Données supprimées\n\n";
            } else {
                echo "❌ Opération annulée\n";
                exit(0);
            }
        } elseif ($choice === '3') {
            echo "❌ Opération annulée\n";
            exit(0);
        }
    }

    // Lecture du fichier SQL
    echo "📄 Lecture du fichier de migration...\n";
    $sqlFile = __DIR__ . '/database/seeds/003_populate_complete_services.sql';

    if (!file_exists($sqlFile)) {
        throw new Exception("Fichier SQL introuvable: $sqlFile");
    }

    $sql = file_get_contents($sqlFile);
    echo "✅ Fichier lu avec succès\n\n";

    // Exécution de la migration
    echo "🚀 Exécution de la migration...\n";
    echo "   Cela peut prendre quelques secondes...\n\n";

    // Diviser le SQL en requêtes individuelles et les exécuter
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function($stmt) {
            return !empty($stmt) &&
                   !preg_match('/^--/', $stmt) &&
                   !preg_match('/^\/\*/', $stmt);
        }
    );

    $successCount = 0;
    $pdo->beginTransaction();

    foreach ($statements as $statement) {
        try {
            // Ignorer les commentaires et les lignes vides
            if (preg_match('/^(SELECT|INSERT|UPDATE|DELETE|SET|ALTER)/i', $statement)) {
                $pdo->exec($statement);
                $successCount++;
            }
        } catch (PDOException $e) {
            // Continuer même en cas d'erreur (pour les SELECT de vérification)
            if (strpos($statement, 'SELECT') === false) {
                echo "⚠️  Avertissement : " . $e->getMessage() . "\n";
            }
        }
    }

    $pdo->commit();
    echo "✅ Migration exécutée avec succès! ($successCount requêtes)\n\n";

    // Vérification des résultats
    echo "╔════════════════════════════════════════════════════════════╗\n";
    echo "║  RÉSUMÉ DE L'INSERTION                                     ║\n";
    echo "╚════════════════════════════════════════════════════════════╝\n\n";

    $stmt = $pdo->query("
        SELECT
            c.name as 'Catégorie',
            COUNT(s.id) as 'Services',
            MIN(s.price) as 'Prix min',
            MAX(s.price) as 'Prix max',
            ROUND(AVG(s.duration_minutes)) as 'Durée moy (min)'
        FROM categories c
        LEFT JOIN services s ON c.id = s.category_id
        WHERE c.parent_id IS NULL
        GROUP BY c.id, c.name
        ORDER BY c.display_order
    ");

    $categories = $stmt->fetchAll();

    echo "┌─────────────────┬──────────┬──────────┬──────────┬────────────────┐\n";
    echo "│ Catégorie       │ Services │ Prix min │ Prix max │ Durée moy (min)│\n";
    echo "├─────────────────┼──────────┼──────────┼──────────┼────────────────┤\n";

    $totalServices = 0;
    foreach ($categories as $cat) {
        $totalServices += $cat['Services'];
        printf(
            "│ %-15s │ %8d │ %7.0f  │ %7.0f  │ %14.0f │\n",
            mb_substr($cat['Catégorie'], 0, 15),
            $cat['Services'],
            $cat['Prix min'] ?? 0,
            $cat['Prix max'] ?? 0,
            $cat['Durée moy (min)'] ?? 0
        );
    }

    echo "└─────────────────┴──────────┴──────────┴──────────┴────────────────┘\n";
    echo "\n";
    echo "📊 TOTAL : " . count($categories) . " catégories principales, $totalServices services\n";
    echo "\n";

    // Compter les sous-catégories
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM categories WHERE parent_id IS NOT NULL");
    $result = $stmt->fetch();
    $subCategories = $result['count'];
    echo "📂 Sous-catégories : $subCategories\n";

    echo "\n";
    echo "╔════════════════════════════════════════════════════════════╗\n";
    echo "║  ✅ MIGRATION TERMINÉE AVEC SUCCÈS!                        ║\n";
    echo "╚════════════════════════════════════════════════════════════╝\n";
    echo "\n";

} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "\n";
    echo "❌ ERREUR DE BASE DE DONNÉES:\n";
    echo "   " . $e->getMessage() . "\n";
    echo "\n";
    exit(1);
} catch (Exception $e) {
    echo "\n";
    echo "❌ ERREUR:\n";
    echo "   " . $e->getMessage() . "\n";
    echo "\n";
    exit(1);
}
