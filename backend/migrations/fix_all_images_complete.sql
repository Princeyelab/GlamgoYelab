-- =====================================================
-- CORRECTION COMPLÈTE ET DÉFINITIVE DE TOUTES LES IMAGES
-- =====================================================
SET NAMES utf8mb4;

-- =====================================================
-- SERVICES BIEN-ÊTRE (catégorie incorrecte)
-- Ces services sont dans "Bien-être" mais devraient avoir des images de coiffure
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&h=600&fit=crop' WHERE name = 'Coupe Homme' AND category_id = 5;
UPDATE services SET image = 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=600&fit=crop' WHERE name = 'Coupe Femme' AND category_id = 5;
UPDATE services SET image = 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800&h=600&fit=crop' WHERE name = 'Brushing' AND category_id = 5;
UPDATE services SET image = 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=800&h=600&fit=crop' WHERE name = 'Coloration' AND category_id = 5;
UPDATE services SET image = 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=800&h=600&fit=crop' WHERE name = 'Mèches' OR name LIKE 'M%ches' AND category_id = 5;

-- =====================================================
-- MONTAGE MEUBLE - Image correcte de menuiserie
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop' WHERE slug = 'montage-meuble';

-- =====================================================
-- NETTOYAGE VILLA & APPARTEMENT - Images de maison propre
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop' WHERE slug = 'nettoyage-villa';
UPDATE services SET image = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop' WHERE slug = 'nettoyage-appartement';
UPDATE services SET image = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop' WHERE slug = 'nettoyage-express';

-- =====================================================
-- LAVAGE AUTO - Images plus précises
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&h=600&fit=crop' WHERE slug = 'nettoyage-exterieur-seul';
UPDATE services SET image = 'https://images.unsplash.com/photo-1607860108000-2b9d951df188?w=800&h=600&fit=crop' WHERE slug = 'nettoyage-interieur-seul';

-- =====================================================
-- VIDANGE - Image correcte de mécanique
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=800&h=600&fit=crop' WHERE slug = 'vidange';

-- =====================================================
-- DIAGNOSTIC PANNE - Image de mécanicien
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1632823469959-e94206409d5a?w=800&h=600&fit=crop' WHERE slug = 'diagnostic-panne';

-- =====================================================
-- JARDINAGE - Images de jardinage
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=800&h=600&fit=crop' WHERE slug = 'entretien-pelouse';
UPDATE services SET image = 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800&h=600&fit=crop' WHERE slug = 'tonte-pelouse' OR name = 'Tonte de pelouse';

-- =====================================================
-- CUISINE - Images de chef cuisine
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=600&fit=crop' WHERE slug = 'preparation-repas';

-- =====================================================
-- VACCINATION - Image vétérinaire avec seringue
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1612367159518-e3a1f0d3e8e4?w=800&h=600&fit=crop' WHERE slug = 'vaccination';

-- =====================================================
-- ÉPILATION - Images spa/beauté
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=600&fit=crop' WHERE slug = 'jambes-completes-femme';
UPDATE services SET image = 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800&h=600&fit=crop' WHERE slug = 'sourcils-visage' OR name = 'Sourcils et visage';
UPDATE services SET image = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop' WHERE slug = 'torse-dos' OR name = 'Torse ou dos';
UPDATE services SET image = 'https://images.unsplash.com/photo-1571019613576-2b22c76fd955?w=800&h=600&fit=crop' WHERE slug = 'bras-complets' OR name = 'Bras complets';

-- =====================================================
-- ÉLECTRICITÉ - Images électricien
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=600&fit=crop' WHERE slug = 'depannage-electrique' OR name LIKE 'D%pannage %lectrique';
UPDATE services SET image = 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=600&fit=crop' WHERE slug = 'installation-electrique' OR name LIKE 'Installation %lectrique';

-- =====================================================
-- MANUCURE - Images manucure/pédicure
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=600&fit=crop' WHERE slug = 'manucure-classique';
UPDATE services SET image = 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=800&h=600&fit=crop' WHERE slug = 'manucure-gel';
UPDATE services SET image = 'https://images.unsplash.com/photo-1599206676335-193c82b13c9e?w=800&h=600&fit=crop' WHERE slug = 'pedicure-classique' OR name LIKE 'P%dicure classique';
UPDATE services SET image = 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=800&h=600&fit=crop' WHERE slug = 'pedicure-spa' OR name LIKE 'P%dicure spa';
UPDATE services SET image = 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=800&h=600&fit=crop' WHERE slug = 'manucure-femme';
UPDATE services SET image = 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=800&h=600&fit=crop' WHERE slug = 'manucure-homme';

-- =====================================================
-- MASSAGE - Images massage/spa
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=600&fit=crop' WHERE slug = 'massage-relaxant-30min' OR name LIKE 'Massage relaxant 30%';
UPDATE services SET image = 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800&h=600&fit=crop' WHERE slug = 'massage-relaxant-60min' OR name LIKE 'Massage relaxant 60%';
UPDATE services SET image = 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&h=600&fit=crop' WHERE slug = 'massage-sportif';
UPDATE services SET image = 'https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=800&h=600&fit=crop' WHERE slug = 'massage-tonique';
UPDATE services SET image = 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&h=600&fit=crop' WHERE slug = 'massage-thailandais' OR name LIKE 'Massage tha%';
UPDATE services SET image = 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=600&fit=crop' WHERE slug = 'massage-marocain' OR name LIKE 'Massage marocain%';

-- =====================================================
-- SOINS ESTHÉTIQUES - Images beauté
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=600&fit=crop' WHERE slug = 'soin-visage' OR name = 'Soin du visage';
UPDATE services SET image = 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&h=600&fit=crop' WHERE name = 'Maquillage' AND category_id = 6;
UPDATE services SET image = 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&h=600&fit=crop' WHERE name LIKE '%pilation jambes' OR name LIKE 'Ã%pilation jambes';

-- =====================================================
-- PLOMBERIE - Images plombier
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&h=600&fit=crop' WHERE slug = 'depannage-plomberie' OR name LIKE 'D%pannage plomberie';
UPDATE services SET image = 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&h=600&fit=crop' WHERE slug = 'installation-sanitaire';

-- =====================================================
-- VÉTÉRINAIRE - Images vétérinaire
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800&h=600&fit=crop' WHERE slug = 'consultation-veterinaire' OR name LIKE 'Consultation v%t%rinaire';

-- =====================================================
-- COACHING/FITNESS - Images sport
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop' WHERE slug = 'yoga' OR name = 'Yoga';
UPDATE services SET image = 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=600&fit=crop' WHERE slug = 'pilates' OR name = 'Pilates';
UPDATE services SET image = 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&h=600&fit=crop' WHERE slug = 'etirements-guides' OR name LIKE '%tirements guid%s';
UPDATE services SET image = 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&h=600&fit=crop' WHERE slug = 'musculation' OR name LIKE 'Musculation%';
UPDATE services SET image = 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop' WHERE slug = 'meditation' OR name LIKE 'M%ditation%';
UPDATE services SET image = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=600&fit=crop' WHERE slug = 'coaching-nutrition';

SELECT 'Toutes les images ont été mises à jour!' as status;
