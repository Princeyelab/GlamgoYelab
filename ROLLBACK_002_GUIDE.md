# 🔄 GUIDE COMPLET DU ROLLBACK 002

**Date :** 2025-11-19
**Migration concernée :** 002_add_bidding_system.sql
**Script de rollback :** 002_rollback_bidding_system.sql

---

## 📋 VUE D'ENSEMBLE

Ce guide explique comment effectuer un rollback complet de la migration 002 qui ajoute le système d'enchères type InDrive à GlamGo.

**⚠️ ATTENTION :** Le rollback est **DESTRUCTIF** et supprimera :
- Toutes les offres (bids)
- Toutes les négociations (negotiations)
- Toutes les statistiques prestataires (provider_stats)
- Les colonnes ajoutées aux tables `orders` et `services`

---

## 🎯 QUAND EFFECTUER UN ROLLBACK ?

Effectuer un rollback uniquement si :
- ❌ L'application ne fonctionne plus après la migration
- ❌ Des erreurs critiques apparaissent
- ❌ Les tests de non-régression échouent
- ❌ Décision business de ne pas implémenter les enchères

**Ne PAS effectuer de rollback si :**
- ✅ L'application fonctionne normalement
- ✅ Seules quelques fonctionnalités d'enchères ont des bugs mineurs
- ✅ Vous voulez juste désactiver temporairement les enchères

---

## 📄 CONTENU DU SCRIPT DE ROLLBACK

Le script `002_rollback_bidding_system.sql` effectue les actions suivantes **dans l'ordre** :

### 1. Suppression de la vue (ligne 15)
```sql
DROP VIEW IF EXISTS v_bidding_orders_summary;
```

### 2. Suppression des contraintes FK (lignes 20-35)
```sql
-- Supprime fk_orders_accepted_bid (si existe)
ALTER TABLE orders DROP FOREIGN KEY fk_orders_accepted_bid;
```

### 3. Suppression de l'index (lignes 40-56)
```sql
-- Supprime idx_pricing_mode_status (si existe)
ALTER TABLE orders DROP INDEX idx_pricing_mode_status;
```

### 4. Suppression des colonnes de `orders` (lignes 58-128)
```sql
-- Dans l'ordre :
ALTER TABLE orders DROP COLUMN bid_expiry_time;
ALTER TABLE orders DROP COLUMN accepted_bid_id;
ALTER TABLE orders DROP COLUMN user_proposed_price;
ALTER TABLE orders DROP COLUMN pricing_mode;
```

### 5. Suppression des colonnes de `services` (lignes 133-185)
```sql
-- Dans l'ordre :
ALTER TABLE services DROP COLUMN max_suggested_price;
ALTER TABLE services DROP COLUMN min_suggested_price;
ALTER TABLE services DROP COLUMN allow_bidding;
```

### 6. Suppression des tables (lignes 190-197)
```sql
-- Dans l'ordre inverse des dépendances :
DROP TABLE IF EXISTS negotiations;
DROP TABLE IF EXISTS provider_stats;
DROP TABLE IF EXISTS bids;
```

---

## 🔐 CARACTÉRISTIQUES DU SCRIPT

✅ **Idempotent** : Peut être exécuté plusieurs fois sans erreur
✅ **Transactionnel** : Tout est dans une transaction (ROLLBACK automatique en cas d'erreur)
✅ **Sécurisé** : Vérifie l'existence de chaque élément avant suppression
✅ **Documenté** : Commentaires explicites
✅ **Non-destructif pour notifications** : Conserve la table `notifications`

---

## 🛠️ MÉTHODES D'EXÉCUTION

### Méthode 1 : Mode Simulation (RECOMMANDÉ en premier)

Testez d'abord le rollback en mode simulation :

```bash
bash test-rollback-002.sh
```

**Ce que fait la simulation :**
- ✅ Affiche l'état actuel de la base de données
- ✅ Liste toutes les actions qui seraient effectuées
- ✅ N'exécute RIEN réellement
- ✅ Sécurisé à 100%

**Sortie attendue :**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 SIMULATION DU ROLLBACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Le rollback effectuerait les actions suivantes :

1. ✅ Supprimer la vue v_bidding_orders_summary
2. ✅ Supprimer la FK fk_orders_accepted_bid
3. ✅ Supprimer l'index idx_pricing_mode_status
4. ✅ Supprimer 4 colonnes de orders
5. ✅ Supprimer 3 colonnes de services
6. ✅ Supprimer les tables

✅ Simulation terminée
```

---

### Méthode 2 : Exécution Réelle (avec backup automatique)

⚠️ **ATTENTION** : Cette commande exécute VRAIMENT le rollback !

```bash
bash test-rollback-002.sh --real
```

**Le script va :**
1. Demander une confirmation (tapez `OUI` en majuscules)
2. Créer un backup automatique dans `backup/pre_rollback_YYYYMMDD_HHMMSS.sql`
3. Exécuter le rollback
4. Afficher l'état final de la base de données
5. Vérifier que tout a été supprimé correctement

**Sortie attendue :**
```
⚠️  MODE RÉEL ACTIVÉ - LE ROLLBACK SERA VRAIMENT EXÉCUTÉ
Êtes-vous sûr ? (tapez 'OUI' pour confirmer) : OUI

Création d'un backup de sécurité...
✅ Backup créé

Exécution du script de rollback...
✅ Rollback 002 exécuté avec succès !

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 ÉTAT APRÈS ROLLBACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Table bids supprimée
✅ Table negotiations supprimée
✅ Table provider_stats supprimée
✅ Toutes les colonnes orders supprimées
✅ Toutes les colonnes services supprimées

✅ Rollback terminé
```

---

### Méthode 3 : Exécution Manuelle (sans script)

Si vous préférez exécuter manuellement :

```bash
# 1. Créer un backup
docker exec glamgo-mysql mysqldump -u glamgo_user -pglamgo_password glamgo > backup/manual_backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Exécuter le rollback
docker exec -i glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo < backend/database/migrations/002_rollback_bidding_system.sql

# 3. Vérifier
docker exec glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo -e "SHOW TABLES;"
```

---

## ✅ VÉRIFICATIONS POST-ROLLBACK

Après le rollback, vérifiez que :

### 1. Tables supprimées ✅
```bash
docker exec glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo -e "SHOW TABLES;" | grep -E "(bids|negotiations|provider_stats)"
```

**Résultat attendu :** Aucune ligne (commande ne retourne rien)

### 2. Colonnes orders supprimées ✅
```bash
docker exec glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo -e "DESCRIBE orders;" | grep -E "(pricing_mode|user_proposed_price|accepted_bid_id|bid_expiry_time)"
```

**Résultat attendu :** Aucune ligne

### 3. Colonnes services supprimées ✅
```bash
docker exec glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo -e "DESCRIBE services;" | grep -E "(allow_bidding|min_suggested_price|max_suggested_price)"
```

**Résultat attendu :** Aucune ligne

### 4. Vue supprimée ✅
```bash
docker exec glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo -e "SHOW FULL TABLES WHERE TABLE_TYPE = 'VIEW';" | grep bidding
```

**Résultat attendu :** Aucune ligne

### 5. Application fonctionne ✅
```bash
# Test health check
curl http://localhost:8080/api/health

# Test services (mode fixe uniquement)
curl http://localhost:8080/api/services

# Test création commande (mode fixe)
curl -X POST http://localhost:8080/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"service_id":1,"address_id":1}'
```

---

## 🔄 RESTAURER APRÈS ROLLBACK

Si vous avez fait un rollback par erreur, vous pouvez restaurer :

### Option 1 : Ré-exécuter la migration
```bash
docker exec -i glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo < backend/database/migrations/002_add_bidding_system.sql
```

### Option 2 : Restaurer depuis le backup
```bash
# Lister les backups disponibles
ls -lh backup/pre_rollback_*.sql

# Restaurer le plus récent
docker exec -i glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo < backup/pre_rollback_YYYYMMDD_HHMMSS.sql
```

---

## 📊 ÉTAT DE LA BASE DE DONNÉES

### Avant Rollback
```
Tables : 17 (avec bids, negotiations, provider_stats, v_bidding_orders_summary)
orders : 4 colonnes supplémentaires
services : 3 colonnes supplémentaires
```

### Après Rollback
```
Tables : 14 (sans bids, negotiations, provider_stats, v_bidding_orders_summary)
orders : colonnes originales uniquement
services : colonnes originales uniquement
```

---

## 🚨 EN CAS DE PROBLÈME

### Le rollback échoue avec une erreur FK

**Problème :** Des commandes existent en mode 'bidding'

**Solution :**
```sql
-- Mettre toutes les commandes en mode 'fixed'
UPDATE orders SET pricing_mode = 'fixed' WHERE pricing_mode = 'bidding';

-- Ré-exécuter le rollback
```

### Le rollback échoue sur DROP TABLE

**Problème :** Des données existent dans les tables

**Solution :**
```sql
-- Vider les tables dans l'ordre
DELETE FROM negotiations;
DELETE FROM bids;
DELETE FROM provider_stats;

-- Ré-exécuter le rollback
```

### L'application ne démarre plus après rollback

**Solution :**
1. Vérifier les logs : `docker-compose logs php-backend`
2. Si erreur "Table bids not found" → Supprimer `backend/app/models/Bid.php`
3. Si erreur dans routes → Supprimer les routes d'enchères
4. Redémarrer : `docker-compose restart php-backend`

---

## 📝 CHECKLIST COMPLÈTE

Avant d'exécuter le rollback :
- [ ] Créer un backup de la base de données
- [ ] Tester en mode simulation
- [ ] Vérifier qu'il n'y a pas de commandes en mode 'bidding'
- [ ] Prévenir les utilisateurs d'un possible downtime court
- [ ] Avoir le script de migration prêt pour restaurer si besoin

Après le rollback :
- [ ] Vérifier que les tables sont supprimées
- [ ] Vérifier que les colonnes sont supprimées
- [ ] Tester l'API health check
- [ ] Tester la création de commande en mode fixe
- [ ] Vérifier les logs de l'application
- [ ] Supprimer les fichiers PHP liés aux enchères (optionnel)

---

## 📞 SUPPORT

En cas de problème avec le rollback :
1. Consulter les logs : `docker-compose logs mysql-db`
2. Vérifier l'état : `bash test-rollback-002.sh`
3. Restaurer depuis backup si nécessaire
4. Documenter l'incident dans `backup/INCIDENT_REPORT_<date>.md`

---

**Auteur :** Claude Code
**Dernière mise à jour :** 2025-11-19
**Version du script :** 1.0
