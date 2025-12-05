-- ============================================================================
-- Migration: Ajout des coordonnées GPS pour les clients et prestataires
-- Date: 2025-01-20
-- Database: PostgreSQL
-- Description: Ajoute les champs address, latitude, longitude pour supporter
--              la géolocalisation et la recherche par rayon
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE: users (Clients)
-- ----------------------------------------------------------------------------

-- PostgreSQL
ALTER TABLE users
ADD COLUMN address VARCHAR(255) DEFAULT NULL,
ADD COLUMN latitude NUMERIC(10, 8) DEFAULT NULL,
ADD COLUMN longitude NUMERIC(11, 8) DEFAULT NULL;

-- Commentaires sur les colonnes
COMMENT ON COLUMN users.address IS 'Adresse complète du client';
COMMENT ON COLUMN users.latitude IS 'Latitude GPS (optionnel, -90 à +90)';
COMMENT ON COLUMN users.longitude IS 'Longitude GPS (optionnel, -180 à +180)';

-- Créer un index pour optimiser les requêtes de distance
CREATE INDEX idx_users_location ON users(latitude, longitude);

-- Optionnel: Créer un index GiST pour les requêtes géospatiales avancées
-- Nécessite l'extension PostGIS
-- CREATE EXTENSION IF NOT EXISTS postgis;
-- ALTER TABLE users ADD COLUMN geom GEOMETRY(Point, 4326);
-- CREATE INDEX idx_users_geom ON users USING GIST(geom);


-- ----------------------------------------------------------------------------
-- TABLE: providers (Prestataires)
-- ----------------------------------------------------------------------------

-- PostgreSQL
ALTER TABLE providers
ADD COLUMN address VARCHAR(255) DEFAULT NULL,
ADD COLUMN latitude NUMERIC(10, 8) DEFAULT NULL,
ADD COLUMN longitude NUMERIC(11, 8) DEFAULT NULL;

-- Commentaires sur les colonnes
COMMENT ON COLUMN providers.address IS 'Adresse professionnelle du prestataire';
COMMENT ON COLUMN providers.latitude IS 'Latitude GPS (optionnel, -90 à +90)';
COMMENT ON COLUMN providers.longitude IS 'Longitude GPS (optionnel, -180 à +180)';

-- Créer un index pour optimiser les requêtes de distance
CREATE INDEX idx_providers_location ON providers(latitude, longitude);

-- Optionnel: Créer un index GiST pour les requêtes géospatiales avancées
-- Nécessite l'extension PostGIS
-- ALTER TABLE providers ADD COLUMN geom GEOMETRY(Point, 4326);
-- CREATE INDEX idx_providers_geom ON providers USING GIST(geom);


-- ============================================================================
-- CONTRAINTES DE VALIDATION (Optionnel)
-- ============================================================================

-- Valider que latitude est entre -90 et +90
ALTER TABLE users
ADD CONSTRAINT chk_users_latitude CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));

ALTER TABLE providers
ADD CONSTRAINT chk_providers_latitude CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));

-- Valider que longitude est entre -180 et +180
ALTER TABLE users
ADD CONSTRAINT chk_users_longitude CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));

ALTER TABLE providers
ADD CONSTRAINT chk_providers_longitude CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));


-- ============================================================================
-- NOTES IMPORTANTES:
-- ============================================================================
--
-- 1. Les colonnes latitude/longitude acceptent NULL
--    → L'inscription fonctionne même sans coordonnées GPS
--
-- 2. Précision des coordonnées:
--    - latitude:  NUMERIC(10, 8)  → ±90.00000000  (8 décimales ≈ 1mm)
--    - longitude: NUMERIC(11, 8)  → ±180.00000000 (8 décimales ≈ 1mm)
--
-- 3. Plage de valeurs au Maroc:
--    - Latitude:  27.66° N à 35.92° N
--    - Longitude: 1.00° W à 13.16° W (valeurs négatives: -13.16 à -1.00)
--
-- 4. Index:
--    - Index B-tree standard pour requêtes simples
--    - Index GiST optionnel avec PostGIS pour requêtes géospatiales avancées
--
-- ============================================================================
-- ROLLBACK (si nécessaire):
-- ============================================================================
--
-- Pour annuler cette migration:
--
-- DROP INDEX IF EXISTS idx_users_location;
-- DROP INDEX IF EXISTS idx_providers_location;
--
-- ALTER TABLE users
-- DROP CONSTRAINT IF EXISTS chk_users_latitude,
-- DROP CONSTRAINT IF EXISTS chk_users_longitude,
-- DROP COLUMN IF EXISTS address,
-- DROP COLUMN IF EXISTS latitude,
-- DROP COLUMN IF EXISTS longitude;
--
-- ALTER TABLE providers
-- DROP CONSTRAINT IF EXISTS chk_providers_latitude,
-- DROP CONSTRAINT IF EXISTS chk_providers_longitude,
-- DROP COLUMN IF EXISTS address,
-- DROP COLUMN IF EXISTS latitude,
-- DROP COLUMN IF EXISTS longitude;
--
-- ============================================================================
