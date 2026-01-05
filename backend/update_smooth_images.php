<?php
/**
 * Script pour mettre a jour les images des services Smooth
 */

require_once __DIR__ . '/app/core/Database.php';

use App\Core\Database;

try {
    $pdo = Database::getInstance();

    echo "Mise a jour des images Smooth...\n";

    // Smooth Femme
    $stmt = $pdo->prepare("UPDATE services SET image = ? WHERE slug = ? OR name = ?");
    $stmt->execute(['/images/services/smooth-femme.jpg', 'smooth-femme', 'Smooth Femme']);
    echo "Smooth Femme: " . $stmt->rowCount() . " ligne(s) modifiee(s)\n";

    // Full Smooth Femme
    $stmt = $pdo->prepare("UPDATE services SET image = ? WHERE slug = ? OR name LIKE ? OR name = ?");
    $stmt->execute(['/images/services/smooth-femme-full.jpg', 'smooth-femme-full', '%Full Smooth Femme%', 'Smooth Femme Full']);
    echo "Full Smooth Femme: " . $stmt->rowCount() . " ligne(s) modifiee(s)\n";

    // Smooth Homme
    $stmt = $pdo->prepare("UPDATE services SET image = ? WHERE slug = ? OR name = ?");
    $stmt->execute(['/images/services/smooth-homme.jpg', 'smooth-homme', 'Smooth Homme']);
    echo "Smooth Homme: " . $stmt->rowCount() . " ligne(s) modifiee(s)\n";

    // Full Smooth Homme
    $stmt = $pdo->prepare("UPDATE services SET image = ? WHERE slug = ? OR name LIKE ? OR name = ?");
    $stmt->execute(['/images/services/smooth-homme-full.jpg', 'smooth-homme-full', '%Full Smooth Homme%', 'Smooth Homme Full']);
    echo "Full Smooth Homme: " . $stmt->rowCount() . " ligne(s) modifiee(s)\n";

    // Verification
    echo "\nVerification:\n";
    $stmt = $pdo->query("SELECT id, name, slug, image FROM services WHERE name LIKE '%Smooth%' OR slug LIKE '%smooth%'");
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($results as $row) {
        echo "- [{$row['id']}] {$row['name']} ({$row['slug']}): {$row['image']}\n";
    }

    echo "\nTermine!\n";

} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
    exit(1);
}
