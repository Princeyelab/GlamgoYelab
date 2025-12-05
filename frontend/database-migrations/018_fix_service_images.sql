-- Migration: Corriger les images des services
-- Date: 2025-12-03

-- Gardiennage et Promenade animaux
UPDATE services SET image = '/images/services/gardiennage-animaux.jpg' WHERE slug = 'gardiennage-animaux';
UPDATE services SET image = '/images/services/promenade-animaux.jpg' WHERE slug = 'promenade-animaux';

-- Yoga
UPDATE services SET image = '/images/services/yoga.jpg' WHERE slug = 'yoga';

-- Massage
UPDATE services SET image = '/images/services/massage-relaxant.jpg' WHERE slug = 'massage-relaxant';

-- Soin Argan
UPDATE services SET image = '/images/services/soin-premium-argan.jpg' WHERE slug = 'soin-argan';

-- Chef à domicile
UPDATE services SET image = '/images/services/chef-domicile-2-personnes.jpg' WHERE slug = 'chef-2-personnes';
UPDATE services SET image = '/images/services/chef-domicile-4-personnes.jpg' WHERE slug = 'chef-4-personnes';
UPDATE services SET image = '/images/services/chef-domicile-8-personnes.jpg' WHERE slug = 'chef-8-personnes';

-- Coiffure classique (femme)
UPDATE services SET image = '/images/services/coiffure-classique.jpg' WHERE slug = 'coiffure-classique';

-- Nettoyage auto interne
UPDATE services SET image = '/images/services/lavage-interieur.jpg' WHERE slug = 'auto-nettoyage-interne';

-- Vérification
SELECT id, name, slug, image FROM services ORDER BY id;
