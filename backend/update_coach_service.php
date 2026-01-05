<?php
/**
 * Script pour configurer le service Coach Sportif avec packs
 * Packs: Decouverte (4 seances), Classique (8 seances), Intensif (12 seances)
 */

require_once __DIR__ . '/app/core/Database.php';

use App\Core\Database;

try {
    $pdo = Database::getInstance();

    echo "=== Configuration service Coach Sportif ===\n\n";

    // D'abord, executer les migrations pour ajouter les colonnes
    echo "1. Ajout des colonnes pack si necessaire...\n";

    $migrations = [
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS pack_id VARCHAR(50) DEFAULT NULL",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS pack_name VARCHAR(100) DEFAULT NULL",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS pack_sessions INTEGER DEFAULT NULL",
        "ALTER TABLE services ADD COLUMN IF NOT EXISTS packs JSONB DEFAULT NULL",
    ];

    foreach ($migrations as $sql) {
        try {
            $pdo->exec($sql);
            echo "   OK: " . substr($sql, 0, 60) . "...\n";
        } catch (Exception $e) {
            echo "   Skip: " . substr($sql, 0, 60) . "...\n";
        }
    }

    // Packs de seances
    $packs = json_encode([
        ['id' => 'decouverte', 'name' => 'Decouverte', 'sessions' => 4, 'price' => 700, 'pricePerSession' => 175],
        ['id' => 'classique', 'name' => 'Classique', 'sessions' => 8, 'price' => 1200, 'pricePerSession' => 150, 'discount' => 17, 'popular' => true],
        ['id' => 'intensif', 'name' => 'Intensif', 'sessions' => 12, 'price' => 1500, 'pricePerSession' => 125, 'discount' => 29],
    ]);

    echo "\n2. Recherche du service Coach Sportif existant...\n";

    // Chercher le service coach existant
    $stmt = $pdo->query("
        SELECT id, name, slug, price
        FROM services
        WHERE name LIKE '%Coach%' OR slug LIKE '%coach%'
        ORDER BY id
    ");
    $existingCoach = $stmt->fetchAll();

    foreach ($existingCoach as $coach) {
        echo "   - [{$coach['id']}] {$coach['name']} ({$coach['slug']}) - {$coach['price']} MAD\n";
    }

    // Trouver la categorie Bien-etre
    $stmt = $pdo->query("SELECT id, name FROM categories WHERE name LIKE '%Bien%' OR slug LIKE '%bien%' OR slug LIKE '%wellness%' LIMIT 1");
    $category = $stmt->fetch();

    if (!$category) {
        echo "\n   Categorie Bien-etre non trouvee, utilisation de la premiere categorie...\n";
        $stmt = $pdo->query("SELECT id, name FROM categories ORDER BY id LIMIT 1");
        $category = $stmt->fetch();
    }

    echo "\n   Categorie: [{$category['id']}] {$category['name']}\n";

    echo "\n3. Mise a jour/creation du service Coach Sportif...\n";

    // Chercher si le service existe deja
    $stmt = $pdo->prepare("SELECT id FROM services WHERE slug = 'coach-sportif' OR name LIKE '%Coach Sportif%' LIMIT 1");
    $stmt->execute();
    $existingService = $stmt->fetch();

    if ($existingService) {
        // Mettre a jour le service existant
        echo "   Service existant trouve (ID: {$existingService['id']}), mise a jour...\n";

        $stmt = $pdo->prepare("
            UPDATE services SET
                name = 'Coach Sportif',
                slug = 'coach-sportif',
                description = 'Entrainement personnalise selon vos objectifs : perte de poids, musculation ou remise en forme. Minimum 4 seances pour un suivi efficace.',
                price = 700,
                service_type = 'coach',
                packs = ?,
                duration_minutes = 60,
                image = '/images/services/coach-sportif.jpg'
            WHERE id = ?
        ");
        $stmt->execute([$packs, $existingService['id']]);
        $coachServiceId = $existingService['id'];

    } else {
        // Creer un nouveau service
        echo "   Creation d'un nouveau service Coach Sportif...\n";

        $stmt = $pdo->prepare("
            INSERT INTO services (name, slug, description, category_id, price, service_type, packs, duration_minutes, image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            'Coach Sportif',
            'coach-sportif',
            'Entrainement personnalise selon vos objectifs : perte de poids, musculation ou remise en forme. Minimum 4 seances pour un suivi efficace.',
            $category['id'],
            700, // Prix du pack minimum (Decouverte)
            'coach',
            $packs,
            60,
            '/images/services/coach-sportif.jpg'
        ]);
        $coachServiceId = $pdo->lastInsertId();
    }

    echo "   Service Coach Sportif configure (ID: {$coachServiceId})\n";

    // Verification finale
    echo "\n=== Verification finale ===\n";
    $stmt = $pdo->prepare("
        SELECT id, name, slug, price, service_type, packs
        FROM services
        WHERE id = ?
    ");
    $stmt->execute([$coachServiceId]);
    $result = $stmt->fetch();

    echo "\n   ID: {$result['id']}\n";
    echo "   Nom: {$result['name']}\n";
    echo "   Slug: {$result['slug']}\n";
    echo "   Prix affiche: {$result['price']} MAD\n";
    echo "   Type: {$result['service_type']}\n";
    echo "   Packs: " . ($result['packs'] ? 'OK' : 'Non definis') . "\n";

    echo "\n=== Termine avec succes! ===\n";
    echo "\nPacks disponibles:\n";
    echo "   Pack Decouverte  : 4 seances  - 700 MAD  (175 DH/seance)\n";
    echo "   Pack Classique   : 8 seances  - 1200 MAD (150 DH/seance) -17%\n";
    echo "   Pack Intensif    : 12 seances - 1500 MAD (125 DH/seance) -29%\n";

} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
    exit(1);
}
