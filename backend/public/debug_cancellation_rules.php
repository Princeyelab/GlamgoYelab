<?php
/**
 * Script de debug pour les regles d'annulation
 * Usage: php debug_cancellation_rules.php ou via navigateur
 */

require_once __DIR__ . '/../app/core/config.php';
require_once __DIR__ . '/../app/core/Database.php';

use App\Core\Database;

header('Content-Type: text/plain; charset=utf-8');

try {
    $db = Database::getInstance();

    echo "=== DEBUG CANCELLATION RULES ===\n\n";

    // 1. Verifier si la table existe
    $stmt = $db->query("SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'cancellation_rules'
    )");
    $tableExists = $stmt->fetchColumn();

    echo "1. Table 'cancellation_rules' existe: " . ($tableExists ? "OUI" : "NON") . "\n\n";

    if (!$tableExists) {
        echo ">>> La table n'existe pas. Executez la migration 015_add_cancellation_disputes_system.sql\n";
        exit;
    }

    // 2. Lister toutes les regles
    echo "2. Regles existantes:\n";
    echo str_repeat("-", 100) . "\n";

    $stmt = $db->query("SELECT * FROM cancellation_rules ORDER BY status, cancelled_by");
    $rules = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($rules)) {
        echo ">>> AUCUNE REGLE TROUVEE!\n\n";

        // Inserer les regles par defaut
        echo "3. Insertion des regles par defaut...\n";

        $insertSql = "INSERT INTO cancellation_rules (status, cancelled_by, hours_before_appointment, min_fee_percentage, max_fee_percentage, provider_penalty_points, description, is_active) VALUES
            ('pending', 'client', NULL, 0, 0, 0, 'Client annule commande en attente - Gratuit', true),
            ('accepted', 'client', 2, 0, 0, 0, 'Client annule > 2h avant RDV - Gratuit', true),
            ('accepted', 'client', 0, 50, 50, 0, 'Client annule < 2h avant RDV - 50% frais', true),
            ('on_way', 'client', NULL, 50, 100, 0, 'Client annule prestataire en route - 50-100% selon distance', true),
            ('pending', 'provider', NULL, 0, 0, 1, 'Prestataire annule commande en attente - 1 point', true),
            ('accepted', 'provider', 2, 0, 0, 2, 'Prestataire annule > 2h avant - 2 points', true),
            ('accepted', 'provider', 0, 0, 0, 5, 'Prestataire annule < 2h avant - 5 points', true),
            ('on_way', 'provider', NULL, 0, 0, 10, 'Prestataire annule en route - 10 points', true)
            ON CONFLICT DO NOTHING";

        $db->exec($insertSql);
        echo ">>> Regles inserees avec succes!\n\n";

        // Re-lister
        $stmt = $db->query("SELECT * FROM cancellation_rules ORDER BY status, cancelled_by");
        $rules = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    foreach ($rules as $rule) {
        echo sprintf(
            "ID:%d | Status: %-10s | By: %-8s | Hours: %s | Fee: %d-%d%% | Points: %d | Active: %s\n",
            $rule['id'],
            $rule['status'],
            $rule['cancelled_by'],
            $rule['hours_before_appointment'] ?? 'NULL',
            $rule['min_fee_percentage'],
            $rule['max_fee_percentage'],
            $rule['provider_penalty_points'],
            $rule['is_active'] ? 'YES' : 'NO'
        );
        echo "   Description: " . ($rule['description'] ?? 'N/A') . "\n";
    }

    echo str_repeat("-", 100) . "\n\n";

    // 3. Verifier specifiquement la regle on_way client
    echo "3. Regle specifique 'on_way' + 'client':\n";
    $stmt = $db->prepare("SELECT * FROM cancellation_rules WHERE status = 'on_way' AND cancelled_by = 'client' AND is_active = true");
    $stmt->execute();
    $onWayRule = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($onWayRule) {
        echo ">>> TROUVEE: Fee " . $onWayRule['min_fee_percentage'] . "-" . $onWayRule['max_fee_percentage'] . "%\n";
    } else {
        echo ">>> NON TROUVEE ou INACTIVE!\n";

        // Activer la regle si elle existe mais est inactive
        $db->exec("UPDATE cancellation_rules SET is_active = true WHERE status = 'on_way' AND cancelled_by = 'client'");
        echo ">>> Tentative d'activation effectuee.\n";
    }

    echo "\n=== FIN DEBUG ===\n";

} catch (Exception $e) {
    echo "ERREUR: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
