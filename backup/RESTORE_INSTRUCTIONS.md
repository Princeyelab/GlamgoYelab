# 🔄 INSTRUCTIONS DE RESTAURATION

## 📦 Fichiers Sauvegardés

Date de sauvegarde : **2025-11-19 09:37**

```
backup/
├── index.php.backup                → backend/public/index.php
├── api.php.backup                  → backend/routes/api.php
├── Order.php.backup                → backend/app/models/Order.php
├── OrderController.php.backup      → backend/app/controllers/OrderController.php
└── RESTORE_INSTRUCTIONS.md         → Ce fichier
```

**Tailles des fichiers :**
```
Order.php.backup           7.0K
OrderController.php.backup 4.2K
api.php.backup             7.2K
index.php.backup           1.3K
```

---

## ⚠️ QUAND RESTAURER ?

Restaurer uniquement si :
- ❌ Les tests de non-régression échouent
- ❌ L'application ne démarre plus
- ❌ Les endpoints existants ne fonctionnent plus
- ❌ Erreurs SQL critiques après migration

---

## 🔧 COMMANDES DE RESTAURATION

### Étape 1 : Arrêter les conteneurs Docker
```bash
cd /c/Dev/YelabGo
docker-compose down
```

### Étape 2 : Restaurer les fichiers
```bash
# Restaurer le point d'entrée
cp backup/index.php.backup backend/public/index.php

# Restaurer les routes
cp backup/api.php.backup backend/routes/api.php

# Restaurer le modèle Order
cp backup/Order.php.backup backend/app/models/Order.php

# Restaurer le contrôleur Order
cp backup/OrderController.php.backup backend/app/controllers/OrderController.php
```

### Étape 3 : Rollback de la base de données (si migration exécutée)
```bash
# Se connecter au conteneur MySQL
docker-compose up -d mysql-db
docker exec glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo

# Dans MySQL, exécuter le script de rollback
SOURCE /docker-entrypoint-initdb.d/005_rollback_bidding_system.sql;
exit;
```

OU via un fichier :
```bash
docker exec -i glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo < backend/database/migrations/005_rollback_bidding_system.sql
```

### Étape 4 : Supprimer les nouveaux fichiers créés
```bash
# Supprimer les nouveaux modèles
rm -f backend/app/models/Bid.php

# Supprimer les nouveaux contrôleurs
rm -f backend/app/controllers/BiddingController.php

# Supprimer les migrations
rm -f backend/database/migrations/002_add_bidding_system.sql
rm -f backend/database/migrations/002_rollback_bidding_system.sql
```

### Étape 5 : Redémarrer l'application
```bash
docker-compose up -d --build
```

### Étape 6 : Vérifier que tout fonctionne
```bash
# Test de santé
curl http://localhost:8080/api/health

# Test de connexion
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test des services
curl http://localhost:8080/api/services
```

---

## 🔍 VÉRIFICATIONS POST-RESTAURATION

### 1. Vérifier que les endpoints fonctionnent
```bash
# Lancer le script de test
cd /c/Dev/YelabGo
bash test-auth.sh
bash test-services.sh
bash test-orders.sh
```

### 2. Vérifier la structure de la base de données
```sql
-- Se connecter à MySQL
docker-compose exec mysql-db mysql -u root -proot marrakech_services

-- Vérifier que les nouvelles tables ont été supprimées
SHOW TABLES;
-- Ne devrait PAS contenir : bids, negotiations, provider_stats

-- Vérifier la table orders
DESCRIBE orders;
-- Ne devrait PAS contenir : pricing_mode, user_proposed_price, accepted_bid_id, bid_expiry_time

-- Vérifier la table services
DESCRIBE services;
-- Ne devrait PAS contenir : allow_bidding, min_suggested_price, max_suggested_price
```

### 3. Vérifier les logs Docker
```bash
docker-compose logs backend | tail -50
docker-compose logs mysql-db | tail -50
```

---

## 📞 EN CAS DE PROBLÈME

Si la restauration ne fonctionne pas :

### Option 1 : Restaurer depuis le dernier dump SQL
```bash
# Restaurer le dump complet (si disponible)
docker-compose exec -T mysql-db mysql -u root -proot marrakech_services < backup_data_20251117.sql
```

### Option 2 : Recréer la base de données depuis zéro
```bash
# Supprimer la BDD
docker-compose exec mysql-db mysql -u root -proot -e "DROP DATABASE marrakech_services;"

# Recréer
docker-compose exec mysql-db mysql -u root -proot -e "CREATE DATABASE marrakech_services CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Réimporter le schéma initial
docker-compose exec -T mysql-db mysql -u root -proot marrakech_services < backend/database/migrations/001_create_tables.sql
docker-compose exec -T mysql-db mysql -u root -proot marrakech_services < backend/database/migrations/002_add_notifications.sql
docker-compose exec -T mysql-db mysql -u root -proot marrakech_services < backend/database/migrations/003_add_location_tracking.sql
docker-compose exec -T mysql-db mysql -u root -proot marrakech_services < backend/database/migrations/004_add_reviews.sql

# Réimporter les données de seed
docker-compose exec -T mysql-db mysql -u root -proot marrakech_services < backend/database/seeds/002_seed_data.sql
```

### Option 3 : Rollback Git (si commité)
```bash
# Voir l'historique
git log --oneline

# Revenir au commit précédent
git reset --hard <commit-hash-avant-migration>

# Forcer le push (si déjà pushé)
git push --force origin main
```

---

## 🎯 CHECKLIST DE VÉRIFICATION POST-RESTAURATION

- [ ] L'API répond sur `/api/health`
- [ ] L'authentification fonctionne (`/api/auth/login`)
- [ ] Les services sont listés (`/api/services`)
- [ ] Les catégories sont listées (`/api/categories`)
- [ ] Création de commande fonctionne (`POST /api/orders`)
- [ ] Pas d'erreurs dans les logs Docker
- [ ] La table `orders` n'a PAS les nouvelles colonnes
- [ ] Les tables `bids`, `negotiations`, `provider_stats` n'existent PAS
- [ ] Le frontend se connecte correctement au backend

---

## 📝 RAPPORT D'INCIDENT

Si vous devez restaurer, documenter :
1. **Date et heure** de l'incident
2. **Symptômes** observés
3. **Logs d'erreur** (copier-coller)
4. **Étapes de restauration** effectuées
5. **Résultat** de la restauration (succès/échec)

Enregistrer dans `backup/INCIDENT_REPORT_<date>.md`
