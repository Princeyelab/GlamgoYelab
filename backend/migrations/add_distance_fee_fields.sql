-- Migration: Frais kilométriques
-- À exécuter dans phpMyAdmin ou MySQL Workbench

-- 1. Table PROVIDERS - Colonnes de configuration distance
ALTER TABLE providers
ADD COLUMN IF NOT EXISTS intervention_radius_km INT DEFAULT 10 COMMENT 'Rayon intervention gratuit en km',
ADD COLUMN IF NOT EXISTS price_per_extra_km DECIMAL(5,2) DEFAULT 5.00 COMMENT 'Prix par km supplémentaire en MAD';

-- 2. Table ORDERS - Colonnes de distance et frais
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS distance_km DECIMAL(6,2) NULL COMMENT 'Distance totale prestataire-client en km',
ADD COLUMN IF NOT EXISTS distance_fee DECIMAL(8,2) DEFAULT 0.00 COMMENT 'Frais de déplacement en MAD',
ADD COLUMN IF NOT EXISTS intervention_radius_km INT NULL COMMENT 'Rayon du prestataire au moment de la commande',
ADD COLUMN IF NOT EXISTS extra_distance_km DECIMAL(6,2) DEFAULT 0.00 COMMENT 'Distance au-delà du rayon gratuit',
ADD COLUMN IF NOT EXISTS price_per_extra_km DECIMAL(5,2) NULL COMMENT 'Tarif km au moment de la commande',
ADD COLUMN IF NOT EXISTS base_price DECIMAL(10,2) NULL COMMENT 'Prix de base du service',
ADD COLUMN IF NOT EXISTS formula_fee DECIMAL(8,2) DEFAULT 0.00 COMMENT 'Supplément formule',
ADD COLUMN IF NOT EXISTS night_fee DECIMAL(8,2) DEFAULT 0.00 COMMENT 'Supplément nuit',
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(8,2) DEFAULT 0.00 COMMENT 'Commission GlamGo 20%',
ADD COLUMN IF NOT EXISTS provider_amount DECIMAL(10,2) NULL COMMENT 'Montant net prestataire';

-- 3. Table de configuration par ville
CREATE TABLE IF NOT EXISTS city_distance_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city_name VARCHAR(100) NOT NULL UNIQUE,
    default_radius_km INT DEFAULT 10,
    default_price_per_km DECIMAL(5,2) DEFAULT 5.00,
    max_radius_km INT DEFAULT 50,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Configurations par défaut des villes
INSERT IGNORE INTO city_distance_configs (city_name, default_radius_km, default_price_per_km, max_radius_km)
VALUES
    ('marrakech', 10, 5.00, 50),
    ('casablanca', 15, 4.00, 60),
    ('rabat', 12, 4.50, 50),
    ('fes', 10, 5.00, 45),
    ('tanger', 12, 4.50, 50),
    ('agadir', 15, 4.00, 60);

-- 5. Index pour optimisation
CREATE INDEX IF NOT EXISTS idx_orders_distance ON orders(distance_km);
CREATE INDEX IF NOT EXISTS idx_orders_distance_fee ON orders(distance_fee);

-- Vérification
SELECT 'Migration terminée avec succès!' AS status;
