# 💰 Système de Paiement GlamGo - Documentation Complète

## 📋 Vue d'ensemble

Système de paiement en **espèces uniquement** avec :
- ✅ Pourboire flexible (10, 20, 30 MAD ou personnalisé)
- ✅ Commission 20% sur le service (PAS sur le pourboire)
- ✅ Confirmation double (client + prestataire)
- ✅ Historique des paiements et revenus

---

## 🗄️ Base de données

### Table : `payments`

```sql
CREATE TABLE payments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,

  -- Références
  order_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  provider_id BIGINT NOT NULL,

  -- Montants
  service_amount DECIMAL(10,2) NOT NULL,
  tip_amount DECIMAL(10,2) DEFAULT 0.00,
  subtotal DECIMAL(10,2) NOT NULL,

  -- Commission (20% sur service uniquement)
  platform_commission_rate DECIMAL(5,2) DEFAULT 20.00,
  platform_commission DECIMAL(10,2) NOT NULL,

  -- Totaux
  total_amount DECIMAL(10,2) NOT NULL,
  provider_earnings DECIMAL(10,2) NOT NULL,

  -- Paiement
  payment_method ENUM('cash') DEFAULT 'cash',
  payment_status ENUM('pending', 'confirmed', 'disputed', 'refunded'),

  -- Confirmation
  confirmed_by_client BOOLEAN DEFAULT FALSE,
  confirmed_by_provider BOOLEAN DEFAULT FALSE,
  client_confirmed_at TIMESTAMP NULL,
  provider_confirmed_at TIMESTAMP NULL,

  -- Métadonnées
  payment_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Triggers automatiques

Les triggers calculent automatiquement :
- `subtotal` = service_amount + tip_amount
- `platform_commission` = service_amount × 20%
- `total_amount` = subtotal
- `provider_earnings` = (service_amount - commission) + tip_amount

---

## 🎯 Flux de paiement

### Étape 1 : Fin de prestation
1. Le prestataire marque la commande comme "completed"
2. Un bouton "💰 Payer maintenant" apparaît pour le client

### Étape 2 : Page de paiement (`/payment/[orderId]`)
Le client voit :
- 📋 Détails de la commande
- ✨ Interface de sélection de pourboire
  - Boutons : 10 MAD, 20 MAD, 30 MAD
  - Option "Personnalisé"
- 📊 Récapitulatif avec calculs automatiques
- 💵 Mode de paiement (espèces)
- 📝 Instructions de paiement

### Étape 3 : Confirmation
- Client clique sur "Confirmer le paiement"
- Système crée l'enregistrement dans `payments`
- Statut : `pending`

### Étape 4 : Paiement physique
- Client remet l'argent au prestataire
- Prestataire confirme la réception

### Étape 5 : Double confirmation
- Prestataire : clique sur "✅ J'ai reçu le paiement"
- Client : vérifie et confirme
- Statut passe à `confirmed`

---

## 💡 Exemples de calcul

### Exemple 1 : Avec pourboire
```
Service : 150 MAD
Pourboire : 30 MAD

Commission : 150 × 20% = 30 MAD
Total client : 150 + 30 = 180 MAD

Prestataire reçoit : (150 - 30) + 30 = 150 MAD
GlamGo reçoit : 30 MAD
```

### Exemple 2 : Sans pourboire
```
Service : 200 MAD
Pourboire : 0 MAD

Commission : 200 × 20% = 40 MAD
Total client : 200 MAD

Prestataire reçoit : 200 - 40 = 160 MAD
GlamGo reçoit : 40 MAD
```

### Exemple 3 : Pourboire personnalisé
```
Service : 120 MAD
Pourboire : 50 MAD

Commission : 120 × 20% = 24 MAD
Total client : 120 + 50 = 170 MAD

Prestataire reçoit : (120 - 24) + 50 = 146 MAD
GlamGo reçoit : 24 MAD
```

---

## 🔌 API Endpoints (à implémenter côté backend)

### 1. Créer un paiement
```http
POST /api/payments
Authorization: Bearer {token}

Request:
{
  "order_id": 123,
  "service_amount": 150.00,
  "tip_amount": 30.00,
  "payment_method": "cash",
  "payment_notes": "Pourboire de 30 MAD inclus"
}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "order_id": 123,
    "total_amount": 180.00,
    "provider_earnings": 150.00,
    "platform_commission": 30.00,
    "payment_status": "pending"
  }
}
```

### 2. Confirmer paiement (Client)
```http
POST /api/payments/{id}/confirm-client
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Paiement confirmé par le client"
}
```

### 3. Confirmer paiement (Prestataire)
```http
POST /api/payments/{id}/confirm-provider
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Paiement confirmé par le prestataire",
  "data": {
    "payment_status": "confirmed",
    "confirmed_at": "2025-01-22T14:30:00Z"
  }
}
```

### 4. Obtenir paiement par commande
```http
GET /api/payments/order/{orderId}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "service_amount": 150.00,
    "tip_amount": 30.00,
    "total_amount": 180.00,
    "provider_earnings": 150.00,
    "platform_commission": 30.00,
    "payment_status": "confirmed"
  }
}
```

### 5. Historique paiements prestataire
```http
GET /api/payments/provider/history
Authorization: Bearer {provider_token}

Response:
{
  "success": true,
  "data": {
    "payments": [...],
    "total_earnings": 3450.00,
    "total_tips": 450.00,
    "count": 23
  }
}
```

### 6. Statistiques revenus prestataire
```http
GET /api/payments/provider/earnings
Authorization: Bearer {provider_token}

Response:
{
  "success": true,
  "data": {
    "today": 320.00,
    "this_week": 1580.00,
    "this_month": 5240.00,
    "total": 15680.00,
    "tips_total": 1240.00,
    "average_tip": 28.50
  }
}
```

---

## 📱 Interfaces Frontend créées

### 1. Page de paiement client
**Path:** `/payment/[orderId]`
**Fichiers:**
- `src/app/payment/[orderId]/page.js`
- `src/app/payment/[orderId]/page.module.scss`

**Fonctionnalités:**
- ✅ Affichage des détails de commande
- ✅ Sélection de pourboire (4 options)
- ✅ Calculs automatiques en temps réel
- ✅ Récapitulatif détaillé
- ✅ Instructions de paiement claires

### 2. API Client
**Fichier:** `src/lib/apiClient.js`

**Méthodes ajoutées:**
- `createPayment(paymentData)`
- `getPaymentDetails(paymentId)`
- `getPaymentByOrder(orderId)`
- `confirmPaymentByClient(paymentId)`
- `confirmPaymentByProvider(paymentId)`
- `getClientPayments()`
- `getProviderPayments()`
- `getProviderEarnings()`

---

## ✅ TODO Backend

### Priorité 1 : Base de données
- [ ] Exécuter le script `003_create_payments_table.sql`
- [ ] Vérifier que les triggers fonctionnent correctement
- [ ] Tester les calculs automatiques

### Priorité 2 : API Routes
- [ ] Créer le controller `PaymentController.php`
- [ ] Implémenter `POST /api/payments`
- [ ] Implémenter `POST /api/payments/{id}/confirm-client`
- [ ] Implémenter `POST /api/payments/{id}/confirm-provider`
- [ ] Implémenter `GET /api/payments/order/{orderId}`
- [ ] Implémenter `GET /api/payments/provider/history`
- [ ] Implémenter `GET /api/payments/provider/earnings`

### Priorité 3 : Logique métier
- [ ] Vérifier que la commande est `completed` avant paiement
- [ ] Vérifier que la commande n'a pas déjà un paiement
- [ ] Vérifier les permissions (client/prestataire)
- [ ] Envoyer notification email après confirmation
- [ ] Mettre à jour le statut de la commande

### Priorité 4 : Interface prestataire
- [ ] Créer la page de confirmation pour prestataire
- [ ] Ajouter bouton "J'ai reçu le paiement" dans dashboard
- [ ] Afficher les statistiques de revenus
- [ ] Afficher l'historique des pourboires

---

## 🎨 Exemple de flow complet

```
1. Client commande service "Coiffure" → 150 MAD
2. Prestataire accepte et effectue la prestation
3. Prestataire marque "Terminé"
4. Client voit bouton "💰 Payer maintenant"
5. Client va sur /payment/123
6. Client sélectionne pourboire 30 MAD
7. Interface affiche :
   - Service : 150 MAD
   - Pourboire : +30 MAD
   - Total : 180 MAD
   - (Prestataire recevra : 150 MAD)
   - (Commission GlamGo : 30 MAD)
8. Client confirme
9. Client paie 180 MAD en espèces au prestataire
10. Prestataire confirme "J'ai reçu 180 MAD"
11. Système enregistre :
    - total_amount : 180 MAD
    - service_amount : 150 MAD
    - tip_amount : 30 MAD
    - platform_commission : 30 MAD
    - provider_earnings : 150 MAD
    - payment_status : confirmed
12. Email de confirmation envoyé aux deux parties
```

---

## 🔒 Sécurité

- ✅ Vérification du propriétaire de la commande
- ✅ Validation des montants (> 0)
- ✅ Double confirmation requise
- ✅ Logs de toutes les transactions
- ✅ Calculs automatiques (pas de manipulation manuelle)

---

## 📊 Avantages du système

### Pour le client
- ✨ Pourboire flexible et facile
- 💵 Paiement en espèces (pas de frais)
- 📱 Interface claire et simple
- ✅ Confirmation et suivi

### Pour le prestataire
- 💰 100% des pourboires
- 📊 Statistiques de revenus
- 🎯 Motivation à fournir un bon service
- 💳 Pas de frais de transaction

### Pour GlamGo
- 💵 Commission 20% sur service
- 📈 Encourage les bonnes prestations
- 🤝 Bonne relation prestataires
- 📊 Tracking complet

---

## 🚀 Prochaines étapes

1. **Immédiat** : Implémenter les routes API backend
2. **Court terme** : Créer l'interface prestataire
3. **Moyen terme** : Ajouter statistiques et analytics
4. **Long terme** : Intégrer CMI pour paiement carte

---

**Date de création:** 22 janvier 2025
**Version:** 1.0
**Auteur:** GlamGo Development Team
