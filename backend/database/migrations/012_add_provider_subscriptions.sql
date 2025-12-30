-- =====================================================
-- Migration 012: Provider Subscription Plans System
-- GlamGo - Formules Premium & Packagings
-- =====================================================

-- Table des plans d'abonnement disponibles
CREATE TABLE IF NOT EXISTS subscription_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    duration_days INT NOT NULL DEFAULT 30 COMMENT 'Duree en jours (30 = mensuel, 365 = annuel)',
    features JSON COMMENT 'Liste des fonctionnalites incluses',

    -- Avantages
    visibility_boost INT DEFAULT 0 COMMENT 'Boost de visibilite en pourcentage (0-100)',
    priority_level INT DEFAULT 0 COMMENT 'Niveau de priorite dans les recherches (0-10)',
    commission_rate DECIMAL(5,2) DEFAULT 20.00 COMMENT 'Taux de commission GlamGo',
    max_services INT DEFAULT NULL COMMENT 'Nombre max de services (NULL = illimite)',
    max_photos INT DEFAULT 5 COMMENT 'Nombre max de photos profil',
    can_access_stats BOOLEAN DEFAULT FALSE COMMENT 'Acces aux statistiques avancees',
    can_access_chat BOOLEAN DEFAULT TRUE COMMENT 'Acces au chat client',
    can_urgent_bookings BOOLEAN DEFAULT FALSE COMMENT 'Peut recevoir des reservations urgentes',
    badge_type VARCHAR(50) DEFAULT NULL COMMENT 'Badge affiche (gold, silver, verified, etc.)',

    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    is_recommended BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des abonnements des prestataires
CREATE TABLE IF NOT EXISTS provider_subscriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    provider_id INT NOT NULL,
    plan_id INT NOT NULL,

    -- Statut
    status ENUM('pending_payment', 'active', 'expired', 'cancelled', 'suspended') DEFAULT 'pending_payment',

    -- Dates
    started_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,

    -- Paiement
    payment_method ENUM('card', 'cash', 'transfer', 'free') DEFAULT 'card',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_amount DECIMAL(10,2) DEFAULT 0,
    transaction_id VARCHAR(100) DEFAULT NULL,

    -- Renouvellement
    auto_renew BOOLEAN DEFAULT FALSE,
    renewal_reminder_sent BOOLEAN DEFAULT FALSE,

    -- Historique
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT
);

-- Ajouter colonnes aux providers pour le statut d'abonnement
ALTER TABLE providers
ADD COLUMN IF NOT EXISTS subscription_plan_id INT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS subscription_status ENUM('none', 'pending', 'active', 'expired') DEFAULT 'none',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS badge_type VARCHAR(50) DEFAULT NULL;

-- =====================================================
-- Plans d'abonnement par defaut
-- =====================================================

-- Plan Gratuit (Decouverte)
INSERT INTO subscription_plans (name, slug, description, price, duration_days, features, visibility_boost, priority_level, commission_rate, max_services, max_photos, can_access_stats, can_urgent_bookings, badge_type, is_active, sort_order)
VALUES (
    'Decouverte',
    'free',
    'Plan gratuit pour debuter sur GlamGo',
    0,
    365,
    JSON_ARRAY(
        'Profil basique',
        '3 services maximum',
        'Commission standard 20%',
        'Visibilite normale'
    ),
    0,
    0,
    20.00,
    3,
    3,
    FALSE,
    FALSE,
    NULL,
    TRUE,
    1
) ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Plan Essentiel
INSERT INTO subscription_plans (name, slug, description, price, duration_days, features, visibility_boost, priority_level, commission_rate, max_services, max_photos, can_access_stats, can_urgent_bookings, badge_type, is_active, is_recommended, sort_order)
VALUES (
    'Essentiel',
    'essential',
    'L''essentiel pour developper votre activite',
    99,
    30,
    JSON_ARRAY(
        'Profil complet',
        '10 services maximum',
        'Commission reduite 18%',
        '+20% de visibilite',
        'Statistiques basiques',
        'Badge Verifie'
    ),
    20,
    3,
    18.00,
    10,
    5,
    TRUE,
    FALSE,
    'verified',
    TRUE,
    TRUE,
    2
) ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Plan Premium
INSERT INTO subscription_plans (name, slug, description, price, duration_days, features, visibility_boost, priority_level, commission_rate, max_services, max_photos, can_access_stats, can_urgent_bookings, badge_type, is_active, sort_order)
VALUES (
    'Premium',
    'premium',
    'Maximisez votre visibilite et vos revenus',
    199,
    30,
    JSON_ARRAY(
        'Profil premium complet',
        'Services illimites',
        'Commission reduite 15%',
        '+50% de visibilite',
        'Priorite dans les recherches',
        'Statistiques avancees',
        'Reservations urgentes',
        'Badge Gold',
        '10 photos profil'
    ),
    50,
    7,
    15.00,
    NULL,
    10,
    TRUE,
    TRUE,
    'gold',
    TRUE,
    3
) ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Plan VIP
INSERT INTO subscription_plans (name, slug, description, price, duration_days, features, visibility_boost, priority_level, commission_rate, max_services, max_photos, can_access_stats, can_urgent_bookings, badge_type, is_active, sort_order)
VALUES (
    'VIP',
    'vip',
    'L''excellence pour les professionnels etablis',
    399,
    30,
    JSON_ARRAY(
        'Tous les avantages Premium',
        'Commission minimale 12%',
        '+100% de visibilite',
        'Priorite maximale',
        'Support prioritaire 24/7',
        'Badge VIP exclusif',
        'Photos illimitees',
        'Mise en avant sur la page d''accueil'
    ),
    100,
    10,
    12.00,
    NULL,
    50,
    TRUE,
    TRUE,
    'vip',
    TRUE,
    4
) ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =====================================================
-- Index pour performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider ON provider_subscriptions(provider_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON provider_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires ON provider_subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_plans_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_providers_subscription ON providers(subscription_plan_id, subscription_status);

-- =====================================================
-- Vue pour les abonnements actifs
-- =====================================================
CREATE OR REPLACE VIEW v_active_subscriptions AS
SELECT
    ps.id,
    ps.provider_id,
    ps.plan_id,
    ps.status,
    ps.started_at,
    ps.expires_at,
    ps.payment_status,
    sp.name as plan_name,
    sp.slug as plan_slug,
    sp.price as plan_price,
    sp.visibility_boost,
    sp.priority_level,
    sp.commission_rate,
    sp.badge_type,
    p.first_name,
    p.last_name,
    p.email,
    DATEDIFF(ps.expires_at, NOW()) as days_remaining
FROM provider_subscriptions ps
JOIN subscription_plans sp ON ps.plan_id = sp.id
JOIN providers p ON ps.provider_id = p.id
WHERE ps.status = 'active' AND ps.expires_at > NOW();
