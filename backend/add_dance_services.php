<?php
/**
 * Script pour ajouter les services de danse
 */

$host = 'localhost';
$db = 'glamgo_db';
$user = 'root';
$pass = 'root';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "✅ Connexion à la base de données réussie\n\n";

    // Vérifier si la catégorie Danse existe déjà
    $stmt = $pdo->query("SELECT id FROM categories WHERE slug = 'danse'");
    $danceCategory = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$danceCategory) {
        // Créer la catégorie Danse
        echo "📁 Création de la catégorie 'Danse'...\n";
        $stmt = $pdo->prepare(
            "INSERT INTO categories (name, slug, description, icon, parent_id, display_order)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute(['Danse', 'danse', 'Cours de danse à domicile', 'dance.svg', 1, 5]);
        $danceCategoryId = $pdo->lastInsertId();
        echo "✅ Catégorie 'Danse' créée avec l'ID: $danceCategoryId\n\n";
    } else {
        $danceCategoryId = $danceCategory['id'];
        echo "ℹ️  Catégorie 'Danse' existe déjà avec l'ID: $danceCategoryId\n\n";
    }

    // Vérifier si les services existent déjà
    $stmt = $pdo->query("SELECT slug FROM services WHERE slug IN ('danse-orientale', 'danse-salon')");
    $existingServices = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $services = [
        [
            'category_id' => $danceCategoryId,
            'name' => 'Danse Orientale',
            'slug' => 'danse-orientale',
            'description' => 'Cours de danse orientale à domicile - Apprenez les mouvements gracieux et élégants de la danse du ventre avec un professeur expérimenté',
            'price' => 200.00,
            'duration_minutes' => 60,
            'image' => 'danse-orientale.svg'
        ],
        [
            'category_id' => $danceCategoryId,
            'name' => 'Danse de Salon',
            'slug' => 'danse-salon',
            'description' => 'Cours de danse de salon à domicile - Valse, tango, cha-cha-cha, apprenez les danses de couple classiques',
            'price' => 250.00,
            'duration_minutes' => 60,
            'image' => 'danse-salon.svg'
        ]
    ];

    echo "💃 Ajout des services de danse...\n\n";

    $stmt = $pdo->prepare(
        "INSERT INTO services (category_id, name, slug, description, price, duration_minutes, image)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    );

    foreach ($services as $service) {
        if (in_array($service['slug'], $existingServices)) {
            echo "⚠️  Service '{$service['name']}' existe déjà\n";
            continue;
        }

        $stmt->execute([
            $service['category_id'],
            $service['name'],
            $service['slug'],
            $service['description'],
            $service['price'],
            $service['duration_minutes'],
            $service['image']
        ]);

        echo "✅ Service '{$service['name']}' ajouté avec succès\n";
        echo "   - Prix: {$service['price']} MAD\n";
        echo "   - Durée: {$service['duration_minutes']} minutes\n";
        echo "   - Image: {$service['image']}\n\n";
    }

    // Afficher le résumé
    echo "\n🎉 Terminé !\n\n";
    echo "📊 Résumé:\n";
    $stmt = $pdo->query("SELECT COUNT(*) FROM services WHERE category_id = $danceCategoryId");
    $count = $stmt->fetchColumn();
    echo "   - $count services de danse dans la base de données\n";

    // Afficher les services
    $stmt = $pdo->query(
        "SELECT id, name, price, duration_minutes
         FROM services
         WHERE category_id = $danceCategoryId
         ORDER BY id ASC"
    );
    $danceServices = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "\n📝 Services de danse disponibles:\n";
    foreach ($danceServices as $service) {
        echo "   - [{$service['id']}] {$service['name']} - {$service['price']} MAD ({$service['duration_minutes']} min)\n";
    }

} catch (PDOException $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    exit(1);
}
