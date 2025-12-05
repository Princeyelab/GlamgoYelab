# 🧪 GUIDE DE TEST COMPLET - GlamGo

Guide pas à pas pour tester l'ensemble du système GlamGo.

---

## 📋 PRÉPARATION

### Vérifier que tout est lancé

```bash
# Backend + MySQL + Nginx
cd C:\Dev\YelabGo
docker-compose ps

# Frontend Next.js
cd frontend
npm run dev
```

✅ Backend : http://localhost:8080/api/health
✅ Frontend : http://localhost:3000

---

## 👤 ÉTAPE 1 : CRÉER UN COMPTE CLIENT

### 1.1 Inscription Client

🔗 URL : http://localhost:3000/register

**Remplir le formulaire :**
- Prénom : `Ahmed`
- Nom : `Bennani`
- Email : `ahmed.test@glamgo.ma`
- Téléphone : `0612345678`
- WhatsApp : `0612345678` (optionnel)
- Adresse : Cliquer sur la carte pour sélectionner
- Ville : `Marrakech`
- Mot de passe : `password123`
- Confirmer : `password123`
- ✅ Accepter les CGU

**Résultat attendu :**
- ✅ Message de succès
- ✅ Redirection vers `/onboarding/client`

### 1.2 Onboarding Client

🔗 URL : http://localhost:3000/onboarding/client

**Étape 1 - Adresse :**
- Sélectionner votre adresse sur la carte (GPS obligatoire)
- Rayon de recherche : 10 km (par défaut)
- Cliquer sur "Suivant"

**Étape 2 - Services :**
- Sélectionner au moins 1 service (ex: Coiffure)
- Mode de paiement : Carte bancaire ou Espèces
- Cliquer sur "Suivant"

**Étape 3 - Validation :**
- ✅ Accepter les CGU
- ✅ Accepter la Politique de confidentialité
- Cliquer sur "Terminer mon inscription"

**Résultat attendu :**
- ✅ Message de succès
- ✅ Redirection vers `/` (page d'accueil)
- ✅ Popup de bienvenue

---

## 🔧 ÉTAPE 2 : CRÉER UN COMPTE PRESTATAIRE

### 2.1 Inscription Prestataire

🔗 URL : http://localhost:3000/provider/register

**Remplir le formulaire :**
- Prénom : `Fatima`
- Nom : `Alaoui`
- Email : `fatima.pro@glamgo.ma`
- Téléphone : `0687654321`
- WhatsApp : `0687654321`
- CIN : `AB123456`
- Date de naissance : `01/01/1990`
- Adresse : Cliquer sur la carte
- Ville : `Marrakech`
- Mot de passe : `password123`
- Confirmer : `password123`
- ✅ Accepter les CGU

**Résultat attendu :**
- ✅ Redirection vers `/provider/onboarding`

### 2.2 Onboarding Prestataire

🔗 URL : http://localhost:3000/provider/onboarding

**Étape 1 - Zone d'intervention :**
- Cliquer sur la carte pour définir votre centre
- Rayon d'intervention : 15 km (par défaut)
- Cliquer sur "Suivant"

**Étape 2 - Services et Formules :**
- Sélectionner au moins 1 service
- Cocher au moins 1 formule (Standard, Récurrent, etc.)
- Cliquer sur "Suivant"

**Étape 3 - Documents :**
- Numéro CIN : `AB123456`
- ✅ Accepter la Charte Prestataire
- Cliquer sur "Terminer l'inscription"

**Résultat attendu :**
- ✅ Message "Questionnaire soumis ! Votre compte sera activé après validation"
- ✅ Redirection vers `/provider/dashboard`
- ✅ Statut : **"En attente de validation"** (pending)

### 2.3 Activer le Prestataire (Admin)

Pour tester, vous devez activer manuellement le prestataire :

```bash
# Ouvrir MySQL
docker exec -it glamgo-mysql mysql -uglamgo_user -pglamgo_password glamgo

# Activer le prestataire
UPDATE providers
SET account_status = 'active', is_available = TRUE
WHERE email = 'fatima.pro@glamgo.ma';

# Quitter MySQL
exit
```

**Vérifier dans le dashboard prestataire :**
- Actualiser la page `/provider/dashboard`
- ✅ Statut devrait être "Actif"

---

## 📦 ÉTAPE 3 : CRÉER UNE COMMANDE

### 3.1 Se connecter en tant que Client

🔗 URL : http://localhost:3000/login

- Email : `ahmed.test@glamgo.ma`
- Mot de passe : `password123`

### 3.2 Créer une commande

🔗 URL : http://localhost:3000/

1. **Parcourir les services**
   - Cliquer sur une catégorie (ex: Coiffure)
   - Sélectionner un service (ex: "Coupe classique homme")

2. **Remplir le formulaire de commande**
   - Date : Aujourd'hui ou demain
   - Heure : Dans quelques heures
   - Adresse : Votre adresse enregistrée
   - Notes (optionnel) : "Test de commande"
   - Cliquer sur "Commander"

3. **Système d'enchères (si activé)**
   - Les prestataires disponibles reçoivent la notification
   - Ils peuvent proposer un prix

**Résultat attendu :**
- ✅ Commande créée avec statut `pending`
- ✅ Notification envoyée aux prestataires
- ✅ Redirection vers `/orders/[ORDER_ID]`

### 3.3 Noter l'ORDER_ID

📝 **Important :** Notez l'ID de votre commande dans l'URL :
```
http://localhost:3000/orders/[ORDER_ID]
            Exemple : http://localhost:3000/orders/123
```

Vous en aurez besoin pour tester le paiement !

---

## 👨‍🔧 ÉTAPE 4 : ACCEPTER LA COMMANDE (PRESTATAIRE)

### 4.1 Se connecter en tant que Prestataire

🔗 URL : http://localhost:3000/provider/login

- Email : `fatima.pro@glamgo.ma`
- Mot de passe : `password123`

### 4.2 Voir les commandes disponibles

🔗 URL : http://localhost:3000/provider/dashboard

- Onglet : **"Disponibles"**
- Vous devriez voir la commande créée

### 4.3 Accepter la commande

1. Cliquer sur **"Voir"** ou **"Accepter"**
2. Confirmer l'acceptation
3. La commande passe au statut `accepted`

### 4.4 Simuler la complétion

Quand vous êtes "arrivé" chez le client :

1. **Confirmer l'arrivée**
   - Statut → `in_progress`

2. **Marquer comme complété**
   - Cliquer sur "Marquer comme terminé"
   - Ajouter une note (optionnel)
   - Statut → `completed`

**Résultat attendu :**
- ✅ Statut de la commande : `completed`
- ✅ Client peut maintenant payer

---

## 💳 ÉTAPE 5 : TESTER LE PAIEMENT

### 5.1 Accéder à la page de paiement

🔗 URL : http://localhost:3000/payment/[ORDER_ID]
```
Remplacez [ORDER_ID] par votre ID de commande
Exemple : http://localhost:3000/payment/123
```

**Vérifications initiales :**
- ✅ Récapitulatif de la commande affiché
- ✅ Montant total visible
- ✅ Deux options : Carte bancaire / Espèces

---

## 💵 TEST A : PAIEMENT EN ESPÈCES

### A.1 Sélectionner "Espèces"

1. Cliquer sur le bouton **"💵 Espèces"**
2. Le formulaire d'espèces s'affiche

### A.2 Ajouter un pourboire (optionnel)

Options disponibles :
- 5% (recommandé)
- 10%
- 15%
- Montant personnalisé

### A.3 Confirmer le paiement

1. Cliquer sur **"Confirmer le paiement en espèces"**
2. Une confirmation apparaît

**Résultat attendu :**
- ✅ Message de succès
- ✅ Statut commande → `pending_payment` (en attente confirmation prestataire)
- ✅ Transaction créée avec `payment_method = 'cash'`

### A.4 Confirmer côté prestataire

1. Se connecter sur `/provider/dashboard`
2. Aller dans l'onglet **"En cours"**
3. Cliquer sur **"Confirmer réception espèces"**

**Résultat attendu :**
- ✅ Statut transaction → `completed`
- ✅ Statut commande → `paid`
- ✅ Montant transféré au prestataire (80% après commission)

---

## 💳 TEST B : PAIEMENT PAR CARTE

### B.1 Sélectionner "Carte bancaire"

1. Cliquer sur le bouton **"💳 Carte bancaire"**

### B.2 Ajouter une carte (si première fois)

**Si aucune carte enregistrée :**

Formulaire d'ajout de carte s'affiche :

**🧪 CARTE DE TEST (100% succès) :**
```
Numéro : 4242 4242 4242 4242
Mois   : 12
Année  : 2025
CVV    : 123
```

1. Remplir le formulaire avec la carte de test
2. Cliquer sur **"Enregistrer la carte"**

**Résultat attendu :**
- ✅ Message "Carte validée avec succès"
- ✅ Carte enregistrée et affichée (4 derniers chiffres)

**Note :** Autres cartes ont un taux de succès de 80% (mode MOCK aléatoire)

### B.3 Ajouter un pourboire (optionnel)

Même options que pour les espèces :
- 5%, 10%, 15%, ou montant personnalisé

### B.4 Payer avec la carte

1. Vérifier le montant total (service + pourboire)
2. Cliquer sur **"Payer XXX MAD"**
3. Attendre le traitement (simulation 500ms)

**Résultat attendu :**
- ✅ Message "Paiement effectué avec succès"
- ✅ Transaction créée avec `payment_method = 'card'`
- ✅ Statut transaction → `completed` (immédiat)
- ✅ Statut commande → `paid`
- ✅ Commission GlamGo (20%) calculée
- ✅ Montant prestataire (80%) calculé

---

## 🔍 ÉTAPE 6 : VÉRIFICATIONS

### 6.1 Vérifier dans l'interface Client

🔗 URL : http://localhost:3000/orders/[ORDER_ID]

**Vérifications :**
- ✅ Statut : "Payé" ou "Terminé"
- ✅ Badge de paiement vert
- ✅ Montant payé affiché
- ✅ Pourboire visible (si ajouté)
- ✅ Possibilité de laisser un avis

### 6.2 Vérifier dans le Dashboard Prestataire

🔗 URL : http://localhost:3000/provider/dashboard

**Onglet "Historique" :**
- ✅ Commande visible avec badge "Payé"
- ✅ Montant reçu affiché (après commission)
- ✅ Si pourboire : montant inclus

**Section Gains (si implémentée) :**
- ✅ Gains totaux mis à jour
- ✅ Commission GlamGo visible

### 6.3 Vérifier dans la Base de Données

```bash
docker exec -it glamgo-mysql mysql -uglamgo_user -pglamgo_password glamgo
```

**Commande de vérification :**

```sql
-- Voir la commande
SELECT id, status, total_price, payment_status
FROM orders
WHERE id = [ORDER_ID];

-- Voir la transaction
SELECT
    id,
    order_id,
    amount,
    tip_amount,
    total_amount,
    payment_method,
    status,
    provider_amount,
    platform_commission
FROM transactions
WHERE order_id = [ORDER_ID];

-- Voir la carte enregistrée (client)
SELECT card_last4, card_brand, is_default
FROM payment_methods
WHERE user_id = (SELECT id FROM users WHERE email = 'ahmed.test@glamgo.ma');
```

**Résultats attendus :**

**Table `orders` :**
- `status` : `completed` ou `paid`
- `payment_status` : `paid`
- `total_price` : Montant du service

**Table `transactions` :**
- `amount` : Prix du service
- `tip_amount` : Montant du pourboire (si ajouté)
- `total_amount` : amount + tip_amount
- `payment_method` : `card` ou `cash`
- `status` : `completed`
- `provider_amount` : 80% du total
- `platform_commission` : 20% du total

---

## 🎯 SCÉNARIOS DE TEST SUPPLÉMENTAIRES

### Scénario 1 : Pourboires variables

- Test avec 5% de pourboire
- Test avec 10% de pourboire
- Test avec montant personnalisé (ex: 50 MAD)

### Scénario 2 : Multiple cartes

- Ajouter 2-3 cartes différentes
- Vérifier qu'une seule est "par défaut"
- Tester le paiement avec chaque carte

### Scénario 3 : Échec de paiement carte

- Utiliser une carte aléatoire (pas 4242...)
- Si échec (20% de chance) : message d'erreur
- Réessayer avec la carte de test

### Scénario 4 : Confirmation tardive espèces

- Payer en espèces
- Attendre 5-10 minutes
- Prestataire confirme la réception
- Vérifier que tout fonctionne

---

## 📊 TABLEAU DE BORD - CHECKLIST COMPLÈTE

### ✅ Inscription et Onboarding
- [ ] Client peut s'inscrire
- [ ] Client complète l'onboarding avec GPS
- [ ] Prestataire peut s'inscrire
- [ ] Prestataire complète l'onboarding
- [ ] Prestataire est activé (manuellement)

### ✅ Commandes
- [ ] Client peut créer une commande
- [ ] Prestataire reçoit la notification
- [ ] Prestataire peut accepter
- [ ] Prestataire peut marquer comme complété

### ✅ Paiement Espèces
- [ ] Option espèces disponible
- [ ] Pourboire ajouté correctement
- [ ] Transaction créée avec statut `pending_payment`
- [ ] Prestataire peut confirmer réception
- [ ] Transaction passe à `completed`

### ✅ Paiement Carte
- [ ] Carte de test fonctionne à 100%
- [ ] Carte enregistrée visible
- [ ] Pourboire ajouté correctement
- [ ] Paiement traité immédiatement
- [ ] Transaction `completed` instantanément

### ✅ Commissions et Transferts
- [ ] Commission GlamGo calculée (20%)
- [ ] Montant prestataire correct (80%)
- [ ] Pourboire inclus dans le calcul
- [ ] Gains prestataire mis à jour

### ✅ Notifications et UI
- [ ] Messages de succès affichés
- [ ] Erreurs gérées correctement
- [ ] Badges de statut corrects
- [ ] Historique mis à jour

---

## 🐛 DÉBOGAGE

### Si ça ne fonctionne pas :

#### 1. Vérifier les logs backend

```bash
docker logs glamgo-php --tail=50
```

#### 2. Vérifier les logs frontend

Ouvrir la **Console Chrome** (F12) et chercher les erreurs

#### 3. Vérifier l'authentification

```javascript
// Dans la console Chrome
console.log('Token:', localStorage.getItem('token'));
console.log('Provider Token:', localStorage.getItem('provider_token'));
console.log('User:', localStorage.getItem('user'));
```

#### 4. Vérifier la base de données

```sql
-- Vérifier que les tables existent
SHOW TABLES LIKE '%payment%';
SHOW TABLES LIKE '%transaction%';

-- Voir les dernières transactions
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 5;
```

---

## 📞 CONTACTS ET RESSOURCES

**Documentation :**
- Backend : `C:\Dev\YelabGo\backend\API.md`
- Paiement : `C:\Dev\YelabGo\frontend\SYSTEME-PAIEMENT.md`

**URLs importantes :**
- Frontend : http://localhost:3000
- Backend API : http://localhost:8080/api
- API Health : http://localhost:8080/api/health

**Données de test :**
- Client : `ahmed.test@glamgo.ma` / `password123`
- Prestataire : `fatima.pro@glamgo.ma` / `password123`
- Carte test : `4242 4242 4242 4242` (CVV: 123)

---

## ✨ FÉLICITATIONS !

Si tous les tests passent, votre système GlamGo est **opérationnel** ! 🎉

**Prochaines étapes (production) :**
1. Intégrer un vrai processeur de paiement (CMI/Stripe)
2. Mettre en place les notifications push
3. Activer le système de validation admin des prestataires
4. Configurer les webhooks de paiement
5. Tester en conditions réelles

**Bon courage ! 🚀**
