# 🚀 INSTALLATION SYSTÈME DE PAIEMENT - GUIDE RAPIDE

## ✅ ÉTAPE 1 : EXÉCUTER LA MIGRATION SQL

Vous avez **3 options** pour exécuter la migration :

### Option A : Via Docker MySQL (Recommandé)

Si vous utilisez Docker pour MySQL :

```bash
# Depuis le dossier racine YelabGo
docker exec -i mysql-db mysql -u glamgo_user -pglamgo_password glamgo < backend/database/migrations/008_add_payment_system.sql
```

### Option B : Via MySQL en ligne de commande

Si MySQL est installé localement :

```bash
cd backend
mysql -h localhost -u glamgo_user -pglamgo_password glamgo < database/migrations/008_add_payment_system.sql
```

### Option C : Via phpMyAdmin ou MySQL Workbench

1. Ouvrir phpMyAdmin / MySQL Workbench
2. Se connecter à la base `glamgo`
3. Aller dans l'onglet SQL
4. Copier-coller le contenu de `backend/database/migrations/008_add_payment_system.sql`
5. Exécuter

---

## ✅ ÉTAPE 2 : VÉRIFIER LA MIGRATION

Connectez-vous à MySQL et vérifiez :

```sql
-- Vérifier nouvelles tables
SHOW TABLES LIKE '%payment%';
-- Résultat attendu : transactions, payment_methods, payment_logs, payment_config

-- Vérifier colonnes users
DESCRIBE users;
-- Doit contenir : payment_method_validated, card_last4, card_brand, card_token

-- Vérifier colonnes providers
DESCRIBE providers;
-- Doit contenir : bank_account_iban, bank_name, bank_account_validated

-- Vérifier config
SELECT * FROM payment_config;
```

---

## ✅ ÉTAPE 3 : CRÉER LE DOSSIER LOGS

```bash
# Depuis le dossier backend
mkdir logs
chmod 755 logs
```

Ou sur Windows :
```cmd
cd backend
mkdir logs
```

---

## ✅ ÉTAPE 4 : DÉMARRER LE SERVEUR BACKEND

```bash
# Si vous utilisez PHP en local
cd backend/public
php -S localhost:8080

# Ou via Docker
docker-compose up backend
```

---

## ✅ ÉTAPE 5 : DÉMARRER LE FRONTEND

```bash
cd frontend
npm install  # Si pas encore fait
npm run dev
```

Le frontend sera accessible sur `http://localhost:3000`

---

## ✅ ÉTAPE 6 : TESTER LE SYSTÈME

### 1. Page de démonstration

Ouvrir dans le navigateur :
```
http://localhost:3000/payment-demo
```

### 2. Tester validation carte

Utiliser les données de test :
- **Numéro carte :** `4242 4242 4242 4242`
- **Expiration :** N'importe quelle date future (ex: 12/2025)
- **CVV :** `123`

### 3. Dashboard admin

Ouvrir dans le navigateur :
```
http://localhost:8080/admin/transactions.php
```

---

## 🧪 SCÉNARIOS DE TEST

### Test 1 : Client enregistre sa carte

1. Aller sur `/payment-demo`
2. Sélectionner "Client"
3. Remplir formulaire CB avec carte test
4. Cliquer "Valider ma carte"
5. **Résultat attendu :** Message de succès avec derniers 4 chiffres

### Test 2 : Prestataire enregistre CB + IBAN

1. Aller sur `/payment-demo`
2. Sélectionner "Prestataire"
3. Remplir formulaire CB
4. Cliquer "Valider ma carte"
5. Remplir IBAN (format : `MA` + 24 chiffres)
6. Sélectionner banque
7. Cliquer "Enregistrer mon IBAN"
8. **Résultat attendu :** Double validation réussie

### Test 3 : Sélection mode paiement

1. Aller sur onglet "2. Sélection Paiement"
2. Voir les 2 options : CB et Cash
3. Cliquer sur chaque option
4. **Résultat attendu :** Commission 20% affichée clairement

---

## 🔍 VÉRIFIER LES LOGS

### Logs fichiers

```bash
# Voir les logs du jour
cat backend/logs/payments_$(date +%Y-%m-%d).log

# Ou sur Windows
type backend\logs\payments_2025-11-24.log
```

### Logs base de données

```sql
-- 20 derniers événements
SELECT * FROM payment_logs
ORDER BY created_at DESC
LIMIT 20;
```

---

## 📊 DASHBOARD ADMIN

Le dashboard admin affiche :

✅ **Statistiques globales**
- Total transactions
- Volume total (MAD)
- Commission GlamGo
- Montant prestataires

✅ **Filtres**
- Par statut (completed, pending, failed)
- Par méthode (card, cash)
- Par période (aujourd'hui, 7j, 30j)

✅ **Liste complète**
- Toutes les transactions avec détails
- Client, prestataire, service
- Montants, commission, statut

---

## ⚠️ TROUBLESHOOTING

### Erreur : "Table 'transactions' doesn't exist"

➡️ La migration n'a pas été exécutée. Reprendre ÉTAPE 1.

### Erreur : "Access denied for user"

➡️ Vérifier les credentials MySQL dans `backend/.env`

### Erreur : "Cannot write to logs directory"

➡️ Créer le dossier et donner les permissions :
```bash
mkdir backend/logs
chmod 755 backend/logs
```

### Frontend ne charge pas les composants

➡️ Vérifier que les composants existent :
```bash
ls frontend/src/components/PaymentMethodSetup/
ls frontend/src/components/PaymentSelector/
```

### Backend retourne 404 sur routes paiement

➡️ Vérifier que les routes sont bien dans `backend/routes/api.php`
```bash
grep -A 5 "ROUTES SYSTÈME DE PAIEMENT" backend/routes/api.php
```

---

## 📝 CHECKLIST FINALE

Avant de valider l'installation, vérifier :

- [ ] Migration SQL exécutée avec succès
- [ ] Tables créées (transactions, payment_methods, payment_logs, payment_config)
- [ ] Colonnes ajoutées à users et providers
- [ ] Dossier logs/ créé
- [ ] Backend démarre sans erreur
- [ ] Frontend démarre sans erreur
- [ ] Page `/payment-demo` accessible
- [ ] Dashboard admin `/admin/transactions.php` accessible
- [ ] Test validation carte fonctionne
- [ ] Logs écrits dans fichiers
- [ ] Logs écrits dans DB

---

## 🎉 C'EST PRÊT !

Si tous les tests passent, le système de paiement est opérationnel !

**Prochaines étapes :**

1. Intégrer les composants dans vos vraies pages d'inscription
2. Tester des paiements réels via l'app
3. Consulter régulièrement le dashboard admin
4. Préparer l'intégration CMI pour la production

---

## 📞 SUPPORT

En cas de problème, vérifier dans l'ordre :

1. **Logs backend :** `backend/logs/payments_*.log`
2. **Logs DB :** Table `payment_logs`
3. **Console navigateur :** F12 > Console
4. **Variables env :** `backend/.env`

---

**Date :** 2025-11-24
**Version :** 1.0.0 MOCK
**Auteur :** Claude Code
