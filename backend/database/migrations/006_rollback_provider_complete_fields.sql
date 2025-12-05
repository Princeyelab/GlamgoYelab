-- =====================================================
-- Rollback 006: Suppression des champs provider complets
-- Date: 22 janvier 2025
-- =====================================================

-- Supprimer les indexes
DROP INDEX IF EXISTS idx_city ON providers;
DROP INDEX IF EXISTS idx_location_full ON providers;

-- Supprimer les colonnes ajoutées
ALTER TABLE providers
DROP COLUMN IF EXISTS insurance_certificate_path,
DROP COLUMN IF EXISTS experience_proof_path,
DROP COLUMN IF EXISTS diploma_certificate_path,
DROP COLUMN IF EXISTS coverage_area,
DROP COLUMN IF EXISTS specialties,
DROP COLUMN IF EXISTS experience_years,
DROP COLUMN IF EXISTS bio,
DROP COLUMN IF EXISTS longitude,
DROP COLUMN IF EXISTS latitude,
DROP COLUMN IF EXISTS city,
DROP COLUMN IF EXISTS address,
DROP COLUMN IF EXISTS date_of_birth,
DROP COLUMN IF EXISTS cin_number,
DROP COLUMN IF EXISTS whatsapp;

-- Supprimer de migration_log
DELETE FROM migration_log WHERE migration_name = '006_add_provider_complete_fields';
