<?php
/**
 * Script de migration simplifié pour les colonnes d'annulation
 * Exécuter via: https://glamgo-api.fly.dev/run_cancellation_migration.php
 */

header('Content-Type: application/json');

// Charger la config
require_once __DIR__ . '/../app/core/Database.php';

use App\Core\Database;

try {
    $db = Database::getInstance();
    $results = [];

    // Liste des colonnes à ajouter à la table orders
    $columns = [
        "cancelled_at TIMESTAMP NULL",
        "cancelled_by VARCHAR(20) NULL",
        "cancellation_reason TEXT NULL",
        "cancellation_fee DECIMAL(10, 2) DEFAULT 0.00",
        "cancellation_fee_percentage INT DEFAULT 0",
        "cancellation_provider_lat DECIMAL(10, 8) NULL",
        "cancellation_provider_lng DECIMAL(11, 8) NULL",
        "cancellation_distance_traveled DECIMAL(10, 2) NULL"
    ];

    foreach ($columns as $columnDef) {
        $columnName = explode(' ', $columnDef)[0];

        // Vérifier si la colonne existe déjà
        $checkSql = "SELECT column_name FROM information_schema.columns
                     WHERE table_name = 'orders' AND column_name = :col";
        $stmt = $db->prepare($checkSql);
        $stmt->execute(['col' => $columnName]);

        if ($stmt->fetch()) {
            $results[] = "✓ Colonne '{$columnName}' existe déjà";
        } else {
            // Ajouter la colonne
            try {
                $alterSql = "ALTER TABLE orders ADD COLUMN {$columnDef}";
                $db->exec($alterSql);
                $results[] = "✅ Colonne '{$columnName}' ajoutée avec succès";
            } catch (PDOException $e) {
                $results[] = "❌ Erreur ajout '{$columnName}': " . $e->getMessage();
            }
        }
    }

    // Créer la table cancellation_rules si elle n'existe pas
    $createRulesTable = "
    CREATE TABLE IF NOT EXISTS cancellation_rules (
        id SERIAL PRIMARY KEY,
        status VARCHAR(20) NOT NULL,
        cancelled_by VARCHAR(20) NOT NULL,
        hours_before_appointment INT NULL,
        min_fee_percentage INT DEFAULT 0,
        max_fee_percentage INT DEFAULT 0,
        provider_penalty_points INT DEFAULT 0,
        description TEXT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";

    try {
        $db->exec($createRulesTable);
        $results[] = "✅ Table 'cancellation_rules' créée/vérifiée";
    } catch (PDOException $e) {
        $results[] = "❌ Erreur table cancellation_rules: " . $e->getMessage();
    }

    // Insérer les règles par défaut si la table est vide
    $countStmt = $db->query("SELECT COUNT(*) FROM cancellation_rules");
    $count = $countStmt->fetchColumn();

    if ($count == 0) {
        $rules = [
            ['pending', 'client', null, 0, 0, 0, 'Client annule commande en attente - Gratuit'],
            ['accepted', 'client', 2, 0, 0, 0, 'Client annule > 2h avant RDV - Gratuit'],
            ['accepted', 'client', 0, 50, 50, 0, 'Client annule < 2h avant RDV - 50% frais'],
            ['on_way', 'client', null, 50, 100, 0, 'Client annule prestataire en route - 50-100% selon distance'],
            ['pending', 'provider', null, 0, 0, 1, 'Prestataire refuse commande - 1 point'],
            ['accepted', 'provider', 2, 0, 0, 2, 'Prestataire annule > 2h avant - 2 points'],
            ['accepted', 'provider', 0, 0, 0, 5, 'Prestataire annule < 2h avant - 5 points'],
            ['on_way', 'provider', null, 0, 0, 10, 'Prestataire annule en route - 10 points'],
        ];

        $insertSql = "INSERT INTO cancellation_rules
                      (status, cancelled_by, hours_before_appointment, min_fee_percentage, max_fee_percentage, provider_penalty_points, description)
                      VALUES (?, ?, ?, ?, ?, ?, ?)";
        $insertStmt = $db->prepare($insertSql);

        foreach ($rules as $rule) {
            try {
                $insertStmt->execute($rule);
            } catch (PDOException $e) {
                // Ignorer les doublons
            }
        }
        $results[] = "✅ Règles d'annulation insérées";
    } else {
        $results[] = "✓ Règles d'annulation existent déjà ({$count} règles)";
    }

    echo json_encode([
        'success' => true,
        'message' => 'Migration terminée',
        'results' => $results
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
