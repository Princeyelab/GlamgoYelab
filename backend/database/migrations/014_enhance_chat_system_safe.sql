-- =====================================================
-- Migration 014 : Amelioration systeme de chat
-- Suppression WhatsApp + chat interne renforce
-- Version compatible MySQL 5.7/8.0
-- =====================================================

-- Desactiver les checks temporairement
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS=0;

-- Procedure pour ajouter une colonne si elle n'existe pas
DROP PROCEDURE IF EXISTS add_column_if_not_exists;
DELIMITER //
CREATE PROCEDURE add_column_if_not_exists(
    IN p_table VARCHAR(64),
    IN p_column VARCHAR(64),
    IN p_definition VARCHAR(500)
)
BEGIN
    SET @column_exists = (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = p_table
        AND COLUMN_NAME = p_column
    );

    IF @column_exists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE ', p_table, ' ADD COLUMN ', p_column, ' ', p_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- Ajouter colonnes a la table messages
CALL add_column_if_not_exists('messages', 'message_type', "ENUM('text', 'image', 'system') DEFAULT 'text' COMMENT 'Type de message'");
CALL add_column_if_not_exists('messages', 'attachment_url', "VARCHAR(500) DEFAULT NULL COMMENT 'URL de la piece jointe'");
CALL add_column_if_not_exists('messages', 'read_at', "TIMESTAMP NULL DEFAULT NULL COMMENT 'Date de lecture'");
CALL add_column_if_not_exists('messages', 'is_blocked', "BOOLEAN DEFAULT FALSE COMMENT 'Message bloque'");
CALL add_column_if_not_exists('messages', 'blocked_reason', "VARCHAR(255) DEFAULT NULL COMMENT 'Raison du blocage'");
CALL add_column_if_not_exists('messages', 'is_read', "BOOLEAN DEFAULT FALSE COMMENT 'Message lu'");

-- Ajouter last_seen_at aux users et providers
CALL add_column_if_not_exists('users', 'last_seen_at', "TIMESTAMP NULL DEFAULT NULL COMMENT 'Derniere activite'");
CALL add_column_if_not_exists('providers', 'last_seen_at', "TIMESTAMP NULL DEFAULT NULL COMMENT 'Derniere activite'");

-- Supprimer la procedure temporaire
DROP PROCEDURE IF EXISTS add_column_if_not_exists;

-- Supprimer colonnes WhatsApp dans users (si elles existent)
SET @exists_user_whatsapp = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'whatsapp');
SET @sql_user = IF(@exists_user_whatsapp > 0, 'ALTER TABLE users DROP COLUMN whatsapp', 'SELECT 1');
PREPARE stmt FROM @sql_user;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer colonnes WhatsApp dans providers (si elles existent)
SET @exists_provider_whatsapp = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'providers' AND COLUMN_NAME = 'whatsapp');
SET @sql_provider = IF(@exists_provider_whatsapp > 0, 'ALTER TABLE providers DROP COLUMN whatsapp', 'SELECT 1');
PREPARE stmt FROM @sql_provider;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Creer index (ignore si existe deja)
-- MySQL n'a pas CREATE INDEX IF NOT EXISTS, donc on utilise une procedure
DROP PROCEDURE IF EXISTS create_index_if_not_exists;
DELIMITER //
CREATE PROCEDURE create_index_if_not_exists(
    IN p_table VARCHAR(64),
    IN p_index VARCHAR(64),
    IN p_columns VARCHAR(255)
)
BEGIN
    SET @index_exists = (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = p_table
        AND INDEX_NAME = p_index
    );

    IF @index_exists = 0 THEN
        SET @sql = CONCAT('CREATE INDEX ', p_index, ' ON ', p_table, '(', p_columns, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

CALL create_index_if_not_exists('messages', 'idx_messages_order_date', 'order_id, created_at DESC');
CALL create_index_if_not_exists('messages', 'idx_messages_read', 'is_read, sender_type');
CALL create_index_if_not_exists('messages', 'idx_messages_blocked', 'is_blocked');
CALL create_index_if_not_exists('users', 'idx_users_last_seen', 'last_seen_at');
CALL create_index_if_not_exists('providers', 'idx_providers_last_seen', 'last_seen_at');

DROP PROCEDURE IF EXISTS create_index_if_not_exists;

-- Table pour tracking detaille des lectures
CREATE TABLE IF NOT EXISTS message_reads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    message_id INT NOT NULL,
    user_id INT DEFAULT NULL,
    provider_id INT DEFAULT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_message_user (message_id, user_id),
    INDEX idx_message_provider (message_id, provider_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ajouter les foreign keys separement (pour eviter erreurs si table n'existe pas)
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'message_reads' AND CONSTRAINT_NAME = 'fk_message_reads_message');
SET @sql_fk = IF(@fk_exists = 0,
    'ALTER TABLE message_reads ADD CONSTRAINT fk_message_reads_message FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE',
    'SELECT 1');
PREPARE stmt FROM @sql_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Reactiver les checks
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;

-- =====================================================
-- Enregistrer la migration
-- =====================================================
CREATE TABLE IF NOT EXISTS migrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    migration VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO migrations (migration, executed_at)
VALUES ('014_enhance_chat_system', NOW())
ON DUPLICATE KEY UPDATE executed_at = NOW();

SELECT 'Migration 014_enhance_chat_system executee avec succes!' AS result;
