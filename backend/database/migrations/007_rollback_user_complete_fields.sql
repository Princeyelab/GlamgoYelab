-- =====================================================
-- Rollback Migration: Suppression des champs complets utilisateurs
-- Description: Supprime whatsapp, date_of_birth, address, city, latitude, longitude
-- Date: 2025-11-23
-- =====================================================

-- Supprimer les index
ALTER TABLE users
DROP INDEX IF EXISTS idx_city,
DROP INDEX IF EXISTS idx_location;

-- Supprimer les colonnes
ALTER TABLE users
DROP COLUMN IF EXISTS longitude,
DROP COLUMN IF EXISTS latitude,
DROP COLUMN IF EXISTS city,
DROP COLUMN IF EXISTS address,
DROP COLUMN IF EXISTS date_of_birth,
DROP COLUMN IF EXISTS whatsapp;
