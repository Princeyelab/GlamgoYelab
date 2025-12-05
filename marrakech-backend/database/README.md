# Base de Données - Marrakech Services

## 📊 Schéma de Base de Données

### Tables Principales

```
users                    # Utilisateurs (clients)
├── id (PK)
├── email (UNIQUE)
├── password_hash
├── first_name, last_name
├── phone
├── profile_picture_url
├── referral_code (UNIQUE)
└── created_at, updated_at

providers                # Prestataires de services
├── id (PK)
├── email (UNIQUE)
├── password_hash
├── first_name, last_name
├── phone
├── profile_picture_url
├── status (online/offline/busy)
├── current_lat, current_lon
├── rating, total_reviews
├── is_verified
└── created_at, updated_at

addresses                # Adresses des utilisateurs
├── id (PK)
├── user_id (FK → users)
├── full_address
├── lat, lon
├── is_default
└── created_at, updated_at

categories               # Catégories de services
├── id (PK)
├── name
├── description
├── image_url
├── display_order
└── is_active

services                 # Services disponibles
├── id (PK)
├── category_id (FK → categories)
├── name, description
├── duration_minutes
├── price
├── image_url
└── is_active

provider_services        # Services proposés par prestataires (PIVOT)
├── id (PK)
├── provider_id (FK → providers)
├── service_id (FK → services)
└── UNIQUE(provider_id, service_id)

orders                   # Commandes
├── id (PK)
├── user_id (FK → users)
├── provider_id (FK → providers)
├── service_id (FK → services)
├── address_id (FK → addresses)
├── status (pending/accepted/en_route/in_progress/completed/cancelled)
├── order_time
├── scheduled_time
├── final_price, tip_amount
├── cancellation_reason
└── created_at, updated_at

reviews                  # Évaluations
├── id (PK)
├── order_id (FK → orders) UNIQUE
├── user_id (FK → users)
├── provider_id (FK → providers)
├── rating (1-5)
├── comment
└── created_at, updated_at
```

## 🔗 Relations

```
User 1---N Address
User 1---N Order (as customer)
Provider 1---N Order (as service provider)
Provider N---N Service (via provider_services)
Category 1---N Service
Order 1---1 Review
```

## 🚀 Initialisation de la Base de Données

### Méthode 1 : Via Docker (Recommandée)

```bash
# Copier les fichiers dans le conteneur
docker-compose -f docker-compose-marrakech.yml up -d

# Exécuter le script d'initialisation
docker-compose -f docker-compose-marrakech.yml exec mysql-db \
  mysql -u marrakech_user -pmarrakech_password marrakech_services \
  < /docker-entrypoint-initdb.d/schema.sql

# Puis les seeds
docker-compose -f docker-compose-marrakech.yml exec mysql-db \
  mysql -u marrakech_user -pmarrakech_password marrakech_services \
  < /docker-entrypoint-initdb.d/seeds.sql
```

### Méthode 2 : Directement via MySQL

```bash
# Se connecter au conteneur MySQL
docker-compose -f docker-compose-marrakech.yml exec mysql-db bash

# Puis exécuter
mysql -u marrakech_user -pmarrakech_password marrakech_services < /var/www/html/database/schema.sql
mysql -u marrakech_user -pmarrakech_password marrakech_services < /var/www/html/database/seeds.sql
```

### Méthode 3 : Script tout-en-un

```bash
docker-compose -f docker-compose-marrakech.yml exec mysql-db \
  mysql -u marrakech_user -pmarrakech_password < /var/www/html/database/init.sql
```

## 📦 Données de Test Incluses

### Utilisateurs (users)
- **user1@test.com** - Ahmed Benali
- **user2@test.com** - Fatima El Amrani
- **user3@test.com** - Youssef Alaoui

**Mot de passe pour tous** : `password123`

### Prestataires (providers)
- **provider1@test.com** - Mohammed Tazi (Plomberie, Électricité)
- **provider2@test.com** - Aïcha Idrissi (Ménage, Beauté)
- **provider3@test.com** - Hassan Mansouri (Jardinage, Bricolage)
- **provider4@test.com** - Samira Bennani (Peinture, Déménagement)

**Mot de passe pour tous** : `password123`

### Catégories (8 catégories)
1. Ménage & Nettoyage
2. Plomberie
3. Électricité
4. Jardinage
5. Peinture
6. Déménagement
7. Réparation & Bricolage
8. Beauté & Bien-être

### Services (32 services)
4 services par catégorie avec prix et durées variés

### Commandes de Test
- 1 commande complétée avec évaluation
- 1 commande en cours
- 1 commande acceptée (prestataire en route)
- 1 commande en attente

## 🔑 Index et Optimisations

### Index Simples
```sql
-- Sur les emails pour connexion rapide
idx_email (users.email)
idx_email (providers.email)

-- Sur les codes de parrainage
idx_referral_code (users.referral_code)

-- Sur les statuts pour filtrage
idx_status (providers.status)
idx_status (orders.status)

-- Sur la géolocalisation
idx_location (providers.current_lat, current_lon)

-- Sur les notes
idx_rating (providers.rating)
idx_rating (reviews.rating)
```

### Index Composites (Multi-colonnes)
```sql
-- Recherche de prestataires disponibles dans une zone
idx_status_location (providers.status, current_lat, current_lon)

-- Recherche de commandes actives par prestataire
idx_provider_status (orders.provider_id, status)

-- Recherche de commandes actives par utilisateur
idx_user_status (orders.user_id, status)

-- Recherche d'adresses par défaut
idx_default (addresses.user_id, is_default)
```

## 💡 Requêtes Utiles

### Trouver les prestataires disponibles pour un service
```sql
SELECT DISTINCT p.*
FROM providers p
INNER JOIN provider_services ps ON p.id = ps.provider_id
WHERE ps.service_id = ?
  AND p.status = 'online'
  AND p.is_verified = TRUE
ORDER BY p.rating DESC;
```

### Calculer la distance entre prestataire et client
```sql
SELECT p.*,
  (6371 * acos(cos(radians(?)) * cos(radians(p.current_lat)) *
   cos(radians(p.current_lon) - radians(?)) +
   sin(radians(?)) * sin(radians(p.current_lat)))) AS distance
FROM providers p
WHERE p.status = 'online'
HAVING distance <= 10
ORDER BY distance;
```

### Obtenir les commandes en cours d'un utilisateur
```sql
SELECT o.*, s.name AS service_name, p.first_name, p.last_name
FROM orders o
INNER JOIN services s ON o.service_id = s.id
LEFT JOIN providers p ON o.provider_id = p.id
WHERE o.user_id = ?
  AND o.status IN ('pending', 'accepted', 'en_route', 'in_progress')
ORDER BY o.created_at DESC;
```

### Obtenir les statistiques d'un prestataire
```sql
SELECT
  p.*,
  COUNT(o.id) AS total_orders,
  AVG(r.rating) AS avg_rating,
  SUM(o.tip_amount) AS total_tips
FROM providers p
LEFT JOIN orders o ON p.id = o.provider_id
LEFT JOIN reviews r ON p.id = r.provider_id
WHERE p.id = ?
GROUP BY p.id;
```

## 🔒 Contraintes et Règles

### Clés Étrangères
- **ON DELETE CASCADE** : Pour `addresses`, `provider_services`, `orders`, `reviews`
  - Si un utilisateur est supprimé, ses adresses et commandes sont supprimées

- **ON DELETE SET NULL** : Pour `orders.provider_id`
  - Si un prestataire est supprimé, ses commandes restent mais `provider_id` devient NULL

- **ON DELETE RESTRICT** : Pour `orders.service_id`
  - Un service ne peut pas être supprimé s'il a des commandes

### Contraintes CHECK
```sql
-- Rating doit être entre 1 et 5
rating INT CHECK (rating >= 1 AND rating <= 5)
```

### Contraintes ENUM
```sql
-- Status des prestataires
status ENUM('online', 'offline', 'busy')

-- Status des commandes
status ENUM('pending', 'accepted', 'en_route', 'in_progress', 'completed', 'cancelled')
```

## 📈 Statistiques de la Base de Test

```
Users:              3
Providers:          4
Categories:         8
Services:          32
Provider Services: 24
Addresses:          4
Orders:             4
Reviews:            4
```

## 🛠️ Maintenance

### Réinitialiser la base de données
```bash
docker-compose -f docker-compose-marrakech.yml exec mysql-db \
  mysql -u marrakech_user -pmarrakech_password \
  -e "DROP DATABASE marrakech_services; CREATE DATABASE marrakech_services;"

# Puis réexécuter schema.sql et seeds.sql
```

### Backup
```bash
docker-compose -f docker-compose-marrakech.yml exec mysql-db \
  mysqldump -u marrakech_user -pmarrakech_password marrakech_services \
  > backup_$(date +%Y%m%d).sql
```

### Restore
```bash
docker-compose -f docker-compose-marrakech.yml exec -T mysql-db \
  mysql -u marrakech_user -pmarrakech_password marrakech_services \
  < backup_20250113.sql
```

---

**Base de données créée le** : 2025-01-13
**Version** : 1.0
**Encodage** : UTF-8 (utf8mb4)
