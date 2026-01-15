<?php
/**
 * Script pour corriger les modificateurs de formules
 * Phase 3A - Aligner Web sur Mobile
 */

require_once __DIR__ . '/app/core/Database.php';

use App\Core\Database;

try {
    $pdo = Database::getInstance();

    echo "=== Correction des modificateurs de formules ===\n\n";

    // Afficher l'état actuel
    echo "État AVANT correction :\n";
    $stmt = $pdo->query("
        SELECT formula_type, price_modifier_type, price_modifier_value, COUNT(*) as nb_services
        FROM service_formulas
        WHERE formula_type IN ('premium', 'urgent', 'night')
        GROUP BY formula_type, price_modifier_type, price_modifier_value
        ORDER BY formula_type
    ");
    $before = $stmt->fetchAll();
    foreach ($before as $row) {
        echo "  - {$row['formula_type']}: {$row['price_modifier_value']} {$row['price_modifier_type']} ({$row['nb_services']} services)\n";
    }

    echo "\nApplication des corrections...\n";

    // Urgent : +50 MAD fixe → +50%
    $stmt = $pdo->prepare("
        UPDATE service_formulas
        SET
            price_modifier_type = 'percentage',
            price_modifier_value = 50,
            description = 'Intervention urgente en moins de 2 heures (+50%)',
            updated_at = CURRENT_TIMESTAMP
        WHERE formula_type = 'urgent'
    ");
    $stmt->execute();
    $urgentUpdated = $stmt->rowCount();
    echo "  ✓ Urgent: {$urgentUpdated} services mis à jour (fixe → +50%)\n";

    // Nuit : +30 MAD fixe → +25%
    $stmt = $pdo->prepare("
        UPDATE service_formulas
        SET
            price_modifier_type = 'percentage',
            price_modifier_value = 25,
            description = 'Intervention de nuit (22h - 6h) (+25%)',
            updated_at = CURRENT_TIMESTAMP
        WHERE formula_type = 'night'
    ");
    $stmt->execute();
    $nightUpdated = $stmt->rowCount();
    echo "  ✓ Nuit: {$nightUpdated} services mis à jour (fixe → +25%)\n";

    // Afficher l'état final
    echo "\nÉtat APRÈS correction :\n";
    $stmt = $pdo->query("
        SELECT formula_type, price_modifier_type, price_modifier_value, COUNT(*) as nb_services
        FROM service_formulas
        WHERE formula_type IN ('premium', 'urgent', 'night')
        GROUP BY formula_type, price_modifier_type, price_modifier_value
        ORDER BY formula_type
    ");
    $after = $stmt->fetchAll();
    foreach ($after as $row) {
        echo "  - {$row['formula_type']}: {$row['price_modifier_value']} {$row['price_modifier_type']} ({$row['nb_services']} services)\n";
    }

    echo "\n=== Correction terminée avec succès! ===\n";

} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
    exit(1);
}
