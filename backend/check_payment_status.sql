-- Script de vérification de l'état du système de paiement

-- Vérifier tables payment
SELECT 'Tables payment existantes:' AS info;
SHOW TABLES LIKE '%payment%';

-- Vérifier colonnes users
SELECT 'Colonnes payment dans users:' AS info;
SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'glamgo'
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME LIKE '%payment%' OR COLUMN_NAME LIKE '%card%';

-- Vérifier colonnes providers
SELECT 'Colonnes payment dans providers:' AS info;
SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'glamgo'
  AND TABLE_NAME = 'providers'
  AND COLUMN_NAME LIKE '%payment%' OR COLUMN_NAME LIKE '%bank%';

-- Vérifier colonnes orders
SELECT 'Colonnes payment dans orders:' AS info;
SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'glamgo'
  AND TABLE_NAME = 'orders'
  AND COLUMN_NAME LIKE '%payment%';
