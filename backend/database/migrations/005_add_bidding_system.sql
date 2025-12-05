-- =====================================================
-- MIGRATION 005 : SYSTÈME D'ENCHÈRES TYPE INDRIVE
-- =====================================================
-- Date : 2025-11-19
-- Description : Ajout du système hybride (prix fixes + enchères)
-- IMPORTANT : Ce script est IDEMPOTENT (peut être exécuté plusieurs fois)
-- =====================================================

-- Début de la transaction
START TRANSACTION;

-- =====================================================
-- 1. TABLE DES OFFRES (BIDS)
-- =====================================================
CREATE TABLE IF NOT EXISTS bids (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL COMMENT 'Commande concernée',
    provider_id INT NOT NULL COMMENT 'Prestataire qui fait l\'offre',
    proposed_price DECIMAL(10, 2) NOT NULL COMMENT 'Prix proposé par le prestataire',
    estimated_arrival_minutes INT NULL COMMENT 'Temps d\'arrivée estimé en minutes',
    message TEXT NULL COMMENT 'Message/justification du prestataire',
    status ENUM('pending', 'accepted', 'rejected', 'withdrawn', 'expired') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,

    INDEX idx_order_status (order_id, status),
    INDEX idx_provider_status (provider_id, status),
    INDEX idx_created_at (created_at),

    -- Un prestataire ne peut faire qu'une seule offre par commande
    UNIQUE KEY unique_provider_order (provider_id, order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Offres des prestataires pour les commandes en mode enchères';

-- =====================================================
-- 2. TABLE DES NÉGOCIATIONS (HISTORIQUE)
-- =====================================================
CREATE TABLE IF NOT EXISTS negotiations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bid_id INT NOT NULL COMMENT 'Offre concernée',
    order_id INT NOT NULL COMMENT 'Commande concernée',
    actor_type ENUM('user', 'provider') NOT NULL COMMENT 'Qui a fait l\'action',
    actor_id INT NOT NULL COMMENT 'ID de l\'acteur',
    action_type ENUM('counter_offer', 'message', 'price_adjustment') NOT NULL,
    previous_price DECIMAL(10, 2) NULL COMMENT 'Prix précédent',
    new_price DECIMAL(10, 2) NULL COMMENT 'Nouveau prix proposé',
    message TEXT NULL COMMENT 'Message accompagnant l\'action',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (bid_id) REFERENCES bids(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,

    INDEX idx_bid_id (bid_id),
    INDEX idx_order_id (order_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historique des négociations entre utilisateurs et prestataires';

-- =====================================================
-- 3. TABLE DES STATISTIQUES PRESTATAIRES
-- =====================================================
CREATE TABLE IF NOT EXISTS provider_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL UNIQUE,
    total_bids INT DEFAULT 0 COMMENT 'Nombre total d\'offres faites',
    accepted_bids INT DEFAULT 0 COMMENT 'Nombre d\'offres acceptées',
    rejected_bids INT DEFAULT 0 COMMENT 'Nombre d\'offres rejetées',
    withdrawn_bids INT DEFAULT 0 COMMENT 'Nombre d\'offres retirées',
    expired_bids INT DEFAULT 0 COMMENT 'Nombre d\'offres expirées',
    acceptance_rate DECIMAL(5, 2) DEFAULT 0.00 COMMENT 'Taux d\'acceptation en %',
    avg_response_time_minutes INT DEFAULT 0 COMMENT 'Temps moyen de réponse en minutes',
    avg_bid_price DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Prix moyen des offres',
    lowest_bid_price DECIMAL(10, 2) NULL COMMENT 'Offre la plus basse',
    highest_bid_price DECIMAL(10, 2) NULL COMMENT 'Offre la plus haute',
    last_bid_at TIMESTAMP NULL COMMENT 'Date de la dernière offre',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,

    INDEX idx_acceptance_rate (acceptance_rate),
    INDEX idx_last_bid_at (last_bid_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Statistiques des prestataires pour le système d\'enchères';

-- =====================================================
-- 4. MODIFICATION DE LA TABLE ORDERS
-- =====================================================
-- Ajouter la colonne pricing_mode si elle n'existe pas
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'pricing_mode'
);

SET @sql_pricing_mode = IF(
    @column_exists = 0,
    'ALTER TABLE orders ADD COLUMN pricing_mode ENUM(''fixed'', ''bidding'') DEFAULT ''fixed'' COMMENT ''Mode de tarification'' AFTER status',
    'SELECT ''Column pricing_mode already exists'' AS message'
);
PREPARE stmt FROM @sql_pricing_mode;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter la colonne user_proposed_price si elle n'existe pas
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'user_proposed_price'
);

SET @sql_user_price = IF(
    @column_exists = 0,
    'ALTER TABLE orders ADD COLUMN user_proposed_price DECIMAL(10, 2) NULL COMMENT ''Budget proposé par l\\'utilisateur en mode enchères'' AFTER pricing_mode',
    'SELECT ''Column user_proposed_price already exists'' AS message'
);
PREPARE stmt FROM @sql_user_price;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter la colonne accepted_bid_id si elle n'existe pas
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'accepted_bid_id'
);

SET @sql_accepted_bid = IF(
    @column_exists = 0,
    'ALTER TABLE orders ADD COLUMN accepted_bid_id INT NULL COMMENT ''ID de l\\'offre acceptée'' AFTER user_proposed_price',
    'SELECT ''Column accepted_bid_id already exists'' AS message'
);
PREPARE stmt FROM @sql_accepted_bid;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter la colonne bid_expiry_time si elle n'existe pas
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'bid_expiry_time'
);

SET @sql_expiry = IF(
    @column_exists = 0,
    'ALTER TABLE orders ADD COLUMN bid_expiry_time TIMESTAMP NULL COMMENT ''Date d\\'expiration des offres'' AFTER accepted_bid_id',
    'SELECT ''Column bid_expiry_time already exists'' AS message'
);
PREPARE stmt FROM @sql_expiry;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter la contrainte de clé étrangère pour accepted_bid_id (si elle n'existe pas)
SET @fk_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND CONSTRAINT_NAME = 'fk_orders_accepted_bid'
);

SET @sql_fk = IF(
    @fk_exists = 0 AND @column_exists = 1,
    'ALTER TABLE orders ADD CONSTRAINT fk_orders_accepted_bid FOREIGN KEY (accepted_bid_id) REFERENCES bids(id) ON DELETE SET NULL',
    'SELECT ''Foreign key fk_orders_accepted_bid already exists or column not created'' AS message'
);
PREPARE stmt FROM @sql_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter un index sur pricing_mode et status pour optimiser les requêtes
SET @index_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND INDEX_NAME = 'idx_pricing_mode_status'
);

SET @sql_index = IF(
    @index_exists = 0,
    'ALTER TABLE orders ADD INDEX idx_pricing_mode_status (pricing_mode, status)',
    'SELECT ''Index idx_pricing_mode_status already exists'' AS message'
);
PREPARE stmt FROM @sql_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 5. MODIFICATION DE LA TABLE SERVICES
-- =====================================================
-- Ajouter la colonne allow_bidding si elle n'existe pas
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'services'
    AND COLUMN_NAME = 'allow_bidding'
);

SET @sql_allow_bidding = IF(
    @column_exists = 0,
    'ALTER TABLE services ADD COLUMN allow_bidding BOOLEAN DEFAULT TRUE COMMENT ''Autoriser le mode enchères pour ce service'' AFTER is_active',
    'SELECT ''Column allow_bidding already exists'' AS message'
);
PREPARE stmt FROM @sql_allow_bidding;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter la colonne min_suggested_price si elle n'existe pas
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'services'
    AND COLUMN_NAME = 'min_suggested_price'
);

SET @sql_min_price = IF(
    @column_exists = 0,
    'ALTER TABLE services ADD COLUMN min_suggested_price DECIMAL(10, 2) NULL COMMENT ''Prix minimum suggéré en mode enchères'' AFTER allow_bidding',
    'SELECT ''Column min_suggested_price already exists'' AS message'
);
PREPARE stmt FROM @sql_min_price;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter la colonne max_suggested_price si elle n'existe pas
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'services'
    AND COLUMN_NAME = 'max_suggested_price'
);

SET @sql_max_price = IF(
    @column_exists = 0,
    'ALTER TABLE services ADD COLUMN max_suggested_price DECIMAL(10, 2) NULL COMMENT ''Prix maximum suggéré en mode enchères'' AFTER min_suggested_price',
    'SELECT ''Column max_suggested_price already exists'' AS message'
);
PREPARE stmt FROM @sql_max_price;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 6. INITIALISER LES FOURCHETTES DE PRIX POUR LES SERVICES EXISTANTS
-- =====================================================
-- Définir une fourchette de ±20% autour du prix fixe pour les services existants
UPDATE services
SET
    min_suggested_price = ROUND(price * 0.80, 2),
    max_suggested_price = ROUND(price * 1.20, 2)
WHERE
    min_suggested_price IS NULL
    AND max_suggested_price IS NULL
    AND allow_bidding = TRUE;

-- =====================================================
-- 7. INITIALISER LES STATS POUR LES PRESTATAIRES EXISTANTS
-- =====================================================
-- Créer des entrées dans provider_stats pour tous les prestataires existants
INSERT INTO provider_stats (provider_id, created_at)
SELECT id, NOW()
FROM providers
WHERE id NOT IN (SELECT provider_id FROM provider_stats);

-- =====================================================
-- 8. CRÉER DES VUES UTILES (OPTIONNEL)
-- =====================================================
-- Vue pour les commandes en mode enchères avec statistiques
CREATE OR REPLACE VIEW v_bidding_orders_summary AS
SELECT
    o.id AS order_id,
    o.user_id,
    o.service_id,
    s.name AS service_name,
    o.user_proposed_price,
    o.status,
    o.bid_expiry_time,
    COUNT(b.id) AS total_bids,
    MIN(b.proposed_price) AS lowest_bid,
    MAX(b.proposed_price) AS highest_bid,
    AVG(b.proposed_price) AS avg_bid,
    o.created_at
FROM orders o
INNER JOIN services s ON o.service_id = s.id
LEFT JOIN bids b ON o.id = b.order_id AND b.status = 'pending'
WHERE o.pricing_mode = 'bidding'
GROUP BY o.id;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

COMMIT;

-- Afficher un résumé
SELECT
    'Migration 005 exécutée avec succès !' AS message,
    NOW() AS execution_time,
    (SELECT COUNT(*) FROM bids) AS total_bids,
    (SELECT COUNT(*) FROM provider_stats) AS total_provider_stats,
    (SELECT COUNT(*) FROM orders WHERE pricing_mode = 'bidding') AS bidding_orders;
