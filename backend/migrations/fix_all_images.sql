-- =====================================================
-- CORRECTION COMPLÈTE DES IMAGES - Services et Catégories
-- Images Unsplash appropriées pour chaque service
-- =====================================================
SET NAMES utf8mb4;

-- =====================================================
-- COIFFURE HOMME - Images barbier/salon masculin
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1621607003950-2dee0c94129f?w=800&h=600&fit=crop' WHERE slug = 'coupe-classique-homme';
UPDATE services SET image = 'https://images.unsplash.com/photo-1621939514424-e1e4e6c59d35?w=800&h=600&fit=crop' WHERE slug = 'coupe-tendance-homme';
UPDATE services SET image = 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&h=600&fit=crop' WHERE slug = 'taille-barbe-classique';
UPDATE services SET image = 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=800&h=600&fit=crop' WHERE slug = 'barbe-contours';
UPDATE services SET image = 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&h=600&fit=crop' WHERE slug = 'rasage-ancienne';
UPDATE services SET image = 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&h=600&fit=crop' WHERE slug = 'soin-barbe';
UPDATE services SET image = 'https://images.unsplash.com/photo-1621607003950-2dee0c94129f?w=800&h=600&fit=crop' WHERE slug = 'combo-coupe-barbe';

-- =====================================================
-- COIFFURE FEMME - Images coiffure féminine
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop' WHERE slug = 'coupe-cheveux-courts';
UPDATE services SET image = 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=600&fit=crop' WHERE slug = 'coupe-cheveux-longs';
UPDATE services SET image = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=600&fit=crop' WHERE slug = 'coloration-cheveux-courts';
UPDATE services SET image = 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=800&h=600&fit=crop' WHERE slug = 'coloration-cheveux-longs';
UPDATE services SET image = 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800&h=600&fit=crop' WHERE slug = 'brushing';
UPDATE services SET image = 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&h=600&fit=crop' WHERE slug = 'chignon';
UPDATE services SET image = 'https://images.unsplash.com/photo-1605980413787-d72a4e7d1c90?w=800&h=600&fit=crop' WHERE slug = 'soin-cheveux';

-- =====================================================
-- MAQUILLAGE - Images maquillage professionnel
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&h=600&fit=crop' WHERE slug = 'maquillage-jour';
UPDATE services SET image = 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=600&fit=crop' WHERE slug = 'maquillage-soiree';
UPDATE services SET image = 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=800&h=600&fit=crop' WHERE slug = 'maquillage-mariage';
UPDATE services SET image = 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&h=600&fit=crop' WHERE slug = 'maquillage-oriental';

-- =====================================================
-- MANUCURE & PÉDICURE - Images soins ongles
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=600&fit=crop' WHERE slug = 'manucure-femme';
UPDATE services SET image = 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=800&h=600&fit=crop' WHERE slug = 'manucure-homme';
UPDATE services SET image = 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=800&h=600&fit=crop' WHERE slug = 'pedicure-spa';
UPDATE services SET image = 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=800&h=600&fit=crop' WHERE slug = 'pose-gel';
UPDATE services SET image = 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=800&h=600&fit=crop' WHERE slug = 'nail-art';

-- =====================================================
-- ÉPILATION - Images épilation/spa
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=600&fit=crop' WHERE slug = 'jambes-completes-femme';
UPDATE services SET image = 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800&h=600&fit=crop' WHERE slug = 'demi-jambes-femme';
UPDATE services SET image = 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800&h=600&fit=crop' WHERE slug = 'sourcils-visage';
UPDATE services SET image = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop' WHERE slug = 'torse-homme';
UPDATE services SET image = 'https://images.unsplash.com/photo-1571019613576-2b22c76fd955?w=800&h=600&fit=crop' WHERE slug = 'dos-homme';
UPDATE services SET image = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop' WHERE slug = 'epilation-homme';

-- =====================================================
-- MASSAGES - Images spa/massage
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=600&fit=crop' WHERE slug = 'massage-relaxant';
UPDATE services SET image = 'https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=800&h=600&fit=crop' WHERE slug = 'massage-tonique';
UPDATE services SET image = 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&h=600&fit=crop' WHERE slug = 'massage-sportif';
UPDATE services SET image = 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&h=600&fit=crop' WHERE slug = 'massage-thailandais';
UPDATE services SET image = 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=600&fit=crop' WHERE slug = 'massage-marocain';
UPDATE services SET image = 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=600&fit=crop' WHERE slug = 'massage-couple';

-- =====================================================
-- BIEN-ÊTRE & COACHING - Images fitness/yoga
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop' WHERE slug = 'yoga';
UPDATE services SET image = 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=600&fit=crop' WHERE slug = 'pilates';
UPDATE services SET image = 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&h=600&fit=crop' WHERE slug = 'etirements-guides';
UPDATE services SET image = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop' WHERE slug = 'musculation';
UPDATE services SET image = 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop' WHERE slug = 'meditation-respiration';
UPDATE services SET image = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=600&fit=crop' WHERE slug = 'coaching-nutrition';

-- =====================================================
-- MÉNAGE - Images nettoyage/entretien
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800&h=600&fit=crop' WHERE slug = 'menage-classique';
UPDATE services SET image = 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&h=600&fit=crop' WHERE slug = 'menage-approfondi';
UPDATE services SET image = 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&h=600&fit=crop' WHERE slug = 'nettoyage-apres-evenement';
UPDATE services SET image = 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=800&h=600&fit=crop' WHERE slug = 'nettoyage-printemps';
UPDATE services SET image = 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&h=600&fit=crop' WHERE slug = 'nettoyage-cuisine';
UPDATE services SET image = 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=600&fit=crop' WHERE slug = 'nettoyage-salle-bain';
UPDATE services SET image = 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&h=600&fit=crop' WHERE slug = 'service-repassage';

-- =====================================================
-- BRICOLAGE - Images outils/travaux
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&h=600&fit=crop' WHERE slug = 'montage-meuble';
UPDATE services SET image = 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop' WHERE slug = 'changement-ampoule' AND category_id IN (SELECT id FROM categories WHERE slug = 'bricolage');
UPDATE services SET image = 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&h=600&fit=crop' WHERE slug = 'petits-travaux-plomberie';
UPDATE services SET image = 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&h=600&fit=crop' WHERE slug = 'percage-fixation';
UPDATE services SET image = 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=800&h=600&fit=crop' WHERE slug = 'petit-demenagement';

-- =====================================================
-- CUISINE - Images chef/cuisine
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop' WHERE slug = 'preparation-repas';
UPDATE services SET image = 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800&h=600&fit=crop' WHERE slug = 'chef-evenementiel';
UPDATE services SET image = 'https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?w=800&h=600&fit=crop' WHERE slug = 'coaching-cuisine';

-- =====================================================
-- MÉCANIQUE AUTO - Images mécanicien/garage
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=800&h=600&fit=crop' WHERE slug = 'vidange-huile';
UPDATE services SET image = 'https://images.unsplash.com/photo-1614165936126-273a0e40c69e?w=800&h=600&fit=crop' WHERE slug = 'changement-ampoule-voiture';
UPDATE services SET image = 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=800&h=600&fit=crop' WHERE slug = 'changement-essuie-glace';
UPDATE services SET image = 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=800&h=600&fit=crop' WHERE slug = 'changement-pneu';

-- =====================================================
-- LAVAGE AUTO - Images lavage voiture
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&h=600&fit=crop' WHERE slug = 'lavage-exterieur';
UPDATE services SET image = 'https://images.unsplash.com/photo-1601362840547-9e518eea0e47?w=800&h=600&fit=crop' WHERE slug = 'lavage-interieur';
UPDATE services SET image = 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&h=600&fit=crop' WHERE slug = 'lavage-complet';
UPDATE services SET image = 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800&h=600&fit=crop' WHERE slug = 'lavage-premium';
UPDATE services SET image = 'https://images.unsplash.com/photo-1601362840547-9e518eea0e47?w=800&h=600&fit=crop' WHERE slug = 'combo-interieur-exterieur';

-- =====================================================
-- SERVICES ANIMAUX - Images animaux de compagnie
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=800&h=600&fit=crop' WHERE slug = 'toilettage-chien';
UPDATE services SET image = 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&h=600&fit=crop' WHERE slug = 'toilettage-chien-petit';
UPDATE services SET image = 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=600&fit=crop' WHERE slug = 'toilettage-chien-grand';
UPDATE services SET image = 'https://images.unsplash.com/photo-1573865526739-10c1dd7aa000?w=800&h=600&fit=crop' WHERE slug = 'toilettage-chat';
UPDATE services SET image = 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=800&h=600&fit=crop' WHERE slug = 'promenade-chien';
UPDATE services SET image = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop' WHERE slug = 'gardiennage-domicile';
UPDATE services SET image = 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&h=600&fit=crop' WHERE slug = 'gardiennage-longue-duree';
UPDATE services SET image = 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=800&h=600&fit=crop' WHERE slug = 'nourrissage-animaux';
UPDATE services SET image = 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=800&h=600&fit=crop' WHERE slug = 'transport-animaux';
UPDATE services SET image = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&h=600&fit=crop' WHERE slug = 'nettoyage-espace-animal';

-- =====================================================
-- JARDINAGE - Images jardin/plantes
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=800&h=600&fit=crop' WHERE slug = 'entretien-pelouse';
UPDATE services SET image = 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800&h=600&fit=crop' WHERE slug = 'taille-haies';
UPDATE services SET image = 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop' WHERE slug = 'plantation-fleurs';
UPDATE services SET image = 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&h=600&fit=crop' WHERE slug = 'entretien-jardin-complet';

-- =====================================================
-- VÉTÉRINAIRE - Images soins vétérinaires
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800&h=600&fit=crop' WHERE slug = 'consultation-veterinaire';
UPDATE services SET image = 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&h=600&fit=crop' WHERE slug = 'vaccination-domicile';
UPDATE services SET image = 'https://images.unsplash.com/photo-1581888227599-779811939961?w=800&h=600&fit=crop' WHERE slug = 'soin-urgence';

-- =====================================================
-- SERVICES PROBLÉMATIQUES - Corrections spécifiques
-- =====================================================
-- Les services de nettoyage qui avaient une mauvaise catégorie "Animal"
UPDATE services SET image = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop'
WHERE slug = 'nettoyage-appartement' AND category_id = 9;

UPDATE services SET image = 'https://images.unsplash.com/photo-1600320254374-ce2d293c324e?w=800&h=600&fit=crop'
WHERE slug = 'nettoyage-villa' AND category_id = 9;

UPDATE services SET image = 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&h=600&fit=crop'
WHERE slug = 'nettoyage-express' AND category_id = 9;

SELECT 'Images mises à jour avec succès!' as status;
