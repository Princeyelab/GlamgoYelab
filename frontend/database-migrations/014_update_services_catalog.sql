-- =====================================================
-- Migration 014 : Mise à jour complète catalogue services GlamGo
-- Suppression anciens services + insertion nouveaux avec tarifs officiels
-- Date: 2025-11-30
-- =====================================================

-- ÉTAPE 1 : Désactiver les contraintes de clés étrangères
SET FOREIGN_KEY_CHECKS = 0;

-- ÉTAPE 2 : Supprimer les anciennes données
TRUNCATE TABLE service_formulas;

-- Supprimer les tables qui référencent services si elles existent
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'promo_pack_services') > 0,
    'TRUNCATE TABLE promo_pack_services',
    'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'provider_services') > 0,
    'DELETE FROM provider_services',
    'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

DELETE FROM services;

-- Réactiver les contraintes
SET FOREIGN_KEY_CHECKS = 1;

-- ÉTAPE 3 : Ajouter nouvelles catégories manquantes

-- Catégorie Sport (pour Coach Sportif)
INSERT INTO categories (name, slug, description, icon, parent_id, is_active, display_order)
SELECT 'Sport', 'sport', 'Services sportifs et fitness', 'sport.svg', NULL, 1, 6
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'sport');

-- Sous-catégorie Yoga sous Bien-être
INSERT INTO categories (name, slug, description, icon, parent_id, is_active, display_order)
SELECT 'Yoga', 'yoga', 'Cours de yoga à domicile', 'yoga.svg',
    (SELECT id FROM categories WHERE slug = 'bien-etre' LIMIT 1), 1, 3
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'yoga');

-- Sous-catégorie Garde d'Animaux
INSERT INTO categories (name, slug, description, icon, parent_id, is_active, display_order)
SELECT 'Garde d''Animaux', 'garde-animaux', 'Gardiennage et promenade d''animaux', 'pet-care.svg',
    (SELECT id FROM categories WHERE slug = 'animaux' LIMIT 1), 1, 3
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'garde-animaux');

-- ÉTAPE 4 : Insérer les services

-- ================================================
-- 1. PETITS BRICOLAGES
-- ================================================
INSERT INTO services (
    category_id, name, slug, description, image, price,
    duration_minutes, is_active, allow_bidding,
    min_suggested_price, max_suggested_price,
    allowed_formulas, special_rules
) VALUES (
    (SELECT id FROM categories WHERE slug = 'bricolage' LIMIT 1),
    'Petits Bricolages',
    'petits-bricolages',
    'Petits travaux de réparation et maintenance à domicile : plomberie, électricité basique, montage de meubles, fixations murales.',
    '/images/services/bricolage.jpg',
    200.00,
    60,
    1, 1,
    150.00, 250.00,
    '["standard", "urgent", "night"]',
    '{"note": "Interventions légères uniquement, pas de travaux lourds"}'
);

-- ================================================
-- 2. BEAUTÉ & COIFFURE (3 services)
-- ================================================

-- Coiffure Express
INSERT INTO services (
    category_id, name, slug, description, image, price,
    duration_minutes, is_active, allow_bidding,
    min_suggested_price, max_suggested_price,
    allowed_formulas
) VALUES (
    (SELECT id FROM categories WHERE slug = 'coiffure-femme' OR slug = 'beaute' ORDER BY slug DESC LIMIT 1),
    'Coiffure Express',
    'coiffure-express',
    'Coupe et brushing rapide à domicile. Service express pour un look soigné.',
    '/images/services/coiffure-express.jpg',
    125.00,
    30,
    1, 1,
    100.00, 150.00,
    '["standard", "recurring"]'
);

-- Coiffure Classique
INSERT INTO services (
    category_id, name, slug, description, image, price,
    duration_minutes, is_active, allow_bidding,
    min_suggested_price, max_suggested_price,
    allowed_formulas
) VALUES (
    (SELECT id FROM categories WHERE slug = 'coiffure-femme' OR slug = 'beaute' ORDER BY slug DESC LIMIT 1),
    'Coiffure Classique',
    'coiffure-classique',
    'Coiffure complète avec soins : shampoing, coupe, brushing, masque nourrissant.',
    '/images/services/coiffure-classique.jpg',
    250.00,
    60,
    1, 1,
    200.00, 300.00,
    '["standard", "recurring"]'
);

-- Coiffure Mariage & Événement
INSERT INTO services (
    category_id, name, slug, description, image, price,
    duration_minutes, is_active, allow_bidding,
    min_suggested_price, max_suggested_price,
    allowed_formulas
) VALUES (
    (SELECT id FROM categories WHERE slug = 'coiffure-femme' OR slug = 'beaute' ORDER BY slug DESC LIMIT 1),
    'Coiffure Mariage & Événement',
    'coiffure-mariage',
    'Coiffure professionnelle pour mariages et événements spéciaux. Essais inclus.',
    '/images/services/coiffure-mariage.jpg',
    1150.00,
    120,
    1, 1,
    800.00, 1500.00,
    '["premium"]'
);

-- ================================================
-- 3. JARDINAGE
-- ================================================
INSERT INTO services (
    category_id, name, slug, description, image, price,
    duration_minutes, is_active, allow_bidding,
    min_suggested_price, max_suggested_price,
    allowed_formulas
) VALUES (
    (SELECT id FROM categories WHERE slug = 'jardinage' LIMIT 1),
    'Jardinage',
    'jardinage',
    'Entretien complet de jardins : taille de haies, tonte de pelouse, désherbage, arrosage, plantation.',
    '/images/services/jardinage.jpg',
    250.00,
    120,
    1, 1,
    200.00, 300.00,
    '["standard", "recurring", "night"]'
);

-- ================================================
-- 4. MÉNAGE
-- ================================================
INSERT INTO services (
    category_id, name, slug, description, image, price,
    duration_minutes, is_active, allow_bidding,
    min_suggested_price, max_suggested_price,
    allowed_formulas
) VALUES (
    (SELECT id FROM categories WHERE slug = 'menage' LIMIT 1),
    'Ménage',
    'menage',
    'Nettoyage complet de votre domicile : sols, surfaces, cuisine, salle de bain, dépoussiérage, rangement.',
    '/images/services/menage.jpg',
    175.00,
    180,
    1, 1,
    150.00, 200.00,
    '["standard", "recurring", "night"]'
);

-- ================================================
-- 5. GARDE D'ANIMAUX (2 services)
-- ================================================

-- Promenade d'Animaux
INSERT INTO services (
    category_id, name, slug, description, image, price,
    duration_minutes, is_active, allow_bidding,
    min_suggested_price, max_suggested_price,
    allowed_formulas, special_rules
) VALUES (
    COALESCE(
        (SELECT id FROM categories WHERE slug = 'garde-animaux' LIMIT 1),
        (SELECT id FROM categories WHERE slug = 'animaux' LIMIT 1)
    ),
    'Promenade d''Animaux',
    'promenade-animaux',
    'Balade quotidienne de votre animal avec suivi GPS en temps réel.',
    '/images/services/promenade-chien.jpg',
    100.00,
    60,
    1, 1,
    80.00, 120.00,
    '["standard", "recurring"]',
    '{"requires_gps": true, "requires_photos": true, "photo_frequency_hours": 2, "note": "Suivi GPS obligatoire pendant la promenade"}'
);

-- Gardiennage d'Animaux
INSERT INTO services (
    category_id, name, slug, description, image, price,
    duration_minutes, is_active, allow_bidding,
    min_suggested_price, max_suggested_price,
    allowed_formulas, special_rules
) VALUES (
    COALESCE(
        (SELECT id FROM categories WHERE slug = 'garde-animaux' LIMIT 1),
        (SELECT id FROM categories WHERE slug = 'animaux' LIMIT 1)
    ),
    'Gardiennage d''Animaux',
    'gardiennage-animaux',
    'Garde à domicile avec photos régulières toutes les 2h. Pas de toilettage.',
    '/images/services/gardiennage-animaux.jpg',
    200.00,
    480,
    1, 1,
    150.00, 250.00,
    '["standard", "recurring"]',
    '{"requires_gps": true, "requires_photos": true, "photo_frequency_hours": 2, "excluded_services": ["toilettage"], "note": "GPS et photos obligatoires, pas de toilettage"}'
);

-- ================================================
-- 6. AUTO - Nettoyage uniquement (3 services)
-- ================================================

-- Nettoyage Auto Interne
INSERT INTO services (
    category_id, name, slug, description, image, price,
    duration_minutes, is_active, allow_bidding,
    min_suggested_price, max_suggested_price,
    allowed_formulas, special_rules
) VALUES (
    COALESCE(
        (SELECT id FROM categories WHERE slug = 'lavage-auto' OR slug = 'lavage' LIMIT 1),
        (SELECT id FROM categories WHERE slug = 'voiture' LIMIT 1)
    ),
    'Nettoyage Auto Interne',
    'auto-nettoyage-interne',
    'Nettoyage intérieur complet : aspirateur, tissus, tableau de bord, vitres intérieures.',
    '/images/services/auto-interne.jpg',
    150.00,
    60,
    1, 1,
    150.00, 150.00,
    '["standard", "urgent"]',
    '{"service_type": "nettoyage_interne", "excluded_services": ["mecanique", "reparation"], "note": "Uniquement nettoyage, pas de mécanique"}'
);

-- Nettoyage Auto Externe
INSERT INTO services (
    category_id, name, slug, description, image, price,
    duration_minutes, is_active, allow_bidding,
    min_suggested_price, max_suggested_price,
    allowed_formulas, special_rules
) VALUES (
    COALESCE(
        (SELECT id FROM categories WHERE slug = 'lavage-auto' OR slug = 'lavage' LIMIT 1),
        (SELECT id FROM categories WHERE slug = 'voiture' LIMIT 1)
    ),
    'Nettoyage Auto Externe',
    'auto-nettoyage-externe',
    'Lavage extérieur complet : carrosserie, vitres, jantes, pneus.',
    '/images/services/auto-externe.jpg',
    150.00,
    45,
    1, 1,
    150.00, 150.00,
    '["standard", "urgent"]',
    '{"service_type": "nettoyage_externe", "excluded_services": ["mecanique", "reparation"], "note": "Uniquement nettoyage, pas de mécanique"}'
);

-- Nettoyage Auto Complet
INSERT INTO services (
    category_id, name, slug, description, image, price,
    duration_minutes, is_active, allow_bidding,
    min_suggested_price, max_suggested_price,
    allowed_formulas, special_rules
) VALUES (
    COALESCE(
        (SELECT id FROM categories WHERE slug = 'lavage-auto' OR slug = 'lavage' LIMIT 1),
        (SELECT id FROM categories WHERE slug = 'voiture' LIMIT 1)
    ),
    'Nettoyage Auto Complet',
    'auto-nettoyage-complet',
    'Nettoyage complet intérieur + extérieur. Votre véhicule comme neuf.',
    '/images/services/auto-complet.jpg',
    250.00,
    90,
    1, 1,
    250.00, 250.00,
    '["standard", "urgent"]',
    '{"service_type": "nettoyage_complet", "excluded_services": ["mecanique", "reparation"], "note": "Pack complet, uniquement nettoyage"}'
);

-- ================================================
-- 7. CHEF À DOMICILE (3 services)
-- ================================================

-- Chef - 2 Personnes
INSERT INTO services (
    category_id, name, slug, description, image, price,
    duration_minutes, is_active, allow_bidding,
    min_suggested_price, max_suggested_price,
    allowed_formulas
) VALUES (
    COALESCE(
        (SELECT id FROM categories WHERE slug = 'cuisine-domicile' OR slug = 'cuisine' LIMIT 1),
        (SELECT id FROM categories WHERE slug = 'maison' LIMIT 1)
    ),
    'Chef à Domicile - 2 Personnes',
    'chef-2-personnes',
    'Chef professionnel pour repas gastronomique ou traditionnel marocain. Courses, préparation et service inclus.',
    '/images/services/chef-2pers.jpg',
    600.00,
    180,
    1, 0,
    600.00, 600.00,
    '["premium"]'
);

-- Chef - 4 Personnes
INSERT INTO services (
    category_id, name, slug, description, image, price,
    duration_minutes, is_active, allow_bidding,
    min_suggested_price, max_suggested_price,
    allowed_formulas
) VALUES (
    COALESCE(
        (SELECT id FROM categories WHERE slug = 'cuisine-domicile' OR slug = 'cuisine' LIMIT 1),
        (SELECT id FROM categories WHERE slug = 'maison' LIMIT 1)
    ),
    'Chef à Domicile - 4 Personnes',
    'chef-4-personnes',
    'Chef professionnel pour 4 convives. Menu personnalisé, courses et service inclus.',
    '/images/services/chef-4pers.jpg',
    1000.00,
    240,
    1, 0,
    1000.00, 1000.00,
    '["premium"]'
);

-- Chef - 8 Personnes
INSERT INTO services (
    category_id, name, slug, description, image, price,
    duration_minutes, is_active, allow_bidding,
    min_suggested_price, max_suggested_price,
    allowed_formulas
) VALUES (
    COALESCE(
        (SELECT id FROM categories WHERE slug = 'cuisine-domicile' OR slug = 'cuisine' LIMIT 1),
        (SELECT id FROM categories WHERE slug = 'maison' LIMIT 1)
    ),
    'Chef à Domicile - 8 Personnes',
    'chef-8-personnes',
    'Chef professionnel pour grande tablée. Idéal réceptions et fêtes familiales.',
    '/images/services/chef-8pers.jpg',
    1800.00,
    300,
    1, 0,
    1800.00, 1800.00,
    '["premium"]'
);

-- ================================================
-- 8. BIEN-ÊTRE (3 services)
-- ================================================

-- Massage Relaxant
INSERT INTO services (
    category_id, name, slug, description, image, price,
    duration_minutes, is_active, allow_bidding,
    min_suggested_price, max_suggested_price,
    allowed_formulas
) VALUES (
    COALESCE(
        (SELECT id FROM categories WHERE slug = 'massage' LIMIT 1),
        (SELECT id FROM categories WHERE slug = 'bien-etre' LIMIT 1)
    ),
    'Massage Relaxant',
    'massage-relaxant',
    'Massage relaxant aux huiles essentielles (60 min). Détente profonde garantie.',
    '/images/services/massage-relaxant.jpg',
    325.00,
    60,
    1, 1,
    250.00, 400.00,
    '["standard", "premium"]'
);

-- Hammam & Gommage
INSERT INTO services (
    category_id, name, slug, description, image, price,
    duration_minutes, is_active, allow_bidding,
    min_suggested_price, max_suggested_price,
    allowed_formulas
) VALUES (
    (SELECT id FROM categories WHERE slug = 'bien-etre' LIMIT 1),
    'Hammam & Gommage',
    'hammam-gommage',
    'Hammam traditionnel avec gommage au savon noir. Rituel complet de purification.',
    '/images/services/hammam-gommage.jpg',
    400.00,
    90,
    1, 1,
    300.00, 500.00,
    '["standard", "premium"]'
);

-- Soin Premium Argan
INSERT INTO services (
    category_id, name, slug, description, image, price,
    duration_minutes, is_active, allow_bidding,
    min_suggested_price, max_suggested_price,
    allowed_formulas
) VALUES (
    (SELECT id FROM categories WHERE slug = 'bien-etre' LIMIT 1),
    'Soin Premium Argan',
    'soin-argan',
    'Soin complet aux produits d''argan bio du Maroc. Visage, corps et cheveux.',
    '/images/services/soin-argan.jpg',
    600.00,
    120,
    1, 0,
    600.00, 600.00,
    '["premium"]'
);

-- ================================================
-- 9. DANSE ORIENTALE
-- ================================================
INSERT INTO services (
    category_id, name, slug, description, image, price,
    duration_minutes, is_active, allow_bidding,
    min_suggested_price, max_suggested_price,
    allowed_formulas, special_rules
) VALUES (
    COALESCE(
        (SELECT id FROM categories WHERE slug = 'danse' LIMIT 1),
        (SELECT id FROM categories WHERE slug = 'beaute' LIMIT 1)
    ),
    'Danse Orientale',
    'danse-orientale',
    'Cours particuliers de danse orientale à domicile avec professeur diplômé. Tous niveaux.',
    '/images/services/danse-orientale.jpg',
    200.00,
    60,
    1, 1,
    200.00, 200.00,
    '["standard", "recurring"]',
    '{"dance_type": "orientale", "excluded_types": ["moderne", "classique", "hip-hop"], "note": "Uniquement danse orientale"}'
);

-- ================================================
-- 10. YOGA
-- ================================================
INSERT INTO services (
    category_id, name, slug, description, image, price,
    duration_minutes, is_active, allow_bidding,
    min_suggested_price, max_suggested_price,
    allowed_formulas
) VALUES (
    COALESCE(
        (SELECT id FROM categories WHERE slug = 'yoga' LIMIT 1),
        (SELECT id FROM categories WHERE slug = 'bien-etre' LIMIT 1)
    ),
    'Yoga',
    'yoga',
    'Cours particuliers de yoga à domicile : Hatha, Vinyasa, Yin. Tous niveaux acceptés.',
    '/images/services/yoga.jpg',
    200.00,
    60,
    1, 1,
    200.00, 200.00,
    '["standard", "recurring"]'
);

-- ================================================
-- 11. COACH SPORTIF
-- ================================================
INSERT INTO services (
    category_id, name, slug, description, image, price,
    duration_minutes, is_active, allow_bidding,
    min_suggested_price, max_suggested_price,
    allowed_formulas, special_rules
) VALUES (
    COALESCE(
        (SELECT id FROM categories WHERE slug = 'coaching' LIMIT 1),
        (SELECT id FROM categories WHERE slug = 'sport' LIMIT 1),
        (SELECT id FROM categories WHERE slug = 'bien-etre' LIMIT 1)
    ),
    'Coach Sportif',
    'coach-sportif',
    'Coaching sportif personnalisé : fitness, musculation, cardio, perte de poids, prise de masse.',
    '/images/services/coach-sportif.jpg',
    250.00,
    60,
    1, 1,
    250.00, 250.00,
    '["standard", "recurring"]',
    '{"specialties": ["fitness", "musculation", "cardio"], "note": "Programme sur mesure selon vos objectifs"}'
);

-- ================================================
-- ÉTAPE 5 : Configurer les formules pour chaque service
-- ================================================

-- Formule Standard (gratuite, tous services éligibles)
INSERT INTO service_formulas (service_id, formula_type, price_modifier_type, price_modifier_value, description, is_active)
SELECT
    id,
    'standard',
    'percentage',
    0,
    'Tarif de base - Intervention ponctuelle'
    , 1
FROM services
WHERE JSON_CONTAINS(allowed_formulas, '"standard"');

-- Formule Récurrent (-10%, services éligibles)
INSERT INTO service_formulas (service_id, formula_type, price_modifier_type, price_modifier_value, description, is_active)
SELECT
    id,
    'recurring',
    'percentage',
    -10,
    'Abonnement hebdo/mensuel : -10% de réduction'
    , 1
FROM services
WHERE JSON_CONTAINS(allowed_formulas, '"recurring"');

-- Formule Premium (+30%, services éligibles)
INSERT INTO service_formulas (service_id, formula_type, price_modifier_type, price_modifier_value, description, is_active)
SELECT
    id,
    'premium',
    'percentage',
    30,
    'Service premium haut de gamme : +30%'
    , 1
FROM services
WHERE JSON_CONTAINS(allowed_formulas, '"premium"');

-- Formule Urgence (+50 MAD fixe, services éligibles)
INSERT INTO service_formulas (service_id, formula_type, price_modifier_type, price_modifier_value, description, is_active)
SELECT
    id,
    'urgent',
    'fixed',
    50,
    'Intervention urgente < 2h : +50 MAD'
    , 1
FROM services
WHERE JSON_CONTAINS(allowed_formulas, '"urgent"');

-- Formule Nuit (+20%, services éligibles)
INSERT INTO service_formulas (service_id, formula_type, price_modifier_type, price_modifier_value, description, is_active)
SELECT
    id,
    'night',
    'percentage',
    20,
    'Intervention de nuit (22h-6h) : +20%'
    , 1
FROM services
WHERE JSON_CONTAINS(allowed_formulas, '"night"');

-- ================================================
-- ÉTAPE 6 : Vérifications finales
-- ================================================

SELECT '=== RÉSUMÉ MIGRATION ===' as info;
SELECT 'Services créés' as etape, COUNT(*) as total FROM services;
SELECT 'Formules configurées' as etape, COUNT(*) as total FROM service_formulas;

SELECT '=== SERVICES PAR CATÉGORIE ===' as info;
SELECT c.name as categorie, COUNT(s.id) as services
FROM services s
JOIN categories c ON s.category_id = c.id
GROUP BY c.name
ORDER BY services DESC;

SELECT '=== FORMULES PAR TYPE ===' as info;
SELECT formula_type, COUNT(*) as services
FROM service_formulas
GROUP BY formula_type;

SELECT '=== FOURCHETTE DE PRIX ===' as info;
SELECT
    MIN(price) as prix_min,
    MAX(price) as prix_max,
    ROUND(AVG(price), 2) as prix_moyen
FROM services;
