-- =====================================================
-- Migration 013: Provider Formulas System
-- GlamGo - Formules de reservation par prestataire
-- =====================================================

-- Table des formules disponibles
CREATE TABLE IF NOT EXISTS formulas (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(10) DEFAULT '📅',
    price_modifier DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    badge_text VARCHAR(20) DEFAULT NULL,
    badge_color VARCHAR(20) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de liaison prestataires <-> formules
CREATE TABLE IF NOT EXISTS provider_formulas (
    id SERIAL PRIMARY KEY,
    provider_id INT NOT NULL,
    formula_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(provider_id, formula_id),
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    FOREIGN KEY (formula_id) REFERENCES formulas(id) ON DELETE CASCADE
);

-- =====================================================
-- Formules par defaut (5 formules)
-- =====================================================

INSERT INTO formulas (slug, name, description, icon, price_modifier, badge_text, badge_color, is_active, sort_order)
VALUES
    ('standard', 'Standard', 'Reservation classique avec prestataire disponible', '📅', 1.00, NULL, NULL, TRUE, 1),
    ('premium', 'Premium', 'Prestataire experimente, produits haut de gamme', '⭐', 1.30, '+30%', '#F59E0B', TRUE, 2),
    ('urgent', 'Urgent', 'Intervention dans les 2 heures', '⚡', 1.50, '+50%', '#EF4444', TRUE, 3),
    ('recurring', 'Recurrent', 'Reservation hebdomadaire ou mensuelle', '🔄', 0.90, '-10%', '#10B981', TRUE, 4),
    ('night', 'Nuit', 'Service entre 20h et 8h', '🌙', 1.25, '+25%', '#14B8A6', TRUE, 5)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    price_modifier = EXCLUDED.price_modifier,
    badge_text = EXCLUDED.badge_text,
    badge_color = EXCLUDED.badge_color;

-- =====================================================
-- Index pour performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_provider_formulas_provider ON provider_formulas(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_formulas_formula ON provider_formulas(formula_id);
CREATE INDEX IF NOT EXISTS idx_provider_formulas_active ON provider_formulas(is_active);
CREATE INDEX IF NOT EXISTS idx_formulas_active ON formulas(is_active);
CREATE INDEX IF NOT EXISTS idx_formulas_slug ON formulas(slug);
