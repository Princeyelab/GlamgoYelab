-- Correction des images dupliquées et incompatibles
SET NAMES utf8mb4;

-- =====================================================
-- COIFFURE HOMME - Images uniques
-- =====================================================
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&q=80' WHERE name = 'Coupe classique';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&q=80' WHERE name = 'Coupe tendance';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&q=80' WHERE name = 'Taille de barbe classique';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1593702288056-f2fbc5ee5fda?w=400&q=80' WHERE name = 'Barbe & contours';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80' WHERE name = 'Rasage à l''ancienne';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&q=80' WHERE name = 'Soin barbe complet';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1585747860019-8e52e90ab3f9?w=400&q=80' WHERE name = 'Combo coupe + barbe';

-- =====================================================
-- MANUCURE - Images distinctes
-- =====================================================
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=80' WHERE name = 'Manucure femme';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400&q=80' WHERE name = 'Pose gel';

-- =====================================================
-- ÉPILATION - Images différentes
-- =====================================================
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=80' WHERE name = 'Jambes complètes femme';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&q=80' WHERE name = 'Bras complets';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80' WHERE name = 'Torse homme';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80' WHERE name = 'Dos homme';

-- =====================================================
-- MÉNAGE - Images variées
-- =====================================================
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80' WHERE name = 'Ménage classique (2h)';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400&q=80' WHERE name = 'Nettoyage printemps';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80' WHERE name = 'Nettoyage cuisine';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?w=400&q=80' WHERE name = 'Préparation repas';

-- =====================================================
-- ANIMAUX - Images spécifiques
-- =====================================================
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80' WHERE name = 'Toilettage chien';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&q=80' WHERE name = 'Promenade chien';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&q=80' WHERE name = 'Gardiennage à domicile';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&q=80' WHERE name = 'Gardiennage longue durée';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=400&q=80' WHERE name = 'Transport animaux';

-- =====================================================
-- VÉRIFICATION - Pas de doublons
-- =====================================================
SELECT 'Doublons restants:' as info;
SELECT image_url, GROUP_CONCAT(name SEPARATOR ' | ') as services, COUNT(*) as count
FROM services
GROUP BY image_url
HAVING count > 1;

SELECT 'Total services:' as info, COUNT(*) as total FROM services;
