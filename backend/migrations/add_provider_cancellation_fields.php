<?php

/**
 * Migration: Ajouter les champs d'annulation prestataire dans la table orders
 *
 * Colonnes ajoutées:
 * - provider_cancelled: indicateur si un prestataire a annulé
 * - provider_cancel_reason: raison de l'annulation
 * - provider_cancel_fee: frais d'annulation
 * - provider_cancelled_at: date/heure de l'annulation
 * - previous_provider_id: ID du prestataire qui a annulé
 */

$config = require __DIR__ . '/../config/config.php';
$dbConfig = $config['database'];

try {
    $pdo = new PDO(
        "mysql:host=" . $dbConfig['host'] . ";dbname=" . $dbConfig['name'] . ";charset=utf8mb4",
        $dbConfig['user'],
        $dbConfig['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    echo "🔄 Migration: Ajout des champs d'annulation prestataire\n";
    echo "=========================================\n\n";

    // Vérifier si les colonnes existent déjà
    $stmt = $pdo->query("DESCRIBE orders");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $columnsToAdd = [
        'provider_cancelled' => "TINYINT(1) DEFAULT 0 COMMENT 'Indicateur annulation prestataire'",
        'provider_cancel_reason' => "VARCHAR(500) NULL COMMENT 'Raison de l annulation'",
        'provider_cancel_fee' => "DECIMAL(10,2) DEFAULT 0 COMMENT 'Frais d annulation en MAD'",
        'provider_cancelled_at' => "DATETIME NULL COMMENT 'Date/heure annulation'",
        'previous_provider_id' => "INT UNSIGNED NULL COMMENT 'ID du prestataire qui a annulé'"
    ];

    foreach ($columnsToAdd as $column => $definition) {
        if (in_array($column, $columns)) {
            echo "⏭️  Colonne '$column' existe déjà\n";
        } else {
            $sql = "ALTER TABLE orders ADD COLUMN $column $definition";
            $pdo->exec($sql);
            echo "✅ Colonne '$column' ajoutée\n";
        }
    }

    // Ajouter un index sur previous_provider_id pour les statistiques
    echo "\n🔄 Vérification des index...\n";

    $indexCheck = $pdo->query("SHOW INDEX FROM orders WHERE Key_name = 'idx_previous_provider'");
    if ($indexCheck->rowCount() === 0) {
        $pdo->exec("ALTER TABLE orders ADD INDEX idx_previous_provider (previous_provider_id)");
        echo "✅ Index 'idx_previous_provider' créé\n";
    } else {
        echo "⏭️  Index 'idx_previous_provider' existe déjà\n";
    }

    // Ajouter la colonne cancellation_count à la table providers si elle n'existe pas
    echo "\n🔄 Vérification de la table providers...\n";

    $stmt = $pdo->query("DESCRIBE providers");
    $providerColumns = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (!in_array('cancellation_count', $providerColumns)) {
        $pdo->exec("ALTER TABLE providers ADD COLUMN cancellation_count INT DEFAULT 0 COMMENT 'Nombre d annulations effectuées'");
        echo "✅ Colonne 'cancellation_count' ajoutée à providers\n";
    } else {
        echo "⏭️  Colonne 'cancellation_count' existe déjà dans providers\n";
    }

    echo "\n=========================================\n";
    echo "✅ Migration terminée avec succès!\n";

} catch (PDOException $e) {
    echo "❌ Erreur de migration: " . $e->getMessage() . "\n";
    exit(1);
}
