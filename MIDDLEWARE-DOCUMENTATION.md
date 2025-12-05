# AuthMiddleware - Documentation Complète

## 📦 Fichiers Créés/Modifiés

### Phase 2 - Middleware & Protection des Routes

#### 1. Middleware (`app/middleware/AuthMiddleware.php`)

**Lignes de code:** ~100

**Méthodes implémentées:**

```php
// Méthodes publiques
AuthMiddleware->handle(): bool                  // Vérifie l'authentification
AuthMiddleware::user(): ?array                  // Récupère l'utilisateur authentifié
AuthMiddleware::payload(): ?array               // Récupère le payload JWT
AuthMiddleware::check(): bool                   // Vérifie si l'utilisateur est authentifié
AuthMiddleware::id(): ?int                      // Récupère l'ID de l'utilisateur

// Méthodes privées
unauthorized(string $message): void             // Retourne une erreur 401
```

**Fonctionnalités:**
- ✅ Extraction automatique du token JWT depuis les headers
- ✅ Validation de la signature et de l'expiration du token
- ✅ Vérification de l'existence de l'utilisateur en base
- ✅ Stockage des informations utilisateur dans `$GLOBALS`
- ✅ Retour automatique d'erreurs 401 avec messages clairs
- ✅ Méthodes statiques pour accéder à l'utilisateur depuis les contrôleurs

---

#### 2. Router avec Support Middleware (`core/Router.php`)

**Modifications apportées:**

```php
// Signature modifiée de add()
public function add(
    string $method,
    string $uri,
    string $controller,
    string $action = 'index',
    array $middleware = []        // NOUVEAU paramètre
): void

// Signatures modifiées des shortcuts
public function get(..., array $middleware = []): void
public function post(..., array $middleware = []): void
public function put(..., array $middleware = []): void
public function delete(..., array $middleware = []): void

// Méthode dispatch() modifiée
private function dispatch(
    string $controllerName,
    string $action,
    array $params = [],
    array $middleware = []         // NOUVEAU paramètre
): void
```

**Logique d'exécution du middleware:**

1. Pour chaque middleware spécifié dans la route :
   - Instancier la classe du middleware
   - Appeler la méthode `handle()`
   - Si `handle()` retourne `false`, stopper l'exécution
   - Si `handle()` retourne `true`, continuer

2. Si tous les middleware passent :
   - Instancier le contrôleur
   - Exécuter l'action du contrôleur

**Gestion des erreurs:**
- Middleware introuvable → Erreur 500
- Méthode handle() inexistante → Erreur 500
- Exception dans le middleware → Erreur 500

---

#### 3. Autoloader mis à jour (`public/index.php`)

**Modification:**

```php
$directories = [
    CORE_PATH,
    APP_PATH . '/controllers',
    APP_PATH . '/models',
    APP_PATH . '/helpers',
    APP_PATH . '/middleware',    // NOUVEAU dossier ajouté
];
```

---

#### 4. Routes protégées (`routes/web.php`)

**Avant (sans middleware):**
```php
$router->get('/api/profile', 'AuthController', 'profile');
```

**Après (avec middleware):**
```php
$router->get('/api/profile', 'AuthController', 'profile', ['AuthMiddleware']);
```

**Exemple avec plusieurs middleware:**
```php
$router->get('/api/admin/users', 'AdminController', 'users', [
    'AuthMiddleware',
    'AdminMiddleware'
]);
```

---

#### 5. Contrôleur simplifié (`app/controllers/AuthController.php`)

**Avant (vérification manuelle):**
```php
public function profile(): void
{
    // Récupérer le payload du token JWT depuis les headers
    $payload = JWT::getPayloadFromHeaders();

    if (!$payload) {
        $this->error('Token invalide ou manquant', 401);
    }

    // Récupérer l'utilisateur
    $user = User::findById($payload['user_id']);

    if (!$user) {
        $this->error('Utilisateur non trouvé', 404);
    }

    // Retourner les données publiques
    $userData = User::getPublicData($user);

    $this->success($userData, 'Profil récupéré');
}
```

**Après (avec middleware):**
```php
public function profile(): void
{
    // L'utilisateur est déjà vérifié par AuthMiddleware
    $user = AuthMiddleware::user();

    // Retourner les données publiques
    $userData = User::getPublicData($user);

    $this->success($userData, 'Profil récupéré');
}
```

**Avantages:**
- ✅ Code plus simple et lisible
- ✅ Logique d'authentification centralisée
- ✅ Moins de duplication de code
- ✅ Séparation des responsabilités (SoC)

---

## 🔐 Comment Fonctionne le Middleware

### 1. Flux d'exécution

```
Requête HTTP
    ↓
Router::run()
    ↓
Router::dispatch()
    ↓
[Pour chaque middleware]
    ↓
AuthMiddleware::handle()
    ↓
    ├─→ Token manquant → 401 (arrêt)
    ├─→ Token invalide → 401 (arrêt)
    ├─→ Token expiré → 401 (arrêt)
    ├─→ Utilisateur introuvable → 401 (arrêt)
    └─→ Tout OK → continue
    ↓
Contrôleur::action()
    ↓
Réponse JSON
```

### 2. Stockage des données authentifiées

Le middleware stocke les données dans `$GLOBALS` :

```php
$GLOBALS['auth_user'] = $user;        // Données complètes de l'utilisateur
$GLOBALS['auth_payload'] = $payload;  // Payload JWT (user_id, email, type, iat, exp)
```

**Accès depuis les contrôleurs:**

```php
// Récupérer l'utilisateur
$user = AuthMiddleware::user();
// Returns: ['id' => 1, 'email' => 'user@example.com', 'first_name' => '...', ...]

// Récupérer le payload JWT
$payload = AuthMiddleware::payload();
// Returns: ['user_id' => 1, 'email' => '...', 'type' => 'user', 'iat' => ..., 'exp' => ...]

// Vérifier si authentifié
$isAuth = AuthMiddleware::check();
// Returns: true|false

// Récupérer l'ID uniquement
$userId = AuthMiddleware::id();
// Returns: 1 ou null
```

---

## 🎯 Cas d'Usage

### 1. Route Protégée Simple

```php
// routes/web.php
$router->get('/api/profile', 'AuthController', 'profile', ['AuthMiddleware']);

// app/controllers/AuthController.php
public function profile(): void
{
    $user = AuthMiddleware::user();
    $this->success($user, 'Profil récupéré');
}
```

### 2. Route avec Plusieurs Middleware

```php
// Créer AdminMiddleware.php
class AdminMiddleware
{
    public function handle(): bool
    {
        $user = AuthMiddleware::user();

        if ($user['role'] !== 'admin') {
            $this->error('Accès refusé : admin requis', 403);
            return false;
        }

        return true;
    }
}

// routes/web.php
$router->get('/api/admin/users', 'AdminController', 'users', [
    'AuthMiddleware',   // 1. Vérifier authentification
    'AdminMiddleware'   // 2. Vérifier rôle admin
]);
```

### 3. Route Publique (Sans Middleware)

```php
// routes/web.php
$router->post('/api/login', 'AuthController', 'login');
$router->post('/api/register', 'AuthController', 'register');
```

---

## 🧪 Tests Disponibles

### Test Script Automatique

```bash
# Exécuter le script de test du middleware
bash test-middleware.sh
```

**Le script teste automatiquement:**

1. ✅ Connexion pour obtenir un token valide
2. ✅ Accès au profil AVEC token valide (devrait fonctionner)
3. ✅ Accès au profil SANS token (devrait retourner 401)
4. ✅ Accès au profil avec token INVALIDE (devrait retourner 401)
5. ✅ Accès au profil avec token MAL FORMATÉ (devrait retourner 401)
6. ✅ Accès à une route publique SANS token (devrait fonctionner)
7. ✅ Vérification des données utilisateur chargées par le middleware
8. ✅ Header Authorization mal formaté sans "Bearer" (devrait retourner 401)

---

## 📊 Réponses du Middleware

### Succès (Middleware passe)

Le middleware retourne `true` et le contrôleur s'exécute normalement.

**Réponse typique (200):**
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

### Échec - Token Manquant

```json
{
  "success": false,
  "error": "Token manquant"
}
```

**Code HTTP:** 401

### Échec - Token Invalide ou Expiré

```json
{
  "success": false,
  "error": "Token invalide ou expiré"
}
```

**Code HTTP:** 401

### Échec - Utilisateur Non Trouvé

```json
{
  "success": false,
  "error": "Utilisateur non trouvé"
}
```

**Code HTTP:** 401

---

## 🔄 Comparaison Avant/Après

### Sans Middleware (❌ Approche Répétitive)

```php
// AuthController.php
public function profile(): void
{
    $payload = JWT::getPayloadFromHeaders();
    if (!$payload) $this->error('Token invalide', 401);
    $user = User::findById($payload['user_id']);
    if (!$user) $this->error('User not found', 404);
    $this->success(User::getPublicData($user));
}

// OrderController.php
public function index(): void
{
    $payload = JWT::getPayloadFromHeaders();        // DUPLICATION
    if (!$payload) $this->error('Token invalide', 401);
    $user = User::findById($payload['user_id']);    // DUPLICATION
    if (!$user) $this->error('User not found', 404);
    // ... logique métier
}

// AddressController.php
public function store(): void
{
    $payload = JWT::getPayloadFromHeaders();        // DUPLICATION
    if (!$payload) $this->error('Token invalide', 401);
    $user = User::findById($payload['user_id']);    // DUPLICATION
    if (!$user) $this->error('User not found', 404);
    // ... logique métier
}
```

**Problèmes:**
- 🔴 Code dupliqué dans chaque contrôleur
- 🔴 Logique d'authentification répétée
- 🔴 Difficile à maintenir
- 🔴 Risque d'oubli de vérification

---

### Avec Middleware (✅ Approche Centralisée)

```php
// routes/web.php
$router->get('/api/profile', 'AuthController', 'profile', ['AuthMiddleware']);
$router->get('/api/orders', 'OrderController', 'index', ['AuthMiddleware']);
$router->post('/api/addresses', 'AddressController', 'store', ['AuthMiddleware']);

// AuthController.php
public function profile(): void
{
    $user = AuthMiddleware::user();
    $this->success(User::getPublicData($user));
}

// OrderController.php
public function index(): void
{
    $userId = AuthMiddleware::id();
    $orders = Order::where('user_id', $userId);
    $this->success($orders);
}

// AddressController.php
public function store(): void
{
    $userId = AuthMiddleware::id();
    $data = $this->getJsonInput();
    $data['user_id'] = $userId;
    $addressId = Address::create($data);
    $this->success(['id' => $addressId]);
}
```

**Avantages:**
- ✅ Code propre et lisible
- ✅ Logique d'authentification centralisée
- ✅ Facile à maintenir
- ✅ Impossible d'oublier la vérification
- ✅ DRY (Don't Repeat Yourself)

---

## 🛡️ Sécurité

### 1. Vérifications Effectuées

Le middleware AuthMiddleware effectue les vérifications suivantes :

1. **Présence du token** dans le header `Authorization: Bearer {token}`
2. **Validité du format** JWT (3 parties séparées par des points)
3. **Signature du token** avec `hash_hmac()` et `hash_equals()`
4. **Expiration du token** (comparaison avec `time()`)
5. **Existence de l'utilisateur** en base de données

### 2. Protection CSRF

Les tokens JWT ne sont pas stockés dans les cookies, ce qui protège naturellement contre les attaques CSRF.

### 3. Expiration des Tokens

Les tokens expirent après **7 jours** (604800 secondes) par défaut.

```php
// Modifier la durée d'expiration
JWT::setExpiration(86400);  // 1 jour
```

### 4. Secret JWT

**⚠️ IMPORTANT en production:**

```php
// app/helpers/JWT.php
private static string $secret = 'marrakech-services-secret-key...';
```

**À faire en production:**
- Changer la clé secrète avec une valeur aléatoire forte
- Stocker la clé dans une variable d'environnement
- Ne jamais commit la vraie clé dans Git

```php
JWT::setSecret(getenv('JWT_SECRET_KEY'));
```

---

## 📈 Métriques

```
Fichiers créés:              1 (AuthMiddleware.php)
Fichiers modifiés:           4 (Router, index.php, routes, AuthController)
Lignes de code ajoutées:     ~100 (middleware)
Lignes de code modifiées:    ~50 (router + routes)
Lignes de code économisées:  ~30 par contrôleur protégé
Tests couverts:              8 scénarios
```

---

## 🚀 Prochaines Étapes

### Phase 2 Suite - Améliorations du Middleware

1. ⏳ Implémenter refresh tokens (renouveler le token sans re-login)
2. ⏳ Ajouter blacklist de tokens (logout réel, invalidation)
3. ⏳ Middleware pour différents rôles (admin, provider, user)
4. ⏳ Middleware pour vérifier les permissions spécifiques

### Phase 3 - Fonctionnalités Utilisateur

1. ⏳ Gestion des adresses (CRUD) avec AuthMiddleware
2. ⏳ Upload d'avatar avec AuthMiddleware
3. ⏳ Modification du profil avec AuthMiddleware
4. ⏳ Changement de mot de passe avec AuthMiddleware
5. ⏳ Reset password (email)

### Phase 4 - Autres Entités

1. ⏳ Modèle et contrôleur Provider avec AuthMiddleware
2. ⏳ Modèle et contrôleur Service
3. ⏳ Modèle et contrôleur Category
4. ⏳ Modèle et contrôleur Order avec AuthMiddleware

---

## 💡 Exemples d'Utilisation Avancée

### 1. Middleware Optionnel

Pour une route qui fonctionne avec ou sans authentification :

```php
public function index(): void
{
    if (AuthMiddleware::check()) {
        // Utilisateur authentifié
        $userId = AuthMiddleware::id();
        $orders = Order::where('user_id', $userId);
    } else {
        // Utilisateur non authentifié
        $orders = Order::where('status', 'public');
    }

    $this->success($orders);
}
```

### 2. Vérifier des Permissions Spécifiques

```php
public function delete(int $orderId): void
{
    $userId = AuthMiddleware::id();
    $order = Order::find($orderId);

    // Vérifier que l'utilisateur est propriétaire de la commande
    if ($order['user_id'] !== $userId) {
        $this->error('Vous n\'avez pas la permission de supprimer cette commande', 403);
    }

    Order::delete($orderId);
    $this->success(null, 'Commande supprimée');
}
```

### 3. Middleware Personnalisé pour les Providers

```php
class ProviderMiddleware
{
    public function handle(): bool
    {
        $payload = JWT::getPayloadFromHeaders();

        if (!$payload) {
            $this->unauthorized('Token manquant');
            return false;
        }

        // Vérifier que le type est "provider"
        if ($payload['type'] !== 'provider') {
            $this->unauthorized('Accès réservé aux prestataires');
            return false;
        }

        $provider = Provider::findById($payload['provider_id']);

        if (!$provider) {
            $this->unauthorized('Prestataire non trouvé');
            return false;
        }

        // Stocker les données du provider
        $GLOBALS['auth_provider'] = $provider;
        $GLOBALS['auth_payload'] = $payload;

        return true;
    }

    public static function provider(): ?array
    {
        return $GLOBALS['auth_provider'] ?? null;
    }
}
```

**Utilisation:**

```php
// routes/web.php
$router->get('/api/provider/orders', 'ProviderController', 'orders', ['ProviderMiddleware']);

// ProviderController.php
public function orders(): void
{
    $provider = ProviderMiddleware::provider();
    $orders = Order::where('provider_id', $provider['id']);
    $this->success($orders);
}
```

---

**Date de création:** 2025-01-13
**Version:** 2.0
**Status:** ✅ **Middleware Complètement Fonctionnel**
**Auteur:** Développement Marrakech Services

---

## 🎉 Conclusion

Le système de middleware est maintenant **complètement fonctionnel** avec :

- ✅ AuthMiddleware pour protéger les routes
- ✅ Router avec support middleware natif
- ✅ Logique d'authentification centralisée
- ✅ Contrôleurs simplifiés et plus lisibles
- ✅ Gestion automatique des erreurs 401
- ✅ Accès facile aux données utilisateur
- ✅ Tests automatisés complets
- ✅ Documentation complète
- ✅ Architecture extensible pour d'autres middleware

**Le code est désormais plus propre, plus sécurisé et plus maintenable !** 🚀
