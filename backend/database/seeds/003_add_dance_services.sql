-- =====================================================
-- Ajout des services de danse
-- =====================================================

-- Ajouter la sous-catégorie Danse sous Beauté (parent_id = 1)
INSERT INTO categories (name, slug, description, icon, parent_id, display_order)
VALUES ('Danse', 'danse', 'Cours de danse à domicile', 'dance.svg', 1, 5);

-- Récupérer l'ID de la catégorie Danse (supposons que c'est l'ID 17 si on suit la séquence)
-- Si vous avez déjà d'autres catégories, ajustez le category_id en conséquence

-- Services de Danse
INSERT INTO services (category_id, name, slug, description, price, duration_minutes, image) VALUES
(17, 'Danse Orientale', 'danse-orientale', 'Cours de danse orientale à domicile - Apprenez les mouvements gracieux et élégants de la danse du ventre avec un professeur expérimenté', 200.00, 60, 'danse-orientale.jpg'),
(17, 'Danse de Salon', 'danse-salon', 'Cours de danse de salon à domicile - Valse, tango, cha-cha-cha, apprenez les danses de couple classiques', 250.00, 60, 'danse-salon.jpg');

-- Note: Les images doivent être placées dans public/images/services/
-- danse-orientale.jpg et danse-salon.jpg
