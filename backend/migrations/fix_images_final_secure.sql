-- =====================================================
-- CORRECTION SÉCURISÉE - UNIQUEMENT LES PROBLÈMES IDENTIFIÉS
-- 1. Ajouter fit=crop aux 23 images qui en manquent
-- 2. Corriger l'incohérence "Jambes complètes femme"
-- =====================================================
SET NAMES utf8mb4;

-- =====================================================
-- AJOUTER fit=crop AUX IMAGES QUI EN MANQUENT (23 services)
-- =====================================================

-- Coiffure Homme
UPDATE services SET image = 'https://images.unsplash.com/photo-1620207483612-c6f0732e3d83?w=800&h=600&fit=crop' WHERE id = 52;
UPDATE services SET image = 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&h=600&fit=crop' WHERE id = 1;

-- Coiffure Femme
UPDATE services SET image = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop' WHERE id = 59;

-- Lavage/Mécanique
UPDATE services SET image = 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&h=600&fit=crop' WHERE id = 25;
UPDATE services SET image = 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&h=600&fit=crop' WHERE id = 76;
UPDATE services SET image = 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=800&h=600&fit=crop' WHERE id = 72;
UPDATE services SET image = 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop' WHERE id = 28;
UPDATE services SET image = 'https://images.unsplash.com/photo-1632823469959-e94206409d5a?w=800&h=600&fit=crop' WHERE id = 29;

-- Ménage
UPDATE services SET image = 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800&h=600&fit=crop' WHERE id = 35;

-- Animaux
UPDATE services SET image = 'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=800&h=600&fit=crop' WHERE id = 88;

-- Vétérinaire
UPDATE services SET image = 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800&h=600&fit=crop' WHERE id = 33;
UPDATE services SET image = 'https://images.unsplash.com/photo-1612536551977-5ccc4a13c107?w=800&h=600&fit=crop' WHERE id = 34;

-- Plomberie
UPDATE services SET image = 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&h=600&fit=crop' WHERE id = 19;

-- Bricolage
UPDATE services SET image = 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=800&h=600&fit=crop' WHERE id = 42;

-- Électricité
UPDATE services SET image = 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=600&fit=crop' WHERE id = 21;

-- Esthétique
UPDATE services SET image = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=600&fit=crop' WHERE id = 6;

-- Manucure
UPDATE services SET image = 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=600&fit=crop' WHERE id = 9;

-- Maquillage
UPDATE services SET image = 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&h=600&fit=crop' WHERE id = 63;

-- Massage
UPDATE services SET image = 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=600&fit=crop' WHERE id = 13;

-- Coaching
UPDATE services SET image = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop' WHERE id = 82;

-- Jardinage
UPDATE services SET image = 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800&h=600&fit=crop' WHERE id = 47;

-- Cuisine
UPDATE services SET image = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=600&fit=crop' WHERE id = 49;

-- =====================================================
-- CORRIGER L'INCOHÉRENCE : Jambes complètes femme
-- Remplacer l'image de massage par une vraie image d'épilation
-- =====================================================
UPDATE services SET image = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=600&fit=crop' WHERE id = 68;

SELECT 'Corrections appliquées: 24 services mis à jour' as status;
