# Guide de Test - Authentification Marrakech Services

## ✅ Fonctionnalités Implémentées

- [x] Inscription utilisateur avec validation
- [x] Connexion avec JWT
- [x] Hashage sécurisé des mots de passe (bcrypt cost 12)
- [x] Génération automatique de code de parrainage unique
- [x] Récupération du profil utilisateur
- [x] Vérification de token JWT
- [x] Déconnexion

## 🚀 Démarrage

```bash
# Démarrer Docker
docker-compose -f docker-compose-marrakech.yml up -d

# Attendre 10 secondes que tout soit prêt

# Vérifier que l'API fonctionne
curl http://localhost:8081/health
```

## 📝 Tests de l'API

### 1. Inscription d'un Nouvel Utilisateur

**Endpoint:** `POST /api/register`

```bash
curl -X POST http://localhost:8081/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@marrakech.com",
    "password": "password123",
    "first_name": "Ahmed",
    "last_name": "Benali",
    "phone": "0612345678"
  }'
```

**Réponse Attendue (201):**
```json
{
  "success": true,
  "message": "Inscription réussie",
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
      "id": 4,
      "email": "test@marrakech.com",
      "first_name": "Ahmed",
      "last_name": "Benali",
      "phone": "0612345678",
      "profile_picture_url": null,
      "referral_code": "ABC12XYZ",
      "created_at": "2025-01-13 15:30:45",
      "updated_at": "2025-01-13 15:30:45"
    }
  }
}
```

### 2. Inscription avec Erreurs de Validation

```bash
# Email invalide
curl -X POST http://localhost:8081/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "123",
    "first_name": "Ahmed"
  }'
```

**Réponse Attendue (422):**
```json
{
  "success": false,
  "error": "Erreurs de validation",
  "errors": {
    "email": ["Le champ email doit être un email valide"],
    "password": ["Le champ password doit contenir au moins 6 caractères"],
    "last_name": ["Le champ last_name est requis"]
  }
}
```

### 3. Inscription avec Email Déjà Utilisé

```bash
curl -X POST http://localhost:8081/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@test.com",
    "password": "password123",
    "first_name": "Test",
    "last_name": "User"
  }'
```

**Réponse Attendue (409):**
```json
{
  "success": false,
  "error": "Cet email est déjà utilisé"
}
```

### 4. Connexion avec Email/Mot de Passe

**Endpoint:** `POST /api/login`

```bash
curl -X POST http://localhost:8081/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@test.com",
    "password": "password123"
  }'
```

**Réponse Attendue (200):**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
      "id": 1,
      "email": "user1@test.com",
      "first_name": "Ahmed",
      "last_name": "Benali",
      "phone": "0612345678",
      "referral_code": "AHMED123",
      "created_at": "2025-01-10 10:00:00"
    }
  }
}
```

### 5. Connexion avec Mauvais Mot de Passe

```bash
curl -X POST http://localhost:8081/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@test.com",
    "password": "wrongpassword"
  }'
```

**Réponse Attendue (401):**
```json
{
  "success": false,
  "error": "Email ou mot de passe incorrect"
}
```

### 6. Récupérer le Profil Utilisateur (Authentifié)

**Endpoint:** `GET /api/profile`
**Headers:** `Authorization: Bearer {token}`

```bash
# Remplacer YOUR_TOKEN par le token reçu lors de la connexion
curl -X GET http://localhost:8081/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Réponse Attendue (200):**
```json
{
  "success": true,
  "message": "Profil récupéré",
  "data": {
    "id": 1,
    "email": "user1@test.com",
    "first_name": "Ahmed",
    "last_name": "Benali",
    "phone": "0612345678",
    "referral_code": "AHMED123"
  }
}
```

### 7. Profil Sans Token (Erreur)

```bash
curl -X GET http://localhost:8081/api/profile
```

**Réponse Attendue (401):**
```json
{
  "success": false,
  "error": "Token invalide ou manquant"
}
```

### 8. Profil Avec Token Invalide

```bash
curl -X GET http://localhost:8081/api/profile \
  -H "Authorization: Bearer invalid-token-12345"
```

**Réponse Attendue (401):**
```json
{
  "success": false,
  "error": "Token invalide ou manquant"
}
```

### 9. Vérifier la Validité d'un Token

**Endpoint:** `POST /api/verify-token`

```bash
curl -X POST http://localhost:8081/api/verify-token \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_TOKEN"
  }'
```

**Réponse Si Token Valide (200):**
```json
{
  "success": true,
  "message": "Token valide",
  "data": {
    "valid": true,
    "payload": {
      "user_id": 1,
      "email": "user1@test.com",
      "type": "user",
      "iat": 1705161234,
      "exp": 1705766034
    }
  }
}
```

**Réponse Si Token Invalide (401):**
```json
{
  "success": false,
  "error": "Token invalide ou expiré"
}
```

### 10. Déconnexion

**Endpoint:** `POST /api/logout`

```bash
curl -X POST http://localhost:8081/api/logout
```

**Réponse (200):**
```json
{
  "success": true,
  "message": "Déconnexion réussie"
}
```

## 🔐 Sécurité

### Hashage des Mots de Passe
- Algorithme: **bcrypt**
- Cost: **12** (très sécurisé)
- Le mot de passe en clair n'est jamais stocké

### JWT (JSON Web Token)
- Algorithme: **HS256** (HMAC-SHA256)
- Durée de validité: **7 jours** (604800 secondes)
- Clé secrète: Stockée dans `JWT::$secret`

### Structure du Token JWT
```
Header:
{
  "typ": "JWT",
  "alg": "HS256"
}

Payload:
{
  "user_id": 1,
  "email": "user@example.com",
  "type": "user",
  "iat": 1705161234,  // Issued At
  "exp": 1705766034   // Expiration
}
```

## 📊 Comptes de Test Existants

### Utilisateurs (Base de Données Seed)
```
Email: user1@test.com
Password: password123
Nom: Ahmed Benali

Email: user2@test.com
Password: password123
Nom: Fatima El Amrani

Email: user3@test.com
Password: password123
Nom: Youssef Alaoui
```

## 🧪 Scénario de Test Complet

```bash
# 1. Inscription
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8081/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@test.com",
    "password": "password123",
    "first_name": "Hassan",
    "last_name": "Mansouri",
    "phone": "0623456789"
  }')

echo "=== INSCRIPTION ==="
echo $REGISTER_RESPONSE | json_pp

# 2. Extraire le token
TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo ""
echo "TOKEN: $TOKEN"

# 3. Récupérer le profil avec le token
echo ""
echo "=== PROFIL ==="
curl -s -X GET http://localhost:8081/api/profile \
  -H "Authorization: Bearer $TOKEN" | json_pp

# 4. Connexion
echo ""
echo "=== CONNEXION ==="
curl -s -X POST http://localhost:8081/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@test.com",
    "password": "password123"
  }' | json_pp
```

## 🔍 Vérification en Base de Données

```bash
# Voir tous les utilisateurs
docker-compose -f docker-compose-marrakech.yml exec mysql-db \
  mysql -u marrakech_user -pmarrakech_password marrakech_services \
  -e "SELECT id, email, first_name, last_name, referral_code FROM users;"

# Voir le dernier utilisateur créé
docker-compose -f docker-compose-marrakech.yml exec mysql-db \
  mysql -u marrakech_user -pmarrakech_password marrakech_services \
  -e "SELECT * FROM users ORDER BY id DESC LIMIT 1;"
```

## 🎯 Fonctionnalités du Modèle User

```php
// Méthodes statiques
User::findByEmail($email)        // Trouver par email
User::findById($id)               // Trouver par ID
User::findByReferralCode($code)   // Trouver par code parrainage
User::create($data)               // Créer (hash auto du password)
User::emailExists($email)         // Vérifier si email existe
User::getPublicData($user)        // Retirer password_hash

// Méthodes d'instance
$user->getAddresses($userId)      // Récupérer adresses
$user->getOrders($userId)         // Récupérer commandes
$user->updateUser($id, $data)     // Mettre à jour (hash auto)
```

## 🎯 Fonctionnalités du Helper JWT

```php
JWT::encode($payload)              // Générer un token
JWT::decode($token)                // Décoder et vérifier
JWT::isValid($token)               // Vérifier validité
JWT::getTokenFromHeaders()         // Extraire token des headers
JWT::getPayloadFromHeaders()       // Extraire payload depuis headers
JWT::setSecret($secret)            // Changer la clé secrète
JWT::setExpiration($seconds)       // Changer la durée
```

## ⚠️ Points d'Attention

1. **En production**: Changer `JWT::$secret` dans une variable d'environnement
2. **HTTPS**: En production, utiliser HTTPS pour sécuriser les tokens
3. **Token expiration**: Les tokens expirent après 7 jours
4. **Refresh tokens**: Pour une meilleure UX, implémenter un système de refresh tokens
5. **Blacklist**: Pour une vraie déconnexion, implémenter une blacklist de tokens

## 📚 Prochaines Étapes

1. ✅ Authentification fonctionnelle
2. ⏳ Middleware d'authentification pour protéger les routes
3. ⏳ Upload d'avatar
4. ⏳ Gestion des adresses utilisateur
5. ⏳ Historique des commandes

---

**Documentation créée le** : 2025-01-13
**Version API** : 1.0
**Status** : ✅ Authentification complètement fonctionnelle
