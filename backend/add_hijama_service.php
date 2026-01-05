<?php
/**
 * Script pour ajouter le service Hijama
 */

require_once __DIR__ . '/app/core/Database.php';

use App\Core\Database;

try {
    $pdo = Database::getInstance();

    echo "Ajout du service Hijama...\n";

    // Trouver la categorie Bien-etre
    $stmt = $pdo->query("SELECT id, name FROM categories WHERE name LIKE '%Bien%' OR slug LIKE '%bien%' OR name LIKE '%Wellness%'");
    $category = $stmt->fetch();

    if (!$category) {
        echo "Categorie Bien-etre non trouvee, recherche de toutes les categories:\n";
        $stmt = $pdo->query("SELECT id, name, slug FROM categories");
        $categories = $stmt->fetchAll();
        foreach ($categories as $cat) {
            echo "- [{$cat['id']}] {$cat['name']} ({$cat['slug']})\n";
        }
        exit(1);
    }

    echo "Categorie trouvee: [{$category['id']}] {$category['name']}\n";

    // Verifier si le service existe deja
    $stmt = $pdo->prepare("SELECT id FROM services WHERE slug = ? OR name = ?");
    $stmt->execute(['hijama', 'Hijama']);
    $existing = $stmt->fetch();

    if ($existing) {
        echo "Service Hijama existe deja (ID: {$existing['id']}), mise a jour de l'image...\n";
        $stmt = $pdo->prepare("UPDATE services SET image = ? WHERE id = ?");
        $stmt->execute(['/images/services/hijama.jpg', $existing['id']]);
    } else {
        // Ajouter le service Hijama - colonnes minimales
        $stmt = $pdo->prepare("
            INSERT INTO services (name, slug, description, category_id, price, duration_minutes, image)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            'Hijama',
            'hijama',
            'Seance de Hijama (cupping therapy) traditionnelle. Technique ancestrale de ventouses pour detoxifier le corps et ameliorer la circulation sanguine.',
            $category['id'],
            300, // Prix en MAD - prix normal Marrakech
            60,  // Duree en minutes
            '/images/services/hijama.jpg'
        ]);
        echo "Service Hijama ajoute avec succes! ID: " . $pdo->lastInsertId() . "\n";
    }

    // Verification
    echo "\nVerification:\n";
    $stmt = $pdo->query("SELECT id, name, slug, price, duration_minutes, image FROM services WHERE slug = 'hijama' OR name = 'Hijama'");
    $service = $stmt->fetch();
    if ($service) {
        echo "- [{$service['id']}] {$service['name']} - {$service['price']} MAD - {$service['duration_minutes']} min\n";
        echo "  Image: {$service['image']}\n";
    }

    echo "\nTermine!\n";

} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
    exit(1);
}
