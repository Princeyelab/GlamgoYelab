<?php

/**
 * Script pour ajouter les données complètes des services
 * Ce script ajoute les 5 catégories populaires avec tous leurs services
 * SANS supprimer les données existantes
 */

// Encodage UTF-8
mb_internal_encoding('UTF-8');
mb_http_output('UTF-8');

echo "\n";
echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║  Ajout des Données Complètes - GlamGo                     ║\n";
echo "║  5 Catégories Populaires + Services                       ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n";
echo "\n";

// Configuration de la base de données
$host = getenv('DB_HOST') ?: 'glamgo-mysql';
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

    // Lecture et exécution du fichier SQL
    echo "📄 Lecture du fichier de migration...\n";
    $sqlFile = __DIR__ . '/database/seeds/003_populate_complete_services.sql';

    if (!file_exists($sqlFile)) {
        throw new Exception("Fichier SQL introuvable: $sqlFile");
    }

    $sql = file_get_contents($sqlFile);

    // Supprimer les commentaires SELECT de vérification pour éviter les problèmes
    $sql = preg_replace('/SELECT.*RÉSUMÉ.*$/m', '', $sql);

    echo "✅ Fichier lu avec succès\n\n";

    // Exécution de la migration
    echo "🚀 Exécution de la migration...\n";
    echo "   Ajout des nouvelles catégories et services...\n\n";

    $pdo->exec($sql);

    echo "✅ Migration exécutée avec succès!\n\n";

    // Vérification des résultats
    echo "╔════════════════════════════════════════════════════════════╗\n";
    echo "║  RÉSUMÉ APRÈS INSERTION                                    ║\n";
    echo "╚════════════════════════════════════════════════════════════╝\n\n";

    $stmt = $pdo->query("
        SELECT
            c.name as category_name,
            COUNT(s.id) as services_count,
            MIN(s.price) as min_price,
            MAX(s.price) as max_price,
            ROUND(AVG(s.duration_minutes)) as avg_duration
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
        $totalServices += $cat['services_count'];
        printf(
            "│ %-15s │ %8d │ %7.0f  │ %7.0f  │ %14.0f │\n",
            mb_substr($cat['category_name'], 0, 15),
            $cat['services_count'],
            $cat['min_price'] ?? 0,
            $cat['max_price'] ?? 0,
            $cat['avg_duration'] ?? 0
        );
    }

    echo "└─────────────────┴──────────┴──────────┴──────────┴────────────────┘\n";
    echo "\n";
    echo "📊 TOTAL : " . count($categories) . " catégories principales\n";

    // Compter tous les services
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM services");
    $result = $stmt->fetch();
    echo "📊 TOTAL SERVICES : " . $result['count'] . " services\n";

    // Compter les sous-catégories
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM categories WHERE parent_id IS NOT NULL");
    $result = $stmt->fetch();
    $subCategories = $result['count'];
    echo "📂 SOUS-CATÉGORIES : $subCategories\n";

    echo "\n";
    echo "╔════════════════════════════════════════════════════════════╗\n";
    echo "║  ✅ MIGRATION TERMINÉE AVEC SUCCÈS!                        ║\n";
    echo "╚════════════════════════════════════════════════════════════╝\n";
    echo "\n";
    echo "🎯 Prochaines étapes :\n";
    echo "   1. Vérifier les données dans la base\n";
    echo "   2. Tester l'affichage sur le frontend\n";
    echo "   3. Assigner des prestataires aux services\n";
    echo "\n";

} catch (PDOException $e) {
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
