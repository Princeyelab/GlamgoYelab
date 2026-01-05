<?php
/**
 * Script pour mettre a jour le service Chef a domicile
 * Logique: prix par personne avec minimum 2 personnes
 */

require_once __DIR__ . '/app/core/Database.php';

use App\Core\Database;

try {
    $pdo = Database::getInstance();

    echo "=== Mise a jour service Chef a domicile ===\n\n";

    // D'abord, executer la migration pour ajouter les colonnes
    echo "1. Ajout des colonnes si necessaire...\n";

    $migrations = [
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS number_of_guests INTEGER DEFAULT NULL",
        "ALTER TABLE services ADD COLUMN IF NOT EXISTS service_type VARCHAR(50) DEFAULT 'standard'",
        "ALTER TABLE services ADD COLUMN IF NOT EXISTS price_per_person DECIMAL(10,2) DEFAULT NULL",
        "ALTER TABLE services ADD COLUMN IF NOT EXISTS min_guests INTEGER DEFAULT NULL",
        "ALTER TABLE services ADD COLUMN IF NOT EXISTS max_guests INTEGER DEFAULT NULL",
    ];

    foreach ($migrations as $sql) {
        try {
            $pdo->exec($sql);
            echo "   OK: " . substr($sql, 0, 60) . "...\n";
        } catch (Exception $e) {
            // Column might already exist
            echo "   Skip: " . substr($sql, 0, 60) . "...\n";
        }
    }

    echo "\n2. Recherche des services chef existants...\n";

    // Trouver les services chef existants
    $stmt = $pdo->query("
        SELECT id, name, slug, price
        FROM services
        WHERE name LIKE '%Chef%' OR slug LIKE '%chef%'
        ORDER BY id
    ");
    $existingChefs = $stmt->fetchAll();

    foreach ($existingChefs as $chef) {
        echo "   - [{$chef['id']}] {$chef['name']} ({$chef['slug']}) - {$chef['price']} MAD\n";
    }

    // Trouver la categorie Maison
    $stmt = $pdo->query("SELECT id, name FROM categories WHERE slug = 'maison' OR name LIKE '%Maison%' LIMIT 1");
    $category = $stmt->fetch();

    if (!$category) {
        echo "\n   Categorie Maison non trouvee, utilisation de la premiere categorie...\n";
        $stmt = $pdo->query("SELECT id, name FROM categories ORDER BY id LIMIT 1");
        $category = $stmt->fetch();
    }

    echo "\n   Categorie: [{$category['id']}] {$category['name']}\n";

    echo "\n3. Mise a jour/creation du service Chef a domicile...\n";

    // Chercher si un service "Chef a domicile" unique existe deja
    $stmt = $pdo->prepare("SELECT id FROM services WHERE slug = 'chef-domicile' OR name = 'Chef a domicile' LIMIT 1");
    $stmt->execute();
    $existingService = $stmt->fetch();

    if ($existingService) {
        // Mettre a jour le service existant
        echo "   Service existant trouve (ID: {$existingService['id']}), mise a jour...\n";

        $stmt = $pdo->prepare("
            UPDATE services SET
                name = 'Chef a domicile',
                slug = 'chef-domicile',
                description = 'Chef professionnel prepare vos repas a domicile. Menu personnalise selon vos gouts. A partir de 2 personnes.',
                price = 500,
                service_type = 'chef',
                price_per_person = 250,
                min_guests = 2,
                max_guests = 12,
                duration_minutes = 120,
                image = '/images/services/chef-domicile.jpg'
            WHERE id = ?
        ");
        $stmt->execute([$existingService['id']]);
        $chefServiceId = $existingService['id'];

    } else {
        // Creer un nouveau service
        echo "   Creation d'un nouveau service Chef a domicile...\n";

        $stmt = $pdo->prepare("
            INSERT INTO services (name, slug, description, category_id, price, service_type, price_per_person, min_guests, max_guests, duration_minutes, image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            'Chef a domicile',
            'chef-domicile',
            'Chef professionnel prepare vos repas a domicile. Menu personnalise selon vos gouts. A partir de 2 personnes.',
            $category['id'],
            500, // Prix affiche = 2 personnes x 250
            'chef',
            250, // Prix par personne
            2,   // Minimum
            12,  // Maximum
            120,
            '/images/services/chef-domicile.jpg'
        ]);
        $chefServiceId = $pdo->lastInsertId();
    }

    echo "   Service Chef a domicile configure (ID: {$chefServiceId})\n";

    // Optionnel: Desactiver les anciens services chef (2p, 4p, 8p)
    echo "\n4. Desactivation des anciens services chef...\n";

    $stmt = $pdo->prepare("
        UPDATE services SET is_active = FALSE
        WHERE (slug LIKE 'chef-domicile-%' OR name LIKE 'Chef % personnes')
        AND id != ?
    ");
    $stmt->execute([$chefServiceId]);
    $deactivated = $stmt->rowCount();
    echo "   {$deactivated} ancien(s) service(s) desactive(s)\n";

    // Verification finale
    echo "\n=== Verification finale ===\n";
    $stmt = $pdo->prepare("
        SELECT id, name, slug, price, service_type, price_per_person, min_guests, max_guests
        FROM services
        WHERE id = ?
    ");
    $stmt->execute([$chefServiceId]);
    $result = $stmt->fetch();

    echo "\n   ID: {$result['id']}\n";
    echo "   Nom: {$result['name']}\n";
    echo "   Slug: {$result['slug']}\n";
    echo "   Prix affiche: {$result['price']} MAD\n";
    echo "   Type: {$result['service_type']}\n";
    echo "   Prix/personne: {$result['price_per_person']} MAD\n";
    echo "   Min personnes: {$result['min_guests']}\n";
    echo "   Max personnes: {$result['max_guests']}\n";

    echo "\n=== Termine avec succes! ===\n";
    echo "\nLogique tarifaire:\n";
    echo "   2 personnes = 500 MAD\n";
    echo "   4 personnes = 1000 MAD\n";
    echo "   6 personnes = 1500 MAD\n";
    echo "   8 personnes = 2000 MAD\n";
    echo "   10 personnes = 2500 MAD\n";
    echo "   12 personnes = 3000 MAD\n";

} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
    exit(1);
}
