-- =====================================================
-- Migration 010: Système de formules de services
-- GlamGo - Tarification dynamique
-- =====================================================

-- Table des formules de services
CREATE TABLE IF NOT EXISTS service_formulas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service_id INT NOT NULL,
    formula_type ENUM('standard', 'recurring', 'premium', 'urgent', 'night') NOT NULL,
    price_modifier_type ENUM('percentage', 'fixed') NOT NULL,
    price_modifier_value DECIMAL(10,2) NOT NULL,
    description TEXT,
    conditions JSON COMMENT 'Conditions spécifiques (heures, jours, etc.)',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    UNIQUE KEY unique_service_formula (service_id, formula_type)
);

-- Ajouter colonnes aux services
ALTER TABLE services
ADD COLUMN IF NOT EXISTS allowed_formulas JSON COMMENT 'Formules autorisées pour ce service',
ADD COLUMN IF NOT EXISTS special_rules JSON COMMENT 'Règles métier spécifiques',
ADD COLUMN IF NOT EXISTS min_booking_hours INT DEFAULT 1 COMMENT 'Durée minimum de réservation',
ADD COLUMN IF NOT EXISTS max_booking_hours INT DEFAULT 8 COMMENT 'Durée maximum de réservation';

-- =====================================================
-- Formules par défaut pour tous les services existants
-- =====================================================

-- Insérer les formules standard pour chaque service
INSERT INTO service_formulas (service_id, formula_type, price_modifier_type, price_modifier_value, description, conditions)
SELECT
    id,
    'standard',
    'percentage',
    0,
    'Tarif de base - Intervention ponctuelle',
    JSON_OBJECT('min_notice_hours', 24)
FROM services
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Formule récurrente (-10%)
INSERT INTO service_formulas (service_id, formula_type, price_modifier_type, price_modifier_value, description, conditions)
SELECT
    id,
    'recurring',
    'percentage',
    -10,
    'Abonnement hebdomadaire ou mensuel - Économisez 10%',
    JSON_OBJECT('min_bookings', 4, 'valid_days', 30)
FROM services
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Formule premium (+30%)
INSERT INTO service_formulas (service_id, formula_type, price_modifier_type, price_modifier_value, description, conditions)
SELECT
    id,
    'premium',
    'percentage',
    30,
    'Service haut de gamme avec équipements premium',
    JSON_OBJECT('includes', JSON_ARRAY('produits_premium', 'garantie_satisfaction'))
FROM services
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Formule urgence (+50 MAD fixe)
INSERT INTO service_formulas (service_id, formula_type, price_modifier_type, price_modifier_value, description, conditions)
SELECT
    id,
    'urgent',
    'fixed',
    50,
    'Intervention urgente en moins de 2 heures',
    JSON_OBJECT('max_delay_hours', 2, 'availability', '7j/7')
FROM services
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Formule nuit (+30 MAD fixe)
INSERT INTO service_formulas (service_id, formula_type, price_modifier_type, price_modifier_value, description, conditions)
SELECT
    id,
    'night',
    'fixed',
    30,
    'Intervention de nuit (22h - 6h)',
    JSON_OBJECT('start_hour', 22, 'end_hour', 6)
FROM services
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- =====================================================
-- Règles spéciales par catégorie de service
-- =====================================================

-- Services Auto : uniquement nettoyage
UPDATE services SET
    special_rules = JSON_OBJECT(
        'service_types', JSON_ARRAY('nettoyage_interne', 'nettoyage_externe', 'polish'),
        'excluded', JSON_ARRAY('mecanique', 'reparation'),
        'note', 'Uniquement services de nettoyage automobile, pas de mécanique',
        'requires_vehicle_info', true
    ),
    allowed_formulas = JSON_ARRAY('standard', 'recurring', 'premium', 'urgent')
WHERE category_id IN (SELECT id FROM categories WHERE slug LIKE '%auto%' OR name LIKE '%Auto%');

-- Services Danse : uniquement orientale
UPDATE services SET
    special_rules = JSON_OBJECT(
        'dance_type', 'orientale',
        'session_types', JSON_ARRAY('cours_prive', 'animation'),
        'note', 'Spécialisé en danse orientale uniquement',
        'min_duration_hours', 1
    ),
    allowed_formulas = JSON_ARRAY('standard', 'recurring', 'premium')
WHERE name LIKE '%Danse%' OR name LIKE '%danse%';

-- Services Animaux : gardiennage avec tracking
UPDATE services SET
    special_rules = JSON_OBJECT(
        'animal_services', JSON_ARRAY('gardiennage', 'promenade'),
        'tracking_required', true,
        'photo_frequency_hours', 2,
        'excluded', JSON_ARRAY('toilettage', 'veterinaire'),
        'note', 'Gardiennage avec suivi GPS et photos toutes les 2h',
        'accepted_animals', JSON_ARRAY('chien', 'chat')
    ),
    allowed_formulas = JSON_ARRAY('standard', 'recurring', 'night')
WHERE name LIKE '%Animaux%' OR name LIKE '%animaux%' OR name LIKE '%Pet%';

-- Services Ménage : toutes formules disponibles
UPDATE services SET
    allowed_formulas = JSON_ARRAY('standard', 'recurring', 'premium', 'urgent', 'night')
WHERE category_id IN (SELECT id FROM categories WHERE slug LIKE '%menage%' OR name LIKE '%Ménage%' OR name LIKE '%Menage%');

-- Services Beauté : standard, récurrent, premium
UPDATE services SET
    special_rules = JSON_OBJECT(
        'requires_consultation', false,
        'hygiene_standards', 'strict',
        'equipment_provided', true
    ),
    allowed_formulas = JSON_ARRAY('standard', 'recurring', 'premium', 'urgent')
WHERE category_id IN (SELECT id FROM categories WHERE slug LIKE '%beaute%' OR name LIKE '%Beauté%' OR name LIKE '%Beaute%');

-- Par défaut : tous les services ont au moins standard et recurring
UPDATE services SET
    allowed_formulas = JSON_ARRAY('standard', 'recurring', 'premium', 'urgent', 'night')
WHERE allowed_formulas IS NULL;

-- =====================================================
-- Index pour performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_formulas_service ON service_formulas(service_id);
CREATE INDEX IF NOT EXISTS idx_formulas_type ON service_formulas(formula_type);
CREATE INDEX IF NOT EXISTS idx_formulas_active ON service_formulas(is_active);

-- =====================================================
-- Vue pour récupérer les formules avec infos service
-- =====================================================
CREATE OR REPLACE VIEW v_service_formulas AS
SELECT
    sf.*,
    s.name as service_name,
    s.price as base_price,
    s.allowed_formulas,
    s.special_rules,
    c.name as category_name,
    CASE
        WHEN sf.price_modifier_type = 'percentage' THEN s.price * (1 + sf.price_modifier_value / 100)
        ELSE s.price + sf.price_modifier_value
    END as calculated_price
FROM service_formulas sf
JOIN services s ON sf.service_id = s.id
LEFT JOIN categories c ON s.category_id = c.id
WHERE sf.is_active = TRUE;
