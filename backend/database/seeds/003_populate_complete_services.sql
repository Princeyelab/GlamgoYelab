-- =====================================================
-- Données complètes pour GlamGo - 5 Catégories Populaires
-- =====================================================
-- Ce fichier crée une structure complète avec 5 catégories principales
-- et tous leurs services respectifs avec prix et durées réalistes
-- =====================================================

-- =====================================================
-- NETTOYAGE DES DONNÉES EXISTANTES (OPTIONNEL)
-- =====================================================
-- Décommenter les lignes ci-dessous pour réinitialiser complètement les données
-- ATTENTION : Cela supprimera toutes les catégories et services existants

-- DELETE FROM services WHERE id > 0;
-- DELETE FROM categories WHERE id > 0;
-- ALTER TABLE categories AUTO_INCREMENT = 1;
-- ALTER TABLE services AUTO_INCREMENT = 1;

-- =====================================================
-- 1️⃣ CATÉGORIE : MAISON
-- =====================================================

INSERT INTO categories (name, slug, description, icon, parent_id, is_active, display_order) VALUES
('Maison', 'maison', 'Services pour votre maison et habitat', 'home.svg', NULL, TRUE, 1);

SET @maison_id = LAST_INSERT_ID();

-- Sous-catégorie : Ménage
INSERT INTO categories (name, slug, description, icon, parent_id, is_active, display_order) VALUES
('Ménage', 'menage', 'Services de nettoyage et entretien', 'clean.svg', @maison_id, TRUE, 1);

SET @menage_id = LAST_INSERT_ID();

-- Services de Ménage
INSERT INTO services (category_id, name, slug, description, price, duration_minutes, is_active) VALUES
(@menage_id, 'Ménage classique', 'menage-classique', 'Nettoyage standard de votre logement', 100.00, 60, TRUE),
(@menage_id, 'Ménage approfondi', 'menage-approfondi', 'Nettoyage en profondeur avec détails', 175.00, 90, TRUE),
(@menage_id, 'Nettoyage après événement', 'nettoyage-apres-evenement', 'Remise en état après fête ou réception', 650.00, 210, TRUE),
(@menage_id, 'Nettoyage de printemps', 'nettoyage-printemps', 'Grand nettoyage annuel complet', 1000.00, 480, TRUE),
(@menage_id, 'Nettoyage cuisine', 'nettoyage-cuisine', 'Nettoyage complet de la cuisine', 400.00, 120, TRUE),
(@menage_id, 'Nettoyage salle de bain', 'nettoyage-salle-bain', 'Nettoyage et désinfection sanitaires', 275.00, 90, TRUE),
(@menage_id, 'Service repassage', 'service-repassage', 'Repassage professionnel à domicile', 200.00, 60, TRUE);

-- Sous-catégorie : Bricolage
INSERT INTO categories (name, slug, description, icon, parent_id, is_active, display_order) VALUES
('Bricolage', 'bricolage', 'Petits travaux et réparations', 'tools.svg', @maison_id, TRUE, 2);

SET @bricolage_id = LAST_INSERT_ID();

-- Services de Bricolage
INSERT INTO services (category_id, name, slug, description, price, duration_minutes, is_active) VALUES
(@bricolage_id, 'Montage meuble', 'montage-meuble', 'Assemblage de meubles en kit', 200.00, 60, TRUE),
(@bricolage_id, 'Changement d\'ampoule', 'changement-ampoule', 'Remplacement d\'ampoules difficiles d\'accès', 65.00, 15, TRUE),
(@bricolage_id, 'Petits travaux plomberie', 'petits-travaux-plomberie', 'Réparations simples de plomberie', 300.00, 60, TRUE),
(@bricolage_id, 'Perçage et fixation', 'percage-fixation', 'Installation d\'étagères, cadres, etc.', 115.00, 30, TRUE),
(@bricolage_id, 'Petit déménagement', 'petit-demenagement', 'Déplacement d\'objets lourds ou encombrants', 600.00, 120, TRUE);

-- Sous-catégorie : Jardinage
INSERT INTO categories (name, slug, description, icon, parent_id, is_active, display_order) VALUES
('Jardinage', 'jardinage', 'Entretien d\'espaces verts', 'garden.svg', @maison_id, TRUE, 3);

SET @jardinage_id = LAST_INSERT_ID();

-- Services de Jardinage
INSERT INTO services (category_id, name, slug, description, price, duration_minutes, is_active) VALUES
(@jardinage_id, 'Entretien pelouse', 'entretien-pelouse', 'Tonte et entretien de gazon', 250.00, 60, TRUE),
(@jardinage_id, 'Taille haies', 'taille-haies', 'Taille et formation de haies', 325.00, 90, TRUE),
(@jardinage_id, 'Plantation fleurs', 'plantation-fleurs', 'Plantation et aménagement floral', 200.00, 60, TRUE);

-- Sous-catégorie : Cuisine à domicile
INSERT INTO categories (name, slug, description, icon, parent_id, is_active, display_order) VALUES
('Cuisine', 'cuisine-domicile', 'Services de chef à domicile', 'chef.svg', @maison_id, TRUE, 4);

SET @cuisine_id = LAST_INSERT_ID();

-- Services de Cuisine
INSERT INTO services (category_id, name, slug, description, price, duration_minutes, is_active) VALUES
(@cuisine_id, 'Préparation repas', 'preparation-repas', 'Chef prépare vos repas à domicile', 500.00, 120, TRUE),
(@cuisine_id, 'Chef événementiel', 'chef-evenementiel', 'Service traiteur pour événements', 1500.00, 240, TRUE),
(@cuisine_id, 'Coaching cuisine', 'coaching-cuisine', 'Cours de cuisine personnalisé', 400.00, 90, TRUE);

-- =====================================================
-- 2️⃣ CATÉGORIE : BEAUTÉ
-- =====================================================

INSERT INTO categories (name, slug, description, icon, parent_id, is_active, display_order) VALUES
('Beauté', 'beaute', 'Services de beauté et bien-être', 'beauty.svg', NULL, TRUE, 2);

SET @beaute_id = LAST_INSERT_ID();

-- Sous-catégorie : Coiffure Homme
INSERT INTO categories (name, slug, description, icon, parent_id, is_active, display_order) VALUES
('Coiffure Homme', 'coiffure-homme', 'Coupes et soins capillaires masculins', 'hair-man.svg', @beaute_id, TRUE, 1);

SET @coiffure_homme_id = LAST_INSERT_ID();

-- Services Coiffure Homme
INSERT INTO services (category_id, name, slug, description, price, duration_minutes, is_active) VALUES
(@coiffure_homme_id, 'Coupe classique homme', 'coupe-classique-homme', 'Coupe de cheveux classique', 135.00, 30, TRUE),
(@coiffure_homme_id, 'Coupe tendance homme', 'coupe-tendance-homme', 'Coupe moderne et stylée', 175.00, 40, TRUE),
(@coiffure_homme_id, 'Taille de barbe classique', 'taille-barbe-classique', 'Entretien de barbe simple', 100.00, 20, TRUE),
(@coiffure_homme_id, 'Barbe et contours', 'barbe-contours', 'Taille précise avec contours nets', 125.00, 30, TRUE),
(@coiffure_homme_id, 'Rasage à l\'ancienne', 'rasage-ancienne', 'Rasage traditionnel au rasoir', 175.00, 30, TRUE),
(@coiffure_homme_id, 'Soin barbe', 'soin-barbe', 'Soin complet pour barbe', 150.00, 30, TRUE),
(@coiffure_homme_id, 'Combo coupe + barbe', 'combo-coupe-barbe', 'Coupe cheveux et entretien barbe', 260.00, 60, TRUE);

-- Sous-catégorie : Coiffure Femme
INSERT INTO categories (name, slug, description, icon, parent_id, is_active, display_order) VALUES
('Coiffure Femme', 'coiffure-femme', 'Coupes et soins capillaires féminins', 'hair-woman.svg', @beaute_id, TRUE, 2);

SET @coiffure_femme_id = LAST_INSERT_ID();

-- Services Coiffure Femme
INSERT INTO services (category_id, name, slug, description, price, duration_minutes, is_active) VALUES
(@coiffure_femme_id, 'Coupe cheveux courts', 'coupe-cheveux-courts', 'Coupe pour cheveux courts', 225.00, 45, TRUE),
(@coiffure_femme_id, 'Coupe cheveux longs', 'coupe-cheveux-longs', 'Coupe pour cheveux longs', 300.00, 60, TRUE),
(@coiffure_femme_id, 'Coloration cheveux courts', 'coloration-cheveux-courts', 'Coloration complète cheveux courts', 450.00, 75, TRUE),
(@coiffure_femme_id, 'Coloration cheveux longs', 'coloration-cheveux-longs', 'Coloration complète cheveux longs', 700.00, 105, TRUE);

-- Sous-catégorie : Maquillage
INSERT INTO categories (name, slug, description, icon, parent_id, is_active, display_order) VALUES
('Maquillage', 'maquillage', 'Maquillage professionnel', 'makeup.svg', @beaute_id, TRUE, 3);

SET @maquillage_id = LAST_INSERT_ID();

-- Services Maquillage
INSERT INTO services (category_id, name, slug, description, price, duration_minutes, is_active) VALUES
(@maquillage_id, 'Maquillage jour', 'maquillage-jour', 'Maquillage naturel et léger', 300.00, 45, TRUE),
(@maquillage_id, 'Maquillage soirée', 'maquillage-soiree', 'Maquillage sophistiqué pour soirée', 500.00, 60, TRUE),
(@maquillage_id, 'Maquillage mariage', 'maquillage-mariage', 'Maquillage mariée avec essai', 1000.00, 120, TRUE);

-- Sous-catégorie : Manucure & Pédicure
INSERT INTO categories (name, slug, description, icon, parent_id, is_active, display_order) VALUES
('Manucure & Pédicure', 'manucure-pedicure', 'Soins des mains et des pieds', 'nails.svg', @beaute_id, TRUE, 4);

SET @manucure_id = LAST_INSERT_ID();

-- Services Manucure & Pédicure
INSERT INTO services (category_id, name, slug, description, price, duration_minutes, is_active) VALUES
(@manucure_id, 'Manucure femme', 'manucure-femme', 'Soin des mains et ongles', 175.00, 45, TRUE),
(@manucure_id, 'Manucure homme', 'manucure-homme', 'Soin des ongles masculin', 135.00, 30, TRUE),
(@manucure_id, 'Pédicure spa', 'pedicure-spa', 'Soin des pieds avec relaxation', 300.00, 60, TRUE);

-- Sous-catégorie : Épilation Femme
INSERT INTO categories (name, slug, description, icon, parent_id, is_active, display_order) VALUES
('Épilation Femme', 'epilation-femme', 'Épilation féminine', 'wax-woman.svg', @beaute_id, TRUE, 5);

SET @epilation_femme_id = LAST_INSERT_ID();

-- Services Épilation Femme
INSERT INTO services (category_id, name, slug, description, price, duration_minutes, is_active) VALUES
(@epilation_femme_id, 'Jambes complètes femme', 'jambes-completes-femme', 'Épilation jambes entières', 225.00, 45, TRUE),
(@epilation_femme_id, 'Sourcils et visage', 'sourcils-visage', 'Épilation zone visage', 125.00, 20, TRUE);

-- Sous-catégorie : Épilation Homme
INSERT INTO categories (name, slug, description, icon, parent_id, is_active, display_order) VALUES
('Épilation Homme', 'epilation-homme', 'Épilation masculine', 'wax-man.svg', @beaute_id, TRUE, 6);

SET @epilation_homme_id = LAST_INSERT_ID();

-- Services Épilation Homme
INSERT INTO services (category_id, name, slug, description, price, duration_minutes, is_active) VALUES
(@epilation_homme_id, 'Torse ou dos', 'torse-dos-homme', 'Épilation torse ou dos', 300.00, 45, TRUE),
(@epilation_homme_id, 'Bras complets', 'bras-complets-homme', 'Épilation des deux bras', 250.00, 40, TRUE);

-- =====================================================
-- 3️⃣ CATÉGORIE : VOITURE
-- =====================================================

INSERT INTO categories (name, slug, description, icon, parent_id, is_active, display_order) VALUES
('Voiture', 'voiture', 'Services pour votre véhicule', 'car.svg', NULL, TRUE, 3);

SET @voiture_id = LAST_INSERT_ID();

-- Sous-catégorie : Mécanique à domicile
INSERT INTO categories (name, slug, description, icon, parent_id, is_active, display_order) VALUES
('Mécanique', 'mecanique-domicile', 'Réparations mécaniques à domicile', 'mechanic.svg', @voiture_id, TRUE, 1);

SET @mecanique_id = LAST_INSERT_ID();

-- Services Mécanique
INSERT INTO services (category_id, name, slug, description, price, duration_minutes, is_active) VALUES
(@mecanique_id, 'Vidange huile', 'vidange-huile', 'Vidange complète avec filtre', 500.00, 60, TRUE),
(@mecanique_id, 'Changement ampoule voiture', 'changement-ampoule-voiture', 'Remplacement d\'ampoule auto', 100.00, 20, TRUE),
(@mecanique_id, 'Changement essuie-glace', 'changement-essuie-glace', 'Remplacement balais essuie-glace', 125.00, 20, TRUE),
(@mecanique_id, 'Changement pneu', 'changement-pneu', 'Démontage et montage de pneu', 325.00, 45, TRUE);

-- Sous-catégorie : Nettoyage Auto
INSERT INTO categories (name, slug, description, icon, parent_id, is_active, display_order) VALUES
('Lavage', 'lavage-auto', 'Nettoyage intérieur et extérieur', 'car-wash.svg', @voiture_id, TRUE, 2);

SET @lavage_id = LAST_INSERT_ID();

-- Services Nettoyage Auto
INSERT INTO services (category_id, name, slug, description, price, duration_minutes, is_active) VALUES
(@lavage_id, 'Nettoyage extérieur seul', 'nettoyage-exterieur-seul', 'Lavage extérieur complet', 150.00, 45, TRUE),
(@lavage_id, 'Nettoyage intérieur seul', 'nettoyage-interieur-seul', 'Nettoyage intérieur approfondi', 185.00, 60, TRUE),
(@lavage_id, 'Combo intérieur + extérieur', 'combo-interieur-exterieur', 'Nettoyage complet du véhicule', 325.00, 90, TRUE);

-- =====================================================
-- 4️⃣ CATÉGORIE : BIEN-ÊTRE
-- =====================================================

INSERT INTO categories (name, slug, description, icon, parent_id, is_active, display_order) VALUES
('Bien-être', 'bien-etre', 'Services de bien-être et relaxation', 'wellness.svg', NULL, TRUE, 4);

SET @bien_etre_id = LAST_INSERT_ID();

-- Sous-catégorie : Massages
INSERT INTO categories (name, slug, description, icon, parent_id, is_active, display_order) VALUES
('Massage', 'massage', 'Massages relaxants et thérapeutiques', 'massage.svg', @bien_etre_id, TRUE, 1);

SET @massage_id = LAST_INSERT_ID();

-- Services Massage
INSERT INTO services (category_id, name, slug, description, price, duration_minutes, is_active) VALUES
(@massage_id, 'Massage tonique', 'massage-tonique', 'Massage énergisant et stimulant', 400.00, 60, TRUE),
(@massage_id, 'Massage sportif', 'massage-sportif', 'Massage pour récupération sportive', 450.00, 60, TRUE),
(@massage_id, 'Massage thaïlandais', 'massage-thailandais', 'Massage traditionnel thaï', 600.00, 75, TRUE),
(@massage_id, 'Massage marocain traditionnel', 'massage-marocain', 'Massage aux huiles orientales', 700.00, 90, TRUE);

-- Sous-catégorie : Coaching
INSERT INTO categories (name, slug, description, icon, parent_id, is_active, display_order) VALUES
('Coaching', 'coaching', 'Coaching sportif et bien-être', 'coach.svg', @bien_etre_id, TRUE, 2);

SET @coaching_id = LAST_INSERT_ID();

-- Services Coaching
INSERT INTO services (category_id, name, slug, description, price, duration_minutes, is_active) VALUES
(@coaching_id, 'Yoga', 'yoga', 'Séance de yoga à domicile', 250.00, 60, TRUE),
(@coaching_id, 'Pilates', 'pilates', 'Séance de pilates personnalisée', 300.00, 60, TRUE),
(@coaching_id, 'Étirements guidés', 'etirements-guides', 'Séance d\'étirements et souplesse', 250.00, 45, TRUE),
(@coaching_id, 'Musculation personnalisée', 'musculation-personnalisee', 'Entraînement musculation sur mesure', 400.00, 60, TRUE),
(@coaching_id, 'Méditation et respiration', 'meditation-respiration', 'Séance de méditation guidée', 250.00, 45, TRUE),
(@coaching_id, 'Coaching nutrition', 'coaching-nutrition', 'Consultation nutritionnelle', 400.00, 60, TRUE);

-- =====================================================
-- 5️⃣ CATÉGORIE : ANIMAUX
-- =====================================================

INSERT INTO categories (name, slug, description, icon, parent_id, is_active, display_order) VALUES
('Animaux', 'animaux', 'Services pour vos animaux de compagnie', 'pet.svg', NULL, TRUE, 5);

SET @animaux_id = LAST_INSERT_ID();

-- Sous-catégorie : Soins Animaux
INSERT INTO categories (name, slug, description, icon, parent_id, is_active, display_order) VALUES
('Soins Animaux', 'soins-animaux', 'Toilettage et soins pour animaux', 'pet-grooming.svg', @animaux_id, TRUE, 1);

SET @soins_animaux_id = LAST_INSERT_ID();

-- Services Soins Animaux
INSERT INTO services (category_id, name, slug, description, price, duration_minutes, is_active) VALUES
(@soins_animaux_id, 'Toilettage chien', 'toilettage-chien', 'Toilettage complet pour chien', 325.00, 60, TRUE),
(@soins_animaux_id, 'Promenade chien', 'promenade-chien', 'Balade quotidienne pour votre chien', 115.00, 30, TRUE),
(@soins_animaux_id, 'Gardiennage à domicile', 'gardiennage-domicile', 'Garde d\'animaux par jour', 200.00, 1440, TRUE),
(@soins_animaux_id, 'Gardiennage longue durée', 'gardiennage-longue-duree', 'Garde d\'animaux par semaine', 1250.00, 10080, TRUE),
(@soins_animaux_id, 'Nourrissage animaux', 'nourrissage-animaux', 'Visite pour nourrir vos animaux', 65.00, 15, TRUE),
(@soins_animaux_id, 'Transport animaux', 'transport-animaux', 'Transport sécurisé pour animaux', 200.00, 60, TRUE),
(@soins_animaux_id, 'Nettoyage espace animal', 'nettoyage-espace-animal', 'Nettoyage de niche, litière, etc.', 150.00, 30, TRUE);

-- =====================================================
-- VÉRIFICATION DES DONNÉES INSÉRÉES
-- =====================================================

SELECT 'RÉSUMÉ DE L\'INSERTION' as '';
SELECT
    c.name as 'Catégorie',
    COUNT(s.id) as 'Nombre de services',
    MIN(s.price) as 'Prix min (MAD)',
    MAX(s.price) as 'Prix max (MAD)',
    AVG(s.duration_minutes) as 'Durée moyenne (min)'
FROM categories c
LEFT JOIN services s ON c.id = s.category_id
WHERE c.parent_id IS NULL
GROUP BY c.id, c.name
ORDER BY c.display_order;

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================
