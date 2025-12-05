-- =====================================================
-- CORRECTION FORCÉE - TOUS LES SERVICES PROBLÉMATIQUES
-- =====================================================
SET NAMES utf8mb4;

-- ID 52: Coupe classique homme
UPDATE services SET image = 'https://images.unsplash.com/photo-1620207483612-c6f0732e3d83?w=800&h=600&fit=crop' WHERE id = 52;

-- ID 25: Lavage extérieur
UPDATE services SET image = 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&h=600&fit=crop' WHERE id = 25;

-- ID 35: Ménage classique
UPDATE services SET image = 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800&h=600&fit=crop' WHERE id = 35;

-- ID 88: Toilettage chien
UPDATE services SET image = 'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=800&h=600&fit=crop' WHERE id = 88;

-- ID 33: Consultation vétérinaire
UPDATE services SET image = 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800&h=600&fit=crop' WHERE id = 33;

-- ID 59: Coupe cheveux courts
UPDATE services SET image = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop' WHERE id = 59;

-- ID 19: Dépannage plomberie
UPDATE services SET image = 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&h=600&fit=crop' WHERE id = 19;

-- ID 42: Montage meuble
UPDATE services SET image = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop' WHERE id = 42;

-- ID 6: Soin du visage
UPDATE services SET image = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=600&fit=crop' WHERE id = 6;

-- ID 82: Yoga
UPDATE services SET image = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop' WHERE id = 82;

-- ID 21: Dépannage électrique
UPDATE services SET image = 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=600&fit=crop' WHERE id = 21;

-- ID 9: Manucure classique
UPDATE services SET image = 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=600&fit=crop' WHERE id = 9;

-- ID 63: Maquillage jour
UPDATE services SET image = 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&h=600&fit=crop' WHERE id = 63;

-- ID 47: Entretien pelouse
UPDATE services SET image = 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800&h=600&fit=crop' WHERE id = 47;

-- ID 13: Massage relaxant 30min
UPDATE services SET image = 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=600&fit=crop' WHERE id = 13;

-- ID 49: Préparation repas
UPDATE services SET image = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=600&fit=crop' WHERE id = 49;

-- ID 68: Jambes complètes femme (INCOHÉRENCE - remplacer massage par épilation)
UPDATE services SET image = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=600&fit=crop' WHERE id = 68;

SELECT '17 services corrigés' as status;
