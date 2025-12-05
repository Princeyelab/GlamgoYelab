-- =====================================================
-- Données de test pour Marrakech Services
-- =====================================================

-- =====================================================
-- 1. Utilisateurs de test
-- =====================================================
INSERT INTO users (email, password_hash, first_name, last_name, phone, referral_code) VALUES
('user1@test.com', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5JjS.S6HXO7Fe', 'Ahmed', 'Benali', '0612345678', 'AHMED123'),
('user2@test.com', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5JjS.S6HXO7Fe', 'Fatima', 'El Amrani', '0623456789', 'FATIMA45'),
('user3@test.com', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5JjS.S6HXO7Fe', 'Youssef', 'Alaoui', '0634567890', 'YOUSSEF7');

-- Mot de passe pour tous les users de test : "password123"

-- =====================================================
-- 2. Adresses de test
-- =====================================================
INSERT INTO addresses (user_id, full_address, lat, lon, is_default) VALUES
(1, 'Guéliz, Rue Mohamed V, Marrakech', 31.6369, -8.0107, TRUE),
(1, 'Médina, Place Jemaa el-Fna, Marrakech', 31.6258, -7.9891, FALSE),
(2, 'Hivernage, Boulevard Hassan II, Marrakech', 31.6229, -8.0223, TRUE),
(3, 'Palmeraie, Route de Fès, Marrakech', 31.6792, -7.9839, TRUE);

-- =====================================================
-- 3. Prestataires de test
-- =====================================================
INSERT INTO providers (email, password_hash, first_name, last_name, phone, status, current_lat, current_lon, rating, total_reviews, is_verified) VALUES
('provider1@test.com', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5JjS.S6HXO7Fe', 'Mohammed', 'Tazi', '0645678901', 'online', 31.6295, -7.9811, 4.8, 120, TRUE),
('provider2@test.com', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5JjS.S6HXO7Fe', 'Aïcha', 'Idrissi', '0656789012', 'online', 31.6400, -8.0100, 4.9, 85, TRUE),
('provider3@test.com', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5JjS.S6HXO7Fe', 'Hassan', 'Mansouri', '0667890123', 'offline', 31.6200, -7.9900, 4.5, 62, TRUE),
('provider4@test.com', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5JjS.S6HXO7Fe', 'Samira', 'Bennani', '0678901234', 'busy', 31.6350, -8.0050, 4.7, 98, TRUE);

-- Mot de passe pour tous les providers de test : "password123"

-- =====================================================
-- 4. Catégories de services
-- =====================================================
INSERT INTO categories (name, description, image_url, display_order) VALUES
('Ménage & Nettoyage', 'Services de nettoyage à domicile et professionnel', '/images/categories/menage.jpg', 1),
('Plomberie', 'Réparations et installations de plomberie', '/images/categories/plomberie.jpg', 2),
('Électricité', 'Services électriques et dépannages', '/images/categories/electricite.jpg', 3),
('Jardinage', 'Entretien de jardins et espaces verts', '/images/categories/jardinage.jpg', 4),
('Peinture', 'Services de peinture intérieure et extérieure', '/images/categories/peinture.jpg', 5),
('Déménagement', 'Aide au déménagement et transport', '/images/categories/demenagement.jpg', 6),
('Réparation & Bricolage', 'Petits travaux et réparations diverses', '/images/categories/bricolage.jpg', 7),
('Beauté & Bien-être', 'Services de beauté à domicile', '/images/categories/beaute.jpg', 8);

-- =====================================================
-- 5. Services disponibles
-- =====================================================

-- Catégorie Ménage & Nettoyage (id=1)
INSERT INTO services (category_id, name, description, duration_minutes, price, image_url) VALUES
(1, 'Nettoyage Standard Appartement', 'Nettoyage complet d\'un appartement (jusqu\'à 80m²)', 120, 150.00, '/images/services/nettoyage-standard.jpg'),
(1, 'Nettoyage Approfondi Maison', 'Nettoyage en profondeur d\'une maison (jusqu\'à 150m²)', 240, 300.00, '/images/services/nettoyage-profond.jpg'),
(1, 'Repassage à domicile', 'Service de repassage (2h minimum)', 120, 100.00, '/images/services/repassage.jpg'),
(1, 'Nettoyage de vitres', 'Nettoyage intérieur et extérieur des vitres', 90, 120.00, '/images/services/vitres.jpg');

-- Catégorie Plomberie (id=2)
INSERT INTO services (category_id, name, description, duration_minutes, price, image_url) VALUES
(2, 'Débouchage canalisation', 'Débouchage d\'évier, lavabo ou toilettes', 60, 200.00, '/images/services/debouchage.jpg'),
(2, 'Réparation fuite d\'eau', 'Détection et réparation de fuite', 90, 250.00, '/images/services/fuite.jpg'),
(2, 'Installation sanitaire', 'Installation d\'un lavabo, évier ou WC', 120, 300.00, '/images/services/installation-sanitaire.jpg'),
(2, 'Dépannage chauffe-eau', 'Réparation ou remplacement de chauffe-eau', 150, 350.00, '/images/services/chauffe-eau.jpg');

-- Catégorie Électricité (id=3)
INSERT INTO services (category_id, name, description, duration_minutes, price, image_url) VALUES
(3, 'Installation luminaire', 'Installation de lustre ou applique murale', 45, 120.00, '/images/services/luminaire.jpg'),
(3, 'Réparation panne électrique', 'Diagnostic et réparation de panne électrique', 90, 200.00, '/images/services/panne-electrique.jpg'),
(3, 'Installation prise électrique', 'Installation de prise ou interrupteur', 60, 150.00, '/images/services/prise.jpg'),
(3, 'Mise aux normes électriques', 'Vérification et mise aux normes', 180, 400.00, '/images/services/normes-elec.jpg');

-- Catégorie Jardinage (id=4)
INSERT INTO services (category_id, name, description, duration_minutes, price, image_url) VALUES
(4, 'Tonte de pelouse', 'Tonte et bordures (jusqu\'à 200m²)', 90, 150.00, '/images/services/tonte.jpg'),
(4, 'Taille de haies', 'Taille et mise en forme de haies', 120, 180.00, '/images/services/haies.jpg'),
(4, 'Entretien jardin complet', 'Tonte, taille, désherbage', 180, 280.00, '/images/services/entretien-jardin.jpg'),
(4, 'Plantation et aménagement', 'Plantation de végétaux et aménagement', 240, 350.00, '/images/services/plantation.jpg');

-- Catégorie Peinture (id=5)
INSERT INTO services (category_id, name, description, duration_minutes, price, image_url) VALUES
(5, 'Peinture chambre', 'Peinture d\'une chambre (jusqu\'à 20m²)', 240, 400.00, '/images/services/peinture-chambre.jpg'),
(5, 'Peinture salon', 'Peinture d\'un salon (jusqu\'à 40m²)', 360, 700.00, '/images/services/peinture-salon.jpg'),
(5, 'Peinture façade', 'Peinture extérieure (prix au m²)', 480, 1200.00, '/images/services/peinture-facade.jpg');

-- Catégorie Déménagement (id=6)
INSERT INTO services (category_id, name, description, duration_minutes, price, image_url) VALUES
(6, 'Déménagement Studio', 'Déménagement d\'un studio avec 2 déménageurs', 180, 500.00, '/images/services/demenagement-studio.jpg'),
(6, 'Déménagement Appartement', 'Déménagement appartement 2-3 pièces', 300, 900.00, '/images/services/demenagement-appt.jpg'),
(6, 'Déménagement Maison', 'Déménagement maison avec camion', 480, 1500.00, '/images/services/demenagement-maison.jpg');

-- Catégorie Réparation & Bricolage (id=7)
INSERT INTO services (category_id, name, description, duration_minutes, price, image_url) VALUES
(7, 'Montage de meubles', 'Montage de meubles en kit', 120, 150.00, '/images/services/montage-meubles.jpg'),
(7, 'Réparation porte ou serrure', 'Réparation ou remplacement de serrure', 90, 200.00, '/images/services/serrure.jpg'),
(7, 'Fixation TV murale', 'Installation et fixation de TV au mur', 60, 120.00, '/images/services/tv-murale.jpg'),
(7, 'Réparations diverses', 'Petits travaux de bricolage (2h)', 120, 180.00, '/images/services/bricolage-divers.jpg');

-- Catégorie Beauté & Bien-être (id=8)
INSERT INTO services (category_id, name, description, duration_minutes, price, image_url) VALUES
(8, 'Coupe de cheveux à domicile', 'Coupe homme ou femme', 60, 150.00, '/images/services/coupe-cheveux.jpg'),
(8, 'Manucure & Pédicure', 'Soin des mains et pieds', 90, 200.00, '/images/services/manucure.jpg'),
(8, 'Massage relaxant', 'Massage de relaxation (1h)', 60, 300.00, '/images/services/massage.jpg'),
(8, 'Maquillage professionnel', 'Maquillage pour événement', 90, 250.00, '/images/services/maquillage.jpg');

-- =====================================================
-- 6. Services proposés par les prestataires
-- =====================================================

-- Provider 1 (Mohammed Tazi) - Plomberie et Électricité
INSERT INTO provider_services (provider_id, service_id) VALUES
(1, 5), (1, 6), (1, 7), (1, 8), -- Plomberie
(1, 9), (1, 10), (1, 11);        -- Électricité

-- Provider 2 (Aïcha Idrissi) - Ménage et Beauté
INSERT INTO provider_services (provider_id, service_id) VALUES
(2, 1), (2, 2), (2, 3), (2, 4), -- Ménage
(2, 29), (2, 30), (2, 31), (2, 32); -- Beauté

-- Provider 3 (Hassan Mansouri) - Jardinage et Bricolage
INSERT INTO provider_services (provider_id, service_id) VALUES
(3, 13), (3, 14), (3, 15), (3, 16), -- Jardinage
(3, 22), (3, 23), (3, 24), (3, 25); -- Bricolage

-- Provider 4 (Samira Bennani) - Peinture et Déménagement
INSERT INTO provider_services (provider_id, service_id) VALUES
(4, 17), (4, 18), (4, 19), -- Peinture
(4, 20), (4, 21);           -- Déménagement

-- =====================================================
-- 7. Commandes de test (historique)
-- =====================================================

-- Commande complétée avec évaluation
INSERT INTO orders (user_id, provider_id, service_id, address_id, status, order_time, scheduled_time, final_price, tip_amount) VALUES
(1, 1, 5, 1, 'completed', '2025-01-10 10:00:00', '2025-01-10 14:00:00', 200.00, 20.00);

-- Commande en cours
INSERT INTO orders (user_id, provider_id, service_id, address_id, status, order_time, scheduled_time, final_price, tip_amount) VALUES
(2, 2, 1, 3, 'in_progress', '2025-01-13 09:00:00', '2025-01-13 10:00:00', 150.00, 0.00);

-- Commande acceptée (prestataire en route)
INSERT INTO orders (user_id, provider_id, service_id, address_id, status, order_time, scheduled_time, final_price, tip_amount) VALUES
(3, 3, 13, 4, 'en_route', '2025-01-13 11:00:00', '2025-01-13 14:00:00', 150.00, 0.00);

-- Commande en attente (pas encore acceptée)
INSERT INTO orders (user_id, provider_id, service_id, address_id, status, order_time, scheduled_time, final_price, tip_amount) VALUES
(1, NULL, 9, 1, 'pending', '2025-01-13 12:00:00', NULL, 120.00, 0.00);

-- =====================================================
-- 8. Évaluations de test
-- =====================================================

-- Évaluation de la commande complétée
INSERT INTO reviews (order_id, user_id, provider_id, rating, comment) VALUES
(1, 1, 1, 5, 'Excellent service ! Mohammed est très professionnel et a résolu mon problème rapidement. Je recommande vivement.');

-- Quelques évaluations anciennes pour les prestataires
INSERT INTO reviews (order_id, user_id, provider_id, rating, comment) VALUES
(1, 2, 2, 5, 'Aïcha est fantastique ! Maison impeccable.'),
(1, 3, 3, 4, 'Bon travail, mais un peu en retard.'),
(1, 1, 4, 5, 'Travail de peinture parfait !');

-- Note: Les order_id=1 sont fictifs ici pour les anciennes évaluations
