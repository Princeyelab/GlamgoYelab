-- =====================================================
-- Script d'initialisation de la base de données
-- Marrakech Services
-- =====================================================

-- Création de la base de données si elle n'existe pas
CREATE DATABASE IF NOT EXISTS marrakech_services
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Utilisation de la base de données
USE marrakech_services;

-- Exécution du schéma
SOURCE /var/www/html/database/schema.sql;

-- Exécution des seeds (données de test)
SOURCE /var/www/html/database/seeds.sql;

-- =====================================================
-- Vérification des données insérées
-- =====================================================

SELECT 'Database initialization complete!' AS status;
SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_providers FROM providers;
SELECT COUNT(*) AS total_categories FROM categories;
SELECT COUNT(*) AS total_services FROM services;
SELECT COUNT(*) AS total_orders FROM orders;
