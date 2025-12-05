-- =====================================================
-- Migration 017 : Ajout des champs profil prestataire
-- Champs manquants pour le profil complet
-- Date: 2025-12-02
-- =====================================================

-- Informations personnelles
ALTER TABLE providers ADD COLUMN date_of_birth DATE DEFAULT NULL;
ALTER TABLE providers ADD COLUMN cin_number VARCHAR(50) DEFAULT NULL;
ALTER TABLE providers ADD COLUMN professional_license VARCHAR(100) DEFAULT NULL;

-- Localisation
ALTER TABLE providers ADD COLUMN address TEXT DEFAULT NULL;
ALTER TABLE providers ADD COLUMN city VARCHAR(100) DEFAULT NULL;
ALTER TABLE providers ADD COLUMN latitude DECIMAL(10, 8) DEFAULT NULL;
ALTER TABLE providers ADD COLUMN longitude DECIMAL(11, 8) DEFAULT NULL;

-- Activite professionnelle
ALTER TABLE providers ADD COLUMN bio TEXT DEFAULT NULL;
ALTER TABLE providers ADD COLUMN experience_years INT UNSIGNED DEFAULT NULL;
ALTER TABLE providers ADD COLUMN starting_price DECIMAL(10, 2) DEFAULT NULL;
ALTER TABLE providers ADD COLUMN specialties JSON DEFAULT NULL;
ALTER TABLE providers ADD COLUMN coverage_area JSON DEFAULT NULL;
ALTER TABLE providers ADD COLUMN availability_schedule JSON DEFAULT NULL;
