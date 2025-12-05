<?php
header('Content-Type: text/html; charset=utf-8');

$host = getenv('DB_HOST') ?: 'mysql-db';
$dbname = getenv('DB_NAME') ?: 'glamgo';
$user = getenv('DB_USER') ?: 'glamgo_user';
$pass = getenv('DB_PASSWORD') ?: 'glamgo_password';

try {
    $db = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Erreur de connexion: " . $e->getMessage());
}

echo "<pre>";
echo "==============================================\n";
echo "  Ajout des services de danse - GlamGo\n";
echo "==============================================\n\n";

try {
    $stmt = $db->query("SELECT id FROM categories WHERE slug = 'danse'");
    $danceCategory = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$danceCategory) {
        echo "📁 Création de la catégorie 'Danse'...\n";
        $stmt = $db->prepare(
            "INSERT INTO categories (name, slug, description, icon, parent_id, display_order)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute(['Danse', 'danse', 'Cours de danse à domicile', 'dance.svg', 1, 5]);
        $danceCategoryId = $db->lastInsertId();
        echo "✅ Catégorie 'Danse' créée avec l'ID: $danceCategoryId\n\n";
    } else {
        $danceCategoryId = $danceCategory['id'];
        echo "ℹ️  Catégorie 'Danse' existe déjà avec l'ID: $danceCategoryId\n\n";
    }

    $stmt = $db->query("SELECT slug FROM services WHERE slug IN ('danse-orientale', 'danse-salon')");
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

    $stmt = $db->prepare(
        "INSERT INTO services (category_id, name, slug, description, price, duration_minutes, image)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    );

    $added = 0;
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

        $added++;
        echo "✅ Service '{$service['name']}' ajouté avec succès\n";
        echo "   - Prix: {$service['price']} MAD\n";
        echo "   - Durée: {$service['duration_minutes']} minutes\n";
        echo "   - Image: {$service['image']}\n\n";
    }

    echo "\n🎉 Terminé ! $added service(s) ajouté(s)\n\n";
    echo "📊 Résumé:\n";
    $stmt = $db->query("SELECT COUNT(*) FROM services WHERE category_id = $danceCategoryId");
    $count = $stmt->fetchColumn();
    echo "   - $count services de danse dans la base de données\n";

    $stmt = $db->query(
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

    echo "\n✅ Vous pouvez maintenant voir ces services sur le frontend !\n";
    echo "🔗 http://localhost:3000\n";

} catch (PDOException $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
}

echo "</pre>";
