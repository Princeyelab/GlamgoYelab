-- =====================================================
-- ROLLBACK MIGRATION 005 : SYSTÈME D'ENCHÈRES
-- =====================================================
-- Date : 2025-11-19
-- Description : Supprime toutes les modifications de la migration 005
-- IMPORTANT : Ce script est IDEMPOTENT (peut être exécuté plusieurs fois)
-- ⚠️ ATTENTION : Cette opération supprimera TOUTES les offres et négociations
-- =====================================================

-- Début de la transaction
START TRANSACTION;

-- =====================================================
-- 1. SUPPRIMER LA VUE
-- =====================================================
DROP VIEW IF EXISTS v_bidding_orders_summary;

-- =====================================================
-- 2. SUPPRIMER LES CONTRAINTES DE CLÉ ÉTRANGÈRE
-- =====================================================
-- Supprimer la FK de orders.accepted_bid_id
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
-- Supprimer pricing_mode
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'pricing_mode'
);

SET @sql_drop_col = IF(
    @column_exists > 0,
    'ALTER TABLE orders DROP COLUMN pricing_mode',
    'SELECT ''Column pricing_mode does not exist'' AS message'
);
PREPARE stmt FROM @sql_drop_col;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer user_proposed_price
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'user_proposed_price'
);

SET @sql_drop_col = IF(
    @column_exists > 0,
    'ALTER TABLE orders DROP COLUMN user_proposed_price',
    'SELECT ''Column user_proposed_price does not exist'' AS message'
);
PREPARE stmt FROM @sql_drop_col;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer accepted_bid_id
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'accepted_bid_id'
);

SET @sql_drop_col = IF(
    @column_exists > 0,
    'ALTER TABLE orders DROP COLUMN accepted_bid_id',
    'SELECT ''Column accepted_bid_id does not exist'' AS message'
);
PREPARE stmt FROM @sql_drop_col;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer bid_expiry_time
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'bid_expiry_time'
);

SET @sql_drop_col = IF(
    @column_exists > 0,
    'ALTER TABLE orders DROP COLUMN bid_expiry_time',
    'SELECT ''Column bid_expiry_time does not exist'' AS message'
);
PREPARE stmt FROM @sql_drop_col;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer l'index idx_pricing_mode_status
SET @index_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND INDEX_NAME = 'idx_pricing_mode_status'
);

SET @sql_drop_idx = IF(
    @index_exists > 0,
    'ALTER TABLE orders DROP INDEX idx_pricing_mode_status',
    'SELECT ''Index idx_pricing_mode_status does not exist'' AS message'
);
PREPARE stmt FROM @sql_drop_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 4. SUPPRIMER LES COLONNES DE LA TABLE SERVICES
-- =====================================================
-- Supprimer allow_bidding
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'services'
    AND COLUMN_NAME = 'allow_bidding'
);

SET @sql_drop_col = IF(
    @column_exists > 0,
    'ALTER TABLE services DROP COLUMN allow_bidding',
    'SELECT ''Column allow_bidding does not exist'' AS message'
);
PREPARE stmt FROM @sql_drop_col;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer min_suggested_price
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'services'
    AND COLUMN_NAME = 'min_suggested_price'
);

SET @sql_drop_col = IF(
    @column_exists > 0,
    'ALTER TABLE services DROP COLUMN min_suggested_price',
    'SELECT ''Column min_suggested_price does not exist'' AS message'
);
PREPARE stmt FROM @sql_drop_col;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer max_suggested_price
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'services'
    AND COLUMN_NAME = 'max_suggested_price'
);

SET @sql_drop_col = IF(
    @column_exists > 0,
    'ALTER TABLE services DROP COLUMN max_suggested_price',
    'SELECT ''Column max_suggested_price does not exist'' AS message'
);
PREPARE stmt FROM @sql_drop_col;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 5. SUPPRIMER LES TABLES (dans l'ordre inverse des dépendances)
-- =====================================================
DROP TABLE IF EXISTS negotiations;
DROP TABLE IF EXISTS bids;
DROP TABLE IF EXISTS provider_stats;

-- =====================================================
-- FIN DU ROLLBACK
-- =====================================================

COMMIT;

-- Afficher un résumé
SELECT
    'Rollback de la migration 005 exécuté avec succès !' AS message,
    NOW() AS execution_time,
    'Toutes les tables, colonnes et données liées au système d\'enchères ont été supprimées' AS details;
