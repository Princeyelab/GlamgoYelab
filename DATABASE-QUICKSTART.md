# Guide Rapide - Base de Données Marrakech Services

## 🚀 Démarrage Rapide

### Méthode 1 : Initialisation Automatique (Recommandée)

```bash
# Démarrer les conteneurs Docker
docker-compose -f docker-compose-marrakech.yml up -d

# La base de données est automatiquement initialisée au premier démarrage !
# Les fichiers schema.sql et seeds.sql sont exécutés automatiquement
```

**C'est tout !** La base de données est prête avec :
- ✅ Toutes les tables créées
- ✅ 3 utilisateurs de test
- ✅ 4 prestataires de test
- ✅ 8 catégories de services
- ✅ 32 services disponibles
- ✅ 4 commandes de test

### Méthode 2 : Initialisation Manuelle

Si l'initialisation automatique ne fonctionne pas :

```bash
# Se connecter au conteneur MySQL
docker-compose -f docker-compose-marrakech.yml exec mysql-db bash

# Exécuter manuellement
mysql -u marrakech_user -pmarrakech_password marrakech_services < /docker-entrypoint-initdb.d/schema.sql
mysql -u marrakech_user -pmarrakech_password marrakech_services < /docker-entrypoint-initdb.d/seeds.sql

# Sortir du conteneur
exit
```

## 🔍 Vérification

### Tester la connexion

```bash
docker-compose -f docker-compose-marrakech.yml exec mysql-db \
  mysql -u marrakech_user -pmarrakech_password marrakech_services \
  -e "SHOW TABLES;"
```

Vous devriez voir :
```
+----------------------------+
| Tables_in_marrakech_services |
+----------------------------+
| addresses                  |
| categories                 |
| orders                     |
| provider_services          |
| providers                  |
| reviews                    |
| services                   |
| users                      |
+----------------------------+
```

### Vérifier les données

```bash
# Compter les utilisateurs
docker-compose -f docker-compose-marrakech.yml exec mysql-db \
  mysql -u marrakech_user -pmarrakech_password marrakech_services \
  -e "SELECT COUNT(*) FROM users;"

# Lister les catégories
docker-compose -f docker-compose-marrakech.yml exec mysql-db \
  mysql -u marrakech_user -pmarrakech_password marrakech_services \
  -e "SELECT id, name FROM categories;"

# Voir les prestataires en ligne
docker-compose -f docker-compose-marrakech.yml exec mysql-db \
  mysql -u marrakech_user -pmarrakech_password marrakech_services \
  -e "SELECT first_name, last_name, status FROM providers WHERE status='online';"
```

## 🔑 Comptes de Test

### Utilisateurs (Clients)

| Email              | Mot de passe  | Nom              |
|--------------------|---------------|------------------|
| user1@test.com     | password123   | Ahmed Benali     |
| user2@test.com     | password123   | Fatima El Amrani |
| user3@test.com     | password123   | Youssef Alaoui   |

### Prestataires

| Email              | Mot de passe  | Nom              | Services         | Status  |
|--------------------|---------------|------------------|------------------|---------|
| provider1@test.com | password123   | Mohammed Tazi    | Plomberie, Élec  | online  |
| provider2@test.com | password123   | Aïcha Idrissi    | Ménage, Beauté   | online  |
| provider3@test.com | password123   | Hassan Mansouri  | Jardin, Bricolage| offline |
| provider4@test.com | password123   | Samira Bennani   | Peinture, Déménag| busy    |

## 📊 Données de Test Disponibles

```
✅ 3 utilisateurs
✅ 4 prestataires
✅ 8 catégories
   - Ménage & Nettoyage
   - Plomberie
   - Électricité
   - Jardinage
   - Peinture
   - Déménagement
   - Réparation & Bricolage
   - Beauté & Bien-être

✅ 32 services (4 par catégorie)
✅ 24 associations prestataire-service
✅ 4 adresses de test
✅ 4 commandes avec différents statuts
✅ 4 évaluations
```

## 💻 Requêtes SQL Utiles

### Voir tous les services d'une catégorie

```sql
SELECT s.name, s.price, s.duration_minutes
FROM services s
WHERE s.category_id = 1;  -- Ménage & Nettoyage
```

### Trouver les prestataires disponibles

```sql
SELECT p.first_name, p.last_name, p.status, p.rating
FROM providers p
WHERE p.status = 'online'
  AND p.is_verified = TRUE
ORDER BY p.rating DESC;
```

### Voir les commandes d'un utilisateur

```sql
SELECT
  o.id,
  s.name AS service,
  p.first_name AS provider,
  o.status,
  o.final_price
FROM orders o
INNER JOIN services s ON o.service_id = s.id
LEFT JOIN providers p ON o.provider_id = p.id
WHERE o.user_id = 1;
```

### Calculer les statistiques d'un prestataire

```sql
SELECT
  p.first_name,
  p.last_name,
  p.rating,
  COUNT(DISTINCT o.id) AS total_orders,
  COUNT(DISTINCT r.id) AS total_reviews,
  SUM(o.tip_amount) AS total_tips
FROM providers p
LEFT JOIN orders o ON p.id = o.provider_id
LEFT JOIN reviews r ON p.id = r.provider_id
WHERE p.id = 1
GROUP BY p.id;
```

## 🛠️ Commandes Utiles

### Accès MySQL Shell

```bash
# Méthode 1 : Via docker exec
docker-compose -f docker-compose-marrakech.yml exec mysql-db \
  mysql -u marrakech_user -pmarrakech_password marrakech_services

# Méthode 2 : Depuis l'hôte (si MySQL client installé)
mysql -h 127.0.0.1 -P 3307 -u marrakech_user -pmarrakech_password marrakech_services
```

### Réinitialiser la Base de Données

```bash
# ATTENTION : Cela supprime TOUTES les données !

# Méthode 1 : Via Docker
docker-compose -f docker-compose-marrakech.yml down -v
docker-compose -f docker-compose-marrakech.yml up -d

# Méthode 2 : Manuellement
docker-compose -f docker-compose-marrakech.yml exec mysql-db \
  mysql -u marrakech_user -pmarrakech_password \
  -e "DROP DATABASE marrakech_services; CREATE DATABASE marrakech_services;"

# Puis réexécuter les scripts
docker-compose -f docker-compose-marrakech.yml exec mysql-db \
  mysql -u marrakech_user -pmarrakech_password marrakech_services \
  < /docker-entrypoint-initdb.d/schema.sql

docker-compose -f docker-compose-marrakech.yml exec mysql-db \
  mysql -u marrakech_user -pmarrakech_password marrakech_services \
  < /docker-entrypoint-initdb.d/seeds.sql
```

### Backup & Restore

```bash
# Backup
docker-compose -f docker-compose-marrakech.yml exec mysql-db \
  mysqldump -u marrakech_user -pmarrakech_password marrakech_services \
  > marrakech_backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
docker-compose -f docker-compose-marrakech.yml exec -T mysql-db \
  mysql -u marrakech_user -pmarrakech_password marrakech_services \
  < marrakech_backup_20250113_120000.sql
```

### Voir les Logs MySQL

```bash
docker-compose -f docker-compose-marrakech.yml logs -f mysql-db
```

## 🔧 Dépannage

### Problème : La base de données n'est pas initialisée

**Solution :**
```bash
# Vérifier si les fichiers SQL sont montés
docker-compose -f docker-compose-marrakech.yml exec mysql-db ls -la /docker-entrypoint-initdb.d/

# Si vides, réinitialiser complètement
docker-compose -f docker-compose-marrakech.yml down -v
docker-compose -f docker-compose-marrakech.yml up -d
```

### Problème : Erreur de connexion "Access denied"

**Solution :**
```bash
# Vérifier les credentials dans docker-compose-marrakech.yml
# User: marrakech_user
# Password: marrakech_password
# Database: marrakech_services
```

### Problème : Port 3307 déjà utilisé

**Solution :**
```bash
# Modifier le port dans docker-compose-marrakech.yml
ports:
  - "3308:3306"  # Changer 3307 en 3308
```

### Problème : Les tables existent déjà

**Solution :**
```bash
# Le script schema.sql commence par DROP TABLE IF EXISTS
# Si besoin, forcer la recréation :
docker-compose -f docker-compose-marrakech.yml exec mysql-db \
  mysql -u marrakech_user -pmarrakech_password marrakech_services \
  < /docker-entrypoint-initdb.d/schema.sql
```

## 📈 Prochaines Étapes

Une fois la base de données initialisée :

1. ✅ Tester les connexions
2. ⏳ Créer les classes Core PHP (Database.php)
3. ⏳ Créer les Modèles (User, Provider, Service, etc.)
4. ⏳ Créer les Contrôleurs
5. ⏳ Implémenter les routes API

## 📚 Documentation Complète

- **DATABASE-SCHEMA.md** - Schéma complet avec diagrammes
- **marrakech-backend/database/README.md** - Documentation détaillée
- **marrakech-backend/database/schema.sql** - Script de création
- **marrakech-backend/database/seeds.sql** - Données de test

---

**Guide créé le** : 2025-01-13
**Base de données** : marrakech_services
**Version** : 1.0
