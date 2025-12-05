<?php

/**
 * Script de vérification des images des services
 * Vérifie que toutes les images sont bien configurées
 */

mb_internal_encoding('UTF-8');
mb_http_output('UTF-8');

echo "\n";
echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║  Vérification des Images des Services                     ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n";
echo "\n";

$host = getenv('DB_HOST') ?: 'glamgo-mysql';
$dbname = getenv('DB_NAME') ?: 'glamgo';
$username = getenv('DB_USER') ?: 'glamgo_user';
$password = getenv('DB_PASSWORD') ?: 'glamgo_password';

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );

    echo "📊 STATISTIQUES GLOBALES\n";
    echo "═══════════════════════════════════════════════════════════\n\n";

    // Statistiques générales
    $stmt = $pdo->query("
        SELECT
            COUNT(*) as total_services,
            SUM(CASE WHEN image IS NOT NULL AND image != '' THEN 1 ELSE 0 END) as with_image,
            SUM(CASE WHEN image IS NULL OR image = '' THEN 1 ELSE 0 END) as without_image
        FROM services
    ");
    $stats = $stmt->fetch();

    echo "Total de services       : {$stats['total_services']}\n";
    echo "Services avec image     : {$stats['with_image']} ✅\n";
    echo "Services sans image     : {$stats['without_image']} " . ($stats['without_image'] > 0 ? '⚠️' : '✅') . "\n";
    echo "\n";

    // Vérifier les doublons d'images
    echo "🔍 VÉRIFICATION DES DOUBLONS\n";
    echo "═══════════════════════════════════════════════════════════\n\n";

    $stmt = $pdo->query("
        SELECT image, COUNT(*) as count, GROUP_CONCAT(name SEPARATOR ', ') as services
        FROM services
        WHERE image IS NOT NULL AND image != ''
        GROUP BY image
        HAVING count > 1
    ");

    $duplicates = $stmt->fetchAll();

    if (count($duplicates) > 0) {
        echo "⚠️  DOUBLONS DÉTECTÉS :\n\n";
        foreach ($duplicates as $dup) {
            echo "   Image : {$dup['image']}\n";
            echo "   Utilisée par {$dup['count']} services : {$dup['services']}\n\n";
        }
    } else {
        echo "✅ Aucun doublon détecté - Toutes les images sont uniques!\n\n";
    }

    // Statistiques par catégorie
    echo "📂 IMAGES PAR CATÉGORIE\n";
    echo "═══════════════════════════════════════════════════════════\n\n";

    $stmt = $pdo->query("
        SELECT
            c.name as category_name,
            COUNT(s.id) as total_services,
            SUM(CASE WHEN s.image IS NOT NULL AND s.image != '' THEN 1 ELSE 0 END) as with_image,
            SUM(CASE WHEN s.image IS NULL OR s.image = '' THEN 1 ELSE 0 END) as without_image
        FROM categories c
        LEFT JOIN services s ON c.id = s.category_id
        WHERE c.parent_id IS NULL
        GROUP BY c.id, c.name
        ORDER BY c.display_order
    ");

    $categories = $stmt->fetchAll();

    foreach ($categories as $cat) {
        $percentage = $cat['total_services'] > 0 ? round(($cat['with_image'] / $cat['total_services']) * 100) : 0;
        $status = $percentage == 100 ? '✅' : '⚠️';

        echo sprintf(
            "%-15s : %2d/%2d services (%3d%%) %s\n",
            $cat['category_name'],
            $cat['with_image'],
            $cat['total_services'],
            $percentage,
            $status
        );
    }

    echo "\n";

    // Liste des services sans image (si applicable)
    if ($stats['without_image'] > 0) {
        echo "⚠️  SERVICES SANS IMAGE\n";
        echo "═══════════════════════════════════════════════════════════\n\n";

        $stmt = $pdo->query("
            SELECT s.id, s.name, c.name as category_name
            FROM services s
            JOIN categories c ON s.category_id = c.id
            WHERE s.image IS NULL OR s.image = ''
            ORDER BY c.name, s.name
        ");

        while ($row = $stmt->fetch()) {
            echo "   [{$row['id']}] {$row['name']} ({$row['category_name']})\n";
        }

        echo "\n";
    }

    // Vérifier la validité des URLs
    echo "🌐 VALIDATION DES URLs\n";
    echo "═══════════════════════════════════════════════════════════\n\n";

    $stmt = $pdo->query("
        SELECT COUNT(*) as count
        FROM services
        WHERE image LIKE 'https://images.unsplash.com/%'
    ");
    $unsplashCount = $stmt->fetch()['count'];

    $stmt = $pdo->query("
        SELECT COUNT(*) as count
        FROM services
        WHERE image IS NOT NULL AND image != '' AND image NOT LIKE 'https://images.unsplash.com/%'
    ");
    $otherCount = $stmt->fetch()['count'];

    echo "Images Unsplash         : $unsplashCount ✅\n";
    echo "Autres sources          : $otherCount " . ($otherCount > 0 ? 'ℹ️' : '✅') . "\n";
    echo "\n";

    // Exemples d'images par catégorie
    echo "🎨 EXEMPLES D'IMAGES (par catégorie)\n";
    echo "═══════════════════════════════════════════════════════════\n\n";

    $stmt = $pdo->query("
        SELECT DISTINCT c.name as category_name, s.name as service_name, s.image
        FROM services s
        JOIN categories c ON s.category_id = c.id
        WHERE c.parent_id IS NULL AND s.image IS NOT NULL AND s.image != ''
        GROUP BY c.id
        ORDER BY c.display_order
    ");

    while ($row = $stmt->fetch()) {
        echo "📦 {$row['category_name']}\n";
        echo "   Service : {$row['service_name']}\n";
        echo "   Image   : {$row['image']}\n\n";
    }

    echo "╔════════════════════════════════════════════════════════════╗\n";
    echo "║  ✅ VÉRIFICATION TERMINÉE                                  ║\n";
    echo "╚════════════════════════════════════════════════════════════╝\n";
    echo "\n";

} catch (Exception $e) {
    echo "\n❌ ERREUR: " . $e->getMessage() . "\n\n";
    exit(1);
}
