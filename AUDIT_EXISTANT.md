# 📋 AUDIT DE L'EXISTANT - GlamGo Backend

**Date de l'audit :** 2025-11-19
**Objectif :** Migration vers système hybride (prix fixes + enchères type InDrive)
**Contrainte :** ZÉRO régression sur le système existant

---

## 🗂️ STRUCTURE DES FICHIERS

### Controllers (backend/app/controllers/)
```
✅ AddressController.php          - Gestion des adresses utilisateurs
✅ AuthController.php              - Authentification (register/login/logout)
✅ CategoryController.php          - Gestion des catégories de services
✅ ChatController.php              - Messagerie entre user et provider
✅ HealthController.php            - Health check API
✅ LocationController.php          - Géolocalisation en temps réel
✅ MigrationController.php         - Migrations manuelles
✅ NotificationController.php      - Notifications utilisateurs (EXISTE DÉJÀ)
✅ OAuthController.php             - OAuth Google/Facebook
✅ OrderController.php             - 🔴 COMMANDES (mode fixe actuel)
✅ ProviderController.php          - Gestion profil prestataires
✅ ProviderNotificationController.php - Notifications prestataires
✅ ProviderOrderController.php     - Commandes côté prestataire
✅ ProviderServiceController.php   - Services proposés par prestataires
✅ ReferralController.php          - Système de parrainage
✅ ReviewController.php            - Avis et évaluations
✅ ServiceController.php           - Catalogue des services
✅ UserController.php              - Gestion profil utilisateurs
```

### Models (backend/app/models/)
```
✅ Category.php                    - Modèle catégories
✅ Message.php                     - Modèle messages chat
✅ Notification.php                - Modèle notifications (EXISTE DÉJÀ)
✅ Order.php                       - 🔴 Modèle commandes (à étendre)
✅ Provider.php                    - Modèle prestataires
✅ Review.php                      - Modèle avis
✅ Service.php                     - Modèle services
✅ User.php                        - Modèle utilisateurs
```

### Routes (backend/routes/api.php)
Total : **47 routes définies**

---

## 🛣️ ENDPOINTS API ACTUELS

### 🔓 Routes Publiques (sans authentification)
```
GET    /api/health                          - Health check
GET    /api/migrate                         - Migration manuelle
POST   /api/auth/register                   - Inscription utilisateur
POST   /api/auth/login                      - Connexion utilisateur
POST   /api/auth/logout                     - Déconnexion
POST   /api/auth/forgot-password            - Mot de passe oublié
POST   /api/auth/reset-password             - Réinitialisation MDP
GET    /api/auth/google                     - OAuth Google
GET    /api/auth/google/callback            - Callback Google
GET    /api/auth/facebook                   - OAuth Facebook
GET    /api/auth/facebook/callback          - Callback Facebook
GET    /api/categories                      - Liste des catégories
GET    /api/categories/{id}                 - Détails catégorie
GET    /api/categories/{id}/services        - Services d'une catégorie
GET    /api/services                        - Liste des services
GET    /api/services/{id}                   - Détails service
GET    /api/providers/{id}/reviews          - Avis d'un prestataire
GET    /api/providers/{id}/stats            - Stats prestataire
```

### 🔒 Routes Utilisateurs (authentification requise)
```
GET    /api/user/profile                    - Profil utilisateur
PUT    /api/user/profile                    - Mise à jour profil
POST   /api/user/avatar                     - Upload avatar
GET    /api/user/addresses                  - Liste adresses
POST   /api/user/addresses                  - Créer adresse
PUT    /api/user/addresses/{id}             - Modifier adresse
DELETE /api/user/addresses/{id}             - Supprimer adresse
PATCH  /api/user/addresses/{id}/default     - Définir adresse par défaut
GET    /api/user/referral-code              - Code de parrainage
POST   /api/user/apply-referral             - Appliquer un code

🔴 POST   /api/orders                       - Créer commande (MODE FIXE)
🔴 GET    /api/orders                       - Liste commandes utilisateur
🔴 GET    /api/orders/{id}                  - Détails commande
🔴 PATCH  /api/orders/{id}/cancel           - Annuler commande

POST   /api/orders/{id}/review              - Créer avis
GET    /api/orders/{id}/review              - Récupérer avis
GET    /api/orders/{id}/can-review          - Vérifier si peut évaluer
GET    /api/orders/{id}/location            - Position prestataire
GET    /api/orders/{id}/messages            - Messages de la commande
POST   /api/orders/{id}/messages            - Envoyer un message
GET    /api/notifications                   - Liste notifications
PATCH  /api/notifications/{id}/read         - Marquer comme lu
PATCH  /api/notifications/read-all          - Tout marquer comme lu
GET    /api/notifications/unread-count      - Nombre non lues
```

### 🔒 Routes Prestataires (authentification requise)
```
POST   /api/provider/register               - Inscription prestataire
POST   /api/provider/login                  - Connexion prestataire
GET    /api/provider/profile                - Profil prestataire
PUT    /api/provider/profile                - Modifier profil
GET    /api/provider/services               - Services proposés
POST   /api/provider/services               - Ajouter un service
DELETE /api/provider/services/{id}          - Retirer un service
GET    /api/provider/orders                 - Commandes reçues
PATCH  /api/provider/orders/{id}/accept     - Accepter commande
PATCH  /api/provider/orders/{id}/start      - Commencer prestation
PATCH  /api/provider/orders/{id}/complete   - Terminer prestation
POST   /api/provider/location               - Mettre à jour position
GET    /api/provider/notifications          - Notifications
PATCH  /api/provider/notifications/{id}/read - Marquer comme lu
PATCH  /api/provider/notifications/read-all - Tout marquer comme lu
GET    /api/provider/notifications/unread-count - Nombre non lues
```

---

## 🗄️ SCHÉMA DE BASE DE DONNÉES ACTUEL

### Tables Existantes
```sql
✅ users                           - Utilisateurs (clients)
✅ user_addresses                  - Adresses de livraison
✅ providers                       - Prestataires de services
✅ categories                      - Catégories de services
✅ services                        - Catalogue des services
✅ provider_services               - Services proposés par prestataires
✅ orders                          - 🔴 Commandes (MODE FIXE actuel)
✅ reviews                         - Avis et évaluations
✅ messages                        - Chat user/provider
✅ location_tracking               - Suivi GPS en temps réel
✅ password_reset_tokens           - Tokens de réinitialisation MDP
✅ oauth_providers                 - Comptes OAuth liés
✅ notifications                   - Notifications (EXISTE DÉJÀ)
```

### Structure de la table `orders` (ACTUELLE)
```sql
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    provider_id INT NULL,                    -- Assigné manuellement/automatiquement
    service_id INT NOT NULL,
    address_id INT NOT NULL,
    status ENUM('pending', 'accepted', 'on_way', 'in_progress', 'completed', 'cancelled'),
    scheduled_at DATETIME NULL,
    accepted_at DATETIME NULL,
    started_at DATETIME NULL,
    completed_at DATETIME NULL,
    price DECIMAL(10, 2) NOT NULL,           -- 🔴 Prix fixe du service
    tip DECIMAL(10, 2) DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL,           -- 🔴 Prix fixe + pourboire
    payment_status ENUM('pending', 'paid', 'refunded'),
    payment_method VARCHAR(50),
    notes TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- FOREIGN KEYS...
);
```

### Structure de la table `services` (ACTUELLE)
```sql
CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image VARCHAR(255),
    price DECIMAL(10, 2) NOT NULL,           -- 🔴 Prix fixe standard
    duration_minutes INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 🔍 ANALYSE DU FLUX ACTUEL (MODE FIXE)

### Parcours Utilisateur
```
1. User parcourt les services (GET /api/services)
2. User sélectionne un service avec PRIX FIXE
3. User crée une commande (POST /api/orders)
   → Données : service_id, address_id, scheduled_at, notes
   → Backend récupère le prix du service : $service['price']
   → Création commande avec status='pending' et price=$service['price']
4. Notification envoyée aux prestataires disponibles
5. Premier prestataire accepte (PATCH /api/provider/orders/{id}/accept)
   → Mise à jour : provider_id, status='accepted'
6. Prestataire démarre (PATCH /api/provider/orders/{id}/start)
7. Prestataire termine (PATCH /api/provider/orders/{id}/complete)
8. User laisse un avis (POST /api/orders/{id}/review)
```

### Parcours Prestataire
```
1. Provider reçoit notification de nouvelle commande
2. Provider consulte les commandes disponibles (GET /api/provider/orders?status=pending)
3. Provider accepte une commande (PATCH /api/provider/orders/{id}/accept)
   → AUCUNE négociation de prix
   → Prix fixé par le service
4. Provider effectue la prestation
5. Provider marque comme terminé
```

---

## 🔴 POINTS CRITIQUES À PRÉSERVER

### 1. Logique Métier dans Order.php
```php
✅ getUserOrders($userId, $status)          - Ne PAS modifier
✅ getProviderOrders($providerId, $status)  - Ne PAS modifier
✅ getPendingOrdersForService($serviceId)   - Ne PAS modifier
✅ getDetailedOrder($orderId)               - Ne PAS modifier
✅ updateStatus($orderId, $status)          - Ne PAS modifier
✅ assignProvider($orderId, $providerId)    - Ne PAS modifier
✅ addTip($orderId, $tip)                   - Ne PAS modifier
```

### 2. Logique Métier dans OrderController.php
```php
✅ create()                                 - 🔴 POINT CRITIQUE
   → Actuellement : récupère $service['price'] et crée la commande
   → À PRÉSERVER tel quel pour le mode fixe
   → Nouveau mode enchères = NOUVELLE méthode/endpoint

✅ index()                                  - Ne PAS modifier
✅ show($id)                                - Ne PAS modifier
✅ cancel($id)                              - Ne PAS modifier
```

### 3. Routes API à Préserver
```
✅ POST /api/orders                         - Mode fixe actuel
   → Ne JAMAIS modifier ce endpoint
   → Nouveau mode = nouveau endpoint (POST /api/orders/bidding)
```

---

## ⚠️ DÉPENDANCES ENTRE ENTITÉS

```
users (1) ───── (N) orders ───── (1) services
                   │
                   │ (1)
                   │
                (0..1) providers
                   │
                   │ (1)
                   │
                (N) reviews
```

### Contraintes d'Intégrité Référentielle
```sql
orders.user_id       → users.id           (ON DELETE CASCADE)
orders.provider_id   → providers.id       (ON DELETE SET NULL)
orders.service_id    → services.id        (ON DELETE RESTRICT)
orders.address_id    → user_addresses.id  (ON DELETE RESTRICT)
```

---

## 🎯 CE QUI DOIT ÊTRE AJOUTÉ (SANS CASSER L'EXISTANT)

### Nouvelles Tables à Créer
```sql
🆕 bids                            - Offres des prestataires
🆕 negotiations                    - Historique des contre-offres
🆕 provider_stats                  - Statistiques prestataires (taux d'acceptation, etc.)
```

### Colonnes à Ajouter (ALTER TABLE)
```sql
-- Table orders
ALTER TABLE orders ADD COLUMN pricing_mode ENUM('fixed', 'bidding') DEFAULT 'fixed';
ALTER TABLE orders ADD COLUMN user_proposed_price DECIMAL(10,2) NULL;
ALTER TABLE orders ADD COLUMN accepted_bid_id INT NULL;
ALTER TABLE orders ADD COLUMN bid_expiry_time TIMESTAMP NULL;

-- Table services
ALTER TABLE services ADD COLUMN allow_bidding BOOLEAN DEFAULT TRUE;
ALTER TABLE services ADD COLUMN min_suggested_price DECIMAL(10,2) NULL;
ALTER TABLE services ADD COLUMN max_suggested_price DECIMAL(10,2) NULL;
```

### Nouveaux Fichiers à Créer
```
🆕 backend/app/models/Bid.php
🆕 backend/app/controllers/BiddingController.php
```

### Nouvelles Routes à Ajouter
```
🆕 POST   /api/orders/bidding              - Créer commande en mode enchères
🆕 GET    /api/orders/{id}/bids            - Liste des offres pour une commande
🆕 POST   /api/bids                        - Créer une offre (prestataire)
🆕 PUT    /api/bids/{id}/accept            - Accepter une offre (utilisateur)
🆕 DELETE /api/bids/{id}                   - Retirer une offre (prestataire)
🆕 GET    /api/provider/available-orders   - Commandes en mode enchères disponibles
🆕 GET    /api/provider/my-bids            - Mes offres actives
```

---

## ✅ GARANTIES DE NON-RÉGRESSION

### Principe 1 : Backward Compatibility
```
✅ pricing_mode DEFAULT 'fixed'            → Commandes existantes = mode fixe
✅ Nouvelles colonnes NULL                 → Pas d'impact sur requêtes existantes
✅ Nouveaux endpoints séparés              → Ancien code fonctionne tel quel
```

### Principe 2 : Progressive Enhancement
```
✅ Mode fixe = comportement par défaut
✅ Mode enchères = opt-in (flag allow_bidding sur services)
✅ Frontend peut choisir quel mode utiliser
```

### Principe 3 : Rollback Facilité
```
✅ Chaque migration a son script de rollback
✅ Backups automatiques avant toute modification
✅ Commits atomiques (1 feature = 1 commit)
```

---

## 📊 MÉTRIQUES ACTUELLES À SURVEILLER

Après migration, ces métriques ne doivent PAS régresser :
```
✅ Temps de réponse POST /api/orders          < 200ms
✅ Taux de succès création commande           > 99%
✅ Nombre de commandes/jour                   (baseline actuelle)
✅ Taux d'acceptation par prestataires        (baseline actuelle)
```

---

## 🚦 ÉTAT ACTUEL DE LA MIGRATION (Mise à jour : 2025-11-19)

### ✅ DÉJÀ RÉALISÉ

1. ✅ **Migration SQL** : Tables créées avec succès
   ```
   ✅ bids                 (0 enregistrements)
   ✅ negotiations         (créée)
   ✅ provider_stats       (créée avec prestataires existants)
   ✅ orders.pricing_mode  (colonne ajoutée, DEFAULT 'fixed')
   ✅ orders.user_proposed_price
   ✅ orders.accepted_bid_id
   ✅ orders.bid_expiry_time
   ✅ services.allow_bidding (DEFAULT TRUE)
   ✅ services.min_suggested_price
   ✅ services.max_suggested_price
   ```

2. ✅ **Modèle Bid.php** : COMPLET (400 lignes)
   - Méthodes : create(), findById(), getByOrderId(), acceptBid(), withdrawBid()
   - Gestion automatique des notifications
   - Mise à jour des statistiques prestataires
   - Transactions sécurisées

3. ✅ **Point d'entrée** : backend/public/index.php
   - Autoloader PSR-4
   - Headers CORS configurés
   - Routing via Router->dispatch()

### 🔄 À RÉALISER

4. 🔄 **Contrôleur BiddingController.php** : À CRÉER
   - createBiddingOrder() - Créer commande en mode enchères
   - getBidsForOrder() - Lister les offres
   - acceptBid() - Accepter une offre (utilisateur)
   - createBid() - Créer une offre (prestataire)
   - withdrawBid() - Retirer une offre

5. 🔄 **Routes** : À ajouter dans routes/api.php
   ```
   POST   /api/orders/bidding              - Créer commande mode enchères
   GET    /api/orders/{id}/bids            - Liste des offres
   POST   /api/bids                        - Créer offre (prestataire)
   PATCH  /api/bids/{id}/accept            - Accepter offre (client)
   DELETE /api/bids/{id}                   - Retirer offre (prestataire)
   GET    /api/provider/available-orders   - Commandes disponibles
   GET    /api/provider/my-bids            - Mes offres actives
   ```

6. 🔄 **Tests** : Scripts de test à créer
   - test-bidding-flow.sh : Test du flux complet enchères
   - test-non-regression.sh : Vérifier que mode fixe fonctionne toujours

7. 🔄 **Frontend** : Adaptation Next.js (après backend validé)
   - Composants pour mode enchères
   - Interface de sélection mode (fixed/bidding)
   - Affichage temps réel des offres

---

## 🎯 PROCHAINE ACTION IMMÉDIATE

**PHASE 2 : Créer BiddingController.php**

Ce contrôleur va utiliser le modèle Bid.php déjà existant et fournir les endpoints API pour :
1. Créer des commandes en mode enchères
2. Gérer les offres (création, liste, acceptation, retrait)
3. Lister les commandes disponibles pour prestataires

**⚠️ RÈGLE D'OR : Si un seul test de non-régression échoue, on rollback immédiatement.**
