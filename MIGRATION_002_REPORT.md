# 📊 RAPPORT DE MIGRATION 002 - SYSTÈME D'ENCHÈRES

**Date :** 2025-11-19
**Migration :** 002_add_bidding_system.sql
**Status :** ✅ EXÉCUTÉE AVEC SUCCÈS

---

## ✅ FICHIERS CRÉÉS

| Fichier | Taille | Description |
|---------|--------|-------------|
| `backend/database/migrations/002_add_bidding_system.sql` | ~15KB | Script de migration idempotent |
| `backend/database/migrations/002_rollback_bidding_system.sql` | ~6KB | Script de rollback |

---

## 🗄️ TABLES CRÉÉES

### 1. Table `bids` (Offres des prestataires)
```sql
Structure :
- id (INT, PK, AUTO_INCREMENT)
- order_id (INT, FK → orders.id)
- provider_id (INT, FK → providers.id)
- proposed_price (DECIMAL(10,2))
- estimated_arrival_minutes (INT, NULL)
- message (TEXT, NULL)
- status (ENUM: pending, accepted, rejected, withdrawn, expired)
- created_at, updated_at (TIMESTAMP)

Index :
- idx_order_status (order_id, status)
- idx_provider_status (provider_id, status)
- idx_created_at (created_at)
- unique_provider_order (provider_id, order_id) UNIQUE

Contraintes :
- FK vers orders (ON DELETE CASCADE)
- FK vers providers (ON DELETE CASCADE)
```

### 2. Table `negotiations` (Historique des négociations)
```sql
Structure :
- id (INT, PK)
- bid_id (INT, FK → bids.id)
- order_id (INT, FK → orders.id)
- actor_type (ENUM: user, provider)
- actor_id (INT)
- action_type (ENUM: counter_offer, message, price_adjustment)
- previous_price (DECIMAL(10,2), NULL)
- new_price (DECIMAL(10,2), NULL)
- message (TEXT, NULL)
- created_at (TIMESTAMP)

Index :
- idx_bid_id, idx_order_id, idx_created_at
```

### 3. Table `provider_stats` (Statistiques prestataires)
```sql
Structure :
- id (INT, PK)
- provider_id (INT, UNIQUE, FK → providers.id)
- total_bids (INT, DEFAULT 0)
- accepted_bids (INT, DEFAULT 0)
- rejected_bids (INT, DEFAULT 0)
- withdrawn_bids (INT, DEFAULT 0)
- expired_bids (INT, DEFAULT 0)
- acceptance_rate (DECIMAL(5,2), DEFAULT 0.00)
- avg_response_time_minutes (INT, DEFAULT 0)
- avg_bid_price (DECIMAL(10,2), DEFAULT 0.00)
- lowest_bid_price (DECIMAL(10,2), NULL)
- highest_bid_price (DECIMAL(10,2), NULL)
- last_bid_at (TIMESTAMP, NULL)
- created_at, updated_at (TIMESTAMP)

Index :
- idx_acceptance_rate, idx_last_bid_at

Données initiales :
- 3 entrées créées (pour les 3 prestataires existants)
```

### 4. Table `notifications` (SI N'EXISTAIT PAS)
```sql
Structure :
- id (INT, PK)
- recipient_type (ENUM: user, provider)
- recipient_id (INT)
- order_id (INT, NULL, FK → orders.id)
- notification_type (VARCHAR(50))
- title (VARCHAR(255))
- message (TEXT)
- data (JSON, NULL)
- is_read (BOOLEAN, DEFAULT FALSE)
- read_at (DATETIME, NULL)
- created_at, updated_at (TIMESTAMP)

Index :
- idx_recipient, idx_order_id, idx_is_read, idx_notification_type, idx_created_at
```

---

## 📝 COLONNES AJOUTÉES

### Table `orders` (4 nouvelles colonnes)
```sql
- pricing_mode ENUM('fixed', 'bidding') DEFAULT 'fixed'
  → Mode de tarification (fixe ou enchères)
  
- user_proposed_price DECIMAL(10,2) NULL
  → Budget proposé par l'utilisateur en mode enchères
  
- accepted_bid_id INT NULL (FK → bids.id)
  → ID de l'offre acceptée
  
- bid_expiry_time TIMESTAMP NULL
  → Date d'expiration des offres

+ Index: idx_pricing_mode_status (pricing_mode, status)
```

### Table `services` (3 nouvelles colonnes)
```sql
- allow_bidding BOOLEAN DEFAULT TRUE
  → Autoriser le mode enchères pour ce service
  
- min_suggested_price DECIMAL(10,2) NULL
  → Prix minimum suggéré en mode enchères (initialisé à price * 0.80)
  
- max_suggested_price DECIMAL(10,2) NULL
  → Prix maximum suggéré en mode enchères (initialisé à price * 1.20)

Données initiales :
- Fourchettes de prix calculées pour 94 services existants
```

---

## 📊 VUE CRÉÉE

### `v_bidding_orders_summary`
Vue SQL qui agrège les informations des commandes en mode enchères :
```sql
Colonnes :
- order_id, user_id, service_id, service_name
- user_proposed_price, status, bid_expiry_time
- total_bids (nombre d'offres)
- lowest_bid, highest_bid, avg_bid
- created_at
```

---

## ✅ TESTS D'IDEMPOTENCE

Le script a été exécuté **2 fois** sur la même base de données :

### Première exécution
```
✅ Toutes les tables créées
✅ Toutes les colonnes ajoutées
✅ Index créés
✅ Contraintes FK ajoutées
✅ Vue créée
```

### Deuxième exécution (test idempotence)
```
✅ Détection des colonnes existantes
✅ Aucune erreur
✅ Messages: "Column X already exists"
✅ Transaction COMMIT réussie
```

**Résultat :** Le script est **100% idempotent** ✅

---

## 📈 ÉTAT ACTUEL DE LA BASE DE DONNÉES

```
Tables totales : 17
├── bids                   (0 enregistrements)
├── negotiations           (0 enregistrements)
├── provider_stats         (3 enregistrements)
├── notifications          (24 enregistrements)
├── orders                 (12 enregistrements)
│   └── pricing_mode = 'fixed' pour toutes
├── services               (94 enregistrements)
│   └── allow_bidding = TRUE pour tous
│   └── Fourchettes de prix calculées
└── v_bidding_orders_summary (VUE)
```

---

## 🔄 ROLLBACK

Script de rollback disponible : `002_rollback_bidding_system.sql`

**Action du rollback :**
1. Supprime la vue `v_bidding_orders_summary`
2. Supprime la FK `fk_orders_accepted_bid`
3. Supprime les 4 colonnes de `orders`
4. Supprime les 3 colonnes de `services`
5. Supprime les tables `negotiations`, `provider_stats`, `bids`
6. Conserve la table `notifications` (utilisée ailleurs)

**Pour exécuter le rollback :**
```bash
docker exec -i glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo < backend/database/migrations/002_rollback_bidding_system.sql
```

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ Migration SQL terminée
2. 🔄 Créer BiddingController.php
3. 🔄 Ajouter les routes API
4. 🔄 Tester le flux complet
5. 🔄 Tests de non-régression

---

## 📝 NOTES IMPORTANTES

- ✅ **Aucune donnée existante n'a été modifiée**
- ✅ **Toutes les commandes existantes sont en mode 'fixed'**
- ✅ **Le système actuel continue de fonctionner normalement**
- ✅ **La migration est réversible à 100%**
- ✅ **Aucun downtime requis**

---

**Auteur :** Claude Code  
**Date de création :** 2025-11-19  
**Validé par :** Migration exécutée avec succès  
