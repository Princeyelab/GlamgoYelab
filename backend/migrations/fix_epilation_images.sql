-- =====================================================
-- CORRECTION DES IMAGES - Services Épilation
-- =====================================================
SET NAMES utf8mb4;

-- Épilation Femme
UPDATE services SET image = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=600&fit=crop'
WHERE slug LIKE '%jambes%femme%' OR name LIKE '%Jambes%femme%';

UPDATE services SET image = 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800&h=600&fit=crop'
WHERE slug LIKE '%sourcils%' OR name LIKE '%Sourcils%';

-- Épilation Homme
UPDATE services SET image = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop'
WHERE slug LIKE '%torse%' OR name LIKE '%Torse%';

UPDATE services SET image = 'https://images.unsplash.com/photo-1571019613576-2b22c76fd955?w=800&h=600&fit=crop'
WHERE slug LIKE '%dos%homme%' OR name LIKE '%Dos%';

UPDATE services SET image = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop'
WHERE slug LIKE '%bras%' OR name LIKE '%Bras%';

-- Smooth Femme/Homme (si ces services existent)
UPDATE services SET image = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=600&fit=crop'
WHERE name LIKE '%Smooth Femme%' OR name LIKE '%Full Smooth Femme%';

UPDATE services SET image = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop'
WHERE name LIKE '%Smooth Homme%' OR name LIKE '%Full Smooth Homme%';

-- Mise à jour générique pour tous les services d'épilation sans image
UPDATE services s
SET s.image = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=600&fit=crop'
WHERE s.category_id IN (
    SELECT c.id FROM categories c WHERE c.slug LIKE '%epilation%' OR c.name LIKE '%pilation%'
)
AND (s.image IS NULL OR s.image = '');

SELECT 'Images épilation mises à jour!' as status;
