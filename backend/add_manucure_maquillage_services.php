<?php
/**
 * Script pour ajouter les services Manucure et Maquillage
 */

require_once __DIR__ . '/app/core/Database.php';

use App\Core\Database;

try {
    $pdo = Database::getInstance();

    echo "=== Ajout des services Manucure et Maquillage ===\n\n";

    // Trouver la categorie Beaute
    $stmt = $pdo->query("SELECT id, name FROM categories WHERE name LIKE '%Beaut%' OR slug LIKE '%beaut%' OR slug LIKE '%beauty%'");
    $category = $stmt->fetch();

    if (!$category) {
        echo "Categorie Beaute non trouvee, recherche de toutes les categories:\n";
        $stmt = $pdo->query("SELECT id, name, slug FROM categories ORDER BY id");
        $categories = $stmt->fetchAll();
        foreach ($categories as $cat) {
            echo "- [{$cat['id']}] {$cat['name']} ({$cat['slug']})\n";
        }
        exit(1);
    }

    echo "Categorie trouvee: [{$category['id']}] {$category['name']}\n\n";

    // Services a ajouter
    $services = [
        [
            'name' => 'Manucure Classique',
            'slug' => 'manucure-classique',
            'description' => 'Soin complet des ongles : limage, polissage, cuticules et vernis classique. Mains douces et ongles impeccables.',
            'price' => 150,
            'duration_minutes' => 45,
            'image' => '/images/services/manucure-classique.jpg'
        ],
        [
            'name' => 'Manucure Gel / Semi-permanent',
            'slug' => 'manucure-gel',
            'description' => 'Pose de vernis gel ou semi-permanent longue tenue. Brillance et couleur jusqu\'a 3 semaines sans ecaillement.',
            'price' => 250,
            'duration_minutes' => 60,
            'image' => '/images/services/manucure-gel.jpg'
        ],
        [
            'name' => 'Maquillage Jour',
            'slug' => 'maquillage-jour',
            'description' => 'Maquillage naturel et elegant pour le quotidien ou occasion speciale. Teint frais, regard sublime et levres parfaites.',
            'price' => 300,
            'duration_minutes' => 45,
            'image' => '/images/services/maquillage-jour.jpg'
        ],
        [
            'name' => 'Maquillage Mariage',
            'slug' => 'maquillage-mariage',
            'description' => 'Maquillage de mariee professionnel avec essai inclus. Look personnalise pour votre grand jour, tenue longue duree garantie.',
            'price' => 800,
            'duration_minutes' => 90,
            'image' => '/images/services/maquillage-mariage.jpg'
        ]
    ];

    foreach ($services as $service) {
        echo "Ajout de: {$service['name']}...\n";

        // Verifier si le service existe deja
        $stmt = $pdo->prepare("SELECT id FROM services WHERE slug = ? OR name = ?");
        $stmt->execute([$service['slug'], $service['name']]);
        $existing = $stmt->fetch();

        if ($existing) {
            echo "  -> Service existe deja (ID: {$existing['id']}), mise a jour...\n";
            $stmt = $pdo->prepare("
                UPDATE services
                SET description = ?, price = ?, duration_minutes = ?, image = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $service['description'],
                $service['price'],
                $service['duration_minutes'],
                $service['image'],
                $existing['id']
            ]);
        } else {
            // Ajouter le nouveau service
            $stmt = $pdo->prepare("
                INSERT INTO services (name, slug, description, category_id, price, duration_minutes, image)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $service['name'],
                $service['slug'],
                $service['description'],
                $category['id'],
                $service['price'],
                $service['duration_minutes'],
                $service['image']
            ]);
            echo "  -> Service ajoute avec succes! ID: " . $pdo->lastInsertId() . "\n";
        }
    }

    // Verification finale
    echo "\n=== Verification des services ajoutes ===\n";
    $stmt = $pdo->query("
        SELECT id, name, slug, price, duration_minutes, image
        FROM services
        WHERE slug IN ('manucure-classique', 'manucure-gel', 'maquillage-jour', 'maquillage-mariage')
        ORDER BY id
    ");
    $results = $stmt->fetchAll();

    foreach ($results as $s) {
        echo "- [{$s['id']}] {$s['name']} - {$s['price']} MAD - {$s['duration_minutes']} min\n";
        echo "  Image: {$s['image']}\n";
    }

    echo "\n=== Termine avec succes! ===\n";

} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
    exit(1);
}
