-- =====================================================
-- MISE A JOUR DES IMAGES - Services Smooth
-- =====================================================

-- Smooth Femme
UPDATE services
SET image = '/images/services/smooth-femme.jpg'
WHERE slug = 'smooth-femme' OR name = 'Smooth Femme';

-- Full Smooth Femme
UPDATE services
SET image = '/images/services/smooth-femme-full.jpg'
WHERE slug = 'smooth-femme-full' OR name = 'Smooth Femme Full' OR name = 'Full Smooth Femme';

-- Smooth Homme
UPDATE services
SET image = '/images/services/smooth-homme.jpg'
WHERE slug = 'smooth-homme' OR name = 'Smooth Homme';

-- Full Smooth Homme
UPDATE services
SET image = '/images/services/smooth-homme-full.jpg'
WHERE slug = 'smooth-homme-full' OR name = 'Smooth Homme Full' OR name = 'Full Smooth Homme';

-- Verification
SELECT id, name, slug, image FROM services WHERE name LIKE '%Smooth%' OR slug LIKE '%smooth%';
