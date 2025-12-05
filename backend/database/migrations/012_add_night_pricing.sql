-- ============================================================================
-- Migration 012: Système de tarification nocturne
-- GlamGo - Marrakech
--
-- Définition nuit : 22h00 - 06h00
-- Commission doublée si prestation sur 2 nuits consécutives
-- ============================================================================

-- Table des règles de tarification
CREATE TABLE IF NOT EXISTS pricing_rules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rule_type ENUM('night_single', 'night_double', 'weekend', 'holiday', 'distance_base') NOT NULL,
    fee_amount DECIMAL(8,2) NOT NULL,
    fee_type ENUM('fixed', 'percentage') DEFAULT 'fixed',
    description TEXT,
    conditions JSON DEFAULT NULL COMMENT 'Conditions d\'application (ex: heures, jours)',
    priority INT DEFAULT 0 COMMENT 'Priorité d\'application (plus haut = prioritaire)',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT DEFAULT NULL,
    UNIQUE KEY unique_rule_type (rule_type),
    INDEX idx_active_priority (active, priority DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Valeurs par défaut pour les frais de nuit
INSERT INTO pricing_rules (rule_type, fee_amount, fee_type, description, conditions, priority) VALUES
('night_single', 30.00, 'fixed', 'Intervention de nuit (22h-6h) - 1 nuit',
 '{"start_hour": 22, "end_hour": 6, "nights_count": 1}', 10),
('night_double', 60.00, 'fixed', 'Intervention de nuit (22h-6h) - 2 nuits consécutives',
 '{"start_hour": 22, "end_hour": 6, "nights_count": 2}', 20)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Ajouter colonnes dans orders pour tracker les frais de nuit
-- Note: MySQL 8.0 ne supporte pas IF NOT EXISTS pour ADD COLUMN
-- On utilise des procédures pour éviter les erreurs si colonnes existent déjà

DROP PROCEDURE IF EXISTS add_night_columns;

DELIMITER //
CREATE PROCEDURE add_night_columns()
BEGIN
    -- Ajouter night_shift_fee si n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = DATABASE()
                   AND table_name = 'orders'
                   AND column_name = 'night_shift_fee') THEN
        ALTER TABLE orders ADD COLUMN night_shift_fee DECIMAL(8,2) DEFAULT 0
            COMMENT 'Montant des frais de nuit appliqués';
    END IF;

    -- Ajouter night_shift_type si n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = DATABASE()
                   AND table_name = 'orders'
                   AND column_name = 'night_shift_type') THEN
        ALTER TABLE orders ADD COLUMN night_shift_type ENUM('none', 'single', 'double') DEFAULT 'none'
            COMMENT 'Type d\'intervention nocturne';
    END IF;

    -- Ajouter night_shift_nights_count si n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = DATABASE()
                   AND table_name = 'orders'
                   AND column_name = 'night_shift_nights_count') THEN
        ALTER TABLE orders ADD COLUMN night_shift_nights_count INT DEFAULT 0
            COMMENT 'Nombre de nuits impactées';
    END IF;

    -- Ajouter night_shift_details si n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = DATABASE()
                   AND table_name = 'orders'
                   AND column_name = 'night_shift_details') THEN
        ALTER TABLE orders ADD COLUMN night_shift_details JSON DEFAULT NULL
            COMMENT 'Détails du calcul des frais de nuit';
    END IF;
END//
DELIMITER ;

CALL add_night_columns();
DROP PROCEDURE IF EXISTS add_night_columns;

-- Table historique des modifications de tarifs (audit)
CREATE TABLE IF NOT EXISTS pricing_rules_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pricing_rule_id INT NOT NULL,
    rule_type VARCHAR(50) NOT NULL,
    old_fee_amount DECIMAL(8,2),
    new_fee_amount DECIMAL(8,2),
    changed_by INT,
    change_reason TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_rule_history (pricing_rule_id, changed_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trigger pour historiser les modifications
DELIMITER //
CREATE TRIGGER IF NOT EXISTS pricing_rules_audit_update
AFTER UPDATE ON pricing_rules
FOR EACH ROW
BEGIN
    IF OLD.fee_amount != NEW.fee_amount THEN
        INSERT INTO pricing_rules_history
            (pricing_rule_id, rule_type, old_fee_amount, new_fee_amount, changed_by)
        VALUES
            (NEW.id, NEW.rule_type, OLD.fee_amount, NEW.fee_amount, NEW.created_by);
    END IF;
END//
DELIMITER ;

-- ============================================================================
-- Exemples de calculs :
--
-- 1. Intervention 23h00 - 01h00 (2h) = 1 nuit = 30 MAD
-- 2. Intervention 23h00 - 08h00 lendemain (9h) = chevauche 1 nuit = 30 MAD
-- 3. Intervention 22h00 Jour 1 - 07h00 Jour 3 (33h) = 2 nuits = 60 MAD
-- 4. Intervention 14h00 - 16h00 = pas de nuit = 0 MAD
-- 5. Intervention 05h00 - 07h00 = fin de nuit = 30 MAD
-- ============================================================================
