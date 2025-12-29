-- Migration: Système d'annulation avec frais et litiges
-- Date: 2025-12-14
-- Description: Ajoute les frais d'annulation variables, pénalités prestataires et système de litiges

-- =====================================================
-- 1. Ajout des champs d'annulation à la table orders
-- =====================================================

-- Champs pour les frais d'annulation
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_fee DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_fee_percentage INT DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(20) NULL; -- 'client' ou 'provider'
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP NULL;

-- Position du prestataire au moment de l'annulation (pour calcul distance parcourue)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_provider_lat DECIMAL(10, 8) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_provider_lng DECIMAL(11, 8) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_distance_traveled DECIMAL(10, 2) NULL; -- en km

-- =====================================================
-- 2. Table des pénalités prestataires
-- =====================================================

CREATE TABLE IF NOT EXISTS provider_penalties (
    id SERIAL PRIMARY KEY,
    provider_id INT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    order_id INT NULL REFERENCES orders(id) ON DELETE SET NULL,
    penalty_type VARCHAR(50) NOT NULL, -- 'cancellation', 'no_show', 'late', 'bad_service'
    severity VARCHAR(20) NOT NULL DEFAULT 'warning', -- 'warning', 'minor', 'major', 'critical'
    points INT NOT NULL DEFAULT 1, -- Points de pénalité (accumulation = suspension)
    reason TEXT NULL,
    -- Actions prises
    action_taken VARCHAR(50) NULL, -- 'warning', 'temporary_suspension', 'permanent_ban'
    suspension_until TIMESTAMP NULL, -- Date de fin de suspension
    -- Métadonnées
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    resolved_by INT NULL, -- Admin qui a résolu
    resolution_notes TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_provider_penalties_provider ON provider_penalties(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_penalties_type ON provider_penalties(penalty_type);
CREATE INDEX IF NOT EXISTS idx_provider_penalties_created ON provider_penalties(created_at);

-- =====================================================
-- 3. Table des litiges (disputes)
-- =====================================================

CREATE TABLE IF NOT EXISTS disputes (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    -- Qui a ouvert le litige
    opened_by_type VARCHAR(20) NOT NULL, -- 'client' ou 'provider'
    opened_by_id INT NOT NULL,
    -- Catégorie et détails
    category VARCHAR(50) NOT NULL, -- 'service_quality', 'no_show', 'overcharge', 'damage', 'harassment', 'other'
    description TEXT NOT NULL,
    -- Preuves
    evidence_urls TEXT NULL, -- JSON array of photo/video URLs
    -- Statut
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'under_review', 'resolved', 'escalated', 'closed'
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    -- Résolution
    resolution_type VARCHAR(50) NULL, -- 'refund_full', 'refund_partial', 'no_refund', 'compensation', 'penalty'
    resolution_amount DECIMAL(10, 2) NULL,
    resolution_notes TEXT NULL,
    resolved_by INT NULL, -- Admin ID
    resolved_at TIMESTAMP NULL,
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Délai de contestation (48h après service)
    expires_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_disputes_order ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_opened_by ON disputes(opened_by_type, opened_by_id);
CREATE INDEX IF NOT EXISTS idx_disputes_created ON disputes(created_at);

-- =====================================================
-- 4. Table des messages de litige
-- =====================================================

CREATE TABLE IF NOT EXISTS dispute_messages (
    id SERIAL PRIMARY KEY,
    dispute_id INT NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL, -- 'client', 'provider', 'admin'
    sender_id INT NOT NULL,
    message TEXT NOT NULL,
    attachment_url TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute ON dispute_messages(dispute_id);

-- =====================================================
-- 5. Ajout des champs de suspension aux prestataires
-- =====================================================

ALTER TABLE providers ADD COLUMN IF NOT EXISTS penalty_points INT DEFAULT 0;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP NULL;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS suspension_reason TEXT NULL;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS total_cancellations INT DEFAULT 0;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS cancellation_rate DECIMAL(5, 2) DEFAULT 0.00;

-- =====================================================
-- 6. Configuration des règles d'annulation
-- =====================================================

CREATE TABLE IF NOT EXISTS cancellation_rules (
    id SERIAL PRIMARY KEY,
    status VARCHAR(20) NOT NULL, -- 'pending', 'accepted', 'on_way'
    cancelled_by VARCHAR(20) NOT NULL, -- 'client', 'provider'
    hours_before_appointment INT NULL, -- NULL = any time
    min_fee_percentage INT DEFAULT 0,
    max_fee_percentage INT DEFAULT 0,
    provider_penalty_points INT DEFAULT 0,
    description TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insérer les règles par défaut
INSERT INTO cancellation_rules (status, cancelled_by, hours_before_appointment, min_fee_percentage, max_fee_percentage, provider_penalty_points, description) VALUES
-- Client cancellations
('pending', 'client', NULL, 0, 0, 0, 'Client annule commande en attente - Gratuit'),
('accepted', 'client', 2, 0, 0, 0, 'Client annule > 2h avant RDV - Gratuit'),
('accepted', 'client', 0, 50, 50, 0, 'Client annule < 2h avant RDV - 50% frais'),
('on_way', 'client', NULL, 50, 100, 0, 'Client annule prestataire en route - 50-100% selon distance'),
-- Provider cancellations
('pending', 'provider', NULL, 0, 0, 1, 'Prestataire annule commande en attente - 1 point'),
('accepted', 'provider', 2, 0, 0, 2, 'Prestataire annule > 2h avant - 2 points'),
('accepted', 'provider', 0, 0, 0, 5, 'Prestataire annule < 2h avant - 5 points'),
('on_way', 'provider', NULL, 0, 0, 10, 'Prestataire annule en route - 10 points + suspension possible')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. Seuils de pénalité pour suspension
-- =====================================================

CREATE TABLE IF NOT EXISTS penalty_thresholds (
    id SERIAL PRIMARY KEY,
    points_min INT NOT NULL,
    points_max INT NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'warning', 'suspension_24h', 'suspension_7d', 'suspension_30d', 'permanent_ban'
    suspension_hours INT NULL,
    description TEXT NULL
);

INSERT INTO penalty_thresholds (points_min, points_max, action, suspension_hours, description) VALUES
(5, 9, 'warning', NULL, 'Avertissement envoyé'),
(10, 19, 'suspension_24h', 24, 'Suspension 24 heures'),
(20, 29, 'suspension_7d', 168, 'Suspension 7 jours'),
(30, 49, 'suspension_30d', 720, 'Suspension 30 jours'),
(50, 999, 'permanent_ban', NULL, 'Bannissement permanent')
ON CONFLICT DO NOTHING;
