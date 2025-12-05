-- GlamGo Marrakech - Import des prestations touristiques
-- Date: 2025-11-17
-- Ce script remplace les données existantes par les nouvelles prestations

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Désactiver les contraintes de clés étrangères temporairement
SET FOREIGN_KEY_CHECKS = 0;

-- Vider les tables existantes
TRUNCATE TABLE services;
TRUNCATE TABLE categories;

-- Réactiver les contraintes
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- INSERTION DES CATEGORIES
-- =====================================================
INSERT INTO categories (id, name, description, image_url, display_order, is_active) VALUES
(1, 'Coiffure Homme', 'Services de coiffure et barbier pour hommes', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80', 1, 1),
(2, 'Coiffure Femme', 'Coupes, colorations et soins capillaires pour femmes', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80', 2, 1),
(3, 'Maquillage', 'Maquillage professionnel pour toutes occasions', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80', 3, 1),
(4, 'Manucure & Pédicure', 'Soins des mains et des pieds', 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80', 4, 1),
(5, 'Épilation', 'Services d''épilation professionnelle', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80', 5, 1),
(6, 'Massages', 'Massages relaxants et thérapeutiques', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80', 6, 1),
(7, 'Bien-être & Coaching', 'Yoga, fitness et coaching personnalisé', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80', 7, 1),
(8, 'Jardinage', 'Entretien de jardins et espaces verts', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80', 8, 1),
(9, 'Ménage & Nettoyage', 'Services de nettoyage à domicile', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80', 9, 1),
(10, 'Mécanique Auto', 'Entretien automobile à domicile', 'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=600&q=80', 10, 1),
(11, 'Nettoyage Auto', 'Lavage et nettoyage de véhicules', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', 11, 1),
(12, 'Services Animaux', 'Toilettage, promenade et gardiennage', 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80', 12, 1),
(13, 'Bricolage', 'Montage, réparations et petits travaux', 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600&q=80', 13, 1),
(14, 'Cuisine à Domicile', 'Chef privé et cours de cuisine', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80', 14, 1),
(15, 'Services Touristes', 'Blanchisserie, conciergerie et assistance', 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=600&q=80', 15, 1);

-- =====================================================
-- INSERTION DES SERVICES
-- =====================================================

-- Coiffure Homme (category_id = 1)
INSERT INTO services (category_id, name, description, duration_minutes, price, image_url, is_active) VALUES
(1, 'Coupe classique', 'Coupe traditionnelle avec coiffage soigné', 30, 135.00, 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&q=80', 1),
(1, 'Coupe tendance', 'Dégradé moderne, style contemporain', 40, 175.00, 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&q=80', 1),
(1, 'Taille de barbe classique', 'Uniformisation et finitions soignées', 20, 100.00, 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&q=80', 1),
(1, 'Barbe & contours', 'Tracé net au rasoir et tondeuse', 30, 125.00, 'https://images.unsplash.com/photo-1593702288056-f2fbc5ee5fda?w=400&q=80', 1),
(1, 'Rasage à l''ancienne', 'Serviette chaude et rasage traditionnel', 30, 175.00, 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80', 1),
(1, 'Soin barbe complet', 'Nettoyage, vapeur, huile et baume', 30, 150.00, 'https://images.unsplash.com/photo-1578116922645-3976907a7671?w=400&q=80', 1),
(1, 'Combo coupe + barbe', 'Coupe complète avec taille de barbe', 60, 260.00, 'https://images.unsplash.com/photo-1585747860019-8e52e90ab3f9?w=400&q=80', 1);

-- Coiffure Femme (category_id = 2)
INSERT INTO services (category_id, name, description, duration_minutes, price, image_url, is_active) VALUES
(2, 'Coupe cheveux courts', 'Coupe et brushing professionnels', 45, 225.00, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80', 1),
(2, 'Coupe cheveux longs', 'Coupe et brushing pour cheveux longs', 60, 300.00, 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80', 1),
(2, 'Coloration cheveux courts', 'Coloration complète avec soin', 75, 450.00, 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&q=80', 1),
(2, 'Coloration cheveux longs', 'Coloration et soin pour cheveux longs', 105, 700.00, 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&q=80', 1),
(2, 'Brushing', 'Mise en forme et coiffage', 45, 150.00, 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&q=80', 1);

-- Maquillage (category_id = 3)
INSERT INTO services (category_id, name, description, duration_minutes, price, image_url, is_active) VALUES
(3, 'Maquillage jour', 'Look naturel et discret', 45, 300.00, 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&q=80', 1),
(3, 'Maquillage soirée', 'Look glamour et sophistiqué', 60, 500.00, 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=80', 1),
(3, 'Maquillage mariage', 'Maquillage complet avec retouches', 120, 1000.00, 'https://images.unsplash.com/photo-1457972729786-0411a3b2b626?w=400&q=80', 1);

-- Manucure & Pédicure (category_id = 4)
INSERT INTO services (category_id, name, description, duration_minutes, price, image_url, is_active) VALUES
(4, 'Manucure femme', 'Coupe, limage et pose de vernis', 45, 175.00, 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=80', 1),
(4, 'Manucure homme', 'Coupe et soin naturel', 30, 135.00, 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=400&q=80', 1),
(4, 'Pédicure spa', 'Bain relaxant, soin complet et vernis', 60, 300.00, 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400&q=80', 1),
(4, 'Pose gel', 'Manucure avec pose de gel longue durée', 90, 350.00, 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=80', 1);

-- Épilation (category_id = 5)
INSERT INTO services (category_id, name, description, duration_minutes, price, image_url, is_active) VALUES
(5, 'Jambes complètes femme', 'Épilation à la cire chaude ou tiède', 45, 225.00, 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=80', 1),
(5, 'Sourcils + visage', 'Épilation au fil ou à la cire', 20, 125.00, 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400&q=80', 1),
(5, 'Torse homme', 'Épilation à la cire chaude', 45, 300.00, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80', 1),
(5, 'Dos homme', 'Épilation complète du dos', 45, 300.00, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80', 1),
(5, 'Bras complets', 'Épilation des bras à la cire', 40, 250.00, 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=80', 1);

-- Massages (category_id = 6)
INSERT INTO services (category_id, name, description, duration_minutes, price, image_url, is_active) VALUES
(6, 'Massage relaxant', 'Détente et bien-être complet', 60, 400.00, 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80', 1),
(6, 'Massage tonique', 'Massage énergisant et revigorant', 60, 400.00, 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&q=80', 1),
(6, 'Massage sportif', 'Récupération musculaire profonde', 60, 450.00, 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400&q=80', 1),
(6, 'Massage thaïlandais', 'Étirements et pressions traditionnels', 75, 600.00, 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&q=80', 1),
(6, 'Massage marocain traditionnel', 'Hammam et huiles essentielles', 90, 700.00, 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80', 1);

-- Bien-être & Coaching (category_id = 7)
INSERT INTO services (category_id, name, description, duration_minutes, price, image_url, is_active) VALUES
(7, 'Séance de Yoga', 'Relaxation, souplesse et équilibre', 60, 250.00, 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80', 1),
(7, 'Cours de Pilates', 'Renforcement musculaire en douceur', 60, 300.00, 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=80', 1),
(7, 'Étirements guidés', 'Souplesse et prévention blessures', 45, 250.00, 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80', 1),
(7, 'Musculation personnalisée', 'Programme adapté à vos objectifs', 60, 400.00, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80', 1),
(7, 'Méditation & respiration', 'Gestion du stress et relaxation', 45, 250.00, 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80', 1),
(7, 'Coaching nutrition', 'Conseils alimentaires personnalisés', 60, 400.00, 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80', 1);

-- Jardinage (category_id = 8)
INSERT INTO services (category_id, name, description, duration_minutes, price, image_url, is_active) VALUES
(8, 'Entretien pelouse', 'Tonte et arrosage complet', 60, 250.00, 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80', 1),
(8, 'Taille de haies', 'Mise en forme avec outils fournis', 90, 325.00, 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=400&q=80', 1),
(8, 'Plantation fleurs', 'Mise en terre et arrosage', 60, 200.00, 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80', 1),
(8, 'Entretien jardin complet', 'Tonte, taille et désherbage', 180, 500.00, 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&q=80', 1);

-- Ménage & Nettoyage (category_id = 9)
INSERT INTO services (category_id, name, description, duration_minutes, price, image_url, is_active) VALUES
(9, 'Ménage classique (2h)', 'Poussière, sols et cuisine', 120, 200.00, 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80', 1),
(9, 'Ménage approfondi (2h)', 'Vitres, tapis et gros nettoyage', 120, 350.00, 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&q=80', 1),
(9, 'Nettoyage après évènement', 'Remise en ordre complète', 240, 650.00, 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&q=80', 1),
(9, 'Nettoyage printemps', 'Tri, rangement et nettoyage complet', 480, 1000.00, 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80', 1),
(9, 'Nettoyage cuisine', 'Dégraissage four, frigo et placards', 120, 400.00, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80', 1),
(9, 'Nettoyage salle de bain', 'Carrelage, joints et sanitaires', 90, 275.00, 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80', 1),
(9, 'Service repassage (1h)', 'Repassage vêtements à domicile', 60, 200.00, 'https://images.unsplash.com/photo-1489274495757-95c7c837b101?w=400&q=80', 1);

-- Mécanique Auto (category_id = 10)
INSERT INTO services (category_id, name, description, duration_minutes, price, image_url, is_active) VALUES
(10, 'Vidange huile', 'Changement huile et filtre', 60, 500.00, 'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=400&q=80', 1),
(10, 'Changement ampoule', 'Phare avant ou arrière', 20, 100.00, 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&q=80', 1),
(10, 'Changement essuie-glace', 'Pièces incluses', 20, 125.00, 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&q=80', 1),
(10, 'Changement pneu', 'Intervention à domicile', 45, 325.00, 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=400&q=80', 1);

-- Nettoyage Auto (category_id = 11)
INSERT INTO services (category_id, name, description, duration_minutes, price, image_url, is_active) VALUES
(11, 'Nettoyage extérieur', 'Lavage carrosserie et vitres', 45, 150.00, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', 1),
(11, 'Nettoyage intérieur', 'Aspirateur, tapis et sièges', 60, 185.00, 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=400&q=80', 1),
(11, 'Combo intérieur + extérieur', 'Lavage complet avec polish', 90, 325.00, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', 1);

-- Services Animaux (category_id = 12)
INSERT INTO services (category_id, name, description, duration_minutes, price, image_url, is_active) VALUES
(12, 'Toilettage chien', 'Bain complet et coupe', 60, 325.00, 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80', 1),
(12, 'Promenade chien', 'Sortie de 30 min à 1h', 60, 115.00, 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&q=80', 1),
(12, 'Gardiennage à domicile', 'Nourrir, jouer et promenade', 480, 200.00, 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&q=80', 1),
(12, 'Gardiennage longue durée', 'Séjour vacances (par semaine)', 10080, 1250.00, 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80', 1),
(12, 'Nourrissage animaux', 'Passage rapide', 15, 65.00, 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&q=80', 1),
(12, 'Transport animaux', 'Vétérinaire ou toilettage', 60, 200.00, 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&q=80', 1),
(12, 'Nettoyage espace animal', 'Cage, litière et coin repos', 30, 150.00, 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80', 1);

-- Bricolage (category_id = 13)
INSERT INTO services (category_id, name, description, duration_minutes, price, image_url, is_active) VALUES
(13, 'Montage meuble', 'IKEA, bois ou métal', 60, 200.00, 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&q=80', 1),
(13, 'Changement ampoule', 'Intervention rapide', 15, 65.00, 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=400&q=80', 1),
(13, 'Petits travaux plomberie', 'Fuite, robinet ou siphon', 60, 300.00, 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&q=80', 1),
(13, 'Perçage et fixation', 'Tableau, étagère ou support', 30, 115.00, 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&q=80', 1),
(13, 'Petit déménagement', 'Déplacement meubles et cartons', 120, 600.00, 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=400&q=80', 1);

-- Cuisine à Domicile (category_id = 14)
INSERT INTO services (category_id, name, description, duration_minutes, price, image_url, is_active) VALUES
(14, 'Préparation repas', 'Menu complet pour la famille', 120, 500.00, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80', 1),
(14, 'Chef évènementiel', 'Buffet, mariage ou soirée privée', 300, 2000.00, 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&q=80', 1),
(14, 'Coaching cuisine', 'Plats traditionnels marocains', 90, 400.00, 'https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?w=400&q=80', 1);

-- Services Touristes (category_id = 15)
INSERT INTO services (category_id, name, description, duration_minutes, price, image_url, is_active) VALUES
(15, 'Blanchisserie express', 'Lavage, séchage et pliage', 180, 250.00, 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=400&q=80', 1),
(15, 'Service conciergerie', 'Réservations et assistance', 60, 300.00, 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=400&q=80', 1),
(15, 'Guide touristique', 'Visite guidée personnalisée (demi-journée)', 240, 600.00, 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400&q=80', 1),
(15, 'Transfer aéroport', 'Transport privé confortable', 60, 350.00, 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&q=80', 1);

-- Confirmation
SELECT 'Import terminé avec succès!' as status;
SELECT COUNT(*) as total_categories FROM categories;
SELECT COUNT(*) as total_services FROM services;
