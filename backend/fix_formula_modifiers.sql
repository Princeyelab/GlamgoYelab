-- =====================================================
-- Fix Formula Modifiers - Aligner Web sur Mobile
-- GlamGo - Phase 3A
-- =====================================================

-- Urgent : Passer de +50 MAD fixe à +50%
UPDATE service_formulas
SET
    price_modifier_type = 'percentage',
    price_modifier_value = 50,
    description = 'Intervention urgente en moins de 2 heures (+50%)',
    updated_at = CURRENT_TIMESTAMP
WHERE formula_type = 'urgent';

-- Nuit : Passer de +30 MAD fixe à +25%
UPDATE service_formulas
SET
    price_modifier_type = 'percentage',
    price_modifier_value = 25,
    description = 'Intervention de nuit (22h - 6h) (+25%)',
    updated_at = CURRENT_TIMESTAMP
WHERE formula_type = 'night';

-- Vérification : afficher les formules mises à jour
SELECT
    formula_type,
    price_modifier_type,
    price_modifier_value,
    description,
    COUNT(*) as nb_services
FROM service_formulas
WHERE formula_type IN ('premium', 'urgent', 'night')
GROUP BY formula_type, price_modifier_type, price_modifier_value, description
ORDER BY
    CASE formula_type
        WHEN 'premium' THEN 1
        WHEN 'urgent' THEN 2
        WHEN 'night' THEN 3
    END;
