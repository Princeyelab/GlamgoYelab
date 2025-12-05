# Architecture GlamGo

## Vue d'Ensemble

GlamGo est une application Full-Stack découplée avec :
- **Backend** : API REST en PHP 8.2+ (MVC pur)
- **Frontend** : Application Next.js 15 (React sans TypeScript)
- **Base de données** : MySQL 8.0
- **Infrastructure** : Docker + Docker Compose

## Architecture Backend (PHP MVC)

### Structure des Dossiers

```
backend/
├── app/
│   ├── controllers/      # Contrôleurs (logique métier)
│   ├── models/          # Modèles (accès base de données)
│   ├── core/            # Classes fondamentales du framework
│   ├── middlewares/     # Middlewares (Auth, etc.)
│   ├── helpers/         # Classes utilitaires
│   └── views/           # Non utilisé (API REST)
├── config/              # Configuration (config.php)
├── database/
│   ├── migrations/      # Scripts SQL de création de tables
│   └── seeds/           # Données de test
├── public/
│   └── index.php        # Point d'entrée unique
└── routes/
    └── api.php          # Définition des routes API
```

### Flux de Requête

```
1. Requête HTTP
   ↓
2. public/index.php (point d'entrée)
   ↓
3. Autoloader (chargement des classes)
   ↓
4. Router->dispatch() (routes/api.php)
   ↓
5. Middleware (si requis, ex: AuthMiddleware)
   ↓
6. Controller->method()
   ↓
7. Model (accès BD si nécessaire)
   ↓
8. Response JSON
```

### Classes Core

#### 1. Router (app/core/Router.php)
Responsable du routage des requêtes vers les bons contrôleurs.

**Méthodes principales :**
- `get()`, `post()`, `put()`, `delete()`, `patch()` - Enregistre une route
- `middleware()` - Ajoute des middlewares à une route
- `dispatch()` - Dispatch la requête vers le bon contrôleur

**Exemple d'utilisation (routes/api.php) :**
```php
$router->post('/api/auth/login', 'AuthController', 'login');
$router->get('/api/user/profile', 'UserController', 'profile')
    ->middleware([AuthMiddleware::class]);
```

#### 2. Controller (app/core/Controller.php)
Classe de base pour tous les contrôleurs.

**Méthodes utiles :**
- `json($data, $statusCode)` - Retourne une réponse JSON
- `success($data, $message)` - Réponse de succès
- `error($message, $statusCode)` - Réponse d'erreur
- `getJsonInput()` - Récupère le body JSON
- `validate($data, $rules)` - Valide les données

**Exemple :**
```php
class UserController extends Controller {
    public function profile() {
        $userId = $_SERVER['USER_ID'];
        $user = $this->userModel->find($userId);
        $this->success($user);
    }
}
```

#### 3. Model (app/core/Model.php)
Classe de base pour tous les modèles (accès BD).

**Méthodes disponibles :**
- `all()` - Récupère tous les enregistrements
- `find($id)` - Récupère par ID
- `findBy($column, $value)` - Récupère par colonne
- `where($column, $value)` - Récupère plusieurs enregistrements
- `create($data)` - Crée un enregistrement
- `update($id, $data)` - Met à jour
- `delete($id)` - Supprime
- `query($sql, $params)` - Requête personnalisée

**Exemple :**
```php
class User extends Model {
    protected string $table = 'users';

    public function findByEmail(string $email) {
        return $this->findBy('email', $email);
    }
}
```

#### 4. Database (app/core/Database.php)
Gère la connexion PDO à MySQL (Singleton).

**Utilisation :**
```php
$db = Database::getInstance();
$stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([1]);
```

#### 5. Middleware (app/core/Middleware.php)
Classe de base pour les middlewares.

**Exemple (AuthMiddleware) :**
```php
class AuthMiddleware extends Middleware {
    public function handle() {
        $payload = JWT::getPayloadFromHeaders();
        if (!$payload) {
            $this->error('Non authentifié', 401);
        }
        $_SERVER['USER_ID'] = $payload['user_id'];
    }
}
```

### Helpers

#### JWT (app/helpers/JWT.php)
Gestion de l'authentification JWT.

**Méthodes :**
- `encode($payload)` - Crée un token
- `decode($token)` - Décode et vérifie un token
- `getTokenFromHeaders()` - Récupère le token des headers
- `getPayloadFromHeaders()` - Récupère le payload décodé

**Exemple :**
```php
// Créer un token
$token = JWT::encode([
    'user_id' => 1,
    'email' => 'user@example.com'
]);

// Vérifier un token
$payload = JWT::getPayloadFromHeaders();
if ($payload) {
    $userId = $payload['user_id'];
}
```

#### Password (app/helpers/Password.php)
Hashage et vérification de mots de passe.

**Méthodes :**
- `hash($password)` - Hash un mot de passe
- `verify($password, $hash)` - Vérifie un mot de passe

#### ReferralCode (app/helpers/ReferralCode.php)
Génération de codes de parrainage uniques.

### Modèles Principaux

```
User          → Utilisateurs (clients)
Provider      → Prestataires
Category      → Catégories de services
Service       → Services disponibles
Order         → Commandes
Review        → Évaluations
Message       → Messages du chat
```

### Contrôleurs Principaux

```
AuthController              → Inscription/Connexion
UserController              → Profil utilisateur
AddressController           → Adresses
CategoryController          → Catégories
ServiceController           → Services
OrderController             → Commandes (client)
ReviewController            → Évaluations
ChatController              → Chat
LocationController          → Géolocalisation
ReferralController          → Parrainage
ProviderController          → Prestataires
ProviderServiceController   → Services du prestataire
ProviderOrderController     → Commandes (prestataire)
OAuthController             → OAuth (placeholder)
```

## Architecture Frontend (Next.js)

### Structure des Dossiers

```
frontend/src/
├── app/              # App Router Next.js
│   ├── layout.js     # Layout principal
│   └── page.js       # Page d'accueil
├── components/       # Composants React réutilisables
│   └── Header.js
├── lib/             # Utilitaires
│   └── api.js       # Client API
└── styles/          # Styles CSS
    └── globals.css
```

### Client API (lib/api.js)

Wrapper autour de `fetch` avec gestion automatique du token JWT.

**Fonctions principales :**
- `apiRequest(endpoint, options)` - Requête API générique
- `getToken()`, `setToken()`, `removeToken()` - Gestion du token
- `getUser()`, `setUser()`, `removeUser()` - Gestion de l'utilisateur
- `logout()` - Déconnexion

**Objet `api` avec toutes les méthodes :**
```javascript
api.register(data)
api.login(data)
api.getCategories()
api.getServices()
api.getProfile()
api.createOrder(data)
// ... etc
```

**Exemple d'utilisation :**
```javascript
import { api, setToken, setUser } from '@/lib/api'

// Connexion
const response = await api.login({
  email: 'user@example.com',
  password: 'password123'
})

setToken(response.data.token)
setUser(response.data.user)

// Récupérer le profil (avec token automatique)
const profile = await api.getProfile()
```

## Base de Données MySQL

### Schéma Principal

```sql
users                   # Utilisateurs (clients)
├── id, email, password, first_name, last_name
├── referral_code, referred_by
└── created_at, updated_at

user_addresses          # Adresses des utilisateurs
├── id, user_id, label, address_line
├── latitude, longitude, is_default
└── created_at, updated_at

providers               # Prestataires
├── id, email, password, first_name, last_name
├── is_verified, is_available
├── current_latitude, current_longitude
├── rating, total_reviews
└── created_at, updated_at

categories              # Catégories (hiérarchiques)
├── id, name, slug, description, icon
├── parent_id (NULL = catégorie principale)
└── display_order, is_active

services                # Services disponibles
├── id, category_id, name, slug, description
├── price, duration_minutes
└── is_active, created_at, updated_at

provider_services       # Services proposés par prestataires
├── id, provider_id, service_id
└── created_at

orders                  # Commandes
├── id, user_id, provider_id, service_id, address_id
├── status (pending, accepted, on_way, in_progress, completed, cancelled)
├── price, tip, total
├── scheduled_at, accepted_at, started_at, completed_at
├── payment_status, notes
└── created_at, updated_at

reviews                 # Évaluations
├── id, order_id, user_id, provider_id
├── rating (1-5), comment
└── created_at, updated_at

messages                # Chat
├── id, order_id, sender_type, sender_id
├── content, translated_content
├── is_read
└── created_at

location_tracking       # Suivi GPS
├── id, order_id, provider_id
├── latitude, longitude
└── created_at
```

### Relations

```
User 1---N UserAddress
User 1---N Order (as user)
Provider 1---N Order (as provider)
Provider N---N Service (via provider_services)
Category 1---N Service
Category 1---N Category (auto-référence pour sous-catégories)
Order 1---1 Review
Order 1---N Message
Order 1---N LocationTracking
```

## Infrastructure Docker

### Services

```yaml
mysql-db        # MySQL 8.0 (port 3306)
php-backend     # PHP 8.2-FPM
nginx           # Nginx (port 8080 → Backend API)
frontend        # Next.js (port 3000)
```

### Communication

```
Frontend (3000)
    ↓ HTTP
Nginx (8080)
    ↓ FastCGI
PHP-FPM (9000)
    ↓ PDO
MySQL (3306)
```

### Volumes

```
mysql_data          # Données MySQL persistantes
./backend           # Code backend monté en volume
./frontend          # Code frontend monté en volume
```

## Sécurité

### Backend
- Mots de passe hashés avec bcrypt (cost 12)
- JWT pour authentification (expiration 7 jours)
- Validation des inputs
- Requêtes SQL préparées (protection injection SQL)
- Headers CORS configurés

### Frontend
- Token JWT stocké dans localStorage
- Requêtes API avec Authorization header
- Validation côté client

## Performance

### Backend
- Nginx en reverse proxy
- PHP-FPM avec opcache
- Indexes MySQL sur colonnes clés
- Requêtes optimisées (JOIN quand nécessaire)

### Frontend
- Turbopack (dev rapide)
- Next.js App Router
- Image optimization Next.js

## Extensibilité

L'architecture MVC permet d'ajouter facilement :

### Nouveau modèle
```php
class MonModele extends Model {
    protected string $table = 'ma_table';
}
```

### Nouveau contrôleur
```php
class MonController extends Controller {
    public function index() {
        $this->success(['data' => 'test']);
    }
}
```

### Nouvelle route
```php
$router->get('/api/mon-endpoint', 'MonController', 'index');
```

### Nouveau middleware
```php
class MonMiddleware extends Middleware {
    public function handle() {
        // Logique
    }
}
```

## Prochaines Étapes

1. **OAuth** - Implémenter Google & Facebook
2. **Upload** - Système d'upload d'images
3. **Traduction** - Intégrer API de traduction pour chat
4. **Paiement** - Intégrer gateway de paiement
5. **Notifications** - Push notifications
6. **Admin** - Panel d'administration
7. **Analytics** - Tracking et statistiques
