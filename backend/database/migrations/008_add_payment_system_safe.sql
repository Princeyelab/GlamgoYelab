-- =====================================================
-- Migration 008 SAFE : Système de paiement complet
-- Version sécurisée qui ignore les colonnes existantes
-- GlamGo - Phase 1 Fondations
-- Date : 2025-11-24
-- =====================================================

-- Modifications table users (ignore si existe déjà)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS payment_method_validated BOOLEAN DEFAULT FALSE COMMENT 'Carte bancaire validée';

ALTER TABLE users
ADD COLUMN IF NOT EXISTS card_last4 VARCHAR(4) COMMENT 'Derniers 4 chiffres CB';

ALTER TABLE users
ADD COLUMN IF NOT EXISTS card_brand VARCHAR(20) COMMENT 'Visa, Mastercard, etc.';

ALTER TABLE users
ADD COLUMN IF NOT EXISTS card_token VARCHAR(255) COMMENT 'Token sécurisé passerelle';

ALTER TABLE users
ADD COLUMN IF NOT EXISTS card_added_at TIMESTAMP NULL COMMENT 'Date ajout carte';

-- Modifications table providers (ignore si existe déjà)
ALTER TABLE providers
ADD COLUMN IF NOT EXISTS payment_method_validated BOOLEAN DEFAULT FALSE COMMENT 'Méthode paiement validée';

ALTER TABLE providers
ADD COLUMN IF NOT EXISTS bank_account_iban VARCHAR(34) COMMENT 'IBAN du prestataire';

ALTER TABLE providers
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100) COMMENT 'Nom de la banque';

ALTER TABLE providers
ADD COLUMN IF NOT EXISTS bank_account_validated BOOLEAN DEFAULT FALSE COMMENT 'IBAN vérifié';

ALTER TABLE providers
ADD COLUMN IF NOT EXISTS bank_account_added_at TIMESTAMP NULL COMMENT 'Date ajout IBAN';

-- =====================================================
-- Table transactions : Historique complet des paiements
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Références
    order_id INT NOT NULL COMMENT 'ID commande',
    user_id INT NOT NULL COMMENT 'ID client',
    provider_id INT NOT NULL COMMENT 'ID prestataire',

    -- Montants (en MAD)
    amount DECIMAL(10,2) NOT NULL COMMENT 'Montant total TTC',
    commission_glamgo DECIMAL(10,2) NOT NULL COMMENT 'Commission GlamGo (20%)',
    provider_amount DECIMAL(10,2) NOT NULL COMMENT 'Montant net prestataire',

    -- Méthode de paiement
    payment_method ENUM('card', 'cash') NOT NULL COMMENT 'Carte ou espèces',

    -- Statut transaction
    status ENUM('pending', 'completed', 'failed', 'refunded', 'cancelled') DEFAULT 'pending',

    -- Détails carte bancaire (si applicable)
    card_last4 VARCHAR(4) COMMENT 'Derniers 4 chiffres',
    card_brand VARCHAR(20) COMMENT 'Type de carte',

    -- Intégration passerelle paiement
    payment_gateway_id VARCHAR(255) COMMENT 'ID transaction passerelle',
    payment_gateway_response JSON COMMENT 'Réponse complète passerelle',

    -- Informations complémentaires
    failure_reason TEXT COMMENT 'Raison échec paiement',
    refund_reason TEXT COMMENT 'Raison remboursement',

    -- Dates
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL COMMENT 'Date paiement réussi',
    failed_at TIMESTAMP NULL COMMENT 'Date échec',
    refunded_at TIMESTAMP NULL COMMENT 'Date remboursement',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Index pour performances
    INDEX idx_order_id (order_id),
    INDEX idx_user_id (user_id),
    INDEX idx_provider_id (provider_id),
    INDEX idx_status (status),
    INDEX idx_payment_method (payment_method),
    INDEX idx_created_at (created_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historique complet des transactions de paiement';

-- =====================================================
-- Table payment_methods : Cartes bancaires enregistrées
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_methods (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Propriétaire (client OU prestataire)
    user_id INT NULL COMMENT 'ID client',
    provider_id INT NULL COMMENT 'ID prestataire',

    -- Informations carte
    card_last4 VARCHAR(4) NOT NULL COMMENT 'Derniers 4 chiffres',
    card_brand VARCHAR(20) NOT NULL COMMENT 'Visa, Mastercard, Amex',
    card_exp_month TINYINT NOT NULL COMMENT 'Mois expiration (1-12)',
    card_exp_year SMALLINT NOT NULL COMMENT 'Année expiration',
    card_token VARCHAR(255) NOT NULL COMMENT 'Token sécurisé passerelle',
    card_fingerprint VARCHAR(64) COMMENT 'Empreinte unique carte',

    -- Gestion
    is_default BOOLEAN DEFAULT TRUE COMMENT 'Carte par défaut',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Carte active',

    -- Dates
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP NULL COMMENT 'Dernière utilisation',

    -- Index
    INDEX idx_user_id (user_id),
    INDEX idx_provider_id (provider_id),
    INDEX idx_is_default (is_default),
    INDEX idx_is_active (is_active)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Cartes bancaires enregistrées (clients et prestataires)';

-- =====================================================
-- Table payment_logs : Logs détaillés pour audit
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Référence
    transaction_id INT NULL COMMENT 'ID transaction si existe',

    -- Type événement
    event_type ENUM(
        'card_validation_attempt',
        'card_validation_success',
        'card_validation_failed',
        'payment_initiated',
        'payment_success',
        'payment_failed',
        'refund_initiated',
        'refund_completed',
        'gateway_error'
    ) NOT NULL,

    -- Détails
    user_id INT NULL,
    provider_id INT NULL,
    order_id INT NULL,

    amount DECIMAL(10,2) NULL,
    payment_method VARCHAR(20),

    -- Données techniques
    request_data JSON COMMENT 'Données requête (sans infos sensibles)',
    response_data JSON COMMENT 'Réponse passerelle',

    -- Erreur
    error_code VARCHAR(50),
    error_message TEXT,

    -- Métadonnées
    ip_address VARCHAR(45),
    user_agent TEXT,

    -- Date
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Index
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at),
    INDEX idx_user_id (user_id),
    INDEX idx_order_id (order_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Logs détaillés pour audit et debug paiements';

-- =====================================================
-- Modification table orders : ajout champs paiement
-- =====================================================
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_status ENUM('unpaid', 'paid', 'refunded', 'failed') DEFAULT 'unpaid' COMMENT 'Statut paiement';

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS transaction_id INT NULL COMMENT 'Référence transaction';

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMP NULL COMMENT 'Date paiement effectué';

-- Index sur payment_status si pas déjà existant
ALTER TABLE orders
ADD INDEX IF NOT EXISTS idx_payment_status (payment_status);

-- =====================================================
-- Vue : Dashboard finances
-- =====================================================
CREATE OR REPLACE VIEW v_payment_dashboard AS
SELECT
    DATE(t.created_at) as date,
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as transactions_reussies,
    COUNT(CASE WHEN t.status = 'failed' THEN 1 END) as transactions_echouees,
    COUNT(CASE WHEN t.payment_method = 'card' THEN 1 END) as paiements_cb,
    COUNT(CASE WHEN t.payment_method = 'cash' THEN 1 END) as paiements_cash,
    SUM(t.amount) as montant_total,
    SUM(t.commission_glamgo) as commission_totale,
    SUM(t.provider_amount) as montant_prestataires
FROM transactions t
GROUP BY DATE(t.created_at)
ORDER BY date DESC;

-- =====================================================
-- Données initiales : Configuration paiement
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(50) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO payment_config (config_key, config_value, description) VALUES
('commission_rate', '0.20', 'Taux de commission GlamGo (20%)'),
('min_transaction_amount', '50.00', 'Montant minimum transaction (MAD)'),
('max_transaction_amount', '10000.00', 'Montant maximum transaction (MAD)'),
('payment_gateway_mode', 'mock', 'Mode passerelle: mock, sandbox, production'),
('auto_transfer_enabled', 'false', 'Transfert automatique aux prestataires'),
('refund_enabled', 'false', 'Remboursements activés (manuel pour l\'instant)')
ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);

-- =====================================================
-- FIN MIGRATION 008 SAFE
-- =====================================================
