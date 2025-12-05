<?php

/**
 * Script pour corriger les doublons d'images
 */

mb_internal_encoding('UTF-8');
mb_http_output('UTF-8');

echo "\n";
echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║  Correction des Doublons d'Images                         ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n";
echo "\n";

$host = getenv('DB_HOST') ?: 'glamgo-mysql';
$dbname = getenv('DB_NAME') ?: 'glamgo';
$username = getenv('DB_USER') ?: 'glamgo_user';
$password = getenv('DB_PASSWORD') ?: 'glamgo_password';

// Images de remplacement pour les doublons
$replacements = [
    // Combo coupe + barbe - nouvelle image unique
    'combo-coupe-barbe' => 'https://images.unsplash.com/photo-1621607003950-2dee0c94129f?w=800&h=600&fit=crop',

    // Coupe Homme - garder l'originale, pas de changement nécessaire
    // 'coupe-homme' => 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=600&fit=crop',

    // Manucure homme - nouvelle image unique
    'manucure-homme' => 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=800&h=600&fit=crop',

    // Coloration cheveux courts - garder l'originale
    // 'coloration-cheveux-courts' => 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=600&fit=crop',

    // Coupe cheveux longs - garder l'originale
    // 'coupe-cheveux-longs' => 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=600&fit=crop',

    // Coupe Femme - nouvelle image unique
    'coupe-femme' => 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=800&h=600&fit=crop',

    // Brushing - garder l'originale
    // 'brushing' => 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&h=600&fit=crop',

    // Coupe tendance homme - nouvelle image unique
    'coupe-tendance-homme' => 'https://images.unsplash.com/photo-1620207483612-c6f0732e3d83?w=800&h=600&fit=crop',

    // Nettoyage de printemps - garder l'originale
    // 'nettoyage-printemps' => 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=800&h=600&fit=crop',

    // Nettoyage villa - nouvelle image unique
    'nettoyage-villa' => 'https://images.unsplash.com/photo-1600320254374-ce2d293c324e?w=800&h=600&fit=crop',
];

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

    echo "🔧 Application des corrections...\n\n";

    $stmt = $pdo->prepare("UPDATE services SET image = ? WHERE slug = ?");
    $updated = 0;

    foreach ($replacements as $slug => $newImage) {
        // Vérifier que le service existe
        $checkStmt = $pdo->prepare("SELECT id, name FROM services WHERE slug = ?");
        $checkStmt->execute([$slug]);
        $service = $checkStmt->fetch();

        if ($service) {
            $stmt->execute([$newImage, $slug]);
            echo "   ✅ {$service['name']}\n";
            echo "      🔗 {$newImage}\n";
            $updated++;
        }
    }

    echo "\n";
    echo "╔════════════════════════════════════════════════════════════╗\n";
    echo "║  ✅ CORRECTION TERMINÉE                                    ║\n";
    echo "╚════════════════════════════════════════════════════════════╝\n";
    echo "\n";
    echo "📊 Services mis à jour : $updated\n";
    echo "\n";

    // Vérifier les doublons restants
    echo "🔍 Vérification des doublons restants...\n\n";

    $stmt = $pdo->query("
        SELECT image, COUNT(*) as count, GROUP_CONCAT(name SEPARATOR ', ') as services
        FROM services
        WHERE image IS NOT NULL AND image != ''
        GROUP BY image
        HAVING count > 1
    ");

    $duplicates = $stmt->fetchAll();

    if (count($duplicates) > 0) {
        echo "⚠️  DOUBLONS RESTANTS :\n\n";
        foreach ($duplicates as $dup) {
            echo "   Utilisée par {$dup['count']} services : {$dup['services']}\n";
        }
    } else {
        echo "✅ Aucun doublon - Toutes les images sont uniques!\n";
    }

    echo "\n";

} catch (Exception $e) {
    echo "\n❌ ERREUR: " . $e->getMessage() . "\n\n";
    exit(1);
}
