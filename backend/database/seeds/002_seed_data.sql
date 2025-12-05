-- =====================================================
-- Données de seed pour GlamGo
-- =====================================================

-- Insertion des catégories principales
INSERT INTO categories (name, slug, description, icon, parent_id, display_order) VALUES
('Beauté', 'beaute', 'Services de beauté et bien-être', 'beauty.svg', NULL, 1),
('Maison', 'maison', 'Services pour la maison', 'home.svg', NULL, 2),
('Voiture', 'voiture', 'Services pour votre véhicule', 'car.svg', NULL, 3),
('Animaux', 'animaux', 'Services pour vos animaux de compagnie', 'pet.svg', NULL, 4);

-- Sous-catégories Beauté
INSERT INTO categories (name, slug, description, icon, parent_id, display_order) VALUES
('Coiffure', 'coiffure', 'Coupe, coloration, coiffage', 'hair.svg', 1, 1),
('Esthétique', 'esthetique', 'Soins du visage et du corps', 'face.svg', 1, 2),
('Manucure & Pédicure', 'manucure-pedicure', 'Soins des mains et des pieds', 'nails.svg', 1, 3),
('Massage', 'massage', 'Massages relaxants et thérapeutiques', 'massage.svg', 1, 4);

-- Sous-catégories Maison
INSERT INTO categories (name, slug, description, icon, parent_id, display_order) VALUES
('Nettoyage', 'nettoyage', 'Nettoyage et entretien', 'clean.svg', 2, 1),
('Plomberie', 'plomberie', 'Réparations et installations', 'plumbing.svg', 2, 2),
('Électricité', 'electricite', 'Installations et dépannages électriques', 'electric.svg', 2, 3),
('Jardinage', 'jardinage', 'Entretien d\'espaces verts', 'garden.svg', 2, 4);

-- Sous-catégories Voiture
INSERT INTO categories (name, slug, description, icon, parent_id, display_order) VALUES
('Lavage', 'lavage', 'Lavage intérieur et extérieur', 'car-wash.svg', 3, 1),
('Mécanique', 'mecanique', 'Réparations mécaniques', 'mechanic.svg', 3, 2);

-- Sous-catégories Animaux
INSERT INTO categories (name, slug, description, icon, parent_id, display_order) VALUES
('Toilettage', 'toilettage', 'Toilettage et soins', 'pet-grooming.svg', 4, 1),
('Vétérinaire', 'veterinaire', 'Soins vétérinaires à domicile', 'vet.svg', 4, 2);

-- Services de Coiffure
INSERT INTO services (category_id, name, slug, description, price, duration_minutes) VALUES
(5, 'Coupe Homme', 'coupe-homme', 'Coupe de cheveux classique pour homme', 80.00, 30),
(5, 'Coupe Femme', 'coupe-femme', 'Coupe de cheveux pour femme', 120.00, 45),
(5, 'Brushing', 'brushing', 'Brushing professionnel', 100.00, 40),
(5, 'Coloration', 'coloration', 'Coloration complète', 250.00, 120),
(5, 'Mèches', 'meches', 'Mèches ou balayage', 300.00, 150);

-- Services d'Esthétique
INSERT INTO services (category_id, name, slug, description, price, duration_minutes) VALUES
(6, 'Soin du visage', 'soin-visage', 'Soin complet du visage', 200.00, 60),
(6, 'Épilation jambes', 'epilation-jambes', 'Épilation complète des jambes', 150.00, 45),
(6, 'Maquillage', 'maquillage', 'Maquillage professionnel', 180.00, 60);

-- Services Manucure & Pédicure
INSERT INTO services (category_id, name, slug, description, price, duration_minutes) VALUES
(7, 'Manucure classique', 'manucure-classique', 'Manucure avec vernis', 80.00, 30),
(7, 'Manucure gel', 'manucure-gel', 'Pose de vernis semi-permanent', 120.00, 45),
(7, 'Pédicure classique', 'pedicure-classique', 'Pédicure avec vernis', 100.00, 45),
(7, 'Pédicure spa', 'pedicure-spa', 'Pédicure avec soin relaxant', 150.00, 60);

-- Services Massage
INSERT INTO services (category_id, name, slug, description, price, duration_minutes) VALUES
(8, 'Massage relaxant 30min', 'massage-relaxant-30', 'Massage relaxant de 30 minutes', 150.00, 30),
(8, 'Massage relaxant 60min', 'massage-relaxant-60', 'Massage relaxant d\'une heure', 250.00, 60),
(8, 'Massage sportif', 'massage-sportif', 'Massage pour sportifs', 300.00, 60);

-- Services de Nettoyage
INSERT INTO services (category_id, name, slug, description, price, duration_minutes) VALUES
(9, 'Nettoyage appartement', 'nettoyage-appartement', 'Nettoyage complet d\'appartement', 200.00, 120),
(9, 'Nettoyage villa', 'nettoyage-villa', 'Nettoyage complet de villa', 400.00, 240),
(9, 'Nettoyage express', 'nettoyage-express', 'Nettoyage rapide', 120.00, 60);

-- Services de Plomberie
INSERT INTO services (category_id, name, slug, description, price, duration_minutes) VALUES
(10, 'Dépannage plomberie', 'depannage-plomberie', 'Intervention d\'urgence', 250.00, 60),
(10, 'Installation sanitaire', 'installation-sanitaire', 'Installation équipement sanitaire', 300.00, 120);

-- Services d'Électricité
INSERT INTO services (category_id, name, slug, description, price, duration_minutes) VALUES
(11, 'Dépannage électrique', 'depannage-electrique', 'Intervention d\'urgence', 250.00, 60),
(11, 'Installation électrique', 'installation-electrique', 'Installation équipement électrique', 300.00, 120);

-- Services de Jardinage
INSERT INTO services (category_id, name, slug, description, price, duration_minutes) VALUES
(12, 'Tonte de pelouse', 'tonte-pelouse', 'Tonte et entretien de pelouse', 150.00, 60),
(12, 'Taille de haies', 'taille-haies', 'Taille et formation de haies', 180.00, 90);

-- Services de Lavage auto
INSERT INTO services (category_id, name, slug, description, price, duration_minutes) VALUES
(13, 'Lavage extérieur', 'lavage-exterieur', 'Lavage extérieur complet', 80.00, 30),
(13, 'Lavage complet', 'lavage-complet', 'Lavage intérieur et extérieur', 150.00, 60),
(13, 'Lavage premium', 'lavage-premium', 'Lavage premium avec cirage', 250.00, 90);

-- Services de Mécanique
INSERT INTO services (category_id, name, slug, description, price, duration_minutes) VALUES
(14, 'Vidange', 'vidange', 'Vidange et changement de filtre', 300.00, 45),
(14, 'Diagnostic panne', 'diagnostic-panne', 'Diagnostic mécanique', 200.00, 60);

-- Services de Toilettage animaux
INSERT INTO services (category_id, name, slug, description, price, duration_minutes) VALUES
(15, 'Toilettage chien petit', 'toilettage-chien-petit', 'Pour chiens de petite taille', 120.00, 45),
(15, 'Toilettage chien grand', 'toilettage-chien-grand', 'Pour chiens de grande taille', 200.00, 90),
(15, 'Toilettage chat', 'toilettage-chat', 'Toilettage pour chat', 100.00, 45);

-- Services vétérinaires
INSERT INTO services (category_id, name, slug, description, price, duration_minutes) VALUES
(16, 'Consultation vétérinaire', 'consultation-veterinaire', 'Consultation à domicile', 250.00, 30),
(16, 'Vaccination', 'vaccination', 'Vaccination à domicile', 200.00, 20);
