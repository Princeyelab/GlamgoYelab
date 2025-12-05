-- =====================================================
-- Correction de l'encodage UTF-8 des données
-- =====================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Correction des catégories
UPDATE categories SET name = 'Beauté', description = 'Services de beauté et bien-être' WHERE slug = 'beaute';
UPDATE categories SET name = 'Esthétique', description = 'Soins du visage et du corps' WHERE slug = 'esthetique';
UPDATE categories SET name = 'Manucure & Pédicure', description = 'Soins des mains et des pieds' WHERE slug = 'manucure-pedicure';
UPDATE categories SET name = 'Électricité', description = 'Installations et dépannages électriques' WHERE slug = 'electricite';
UPDATE categories SET description = 'Lavage intérieur et extérieur' WHERE slug = 'lavage';
UPDATE categories SET name = 'Mécanique', description = 'Réparations mécaniques' WHERE slug = 'mecanique';
UPDATE categories SET description = 'Services pour votre véhicule' WHERE slug = 'voiture';
UPDATE categories SET description = 'Entretien d\'espaces verts' WHERE slug = 'jardinage';
UPDATE categories SET description = 'Réparations et installations' WHERE slug = 'plomberie';

-- Correction des services
UPDATE services SET description = 'Épilation complète des jambes' WHERE slug = 'epilation-jambes';
UPDATE services SET name = 'Pédicure classique', description = 'Pédicure avec vernis' WHERE slug = 'pedicure-classique';
UPDATE services SET name = 'Pédicure spa', description = 'Pédicure avec soin relaxant' WHERE slug = 'pedicure-spa';
UPDATE services SET description = 'Nettoyage complet d\'appartement' WHERE slug = 'nettoyage-appartement';
UPDATE services SET description = 'Intervention d\'urgence' WHERE slug = 'depannage-plomberie';
UPDATE services SET description = 'Installation équipement sanitaire' WHERE slug = 'installation-sanitaire';
UPDATE services SET description = 'Intervention d\'urgence' WHERE slug = 'depannage-electrique';
UPDATE services SET description = 'Installation équipement électrique' WHERE slug = 'installation-electrique';
UPDATE services SET description = 'Lavage intérieur et extérieur' WHERE slug = 'lavage-complet';
UPDATE services SET description = 'Diagnostic mécanique' WHERE slug = 'diagnostic-panne';
UPDATE services SET description = 'Consultation à domicile' WHERE slug = 'consultation-veterinaire';
UPDATE services SET description = 'Vaccination à domicile' WHERE slug = 'vaccination';
