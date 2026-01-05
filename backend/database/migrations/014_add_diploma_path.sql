-- Migration: Ajouter le chemin du diplôme aux prestataires
-- Date: 2025-12-31

ALTER TABLE providers
ADD COLUMN IF NOT EXISTS diploma_certificate_path VARCHAR(255) DEFAULT NULL;

-- Commentaire
COMMENT ON COLUMN providers.diploma_certificate_path IS 'Chemin vers le fichier diplôme/certificat du prestataire';
