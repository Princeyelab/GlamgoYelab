-- =====================================================
-- Migration 014 : Amélioration système de chat
-- Suppression WhatsApp + chat interne renforcé
-- =====================================================

-- Améliorer table messages existante
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS message_type ENUM('text', 'image', 'system') DEFAULT 'text'
COMMENT 'Type de message';

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(500) DEFAULT NULL
COMMENT 'URL de la pièce jointe (image)';

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP NULL DEFAULT NULL
COMMENT 'Date de lecture du message';

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE
COMMENT 'Message bloqué (contient infos de contact)';

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS blocked_reason VARCHAR(255) DEFAULT NULL
COMMENT 'Raison du blocage';

-- Ajouter colonne is_read si elle n'existe pas
-- (elle peut déjà exister dans certains cas)
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE
COMMENT 'Message lu par le destinataire';

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

-- Ajouter statut en ligne pour users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP NULL DEFAULT NULL
COMMENT 'Dernière activité';

-- Ajouter statut en ligne pour providers
ALTER TABLE providers
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP NULL DEFAULT NULL
COMMENT 'Dernière activité';

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_messages_order_date ON messages(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(is_read, sender_type);
CREATE INDEX IF NOT EXISTS idx_messages_blocked ON messages(is_blocked);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_providers_last_seen ON providers(last_seen_at);

-- Table pour tracking détaillé des lectures (optionnel, pour futur)
CREATE TABLE IF NOT EXISTS message_reads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    message_id INT NOT NULL,
    user_id INT DEFAULT NULL,
    provider_id INT DEFAULT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,

    INDEX idx_message_user (message_id, user_id),
    INDEX idx_message_provider (message_id, provider_id),
    UNIQUE KEY unique_message_reader (message_id, user_id, provider_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Enregistrer la migration
-- =====================================================
INSERT INTO migrations (migration, executed_at)
VALUES ('014_enhance_chat_system', NOW())
ON DUPLICATE KEY UPDATE executed_at = NOW();
