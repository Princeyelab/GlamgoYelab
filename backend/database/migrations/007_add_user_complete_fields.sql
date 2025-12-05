-- =====================================================
-- Migration: Ajout des champs complets pour les utilisateurs
-- Description: Ajoute whatsapp, date_of_birth, address, city, latitude, longitude
-- Date: 2025-11-23
-- =====================================================

-- Ajouter les colonnes manquantes à la table users
ALTER TABLE users
ADD COLUMN whatsapp VARCHAR(20) NULL AFTER phone,
ADD COLUMN date_of_birth DATE NULL AFTER whatsapp,
ADD COLUMN address TEXT NULL AFTER date_of_birth,
ADD COLUMN city VARCHAR(100) NULL AFTER address,
ADD COLUMN latitude DECIMAL(10, 8) NULL AFTER city,
ADD COLUMN longitude DECIMAL(11, 8) NULL AFTER latitude;

-- Créer un index sur la ville pour les recherches
ALTER TABLE users
ADD INDEX idx_city (city);

-- Créer un index spatial pour la géolocalisation
ALTER TABLE users
ADD INDEX idx_location (latitude, longitude);
