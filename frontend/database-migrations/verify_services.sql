-- =====================================================
-- Script de vérification du catalogue services GlamGo
-- Exécuter après la migration pour valider les données
-- =====================================================

SELECT '🔍 VÉRIFICATION DU CATALOGUE SERVICES GLAMGO' as titre;
SELECT '=============================================' as separator;

-- 1. Nombre total de services
SELECT '' as '';
SELECT '📊 1. COMPTAGE SERVICES' as section;
SELECT COUNT(*) as total_services FROM services;
SELECT IF(COUNT(*) = 21, '✅ OK: 21 services attendus', CONCAT('⚠️  ATTENTION: ', COUNT(*), ' services au lieu de 21')) as verification
FROM services;

-- 2. Services par catégorie
SELECT '' as '';
SELECT '📂 2. SERVICES PAR CATÉGORIE' as section;
SELECT
    c.name as categorie,
    COUNT(s.id) as nb_services,
    GROUP_CONCAT(s.name SEPARATOR ', ') as services
FROM services s
JOIN categories c ON s.category_id = c.id
GROUP BY c.id, c.name
ORDER BY nb_services DESC, c.name;

-- 3. Formules configurées
SELECT '' as '';
SELECT '📋 3. FORMULES CONFIGURÉES' as section;
SELECT
    formula_type as formule,
    COUNT(*) as nb_services,
    CASE formula_type
        WHEN 'standard' THEN 'Tarif de base'
        WHEN 'recurring' THEN '-10% abonnement'
        WHEN 'premium' THEN '+30% premium'
        WHEN 'urgent' THEN '+50 MAD urgence'
        WHEN 'night' THEN '+20% nuit'
    END as description
FROM service_formulas
GROUP BY formula_type
ORDER BY FIELD(formula_type, 'standard', 'recurring', 'premium', 'urgent', 'night');

-- 4. Tarifs par service
SELECT '' as '';
SELECT '💰 4. TARIFS PAR SERVICE' as section;
SELECT
    s.name as service,
    CONCAT(s.price, ' MAD') as prix_base,
    CONCAT(s.min_suggested_price, '-', s.max_suggested_price, ' MAD') as fourchette,
    s.allowed_formulas as formules_autorisees
FROM services s
ORDER BY s.price DESC;

-- 5. Statistiques de prix
SELECT '' as '';
SELECT '📈 5. STATISTIQUES PRIX' as section;
SELECT
    CONCAT(MIN(price), ' MAD') as prix_minimum,
    CONCAT(MAX(price), ' MAD') as prix_maximum,
    CONCAT(ROUND(AVG(price), 2), ' MAD') as prix_moyen,
    CONCAT(ROUND(SUM(price), 2), ' MAD') as total_catalogue
FROM services;

-- 6. Services avec règles spéciales
SELECT '' as '';
SELECT '⚙️  6. SERVICES AVEC RÈGLES SPÉCIALES' as section;
SELECT
    s.name as service,
    JSON_EXTRACT(s.special_rules, '$.note') as note
FROM services s
WHERE s.special_rules IS NOT NULL
AND s.special_rules != 'null';

-- 7. Services par durée
SELECT '' as '';
SELECT '⏱️  7. SERVICES PAR DURÉE' as section;
SELECT
    CASE
        WHEN duration_minutes <= 60 THEN '1h ou moins'
        WHEN duration_minutes <= 120 THEN '1h-2h'
        WHEN duration_minutes <= 180 THEN '2h-3h'
        ELSE 'Plus de 3h'
    END as duree,
    COUNT(*) as nb_services,
    GROUP_CONCAT(name SEPARATOR ', ') as services
FROM services
GROUP BY
    CASE
        WHEN duration_minutes <= 60 THEN '1h ou moins'
        WHEN duration_minutes <= 120 THEN '1h-2h'
        WHEN duration_minutes <= 180 THEN '2h-3h'
        ELSE 'Plus de 3h'
    END
ORDER BY MIN(duration_minutes);

-- 8. Vérification images manquantes (liste des chemins)
SELECT '' as '';
SELECT '📷 8. CHEMINS DES IMAGES' as section;
SELECT
    name as service,
    image as chemin_image
FROM services
ORDER BY name;

-- 9. Services permettant enchères
SELECT '' as '';
SELECT '🏷️  9. SERVICES AVEC ENCHÈRES' as section;
SELECT
    IF(allow_bidding = 1, 'Enchères activées', 'Prix fixes') as type,
    COUNT(*) as nb_services
FROM services
GROUP BY allow_bidding;

-- 10. Résumé final
SELECT '' as '';
SELECT '✅ 10. RÉSUMÉ FINAL' as section;
SELECT
    (SELECT COUNT(*) FROM services) as total_services,
    (SELECT COUNT(*) FROM service_formulas) as total_formules,
    (SELECT COUNT(DISTINCT category_id) FROM services) as nb_categories,
    (SELECT COUNT(*) FROM services WHERE special_rules IS NOT NULL AND special_rules != 'null') as services_regles_speciales,
    (SELECT CONCAT(MIN(price), '-', MAX(price), ' MAD') FROM services) as fourchette_prix;

SELECT '=============================================' as separator;
SELECT '🎉 VÉRIFICATION TERMINÉE' as message;
