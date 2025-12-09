-- Import production data - 6 categories, 24 services
-- Run on Fly.io PostgreSQL

-- Clear existing data
TRUNCATE services CASCADE;
TRUNCATE categories CASCADE;

-- Insert categories
INSERT INTO categories (id, name, slug, description, icon, is_active, display_order) VALUES
(1, 'Beauté', 'beaute', 'Services de beauté', 'spa', TRUE, 1),
(2, 'Maison', 'maison', 'Services pour la maison', 'home', TRUE, 2),
(3, 'Voiture', 'voiture', 'Services automobiles', 'car', TRUE, 3),
(4, 'Animaux', 'animaux', 'Services pour animaux', 'paw', TRUE, 4),
(5, 'Bien-être', 'bien-etre', 'Services de bien-être', 'heart', TRUE, 5),
(6, 'Sport', 'sport', 'Services sportifs', 'dumbbell', TRUE, 6);

-- Reset sequence
SELECT setval('categories_id_seq', 6);

-- Insert services
INSERT INTO services (category_id, name, slug, description, image, price, duration_minutes, is_active) VALUES
(1, 'Coiffure Homme Premium', 'coiffure-homme-premium', 'Coiffure haut de gamme homme avec soins capillaires', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1', 200.00, 45, TRUE),
(1, 'Coiffure Homme Simple', 'coiffure-homme-simple', 'Coupe classique homme avec finitions soignées', 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a', 100.00, 30, TRUE),
(2, 'Ménage', 'menage', 'Nettoyage complet de votre domicile', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952', 175.00, 180, TRUE),
(3, 'Nettoyage Auto Complet', 'nettoyage-auto-complet', 'Nettoyage complet intérieur + extérieur', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64', 250.00, 90, TRUE),
(3, 'Nettoyage Auto Externe', 'nettoyage-auto-externe', 'Lavage extérieur complet : carrosserie, vitres, jantes', 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f', 150.00, 45, TRUE),
(3, 'Nettoyage Auto Interne', 'nettoyage-auto-interne', 'Nettoyage intérieur complet : aspirateur, tissus, tableau de bord', 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc', 150.00, 60, TRUE),
(1, 'Pack Coiffure + Barbe', 'pack-coiffure-barbe', 'Formule complète homme : coupe et taille de barbe', 'https://images.unsplash.com/photo-1585747860019-8e52e90ab3f9', 150.00, 50, TRUE),
(1, 'Taille de Barbe', 'taille-de-barbe', 'Taille et entretien de barbe professionnel', 'https://images.unsplash.com/photo-1621605815971-fbc98d665033', 100.00, 25, TRUE),
(6, 'Coach Sportif', 'coach-sportif', 'Coaching sportif personnalisé : fitness, musculation, cardio', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48', 250.00, 60, TRUE),
(1, 'Coiffure Classique', 'coiffure-classique', 'Coiffure complète avec soins : shampoing, coupe, brushing', 'https://images.unsplash.com/photo-1560066984-138dadb4c035', 250.00, 60, TRUE),
(1, 'Coiffure Express', 'coiffure-express', 'Coupe et brushing rapide à domicile', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e', 125.00, 30, TRUE),
(1, 'Coiffure Mariage & Événement', 'coiffure-mariage-evenement', 'Coiffure professionnelle pour mariages et événements', 'https://images.unsplash.com/photo-1457972729786-0411a3b2b626', 1150.00, 120, TRUE),
(2, 'Petits Bricolages', 'petits-bricolages', 'Petits travaux de réparation et maintenance à domicile', 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189', 200.00, 60, TRUE),
(4, 'Gardiennage d''Animaux', 'gardiennage-animaux', 'Garde à domicile avec photos régulières', 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b', 200.00, 480, TRUE),
(4, 'Promenade d''Animaux', 'promenade-animaux', 'Balade quotidienne de votre animal avec suivi GPS', 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1', 100.00, 60, TRUE),
(6, 'Yoga', 'yoga', 'Cours particuliers de yoga à domicile', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b', 200.00, 60, TRUE),
(2, 'Chef à Domicile - 2 Personnes', 'chef-domicile-2-personnes', 'Chef professionnel pour repas gastronomique', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136', 600.00, 180, TRUE),
(2, 'Chef à Domicile - 4 Personnes', 'chef-domicile-4-personnes', 'Chef professionnel pour 4 convives', 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c', 1000.00, 240, TRUE),
(2, 'Chef à Domicile - 8 Personnes', 'chef-domicile-8-personnes', 'Chef professionnel pour grande tablée', 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c', 1800.00, 300, TRUE),
(2, 'Jardinage', 'jardinage', 'Entretien complet de jardins', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b', 250.00, 120, TRUE),
(5, 'Massage Relaxant', 'massage-relaxant', 'Massage relaxant aux huiles essentielles', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874', 325.00, 60, TRUE),
(6, 'Danse Orientale', 'danse-orientale', 'Cours particuliers de danse orientale à domicile', 'https://images.unsplash.com/photo-1518611012118-696072aa579a', 200.00, 60, TRUE),
(5, 'Hammam & Gommage', 'hammam-gommage', 'Hammam traditionnel avec gommage au savon noir', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef', 400.00, 90, TRUE),
(5, 'Soin Premium Argan', 'soin-premium-argan', 'Soin complet aux produits d''argan bio du Maroc', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881', 600.00, 120, TRUE);

-- Reset service sequence
SELECT setval('services_id_seq', (SELECT MAX(id) FROM services));

-- Verify
SELECT 'Categories: ' || COUNT(*) FROM categories;
SELECT 'Services: ' || COUNT(*) FROM services;
