-- =====================================================
-- Migration 006: Ajout des champs manquants pour providers
-- Date: 22 janvier 2025
-- Description: Ajoute tous les champs nécessaires au profil prestataire
-- =====================================================

-- Ajouter les champs manquants à la table providers
ALTER TABLE providers
ADD COLUMN whatsapp VARCHAR(20) AFTER phone,
ADD COLUMN cin_number VARCHAR(50) AFTER whatsapp,
ADD COLUMN date_of_birth DATE AFTER cin_number,
ADD COLUMN address TEXT AFTER date_of_birth,
ADD COLUMN city VARCHAR(100) AFTER address,
ADD COLUMN latitude DECIMAL(10, 8) AFTER city,
ADD COLUMN longitude DECIMAL(11, 8) AFTER latitude,
ADD COLUMN bio TEXT AFTER longitude,
ADD COLUMN experience_years INT AFTER bio,
ADD COLUMN specialties JSON AFTER experience_years COMMENT 'Liste des spécialités du prestataire',
ADD COLUMN coverage_area JSON AFTER specialties COMMENT 'Zones géographiques couvertes',
ADD COLUMN diploma_certificate_path VARCHAR(255) AFTER coverage_area COMMENT 'Chemin du diplôme/certificat',
ADD COLUMN experience_proof_path VARCHAR(255) AFTER diploma_certificate_path COMMENT 'Chemin de la preuve d\'expérience',
ADD COLUMN insurance_certificate_path VARCHAR(255) AFTER experience_proof_path COMMENT 'Chemin de l\'attestation d\'assurance';

-- Ajouter des indexes pour améliorer les performances
CREATE INDEX idx_city ON providers(city);
CREATE INDEX idx_location_full ON providers(latitude, longitude);

-- Commentaire de la migration
INSERT INTO migration_log (migration_name, executed_at) VALUES
('006_add_provider_complete_fields', NOW())
ON DUPLICATE KEY UPDATE executed_at = NOW();
