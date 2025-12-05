-- =====================================================
-- ROLLBACK 002 : SYSTÈME D'ENCHÈRES TYPE INDRIVE
-- =====================================================
-- Date : 2025-11-19
-- Description : Rollback complet de la migration 002
-- ATTENTION : Ce script supprime toutes les données liées aux enchères
-- =====================================================

-- Début de la transaction
START TRANSACTION;

-- =====================================================
-- 1. SUPPRIMER LA VUE
-- =====================================================
DROP VIEW IF EXISTS v_bidding_orders_summary;

-- =====================================================
-- 2. SUPPRIMER LA CONTRAINTE FK SUR ORDERS.ACCEPTED_BID_ID
-- =====================================================
SET @fk_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND CONSTRAINT_NAME = 'fk_orders_accepted_bid'
);

SET @sql_drop_fk = IF(
    @fk_exists > 0,
    'ALTER TABLE orders DROP FOREIGN KEY fk_orders_accepted_bid',
    'SELECT ''Foreign key fk_orders_accepted_bid does not exist'' AS message'
);
PREPARE stmt FROM @sql_drop_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 3. SUPPRIMER LES COLONNES DE LA TABLE ORDERS
-- =====================================================
-- Supprimer l'index idx_pricing_mode_status
SET @index_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND INDEX_NAME = 'idx_pricing_mode_status'
);

SET @sql_drop_index = IF(
    @index_exists > 0,
    'ALTER TABLE orders DROP INDEX idx_pricing_mode_status',
    'SELECT ''Index idx_pricing_mode_status does not exist'' AS message'
);
PREPARE stmt FROM @sql_drop_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer la colonne bid_expiry_time
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'bid_expiry_time'
);

SET @sql_drop_bid_expiry = IF(
    @column_exists > 0,
    'ALTER TABLE orders DROP COLUMN bid_expiry_time',
    'SELECT ''Column bid_expiry_time does not exist'' AS message'
);
PREPARE stmt FROM @sql_drop_bid_expiry;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer la colonne accepted_bid_id
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'accepted_bid_id'
);

SET @sql_drop_accepted_bid = IF(
    @column_exists > 0,
    'ALTER TABLE orders DROP COLUMN accepted_bid_id',
    'SELECT ''Column accepted_bid_id does not exist'' AS message'
);
PREPARE stmt FROM @sql_drop_accepted_bid;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer la colonne user_proposed_price
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'user_proposed_price'
);

SET @sql_drop_user_price = IF(
    @column_exists > 0,
    'ALTER TABLE orders DROP COLUMN user_proposed_price',
    'SELECT ''Column user_proposed_price does not exist'' AS message'
);
PREPARE stmt FROM @sql_drop_user_price;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer la colonne pricing_mode
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'pricing_mode'
);

SET @sql_drop_pricing_mode = IF(
    @column_exists > 0,
    'ALTER TABLE orders DROP COLUMN pricing_mode',
    'SELECT ''Column pricing_mode does not exist'' AS message'
);
PREPARE stmt FROM @sql_drop_pricing_mode;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 4. SUPPRIMER LES COLONNES DE LA TABLE SERVICES
-- =====================================================
-- Supprimer la colonne max_suggested_price
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'services'
    AND COLUMN_NAME = 'max_suggested_price'
);

SET @sql_drop_max_price = IF(
    @column_exists > 0,
    'ALTER TABLE services DROP COLUMN max_suggested_price',
    'SELECT ''Column max_suggested_price does not exist'' AS message'
);
PREPARE stmt FROM @sql_drop_max_price;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer la colonne min_suggested_price
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'services'
    AND COLUMN_NAME = 'min_suggested_price'
);

SET @sql_drop_min_price = IF(
    @column_exists > 0,
    'ALTER TABLE services DROP COLUMN min_suggested_price',
    'SELECT ''Column min_suggested_price does not exist'' AS message'
);
PREPARE stmt FROM @sql_drop_min_price;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer la colonne allow_bidding
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'services'
    AND COLUMN_NAME = 'allow_bidding'
);

SET @sql_drop_allow_bidding = IF(
    @column_exists > 0,
    'ALTER TABLE services DROP COLUMN allow_bidding',
    'SELECT ''Column allow_bidding does not exist'' AS message'
);
PREPARE stmt FROM @sql_drop_allow_bidding;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 5. SUPPRIMER LES TABLES (dans l'ordre inverse des dépendances)
-- =====================================================
-- Supprimer la table negotiations (dépend de bids et orders)
DROP TABLE IF EXISTS negotiations;

-- Supprimer la table provider_stats (dépend de providers)
DROP TABLE IF EXISTS provider_stats;

-- Supprimer la table bids (dépend de orders et providers)
DROP TABLE IF EXISTS bids;

-- NOTE : On ne supprime PAS la table notifications car elle peut être utilisée
-- par d'autres fonctionnalités. Si vous souhaitez vraiment la supprimer,
-- décommentez la ligne suivante :
-- DROP TABLE IF EXISTS notifications;

-- =====================================================
-- FIN DU ROLLBACK
-- =====================================================

COMMIT;

-- Afficher un résumé
SELECT
    'Rollback 002 exécuté avec succès !' AS message,
    NOW() AS execution_time,
    'Toutes les tables et colonnes du système d\'enchères ont été supprimées' AS status;
