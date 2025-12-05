-- =====================================================
-- Migration 015 : Ajout services Coiffure Homme et Barbe Homme
-- Nouvelles prestations avec tarifs adaptés au marché marocain
-- Date: 2025-12-02
-- =====================================================

-- ================================================
-- COIFFURE HOMME (2 services)
-- ================================================

-- Coiffure Homme Simple (70-120 DH)
INSERT INTO services (
    category_id, name, slug, description, image, price,
    duration_minutes, is_active, allow_bidding,
    min_suggested_price, max_suggested_price,
    allowed_formulas, special_rules
) VALUES (
    (SELECT id FROM categories WHERE slug IN ('coiffure-homme', 'beaute') ORDER BY slug DESC LIMIT 1),
    'Coiffure Homme Simple',
    'coiffure-homme-simple',
    'Coupe classique homme avec finitions soignees. Shampooing et coiffage inclus. Ideal pour un look net et professionnel.',
    '/images/services/coiffure-homme-simple.jpg',
    100.00,
    30,
    1, 1,
    70.00, 120.00,
    '["standard", "recurring"]',
    '{"target": "homme", "note": "Coupe classique avec finitions"}'
);

-- Coiffure Homme Haut de Gamme / Brushing Premium (150-250 DH)
INSERT INTO services (
    category_id, name, slug, description, image, price,
    duration_minutes, is_active, allow_bidding,
    min_suggested_price, max_suggested_price,
    allowed_formulas, special_rules
) VALUES (
    (SELECT id FROM categories WHERE slug IN ('coiffure-homme', 'beaute') ORDER BY slug DESC LIMIT 1),
    'Coiffure Homme Premium',
    'coiffure-homme-premium',
    'Coiffure haut de gamme homme avec soins capillaires : shampooing professionnel, coupe tendance, brushing et styling. Service premium digne des meilleurs salons.',
    '/images/services/coiffure-homme-premium.jpg',
    200.00,
    45,
    1, 1,
    150.00, 250.00,
    '["standard", "premium"]',
    '{"target": "homme", "level": "premium", "note": "Service premium avec soins capillaires"}'
);

-- ================================================
-- BARBE HOMME (2 services)
-- ================================================

-- Taille de Barbe (70-150 DH)
INSERT INTO services (
    category_id, name, slug, description, image, price,
    duration_minutes, is_active, allow_bidding,
    min_suggested_price, max_suggested_price,
    allowed_formulas, special_rules
) VALUES (
    (SELECT id FROM categories WHERE slug IN ('coiffure-homme', 'beaute') ORDER BY slug DESC LIMIT 1),
    'Taille de Barbe',
    'taille-barbe-homme',
    'Taille et entretien de barbe professionnel. Contours nets, rasage precis, huile nourrissante. Pour une barbe impeccable.',
    '/images/services/taille-barbe.jpg',
    100.00,
    25,
    1, 1,
    70.00, 150.00,
    '["standard", "recurring"]',
    '{"target": "homme", "service_type": "barbe", "note": "Taille et entretien barbe"}'
);

-- Pack Coiffure + Barbe (120-200 DH)
INSERT INTO services (
    category_id, name, slug, description, image, price,
    duration_minutes, is_active, allow_bidding,
    min_suggested_price, max_suggested_price,
    allowed_formulas, special_rules
) VALUES (
    (SELECT id FROM categories WHERE slug IN ('coiffure-homme', 'beaute') ORDER BY slug DESC LIMIT 1),
    'Pack Coiffure + Barbe',
    'pack-coiffure-barbe-homme',
    'Formule complete homme : coupe de cheveux et taille de barbe. Le combo parfait pour un look soigne de la tete aux pieds. Tarif avantageux.',
    '/images/services/pack-coiffure-barbe.jpg',
    150.00,
    50,
    1, 1,
    120.00, 200.00,
    '["standard", "recurring"]',
    '{"target": "homme", "service_type": "combo", "includes": ["coiffure", "barbe"], "note": "Pack complet coiffure et barbe"}'
);

-- ================================================
-- Configuration des formules tarifaires
-- ================================================

-- Formule Standard pour les nouveaux services
INSERT INTO service_formulas (service_id, formula_type, price_modifier_type, price_modifier_value, description, is_active)
SELECT
    id,
    'standard',
    'percentage',
    0,
    'Tarif de base - Intervention ponctuelle',
    1
FROM services
WHERE slug IN ('coiffure-homme-simple', 'coiffure-homme-premium', 'taille-barbe-homme', 'pack-coiffure-barbe-homme')
AND NOT EXISTS (
    SELECT 1 FROM service_formulas sf
    WHERE sf.service_id = services.id AND sf.formula_type = 'standard'
);

-- Formule Recurring (-10%) pour les services eligibles
INSERT INTO service_formulas (service_id, formula_type, price_modifier_type, price_modifier_value, description, is_active)
SELECT
    id,
    'recurring',
    'percentage',
    -10,
    'Abonnement hebdo/mensuel : -10% de reduction',
    1
FROM services
WHERE slug IN ('coiffure-homme-simple', 'taille-barbe-homme', 'pack-coiffure-barbe-homme')
AND NOT EXISTS (
    SELECT 1 FROM service_formulas sf
    WHERE sf.service_id = services.id AND sf.formula_type = 'recurring'
);

-- Formule Premium (+30%) pour coiffure homme premium
INSERT INTO service_formulas (service_id, formula_type, price_modifier_type, price_modifier_value, description, is_active)
SELECT
    id,
    'premium',
    'percentage',
    30,
    'Service premium haut de gamme : +30%',
    1
FROM services
WHERE slug = 'coiffure-homme-premium'
AND NOT EXISTS (
    SELECT 1 FROM service_formulas sf
    WHERE sf.service_id = services.id AND sf.formula_type = 'premium'
);

-- ================================================
-- Verification
-- ================================================

SELECT '=== NOUVEAUX SERVICES COIFFURE/BARBE HOMME ===' as info;
SELECT id, name, price, min_suggested_price, max_suggested_price, duration_minutes
FROM services
WHERE slug LIKE '%homme%' OR slug LIKE '%barbe%'
ORDER BY name;

SELECT '=== FORMULES CONFIGUREES ===' as info;
SELECT s.name, sf.formula_type, sf.price_modifier_value
FROM service_formulas sf
JOIN services s ON sf.service_id = s.id
WHERE s.slug IN ('coiffure-homme-simple', 'coiffure-homme-premium', 'taille-barbe-homme', 'pack-coiffure-barbe-homme');
