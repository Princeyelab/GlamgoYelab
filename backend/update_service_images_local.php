<?php
/**
 * Script de mise à jour des images de services
 * Utilise les images locales dans /images/services/
 *
 * Usage: php update_service_images_local.php
 */

$config = require __DIR__ . '/config/config.php';
$dbConfig = $config['database'];

// Mapping des services vers leurs images locales
// Format: 'slug-exact' => 'chemin-image'
$serviceImageMappings = [
    // Coiffure Homme
    'coiffure-homme-simple' => '/images/services/coiffure-homme-simple.jpg',
    'coiffure-homme-premium' => '/images/services/coiffure-homme-premium.jpg',
    'coiffure-express' => '/images/services/coiffure-express.jpg',
    'coiffure-mariage' => '/images/services/coiffure-mariage-evenement.jpg',
    'coiffure-classique' => '/images/services/coiffure-homme-simple.jpg',

    // Barbe
    'taille-barbe' => '/images/services/taille-barbe.jpg',
    'taille-barbe-homme' => '/images/services/taille-barbe.jpg',
    'pack-coiffure-barbe' => '/images/services/pack-coiffure-barbe.jpg',
    'pack-coiffure-barbe-homme' => '/images/services/pack-coiffure-barbe.jpg',

    // Auto - slugs réels
    'auto-nettoyage-complet' => '/images/services/lavage-complet.jpg',
    'auto-nettoyage-externe' => '/images/services/lavage-exterieur.jpg',
    'auto-nettoyage-interne' => '/images/services/lavage-complet.jpg',

    // Ménage
    'menage' => '/images/services/menage.jpg',

    // Jardinage
    'jardinage' => '/images/services/jardinage.jpg',

    // Bricolage
    'petits-bricolages' => '/images/services/bricolage.jpg',
    'bricolage' => '/images/services/bricolage.jpg',

    // Sport
    'coach-sportif' => '/images/services/coach-sportif.jpg',
    'yoga' => '/images/services/coach-sportif.jpg',

    // Danse
    'danse-orientale' => '/images/services/danse-orientale.jpg',
    'danse-salon' => '/images/services/danse-orientale.jpg',

    // Hammam & Spa
    'hammam-gommage' => '/images/services/hammam-gommage.jpg',
    'soin-argan' => '/images/services/hammam-gommage.jpg',
    'massage-relaxant' => '/images/services/hammam-gommage.jpg',

    // Chef - slugs réels
    'chef-2-personnes' => '/images/services/chef-domicile-8-personnes.jpg',
    'chef-4-personnes' => '/images/services/chef-domicile-8-personnes.jpg',
    'chef-8-personnes' => '/images/services/chef-domicile-8-personnes.jpg',

    // Animaux
    'promenade-animaux' => '/images/services/coach-sportif.jpg',
    'gardiennage-animaux' => '/images/services/coach-sportif.jpg',
];

try {
    $pdo = new PDO(
        "mysql:host=" . $dbConfig['host'] . ";dbname=" . $dbConfig['name'] . ";charset=" . $dbConfig['charset'],
        $dbConfig['user'],
        $dbConfig['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    echo "=== Mise à jour des images de services ===\n\n";

    // Récupérer tous les services
    $stmt = $pdo->query("SELECT id, name, slug, image FROM services ORDER BY id");
    $services = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Services trouvés: " . count($services) . "\n\n";

    $updateStmt = $pdo->prepare("UPDATE services SET image = ? WHERE id = ?");
    $updated = 0;
    $skipped = 0;

    foreach ($services as $service) {
        $serviceSlug = $service['slug'] ?? '';
        $serviceName = strtolower($service['name'] ?? '');
        $currentImage = $service['image'] ?? '';

        // Chercher une correspondance
        $newImage = null;

        // D'abord chercher par slug exact
        if (isset($serviceImageMappings[$serviceSlug])) {
            $newImage = $serviceImageMappings[$serviceSlug];
        }

        if ($newImage && $newImage !== $currentImage) {
            $updateStmt->execute([$newImage, $service['id']]);
            echo "✅ [{$service['id']}] {$service['name']} → {$newImage}\n";
            $updated++;
        } else if ($newImage) {
            echo "⏭️  [{$service['id']}] {$service['name']} (déjà à jour)\n";
            $skipped++;
        } else {
            echo "⚠️  [{$service['id']}] {$service['name']} - Pas de correspondance trouvée (slug: {$serviceSlug})\n";
        }
    }

    echo "\n=== Résumé ===\n";
    echo "Services mis à jour: $updated\n";
    echo "Services déjà à jour: $skipped\n";
    echo "Total traités: " . count($services) . "\n";

} catch (PDOException $e) {
    echo "Erreur de base de données: " . $e->getMessage() . "\n";
    exit(1);
}
