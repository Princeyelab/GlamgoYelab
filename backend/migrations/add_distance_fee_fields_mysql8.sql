-- Migration: Frais kilométriques (Compatible MySQL 8.0)
-- À exécuter via Docker

-- 1. Table PROVIDERS - Ajouter colonnes si elles n'existent pas
SET @dbname = 'glamgo';
SET @tablename = 'providers';

-- intervention_radius_km
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'intervention_radius_km';
SET @query = IF(@col_exists = 0,
    'ALTER TABLE providers ADD COLUMN intervention_radius_km INT DEFAULT 10',
    'SELECT "Column intervention_radius_km already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- price_per_extra_km
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'price_per_extra_km';
SET @query = IF(@col_exists = 0,
    'ALTER TABLE providers ADD COLUMN price_per_extra_km DECIMAL(5,2) DEFAULT 5.00',
    'SELECT "Column price_per_extra_km already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Table ORDERS - Colonnes de distance
SET @tablename = 'orders';

-- distance_km
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'distance_km';
SET @query = IF(@col_exists = 0,
    'ALTER TABLE orders ADD COLUMN distance_km DECIMAL(6,2) NULL',
    'SELECT "Column distance_km already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- distance_fee
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'distance_fee';
SET @query = IF(@col_exists = 0,
    'ALTER TABLE orders ADD COLUMN distance_fee DECIMAL(8,2) DEFAULT 0.00',
    'SELECT "Column distance_fee already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- intervention_radius_km (orders)
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'intervention_radius_km';
SET @query = IF(@col_exists = 0,
    'ALTER TABLE orders ADD COLUMN intervention_radius_km INT NULL',
    'SELECT "Column intervention_radius_km already exists in orders"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- extra_distance_km
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'extra_distance_km';
SET @query = IF(@col_exists = 0,
    'ALTER TABLE orders ADD COLUMN extra_distance_km DECIMAL(6,2) DEFAULT 0.00',
    'SELECT "Column extra_distance_km already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- price_per_extra_km (orders)
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'price_per_extra_km';
SET @query = IF(@col_exists = 0,
    'ALTER TABLE orders ADD COLUMN price_per_extra_km DECIMAL(5,2) NULL',
    'SELECT "Column price_per_extra_km already exists in orders"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- base_price
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'base_price';
SET @query = IF(@col_exists = 0,
    'ALTER TABLE orders ADD COLUMN base_price DECIMAL(10,2) NULL',
    'SELECT "Column base_price already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- formula_fee
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'formula_fee';
SET @query = IF(@col_exists = 0,
    'ALTER TABLE orders ADD COLUMN formula_fee DECIMAL(8,2) DEFAULT 0.00',
    'SELECT "Column formula_fee already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- night_fee
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'night_fee';
SET @query = IF(@col_exists = 0,
    'ALTER TABLE orders ADD COLUMN night_fee DECIMAL(8,2) DEFAULT 0.00',
    'SELECT "Column night_fee already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- commission_amount
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'commission_amount';
SET @query = IF(@col_exists = 0,
    'ALTER TABLE orders ADD COLUMN commission_amount DECIMAL(8,2) DEFAULT 0.00',
    'SELECT "Column commission_amount already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- provider_amount
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'provider_amount';
SET @query = IF(@col_exists = 0,
    'ALTER TABLE orders ADD COLUMN provider_amount DECIMAL(10,2) NULL',
    'SELECT "Column provider_amount already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

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

-- Vérification finale
SELECT 'Migration terminée avec succès!' AS status;
SELECT
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'glamgo' AND TABLE_NAME = 'providers' AND COLUMN_NAME IN ('intervention_radius_km', 'price_per_extra_km')) AS providers_columns,
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'glamgo' AND TABLE_NAME = 'orders' AND COLUMN_NAME IN ('distance_km', 'distance_fee', 'base_price', 'formula_fee', 'night_fee', 'commission_amount', 'provider_amount')) AS orders_columns,
    (SELECT COUNT(*) FROM city_distance_configs) AS city_configs;
