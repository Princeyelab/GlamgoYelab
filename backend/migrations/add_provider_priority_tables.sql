-- Migration: Ajout des tables et colonnes pour la priorite et le blocage des prestataires
-- Date: 2024

-- =====================================================
-- 1. Ajouter les colonnes de blocage a la table providers
-- =====================================================

-- Colonne pour le blocage permanent
ALTER TABLE providers ADD COLUMN IF NOT EXISTS is_blocked TINYINT(1) DEFAULT 0;

-- Colonne pour la date de fin de blocage temporaire
ALTER TABLE providers ADD COLUMN IF NOT EXISTS blocked_until DATETIME DEFAULT NULL;

-- Colonne pour la raison du blocage
ALTER TABLE providers ADD COLUMN IF NOT EXISTS block_reason TEXT DEFAULT NULL;

-- Index pour optimiser les requetes de filtrage
CREATE INDEX IF NOT EXISTS idx_providers_is_blocked ON providers(is_blocked);
CREATE INDEX IF NOT EXISTS idx_providers_blocked_until ON providers(blocked_until);


-- =====================================================
-- 2. Creer la table d'historique des blocages
-- =====================================================

CREATE TABLE IF NOT EXISTS provider_block_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    action ENUM('block', 'unblock', 'warning') NOT NULL,
    block_type ENUM('temporary', 'permanent') DEFAULT NULL,
    reason TEXT NOT NULL,
    duration_days INT DEFAULT NULL,
    blocked_until DATETIME DEFAULT NULL,
    admin_id INT DEFAULT NULL,
    is_automatic TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    INDEX idx_block_history_provider (provider_id),
    INDEX idx_block_history_action (action),
    INDEX idx_block_history_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================
-- 3. Creer la table des avertissements
-- =====================================================

CREATE TABLE IF NOT EXISTS provider_warnings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    warning_type ENUM('rating_drop', 'bad_reviews', 'cancellation', 'other') NOT NULL,
    message TEXT NOT NULL,
    admin_id INT DEFAULT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    INDEX idx_warnings_provider (provider_id),
    INDEX idx_warnings_type (warning_type),
    INDEX idx_warnings_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================
-- 4. Creer la table d'historique des notes (pour suivre l'evolution)
-- =====================================================

CREATE TABLE IF NOT EXISTS provider_rating_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    rating DECIMAL(3,2) NOT NULL,
    review_count INT NOT NULL DEFAULT 0,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    INDEX idx_rating_history_provider (provider_id),
    INDEX idx_rating_history_date (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================
-- 5. Ajouter la colonne cancelled_by a la table orders si elle n'existe pas
-- =====================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_by ENUM('client', 'provider', 'system', 'admin') DEFAULT NULL;


-- =====================================================
-- 6. Creer un evenement pour enregistrer l'historique des notes quotidiennement
-- =====================================================

-- Note: Cet evenement necessite que event_scheduler soit active dans MySQL
-- SET GLOBAL event_scheduler = ON;

DELIMITER //

CREATE EVENT IF NOT EXISTS record_daily_provider_ratings
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 1 DAY + INTERVAL 2 HOUR
DO
BEGIN
    INSERT INTO provider_rating_history (provider_id, rating, review_count)
    SELECT id, COALESCE(rating, 0), COALESCE(review_count, 0)
    FROM providers
    WHERE is_blocked = 0 OR is_blocked IS NULL;
END//

DELIMITER ;


-- =====================================================
-- 7. Procedure stockee pour verifier et bloquer automatiquement
-- =====================================================

DELIMITER //

CREATE PROCEDURE IF NOT EXISTS check_and_block_low_rated_providers()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE p_id INT;
    DECLARE p_rating DECIMAL(3,2);
    DECLARE p_review_count INT;
    DECLARE block_count INT;
    DECLARE block_duration INT;
    DECLARE block_type VARCHAR(20);

    -- Curseur pour les prestataires sous le seuil
    DECLARE provider_cursor CURSOR FOR
        SELECT id, rating, review_count
        FROM providers
        WHERE rating < 2.5
        AND review_count >= 5
        AND (is_blocked = 0 OR is_blocked IS NULL)
        AND (blocked_until IS NULL OR blocked_until <= NOW());

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN provider_cursor;

    read_loop: LOOP
        FETCH provider_cursor INTO p_id, p_rating, p_review_count;
        IF done THEN
            LEAVE read_loop;
        END IF;

        -- Compter les blocages precedents
        SELECT COUNT(*) INTO block_count
        FROM provider_block_history
        WHERE provider_id = p_id AND action = 'block';

        -- Determiner le type et la duree du blocage
        CASE block_count
            WHEN 0 THEN SET block_duration = 7; SET block_type = 'temporary';
            WHEN 1 THEN SET block_duration = 14; SET block_type = 'temporary';
            WHEN 2 THEN SET block_duration = 30; SET block_type = 'temporary';
            ELSE SET block_duration = -1; SET block_type = 'permanent';
        END CASE;

        -- Appliquer le blocage
        IF block_type = 'permanent' THEN
            UPDATE providers
            SET is_blocked = 1,
                blocked_until = NULL,
                block_reason = CONCAT('Blocage automatique: note moyenne (', p_rating, ') inferieure au seuil')
            WHERE id = p_id;
        ELSE
            UPDATE providers
            SET is_blocked = 0,
                blocked_until = DATE_ADD(NOW(), INTERVAL block_duration DAY),
                block_reason = CONCAT('Blocage automatique: note moyenne (', p_rating, ') inferieure au seuil')
            WHERE id = p_id;
        END IF;

        -- Enregistrer dans l'historique
        INSERT INTO provider_block_history
        (provider_id, action, block_type, reason, duration_days, blocked_until, is_automatic)
        VALUES (
            p_id,
            'block',
            block_type,
            CONCAT('Blocage automatique: note moyenne (', p_rating, ') inferieure au seuil'),
            IF(block_type = 'permanent', NULL, block_duration),
            IF(block_type = 'permanent', NULL, DATE_ADD(NOW(), INTERVAL block_duration DAY)),
            1
        );

        -- Envoyer notification
        INSERT INTO provider_notifications (provider_id, type, title, message)
        VALUES (
            p_id,
            'account_blocked',
            'Compte suspendu',
            IF(block_type = 'permanent',
                CONCAT('Votre compte a ete suspendu definitivement en raison d\'une note moyenne trop basse (', p_rating, '/5).'),
                CONCAT('Votre compte a ete suspendu pour ', block_duration, ' jours en raison d\'une note moyenne trop basse (', p_rating, '/5).')
            )
        );

    END LOOP;

    CLOSE provider_cursor;
END//

DELIMITER ;


-- =====================================================
-- 8. Vue pour les statistiques de priorite
-- =====================================================

CREATE OR REPLACE VIEW provider_priority_stats AS
SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.rating,
    p.review_count,
    p.is_blocked,
    p.blocked_until,
    CASE
        WHEN p.review_count < 3 THEN 'NEW'
        WHEN p.rating >= 4.5 THEN 'EXCELLENT'
        WHEN p.rating >= 4.0 THEN 'GOOD'
        WHEN p.rating >= 3.5 THEN 'AVERAGE'
        WHEN p.rating >= 3.0 THEN 'LOW'
        ELSE 'CRITICAL'
    END AS priority_level,
    CASE
        WHEN p.review_count < 3 THEN 60
        WHEN p.rating >= 4.5 THEN 0
        WHEN p.rating >= 4.0 THEN 30
        WHEN p.rating >= 3.5 THEN 60
        WHEN p.rating >= 3.0 THEN 120
        ELSE 300
    END AS notification_delay_seconds,
    (SELECT COUNT(*) FROM orders o WHERE o.provider_id = p.id AND o.status = 'completed') AS completed_orders,
    (SELECT COUNT(*) FROM orders o WHERE o.provider_id = p.id AND o.status = 'cancelled' AND o.cancelled_by = 'provider') AS cancelled_orders,
    (SELECT COUNT(*) FROM provider_block_history bh WHERE bh.provider_id = p.id AND bh.action = 'block') AS total_blocks
FROM providers p;
