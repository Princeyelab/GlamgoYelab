-- ============================================================================
-- Migration: Ajout des coordonnées GPS pour les clients et prestataires
-- Date: 2025-01-20
-- Description: Ajoute les champs address, latitude, longitude pour supporter
--              la géolocalisation et la recherche par rayon
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE: users (Clients)
-- ----------------------------------------------------------------------------

-- MySQL/MariaDB
ALTER TABLE users
ADD COLUMN address VARCHAR(255) DEFAULT NULL COMMENT 'Adresse complète du client',
ADD COLUMN latitude DECIMAL(10, 8) DEFAULT NULL COMMENT 'Latitude GPS (optionnel)',
ADD COLUMN longitude DECIMAL(11, 8) DEFAULT NULL COMMENT 'Longitude GPS (optionnel)';

-- Créer un index spatial pour optimiser les requêtes de distance
CREATE INDEX idx_users_location ON users(latitude, longitude);

-- Ajouter un commentaire sur la table
ALTER TABLE users COMMENT = 'Table des clients avec support géolocalisation';


-- ----------------------------------------------------------------------------
-- TABLE: providers (Prestataires)
-- ----------------------------------------------------------------------------

-- MySQL/MariaDB
ALTER TABLE providers
ADD COLUMN address VARCHAR(255) DEFAULT NULL COMMENT 'Adresse professionnelle du prestataire',
ADD COLUMN latitude DECIMAL(10, 8) DEFAULT NULL COMMENT 'Latitude GPS (optionnel)',
ADD COLUMN longitude DECIMAL(11, 8) DEFAULT NULL COMMENT 'Longitude GPS (optionnel)';

-- Créer un index spatial pour optimiser les requêtes de distance
CREATE INDEX idx_providers_location ON providers(latitude, longitude);

-- Ajouter un commentaire sur la table
ALTER TABLE providers COMMENT = 'Table des prestataires avec support géolocalisation';


-- ============================================================================
-- NOTES IMPORTANTES:
-- ============================================================================
--
-- 1. Les colonnes latitude/longitude acceptent NULL
--    → L'inscription fonctionne même sans coordonnées GPS
--
-- 2. Précision des coordonnées:
--    - latitude:  DECIMAL(10, 8)  → ±90.00000000  (8 décimales ≈ 1mm)
--    - longitude: DECIMAL(11, 8)  → ±180.00000000 (8 décimales ≈ 1mm)
--
-- 3. Plage de valeurs au Maroc:
--    - Latitude:  27.66° N à 35.92° N
--    - Longitude: 1.00° W à 13.16° W (valeurs négatives)
--
-- 4. Index spatial:
--    - Optimise les requêtes de recherche par rayon
--    - Améliore les performances pour: SELECT ... WHERE latitude ... AND longitude ...
--
-- ============================================================================
-- ROLLBACK (si nécessaire):
-- ============================================================================
--
-- Pour annuler cette migration:
--
-- ALTER TABLE users
-- DROP COLUMN address,
-- DROP COLUMN latitude,
-- DROP COLUMN longitude,
-- DROP INDEX idx_users_location;
--
-- ALTER TABLE providers
-- DROP COLUMN address,
-- DROP COLUMN latitude,
-- DROP COLUMN longitude,
-- DROP INDEX idx_providers_location;
--
-- ============================================================================
