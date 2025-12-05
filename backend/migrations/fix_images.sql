-- Correction des images pour mieux correspondre aux services
SET NAMES utf8mb4;

-- =====================================================
-- COIFFURE HOMME - Amélioration
-- =====================================================
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&q=80' WHERE name = 'Taille de barbe classique';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&q=80' WHERE name = 'Barbe & contours';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80' WHERE name = 'Rasage à l''ancienne';

-- =====================================================
-- COIFFURE FEMME - Plus spécifiques
-- =====================================================
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&q=80' WHERE name = 'Coupe cheveux courts';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&q=80' WHERE name = 'Coupe cheveux longs';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400&q=80' WHERE name = 'Coloration cheveux courts';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80' WHERE name = 'Brushing';

-- =====================================================
-- MAQUILLAGE - Images plus appropriées
-- =====================================================
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&q=80' WHERE name = 'Maquillage jour';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=80' WHERE name = 'Maquillage soirée';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&q=80' WHERE name = 'Maquillage mariage';

-- =====================================================
-- MANUCURE - Différencier
-- =====================================================
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=80' WHERE name = 'Manucure femme';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1440186347098-386b7459ad6b?w=400&q=80' WHERE name = 'Manucure homme';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400&q=80' WHERE name = 'Pédicure spa';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=80' WHERE name = 'Pose gel';

-- =====================================================
-- ÉPILATION - Images spécifiques
-- =====================================================
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=80' WHERE name = 'Jambes complètes femme';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&q=80' WHERE name = 'Sourcils + visage';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80' WHERE name = 'Torse homme';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80' WHERE name = 'Dos homme';

-- =====================================================
-- MASSAGES - Ambiances différentes
-- =====================================================
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80' WHERE name = 'Massage relaxant';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=400&q=80' WHERE name = 'Massage tonique';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400&q=80' WHERE name = 'Massage sportif';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&q=80' WHERE name = 'Massage thaïlandais';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80' WHERE name = 'Massage marocain traditionnel';

-- =====================================================
-- BIEN-ÊTRE & COACHING - Activités distinctes
-- =====================================================
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80' WHERE name = 'Séance de Yoga';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=80' WHERE name = 'Cours de Pilates';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80' WHERE name = 'Étirements guidés';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80' WHERE name = 'Musculation personnalisée';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80' WHERE name = 'Méditation & respiration';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80' WHERE name = 'Coaching nutrition';

-- =====================================================
-- JARDINAGE - Images spécifiques aux tâches
-- =====================================================
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=400&q=80' WHERE name = 'Entretien pelouse';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=400&q=80' WHERE name = 'Taille de haies';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80' WHERE name = 'Plantation fleurs';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&q=80' WHERE name = 'Entretien jardin complet';

-- =====================================================
-- MÉNAGE - Plus représentatif
-- =====================================================
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80' WHERE name = 'Ménage classique (2h)';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&q=80' WHERE name = 'Ménage approfondi (2h)';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&q=80' WHERE name = 'Nettoyage après évènement';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80' WHERE name = 'Nettoyage printemps';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80' WHERE name = 'Nettoyage cuisine';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80' WHERE name = 'Nettoyage salle de bain';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1489274495757-95c7c837b101?w=400&q=80' WHERE name = 'Service repassage (1h)';

-- =====================================================
-- MÉCANIQUE AUTO - Précision
-- =====================================================
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=400&q=80' WHERE name = 'Vidange huile';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=400&q=80' WHERE name = 'Changement ampoule' AND category_id = 10;
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&q=80' WHERE name = 'Changement essuie-glace';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=400&q=80' WHERE name = 'Changement pneu';

-- =====================================================
-- NETTOYAGE AUTO - Distinction
-- =====================================================
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80' WHERE name = 'Nettoyage extérieur';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=400&q=80' WHERE name = 'Nettoyage intérieur';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&q=80' WHERE name = 'Combo intérieur + extérieur';

-- =====================================================
-- SERVICES ANIMAUX - Variété
-- =====================================================
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80' WHERE name = 'Toilettage chien';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&q=80' WHERE name = 'Promenade chien';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&q=80' WHERE name = 'Gardiennage à domicile';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80' WHERE name = 'Gardiennage longue durée';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&q=80' WHERE name = 'Nourrissage animaux';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&q=80' WHERE name = 'Transport animaux';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80' WHERE name = 'Nettoyage espace animal';

-- =====================================================
-- BRICOLAGE - Outils et travaux
-- =====================================================
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&q=80' WHERE name = 'Montage meuble';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=400&q=80' WHERE name = 'Changement ampoule' AND category_id = 13;
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&q=80' WHERE name = 'Petits travaux plomberie';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&q=80' WHERE name = 'Perçage et fixation';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=400&q=80' WHERE name = 'Petit déménagement';

-- =====================================================
-- CUISINE - Chef et cuisine
-- =====================================================
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80' WHERE name = 'Préparation repas';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&q=80' WHERE name = 'Chef évènementiel';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?w=400&q=80' WHERE name = 'Coaching cuisine';

-- =====================================================
-- SERVICES TOURISTES - Variété services
-- =====================================================
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=400&q=80' WHERE name = 'Blanchisserie express';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=400&q=80' WHERE name = 'Service conciergerie';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400&q=80' WHERE name = 'Guide touristique';
UPDATE services SET image_url = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&q=80' WHERE name = 'Transfer aéroport';

SELECT 'Images mises à jour avec succès!' as status;
