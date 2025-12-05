-- =====================================================
-- Migration 011: Optimisation Géolocalisation
-- GlamGo - Système de recherche prestataires par proximité
-- =====================================================

-- Description:
-- Cette migration ajoute les colonnes et index nécessaires pour
-- optimiser la recherche de prestataires par géolocalisation.
--
-- Algorithme utilisé: Haversine avec pré-filtrage bounding box
-- Performance attendue: <100ms pour 10 000 prestataires

-- =====================================================
-- 1. AJOUT COLONNES PROVIDERS
-- =====================================================

-- Vérifier et ajouter la colonne intervention_radius_km
-- Rayon d'intervention du prestataire en km
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'providers'
    AND COLUMN_NAME = 'intervention_radius_km'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE providers ADD COLUMN intervention_radius_km INT DEFAULT 10 COMMENT ''Rayon maximum d intervention en km''',
    'SELECT ''Column intervention_radius_km already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Vérifier et ajouter la colonne price_per_extra_km
-- Prix par km supplémentaire au-delà des 5km gratuits
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'providers'
    AND COLUMN_NAME = 'price_per_extra_km'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE providers ADD COLUMN price_per_extra_km DECIMAL(5,2) DEFAULT 2.00 COMMENT ''Prix par km supplémentaire en MAD''',
    'SELECT ''Column price_per_extra_km already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter colonne latitude si manquante
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'providers'
    AND COLUMN_NAME = 'latitude'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE providers ADD COLUMN latitude DECIMAL(10,8) NULL COMMENT ''Latitude GPS''',
    'SELECT ''Column latitude already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter colonne longitude si manquante
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'providers'
    AND COLUMN_NAME = 'longitude'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE providers ADD COLUMN longitude DECIMAL(11,8) NULL COMMENT ''Longitude GPS''',
    'SELECT ''Column longitude already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter colonne is_available si manquante
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'providers'
    AND COLUMN_NAME = 'is_available'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE providers ADD COLUMN is_available BOOLEAN DEFAULT TRUE COMMENT ''Disponibilité générale''',
    'SELECT ''Column is_available already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 2. INDEX POUR PERFORMANCES GÉOLOCALISATION
-- =====================================================

-- Index composite sur latitude/longitude pour bounding box
-- Permet un filtrage rapide avant le calcul Haversine coûteux
CREATE INDEX IF NOT EXISTS idx_provider_location
ON providers(latitude, longitude);

-- Index sur la disponibilité pour filtrage rapide
CREATE INDEX IF NOT EXISTS idx_provider_available
ON providers(is_available);

-- Index composite pour recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_provider_location_available
ON providers(is_available, latitude, longitude);

-- Index sur provider_services pour jointures
CREATE INDEX IF NOT EXISTS idx_provider_services_provider
ON provider_services(provider_id, service_id);

CREATE INDEX IF NOT EXISTS idx_provider_services_service
ON provider_services(service_id, provider_id);

-- =====================================================
-- 3. VUE POUR RECHERCHES OPTIMISÉES
-- =====================================================

-- Supprimer la vue si elle existe
DROP VIEW IF EXISTS provider_services_with_location;

-- Créer la vue matérialisée pour recherches fréquentes
-- Cette vue pré-joint les tables nécessaires pour la recherche
CREATE VIEW provider_services_with_location AS
SELECT
    ps.id as provider_service_id,
    ps.provider_id,
    ps.service_id,
    ps.price,
    ps.duration_minutes,
    ps.is_active as service_active,
    p.user_id,
    p.latitude,
    p.longitude,
    p.is_available,
    p.intervention_radius_km,
    p.price_per_extra_km,
    p.avg_rating,
    p.total_reviews,
    p.business_name,
    u.first_name,
    u.last_name,
    u.profile_photo,
    u.status as user_status,
    s.id as s_id,
    s.name as service_name,
    s.category_id,
    c.name as category_name
FROM provider_services ps
INNER JOIN providers p ON ps.provider_id = p.id
INNER JOIN users u ON p.user_id = u.id
INNER JOIN services s ON ps.service_id = s.id
LEFT JOIN categories c ON s.category_id = c.id
WHERE p.is_available = TRUE
AND u.status = 'active'
AND ps.is_active = TRUE;

-- =====================================================
-- 4. TABLE PROVIDER_AVAILABILITY (si n'existe pas)
-- =====================================================

CREATE TABLE IF NOT EXISTS provider_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    INDEX idx_provider_day (provider_id, day_of_week),
    INDEX idx_availability (is_available, day_of_week)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. DONNÉES DE TEST GÉOLOCALISATION MARRAKECH
-- =====================================================

-- Mettre à jour les prestataires existants avec des coordonnées de test
-- Centre: Jemaa el-Fna (31.6258, -7.9891)

-- Prestataire 1: Médina (1.5 km)
UPDATE providers SET
    latitude = 31.6310,
    longitude = -7.9850,
    intervention_radius_km = 15,
    price_per_extra_km = 2.00,
    is_available = TRUE
WHERE id = 1 AND latitude IS NULL;

-- Prestataire 2: Guéliz (3.2 km)
UPDATE providers SET
    latitude = 31.6400,
    longitude = -8.0100,
    intervention_radius_km = 20,
    price_per_extra_km = 2.50,
    is_available = TRUE
WHERE id = 2 AND latitude IS NULL;

-- Prestataire 3: Hivernage (2.8 km)
UPDATE providers SET
    latitude = 31.6180,
    longitude = -8.0150,
    intervention_radius_km = 12,
    price_per_extra_km = 2.00,
    is_available = TRUE
WHERE id = 3 AND latitude IS NULL;

-- Prestataire 4: Palmeraie (8.5 km)
UPDATE providers SET
    latitude = 31.6800,
    longitude = -7.9600,
    intervention_radius_km = 25,
    price_per_extra_km = 3.00,
    is_available = TRUE
WHERE id = 4 AND latitude IS NULL;

-- Prestataire 5: Mellah (1.2 km)
UPDATE providers SET
    latitude = 31.6220,
    longitude = -7.9820,
    intervention_radius_km = 10,
    price_per_extra_km = 2.00,
    is_available = TRUE
WHERE id = 5 AND latitude IS NULL;

-- =====================================================
-- 6. DISPONIBILITÉS PAR DÉFAUT
-- =====================================================

-- Insérer des disponibilités par défaut pour les prestataires sans planning
INSERT IGNORE INTO provider_availability (provider_id, day_of_week, start_time, end_time, is_available)
SELECT
    p.id,
    d.day_name,
    '09:00:00',
    '18:00:00',
    TRUE
FROM providers p
CROSS JOIN (
    SELECT 'monday' as day_name UNION ALL
    SELECT 'tuesday' UNION ALL
    SELECT 'wednesday' UNION ALL
    SELECT 'thursday' UNION ALL
    SELECT 'friday' UNION ALL
    SELECT 'saturday'
) d
WHERE NOT EXISTS (
    SELECT 1 FROM provider_availability pa
    WHERE pa.provider_id = p.id AND pa.day_of_week = d.day_name
);

-- =====================================================
-- 7. FONCTION STOCKÉE POUR CALCUL DISTANCE (optionnel)
-- =====================================================

DROP FUNCTION IF EXISTS haversine_distance;

DELIMITER //

CREATE FUNCTION haversine_distance(
    lat1 DECIMAL(10,8),
    lon1 DECIMAL(11,8),
    lat2 DECIMAL(10,8),
    lon2 DECIMAL(11,8)
)
RETURNS DECIMAL(10,2)
DETERMINISTIC
COMMENT 'Calcule la distance en km entre deux points GPS'
BEGIN
    DECLARE earth_radius DECIMAL(10,2) DEFAULT 6371;
    DECLARE dlat DECIMAL(20,10);
    DECLARE dlon DECIMAL(20,10);
    DECLARE a DECIMAL(20,10);
    DECLARE c DECIMAL(20,10);

    SET dlat = RADIANS(lat2 - lat1);
    SET dlon = RADIANS(lon2 - lon1);

    SET a = SIN(dlat/2) * SIN(dlat/2) +
            COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
            SIN(dlon/2) * SIN(dlon/2);

    SET c = 2 * ASIN(SQRT(a));

    RETURN ROUND(earth_radius * c, 2);
END //

DELIMITER ;

-- =====================================================
-- 8. VÉRIFICATION MIGRATION
-- =====================================================

-- Afficher un résumé des modifications
SELECT
    'providers' as table_name,
    COUNT(*) as total_records,
    SUM(CASE WHEN latitude IS NOT NULL THEN 1 ELSE 0 END) as with_coordinates,
    AVG(intervention_radius_km) as avg_radius
FROM providers;

SELECT
    'provider_availability' as table_name,
    COUNT(*) as total_slots,
    COUNT(DISTINCT provider_id) as providers_with_schedule
FROM provider_availability;

-- Test de la fonction Haversine
-- Distance Jemaa el-Fna vers Guéliz (~3.2 km)
SELECT haversine_distance(31.6258, -7.9891, 31.6400, -8.0100) as test_distance_km;
