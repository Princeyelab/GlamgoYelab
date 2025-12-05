<?php

/**
 * Migration: Ajouter les champs de frais kilométriques
 *
 * Permet de stocker les informations de distance et frais
 * pour chaque commande, basés sur le rayon d'intervention du prestataire.
 */

require_once __DIR__ . '/../config/config.php';

try {
    $db = \App\Core\Database::getInstance();

    echo "🚀 Migration: Ajout des champs de frais kilométriques...\n\n";

    // ========================================
    // 1. Table PROVIDERS - Vérifier les colonnes
    // ========================================
    echo "📋 Vérification table providers...\n";

    $stmt = $db->query("SHOW COLUMNS FROM providers LIKE 'intervention_radius_km'");
    if ($stmt->rowCount() === 0) {
        $db->exec("
            ALTER TABLE providers
            ADD COLUMN intervention_radius_km INT DEFAULT 10 COMMENT 'Rayon d''intervention gratuit en km'
        ");
        echo "  ✅ Colonne intervention_radius_km ajoutée\n";
    } else {
        echo "  ✓ Colonne intervention_radius_km existe déjà\n";
    }

    $stmt = $db->query("SHOW COLUMNS FROM providers LIKE 'price_per_extra_km'");
    if ($stmt->rowCount() === 0) {
        $db->exec("
            ALTER TABLE providers
            ADD COLUMN price_per_extra_km DECIMAL(5,2) DEFAULT 5.00 COMMENT 'Prix par km supplémentaire en MAD'
        ");
        echo "  ✅ Colonne price_per_extra_km ajoutée\n";
    } else {
        echo "  ✓ Colonne price_per_extra_km existe déjà\n";
    }

    // ========================================
    // 2. Table ORDERS - Champs de distance
    // ========================================
    echo "\n📋 Vérification table orders...\n";

    $stmt = $db->query("SHOW COLUMNS FROM orders LIKE 'distance_km'");
    if ($stmt->rowCount() === 0) {
        $db->exec("
            ALTER TABLE orders
            ADD COLUMN distance_km DECIMAL(6,2) NULL COMMENT 'Distance totale entre prestataire et client en km'
        ");
        echo "  ✅ Colonne distance_km ajoutée\n";
    } else {
        echo "  ✓ Colonne distance_km existe déjà\n";
    }

    $stmt = $db->query("SHOW COLUMNS FROM orders LIKE 'distance_fee'");
    if ($stmt->rowCount() === 0) {
        $db->exec("
            ALTER TABLE orders
            ADD COLUMN distance_fee DECIMAL(8,2) DEFAULT 0.00 COMMENT 'Frais de déplacement en MAD'
        ");
        echo "  ✅ Colonne distance_fee ajoutée\n";
    } else {
        echo "  ✓ Colonne distance_fee existe déjà\n";
    }

    $stmt = $db->query("SHOW COLUMNS FROM orders LIKE 'intervention_radius_km'");
    if ($stmt->rowCount() === 0) {
        $db->exec("
            ALTER TABLE orders
            ADD COLUMN intervention_radius_km INT NULL COMMENT 'Rayon d''intervention du prestataire au moment de la commande'
        ");
        echo "  ✅ Colonne intervention_radius_km ajoutée\n";
    } else {
        echo "  ✓ Colonne intervention_radius_km existe déjà\n";
    }

    $stmt = $db->query("SHOW COLUMNS FROM orders LIKE 'extra_distance_km'");
    if ($stmt->rowCount() === 0) {
        $db->exec("
            ALTER TABLE orders
            ADD COLUMN extra_distance_km DECIMAL(6,2) DEFAULT 0.00 COMMENT 'Distance au-delà du rayon gratuit'
        ");
        echo "  ✅ Colonne extra_distance_km ajoutée\n";
    } else {
        echo "  ✓ Colonne extra_distance_km existe déjà\n";
    }

    $stmt = $db->query("SHOW COLUMNS FROM orders LIKE 'price_per_extra_km'");
    if ($stmt->rowCount() === 0) {
        $db->exec("
            ALTER TABLE orders
            ADD COLUMN price_per_extra_km DECIMAL(5,2) NULL COMMENT 'Tarif km au moment de la commande'
        ");
        echo "  ✅ Colonne price_per_extra_km ajoutée (orders)\n";
    } else {
        echo "  ✓ Colonne price_per_extra_km existe déjà (orders)\n";
    }

    // ========================================
    // 3. Table ORDERS - Autres champs de prix
    // ========================================
    echo "\n📋 Vérification champs prix orders...\n";

    $stmt = $db->query("SHOW COLUMNS FROM orders LIKE 'base_price'");
    if ($stmt->rowCount() === 0) {
        $db->exec("
            ALTER TABLE orders
            ADD COLUMN base_price DECIMAL(10,2) NULL COMMENT 'Prix de base du service'
        ");
        echo "  ✅ Colonne base_price ajoutée\n";
    } else {
        echo "  ✓ Colonne base_price existe déjà\n";
    }

    $stmt = $db->query("SHOW COLUMNS FROM orders LIKE 'formula_fee'");
    if ($stmt->rowCount() === 0) {
        $db->exec("
            ALTER TABLE orders
            ADD COLUMN formula_fee DECIMAL(8,2) DEFAULT 0.00 COMMENT 'Supplément formule'
        ");
        echo "  ✅ Colonne formula_fee ajoutée\n";
    } else {
        echo "  ✓ Colonne formula_fee existe déjà\n";
    }

    $stmt = $db->query("SHOW COLUMNS FROM orders LIKE 'night_fee'");
    if ($stmt->rowCount() === 0) {
        $db->exec("
            ALTER TABLE orders
            ADD COLUMN night_fee DECIMAL(8,2) DEFAULT 0.00 COMMENT 'Supplément nuit'
        ");
        echo "  ✅ Colonne night_fee ajoutée\n";
    } else {
        echo "  ✓ Colonne night_fee existe déjà\n";
    }

    $stmt = $db->query("SHOW COLUMNS FROM orders LIKE 'commission_amount'");
    if ($stmt->rowCount() === 0) {
        $db->exec("
            ALTER TABLE orders
            ADD COLUMN commission_amount DECIMAL(8,2) DEFAULT 0.00 COMMENT 'Commission GlamGo (20%)'
        ");
        echo "  ✅ Colonne commission_amount ajoutée\n";
    } else {
        echo "  ✓ Colonne commission_amount existe déjà\n";
    }

    $stmt = $db->query("SHOW COLUMNS FROM orders LIKE 'provider_amount'");
    if ($stmt->rowCount() === 0) {
        $db->exec("
            ALTER TABLE orders
            ADD COLUMN provider_amount DECIMAL(10,2) NULL COMMENT 'Montant net prestataire'
        ");
        echo "  ✅ Colonne provider_amount ajoutée\n";
    } else {
        echo "  ✓ Colonne provider_amount existe déjà\n";
    }

    // ========================================
    // 4. Table de configuration des frais par ville
    // ========================================
    echo "\n📋 Création table city_distance_configs...\n";

    $db->exec("
        CREATE TABLE IF NOT EXISTS city_distance_configs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            city_name VARCHAR(100) NOT NULL UNIQUE,
            default_radius_km INT DEFAULT 10,
            default_price_per_km DECIMAL(5,2) DEFAULT 5.00,
            max_radius_km INT DEFAULT 50,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "  ✅ Table city_distance_configs créée/vérifiée\n";

    // Insérer les configurations par défaut
    $db->exec("
        INSERT IGNORE INTO city_distance_configs (city_name, default_radius_km, default_price_per_km, max_radius_km)
        VALUES
            ('marrakech', 10, 5.00, 50),
            ('casablanca', 15, 4.00, 60),
            ('rabat', 12, 4.50, 50),
            ('fes', 10, 5.00, 45),
            ('tanger', 12, 4.50, 50),
            ('agadir', 15, 4.00, 60)
    ");
    echo "  ✅ Configurations par défaut insérées\n";

    // ========================================
    // 5. Index pour optimisation
    // ========================================
    echo "\n📋 Création des index...\n";

    // Index sur distance_km pour les requêtes de reporting
    $stmt = $db->query("SHOW INDEX FROM orders WHERE Key_name = 'idx_orders_distance'");
    if ($stmt->rowCount() === 0) {
        $db->exec("CREATE INDEX idx_orders_distance ON orders(distance_km)");
        echo "  ✅ Index idx_orders_distance créé\n";
    } else {
        echo "  ✓ Index idx_orders_distance existe déjà\n";
    }

    // Index sur distance_fee pour les requêtes de facturation
    $stmt = $db->query("SHOW INDEX FROM orders WHERE Key_name = 'idx_orders_distance_fee'");
    if ($stmt->rowCount() === 0) {
        $db->exec("CREATE INDEX idx_orders_distance_fee ON orders(distance_fee)");
        echo "  ✅ Index idx_orders_distance_fee créé\n";
    } else {
        echo "  ✓ Index idx_orders_distance_fee existe déjà\n";
    }

    echo "\n✅ Migration des frais kilométriques terminée avec succès!\n";
    echo "\n📊 Résumé:\n";
    echo "   - Table providers: intervention_radius_km, price_per_extra_km\n";
    echo "   - Table orders: distance_km, distance_fee, intervention_radius_km,\n";
    echo "                   extra_distance_km, price_per_extra_km, base_price,\n";
    echo "                   formula_fee, night_fee, commission_amount, provider_amount\n";
    echo "   - Table city_distance_configs: configurations par ville\n";

} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
    exit(1);
}
