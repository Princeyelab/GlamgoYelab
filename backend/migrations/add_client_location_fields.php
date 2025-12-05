<?php

/**
 * Migration: Ajouter les champs de géolocalisation en temps réel du client
 *
 * Permet au client de partager sa position GPS avec le prestataire
 * pendant que le prestataire est en route.
 */

require_once __DIR__ . '/../config/database.php';

try {
    $db = \App\Core\Database::getInstance();

    echo "🚀 Ajout des champs de localisation client...\n";

    // Vérifier si les colonnes existent déjà
    $stmt = $db->query("SHOW COLUMNS FROM orders LIKE 'client_live_latitude'");
    if ($stmt->rowCount() > 0) {
        echo "✅ Les colonnes existent déjà.\n";
        exit(0);
    }

    // Ajouter les colonnes
    $db->exec("
        ALTER TABLE orders
        ADD COLUMN client_live_latitude DECIMAL(10, 8) NULL AFTER longitude,
        ADD COLUMN client_live_longitude DECIMAL(11, 8) NULL AFTER client_live_latitude
    ");

    echo "✅ Colonnes client_live_latitude et client_live_longitude ajoutées avec succès!\n";

} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    exit(1);
}
