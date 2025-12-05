# 💳 SYSTÈME DE PAIEMENT GLAMGO - GUIDE COMPLET

## 📋 Vue d'ensemble

Le système de paiement GlamGo implémente:
- ✅ Validation carte bancaire (clients + prestataires)
- ✅ Enregistrement IBAN prestataires
- ✅ Traitement paiements CB + Cash
- ✅ Commission fixe 20% sur toutes les transactions
- ✅ Mode MOCK pour développement (80% succès, 15% refus, 5% erreur)
- ✅ Logs complets pour audit
- ✅ Dashboard admin des transactions

---

## 🚀 INSTALLATION ET DÉMARRAGE

### 1. Exécuter la migration SQL

```bash
# Se connecter à MySQL
mysql -u glamgo_user -p glamgo

# Exécuter la migration
source backend/database/migrations/008_add_payment_system.sql
```

Ou via le script PHP :

```bash
cd backend
php -r "
require_once 'app/core/Database.php';
\$db = App\Core\Database::getInstance();
\$sql = file_get_contents('database/migrations/008_add_payment_system.sql');
\$db->exec(\$sql);
echo 'Migration 008 exécutée avec succès!';
"
```

### 2. Vérifier les variables d'environnement

Fichier `backend/.env` :

```env
# Passerelle de paiement (MOCK pour développement)
PAYMENT_GATEWAY_MODE=mock
PAYMENT_GATEWAY_API_KEY=mock_api_key_glamgo_dev
PAYMENT_GATEWAY_SECRET=mock_secret_glamgo_dev
PAYMENT_GATEWAY_URL=https://api-mock.glamgo.ma

# Configuration paiement
PAYMENT_COMMISSION_RATE=0.20
PAYMENT_MIN_AMOUNT=50.00
PAYMENT_MAX_AMOUNT=10000.00
```

### 3. Créer le dossier logs

```bash
mkdir backend/logs
chmod 755 backend/logs
```

### 4. Tester le système

**Page de démonstration frontend :**
```
http://localhost:3000/payment-demo
```

**Dashboard admin transactions :**
```
http://localhost:8080/admin/transactions.php
```

---

## 🎮 UTILISATION DES COMPOSANTS

### 1. PaymentMethodSetup - Validation CB

```jsx
import PaymentMethodSetup from '@/components/PaymentMethodSetup';

<PaymentMethodSetup
  userType="client"  // ou "provider"
  skipable={false}   // peut-on sauter cette étape?
  onSuccess={(data) => {
    console.log('Carte validée:', data);
    // data = { payment_method_id, card_last4, card_brand, is_mock }
  }}
/>
```

### 2. PaymentSelector - Choix CB/Cash

```jsx
import PaymentSelector from '@/components/PaymentSelector';

<PaymentSelector
  totalPrice={250}
  defaultMethod="card"
  onSelect={(method) => {
    console.log('Méthode sélectionnée:', method); // "card" ou "cash"
  }}
/>
```

---

## 🔌 API ENDPOINTS

### Client - Paiement

#### Valider carte bancaire
```http
POST /api/payment/validate-card
Authorization: Bearer {token}
Content-Type: application/json

{
  "card_number": "4242424242424242",
  "card_exp_month": 12,
  "card_exp_year": 2025,
  "card_cvv": "123"
}
```

**Réponse (succès) :**
```json
{
  "success": true,
  "message": "Carte validée avec succès",
  "data": {
    "payment_method_id": 1,
    "card_last4": "4242",
    "card_brand": "Visa",
    "is_mock": true
  }
}
```

#### Traiter un paiement
```http
POST /api/payment/process
Authorization: Bearer {token}

{
  "order_id": 42,
  "payment_method": "card"  // ou "cash"
}
```

#### Liste des méthodes de paiement
```http
GET /api/payment/methods
Authorization: Bearer {token}
```

#### Historique transactions
```http
GET /api/payment/transactions
Authorization: Bearer {token}
```

### Prestataire - Paiement

#### Enregistrer IBAN
```http
POST /api/provider/payment/bank-account
Authorization: Bearer {token}

{
  "iban": "MA0000000000000000000000",
  "bank_name": "Attijariwafa Bank"
}
```

#### Récupérer gains
```http
GET /api/provider/payment/earnings
Authorization: Bearer {token}
```

---

## 📊 SCÉNARIOS MOCK (DÉVELOPPEMENT)

Le système MOCK simule 3 scénarios :

### ✅ Succès (80% des cas)
- Carte tokenisée avec succès
- Paiement effectué immédiatement
- Transaction marquée "completed"

**Carte de test :** `4242 4242 4242 4242`

### ❌ Carte refusée (15% des cas)
Erreurs possibles :
- "Carte expirée"
- "Fonds insuffisants"
- "Carte désactivée par la banque"
- "CVV incorrect"

### ⚠️ Erreur technique (5% des cas)
- "Connexion à la banque impossible"
- "Timeout réseau"
- "Service temporairement indisponible"

---

## 💰 COMMISSION GLAMGO (20%)

### Exemple de calcul

**Prestation :** 250 MAD
- **Commission GlamGo (20%) :** 50 MAD
- **Montant prestataire (80%) :** 200 MAD
- **Client paie :** 250 MAD

### Mode Paiement

| Méthode | Instant | Commission | Note |
|---------|---------|------------|------|
| **Carte bancaire** | ✅ Oui | Prélevée immédiatement | Transaction "completed" |
| **Espèces** | ❌ Non | Prélevée à la validation | Transaction "pending" |

---

## 📝 LOGS ET AUDIT

### Fichiers logs

Tous les événements sont enregistrés dans :
```
backend/logs/payments_YYYY-MM-DD.log
```

Format JSON :
```json
{
  "timestamp": "2025-11-24 14:32:15",
  "event": "payment_success",
  "data": {
    "transaction_id": 42,
    "amount": 250,
    "order_id": 123
  },
  "ip": "192.168.1.1",
  "user_agent": "Mozilla/5.0..."
}
```

### Base de données

Table `payment_logs` :
- Tous les événements avec détails complets
- Données sanitisées (pas de numéros CB complets)
- Requête/réponse passerelle
- Codes d'erreur

### Alertes admin

Fichier spécial pour erreurs critiques :
```
backend/logs/alerts_YYYY-MM-DD.log
```

---

## 🔐 SÉCURITÉ

### ✅ Bonnes pratiques implémentées

1. **Tokenisation cartes**
   - Numéros CB jamais stockés en clair
   - Tokens sécurisés via passerelle
   - Empreinte SHA-256 pour détecter doublons

2. **Logs sanitisés**
   - CVV jamais enregistré
   - Numéros CB masqués (****4242)
   - IBAN masqués dans logs

3. **Validation stricte**
   - Algorithme Luhn sur numéros CB
   - Format IBAN Maroc (MA + 24 chiffres)
   - Expiration vérifiée

4. **HTTPS**
   - Obligatoire même en dev
   - Headers sécurisés
   - Tokens JWT

---

## 🐛 DEBUGGING

### Vérifier si migration OK

```sql
-- Vérifier tables créées
SHOW TABLES LIKE '%payment%';

-- Vérifier colonnes users
DESCRIBE users;

-- Vérifier colonnes providers
DESCRIBE providers;

-- Voir config paiement
SELECT * FROM payment_config;
```

### Tester PaymentGateway

```php
<?php
require_once 'app/helpers/PaymentGateway.php';

use App\Helpers\PaymentGateway;

// Test tokenisation
$result = PaymentGateway::tokenizeCard([
    'card_number' => '4242424242424242',
    'exp_month' => 12,
    'exp_year' => 2025,
    'cvv' => '123'
]);

var_dump($result);
```

### Logs en temps réel

```bash
# Suivre logs paiements
tail -f backend/logs/payments_$(date +%Y-%m-%d).log | jq '.'

# Voir erreurs uniquement
tail -f backend/logs/payments_$(date +%Y-%m-% d).log | jq 'select(.data.error != null)'
```

---

## 🔄 MIGRATION VERS CMI (PRODUCTION)

### 1. Obtenir accès CMI

- Contacter CMI Maroc
- Obtenir clés API
- Configurer compte marchand

### 2. Modifier `.env`

```env
PAYMENT_GATEWAY_MODE=production
PAYMENT_GATEWAY_API_KEY=your_cmi_api_key
PAYMENT_GATEWAY_SECRET=your_cmi_secret
PAYMENT_GATEWAY_URL=https://api.cmi.co.ma
```

### 3. Implémenter méthodes CMI

Fichier `backend/app/helpers/PaymentGateway.php` :

```php
private static function cmiTokenizeCard($card_data)
{
    // Implémenter vraie intégration CMI
    // Documentation : https://cmi.co.ma/docs/api
}

private static function cmiCharge($payment_data)
{
    // Implémenter charge CMI
}
```

### 4. Tester en sandbox

```env
PAYMENT_GATEWAY_MODE=sandbox
PAYMENT_GATEWAY_URL=https://sandbox.cmi.co.ma
```

---

## 📚 RESSOURCES

### Fichiers backend

```
backend/
├── database/migrations/008_add_payment_system.sql
├── app/
│   ├── controllers/PaymentController.php
│   └── helpers/
│       ├── PaymentGateway.php
│       └── PaymentLogger.php
├── routes/api.php (routes paiement ajoutées)
└── public/admin/transactions.php
```

### Fichiers frontend

```
frontend/
├── src/
│   ├── components/
│   │   ├── PaymentMethodSetup/
│   │   └── PaymentSelector/
│   ├── app/payment-demo/
│   └── lib/api.js (méthodes génériques ajoutées)
```

### Documentation

- [CMI Documentation](https://cmi.co.ma/docs)
- [Stripe Maroc](https://stripe.com/docs)
- [PCI DSS Compliance](https://www.pcisecuritystandards.org/)

---

## ✅ CHECKLIST DÉPLOIEMENT

Avant de passer en production :

- [ ] Migration SQL exécutée
- [ ] Variables `.env` configurées
- [ ] Dossier `logs/` créé avec permissions
- [ ] Tests MOCK effectués
- [ ] Intégration CMI configurée
- [ ] Tests en sandbox CMI effectués
- [ ] HTTPS activé
- [ ] Certificat SSL valide
- [ ] Backups DB configurés
- [ ] Monitoring logs activé
- [ ] Alertes admin configurées
- [ ] Documentation équipe complétée

---

## 🆘 SUPPORT

En cas de problème :

1. **Vérifier logs**
   ```bash
   tail -100 backend/logs/payments_$(date +%Y-%m-%d).log
   ```

2. **Vérifier table payment_logs**
   ```sql
   SELECT * FROM payment_logs ORDER BY created_at DESC LIMIT 20;
   ```

3. **Dashboard admin**
   http://localhost:8080/admin/transactions.php

4. **Mode debug**
   ```env
   APP_DEBUG=true
   ```

---

**Version :** 1.0.0 MOCK
**Date :** 2025-11-24
**Auteur :** Claude Code
