# Migrations de Base de Données - GlamGo

## 📋 Vue d'ensemble

Ce dossier contient les migrations SQL pour ajouter le support de la géolocalisation (coordonnées GPS) aux tables `users` et `providers`.

---

## 🗂️ Fichiers de migration

### 1. `001_add_gps_coordinates.sql` (MySQL/MariaDB)
Migration pour bases de données MySQL ou MariaDB.

### 2. `001_add_gps_coordinates_postgresql.sql` (PostgreSQL)
Migration pour bases de données PostgreSQL avec contraintes de validation optionnelles.

---

## 🚀 Comment appliquer la migration

### Option A: Ligne de commande MySQL

```bash
# Se connecter à la base de données
mysql -u root -p glamgo_db

# Exécuter la migration
source database-migrations/001_add_gps_coordinates.sql

# Vérifier que les colonnes sont créées
DESCRIBE users;
DESCRIBE providers;
```

### Option B: PHPMyAdmin / Adminer

1. Ouvrez votre outil d'administration de base de données
2. Sélectionnez la base de données `glamgo_db`
3. Allez dans l'onglet **SQL**
4. Copiez-collez le contenu de `001_add_gps_coordinates.sql`
5. Cliquez sur **Exécuter**

### Option C: Laravel Migration (Recommandé)

Si vous utilisez Laravel, créez une migration PHP :

```bash
php artisan make:migration add_gps_coordinates_to_users_and_providers
```

Puis éditez le fichier généré :

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('address', 255)->nullable()->after('city');
            $table->decimal('latitude', 10, 8)->nullable()->after('address');
            $table->decimal('longitude', 11, 8)->nullable()->after('latitude');

            // Index pour optimiser les requêtes de distance
            $table->index(['latitude', 'longitude'], 'idx_users_location');
        });

        Schema::table('providers', function (Blueprint $table) {
            $table->string('address', 255)->nullable()->after('city');
            $table->decimal('latitude', 10, 8)->nullable()->after('address');
            $table->decimal('longitude', 11, 8)->nullable()->after('latitude');

            // Index pour optimiser les requêtes de distance
            $table->index(['latitude', 'longitude'], 'idx_providers_location');
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_location');
            $table->dropColumn(['address', 'latitude', 'longitude']);
        });

        Schema::table('providers', function (Blueprint $table) {
            $table->dropIndex('idx_providers_location');
            $table->dropColumn(['address', 'latitude', 'longitude']);
        });
    }
};
```

Puis exécutez :

```bash
php artisan migrate
```

---

## ✅ Vérification de la migration

### Vérifier les colonnes créées

```sql
-- MySQL
SHOW COLUMNS FROM users LIKE '%address%';
SHOW COLUMNS FROM users LIKE '%latitude%';
SHOW COLUMNS FROM users LIKE '%longitude%';

-- PostgreSQL
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('address', 'latitude', 'longitude');
```

### Vérifier les index

```sql
-- MySQL
SHOW INDEX FROM users WHERE Key_name = 'idx_users_location';
SHOW INDEX FROM providers WHERE Key_name = 'idx_providers_location';

-- PostgreSQL
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('users', 'providers')
AND indexname LIKE '%location%';
```

---

## 🧪 Tester avec des données

### Insérer des données de test

```sql
-- Utilisateur avec coordonnées GPS
INSERT INTO users (
    first_name, last_name, email, phone,
    address, city, latitude, longitude,
    password, created_at, updated_at
) VALUES (
    'Ahmed', 'Bennani', 'ahmed.test@glamgo.ma', '0612345678',
    'Avenue Mohammed V, Marrakech, Maroc', 'Marrakech',
    31.6295, -7.9811,
    '$2y$10$...', NOW(), NOW()
);

-- Utilisateur sans coordonnées GPS (saisie manuelle)
INSERT INTO users (
    first_name, last_name, email, phone,
    address, city, latitude, longitude,
    password, created_at, updated_at
) VALUES (
    'Fatima', 'Alaoui', 'fatima.test@glamgo.ma', '0687654321',
    'Quartier Gueliz', 'Marrakech',
    NULL, NULL,
    '$2y$10$...', NOW(), NOW()
);
```

### Recherche par rayon (5 km autour d'un point)

```sql
-- Trouver tous les prestataires dans un rayon de 5 km
SELECT
    id,
    first_name,
    last_name,
    address,
    (
        6371 * acos(
            cos(radians(31.6295)) *
            cos(radians(latitude)) *
            cos(radians(longitude) - radians(-7.9811)) +
            sin(radians(31.6295)) *
            sin(radians(latitude))
        )
    ) AS distance_km
FROM providers
WHERE
    latitude IS NOT NULL
    AND longitude IS NOT NULL
HAVING distance_km <= 5
ORDER BY distance_km ASC;
```

---

## 📊 Statistiques

### Taux d'adoption des coordonnées GPS

```sql
-- Pourcentage d'utilisateurs avec GPS
SELECT
    COUNT(*) as total_users,
    SUM(CASE WHEN latitude IS NOT NULL THEN 1 ELSE 0 END) as users_with_gps,
    ROUND(
        SUM(CASE WHEN latitude IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
        2
    ) as gps_adoption_rate
FROM users;

-- Distribution par ville
SELECT
    city,
    COUNT(*) as total,
    SUM(CASE WHEN latitude IS NOT NULL THEN 1 ELSE 0 END) as with_gps,
    ROUND(
        SUM(CASE WHEN latitude IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
        2
    ) as gps_rate
FROM users
GROUP BY city
ORDER BY total DESC;
```

---

## 🔙 Rollback (Annulation)

Si vous devez annuler la migration :

### MySQL/MariaDB

```sql
ALTER TABLE users
DROP INDEX idx_users_location,
DROP COLUMN address,
DROP COLUMN latitude,
DROP COLUMN longitude;

ALTER TABLE providers
DROP INDEX idx_providers_location,
DROP COLUMN address,
DROP COLUMN latitude,
DROP COLUMN longitude;
```

### PostgreSQL

```sql
DROP INDEX IF EXISTS idx_users_location;
DROP INDEX IF EXISTS idx_providers_location;

ALTER TABLE users
DROP CONSTRAINT IF EXISTS chk_users_latitude,
DROP CONSTRAINT IF EXISTS chk_users_longitude,
DROP COLUMN IF EXISTS address,
DROP COLUMN IF EXISTS latitude,
DROP COLUMN IF EXISTS longitude;

ALTER TABLE providers
DROP CONSTRAINT IF EXISTS chk_providers_latitude,
DROP CONSTRAINT IF EXISTS chk_providers_longitude,
DROP COLUMN IF EXISTS address,
DROP COLUMN IF EXISTS latitude,
DROP COLUMN IF EXISTS longitude;
```

### Laravel

```bash
php artisan migrate:rollback --step=1
```

---

## ⚠️ Précautions

1. **Sauvegarde obligatoire** : Faites toujours une sauvegarde avant d'exécuter une migration
   ```bash
   mysqldump -u root -p glamgo_db > backup_before_gps_migration.sql
   ```

2. **Tester en développement** : Testez d'abord sur votre environnement de développement

3. **Vérifier les dépendances** : Assurez-vous qu'aucune autre requête ne dépend de l'absence de ces colonnes

4. **Coordination avec le frontend** : Assurez-vous que le frontend envoie bien les champs `address`, `latitude`, `longitude`

---

## 📚 Ressources

- [Requêtes géospatiales MySQL](https://dev.mysql.com/doc/refman/8.0/en/spatial-function-reference.html)
- [PostGIS pour PostgreSQL](https://postgis.net/documentation/)
- [Formule de Haversine (calcul de distance)](https://en.wikipedia.org/wiki/Haversine_formula)

---

**Date de création** : 2025-01-20
**Version** : 1.0.0
**Auteur** : GlamGo Dev Team
