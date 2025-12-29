<?php
/**
 * Script pour ajouter les nouveaux services d'épilation
 */

// Autoloader simple
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $baseDir = __DIR__ . '/app/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    $relativeClass = substr($class, $len);
    $parts = explode('\\', $relativeClass);
    $className = array_pop($parts);
    $path = '';
    if (!empty($parts)) {
        $path = strtolower(implode('/', $parts)) . '/';
    }
    $file = $baseDir . $path . $className . '.php';
    if (file_exists($file)) {
        require $file;
    }
});

use App\Core\Database;

try {
    $db = Database::getInstance();

    // D'abord, récupérer l'ID de la catégorie parente "Beauté"
    $stmt = $db->query("SELECT id FROM categories WHERE slug = 'beaute'");
    $beaute = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$beaute) {
        echo "Erreur: Catégorie Beauté non trouvée\n";
        exit(1);
    }

    $beauteId = $beaute['id'];
    echo "Catégorie Beauté trouvée avec ID: $beauteId\n";

    // Créer les catégories épilation si elles n'existent pas
    $categories = [];

    // Épilation Femme
    $stmt = $db->prepare("
        INSERT INTO categories (name, slug, description, icon, parent_id, is_active, display_order)
        VALUES ('Épilation Femme', 'epilation-femme', 'Épilation féminine', 'wax-woman.svg', ?, TRUE, 5)
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
    ");
    $stmt->execute([$beauteId]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $categories['epilation-femme'] = $result['id'];
    echo "✅ Catégorie Épilation Femme créée/mise à jour avec ID: {$categories['epilation-femme']}\n";

    // Épilation Homme
    $stmt = $db->prepare("
        INSERT INTO categories (name, slug, description, icon, parent_id, is_active, display_order)
        VALUES ('Épilation Homme', 'epilation-homme', 'Épilation masculine', 'wax-man.svg', ?, TRUE, 6)
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
    ");
    $stmt->execute([$beauteId]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $categories['epilation-homme'] = $result['id'];
    echo "✅ Catégorie Épilation Homme créée/mise à jour avec ID: {$categories['epilation-homme']}\n";

    // Services Épilation Femme
    $servicesFemme = [
        [
            'name' => 'Smooth Femme',
            'slug' => 'smooth-femme',
            'description' => 'Épilation simple - Zones : sourcils, lèvre, aisselles, demi-jambes, maillot simple',
            'price' => 249.00,
            'duration_minutes' => 50,
            'image' => '/images/services/epilation-femme.jpg'
        ],
        [
            'name' => 'Full Smooth Femme',
            'slug' => 'full-smooth-femme',
            'description' => 'Épilation complète - Zones : sourcils, lèvre, aisselles, bras complets, jambes complètes, maillot intégral',
            'price' => 399.00,
            'duration_minutes' => 82,
            'image' => '/images/services/epilation-femme-complete.jpg'
        ]
    ];

    // Services Épilation Homme
    $servicesHomme = [
        [
            'name' => 'Smooth Homme',
            'slug' => 'smooth-homme',
            'description' => 'Épilation simple - Zones : torse, épaules, dos, aisselles',
            'price' => 299.00,
            'duration_minutes' => 55,
            'image' => '/images/services/epilation-homme.jpg'
        ],
        [
            'name' => 'Full Smooth Homme',
            'slug' => 'full-smooth-homme',
            'description' => 'Épilation complète - Zones : torse, dos, épaules, bras complets, jambes complètes, aisselles',
            'price' => 449.00,
            'duration_minutes' => 87,
            'image' => '/images/services/epilation-homme-complete.jpg'
        ]
    ];

    // Insérer les services femme
    $insertStmt = $db->prepare("
        INSERT INTO services (category_id, name, slug, description, price, duration_minutes, image, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
        ON CONFLICT (slug) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            price = EXCLUDED.price,
            duration_minutes = EXCLUDED.duration_minutes,
            image = EXCLUDED.image
    ");

    foreach ($servicesFemme as $service) {
        $insertStmt->execute([
            $categories['epilation-femme'],
            $service['name'],
            $service['slug'],
            $service['description'],
            $service['price'],
            $service['duration_minutes'],
            $service['image']
        ]);
        echo "✅ Service ajouté: {$service['name']}\n";
    }

    foreach ($servicesHomme as $service) {
        $insertStmt->execute([
            $categories['epilation-homme'],
            $service['name'],
            $service['slug'],
            $service['description'],
            $service['price'],
            $service['duration_minutes'],
            $service['image']
        ]);
        echo "✅ Service ajouté: {$service['name']}\n";
    }

    echo "\n✅ Tous les services d'épilation ont été ajoutés avec succès!\n";

} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    exit(1);
}
