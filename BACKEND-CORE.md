# Backend Core - Marrakech Services

## ✅ Fichiers Core Créés

### 1. Classes Fondamentales

```
marrakech-backend/core/
├── Database.php     ✅ Connexion PDO Singleton
├── Router.php       ✅ Système de routing avec paramètres dynamiques
├── Controller.php   ✅ Classe de base pour tous les contrôleurs
└── Model.php        ✅ Classe de base pour tous les modèles (CRUD)
```

### 2. Point d'Entrée & Configuration

```
marrakech-backend/
├── public/
│   ├── index.php    ✅ Point d'entrée unique avec autoloader
│   └── .htaccess    ✅ Réécriture d'URL Apache
├── config/
│   └── config.php   ✅ Configuration centralisée
└── routes/
    └── web.php      ✅ Définition des routes
```

### 3. Contrôleur de Test

```
marrakech-backend/app/controllers/
└── HomeController.php  ✅ Endpoint de test et health check
```

## 🏗️ Architecture MVC

### Flux de Requête

```
1. Requête HTTP → public/index.php
   ↓
2. Autoloader charge les classes nécessaires
   ↓
3. Router analyse l'URI et la méthode HTTP
   ↓
4. Router trouve la route correspondante
   ↓
5. Router instancie le Contrôleur
   ↓
6. Contrôleur appelle le Modèle si nécessaire
   ↓
7. Modèle interroge la base de données via Database
   ↓
8. Contrôleur retourne une réponse JSON
```

## 📖 Utilisation

### 1. Database (Singleton PDO)

```php
// Obtenir l'instance PDO
$pdo = Database::getInstance();

// Tester la connexion
$connected = Database::testConnection();

// Exécuter une requête simple
$stmt = Database::query("SELECT * FROM users WHERE id = ?", [1]);
$user = $stmt->fetch();

// Transactions
Database::beginTransaction();
try {
    // ... opérations
    Database::commit();
} catch (Exception $e) {
    Database::rollBack();
}
```

### 2. Router

```php
// Définir une route simple
$router->get('/users', 'UserController', 'index');

// Route avec paramètre dynamique
$router->get('/users/{id}', 'UserController', 'show');

// Routes avec différentes méthodes HTTP
$router->post('/users', 'UserController', 'create');
$router->put('/users/{id}', 'UserController', 'update');
$router->delete('/users/{id}', 'UserController', 'delete');

// Exécuter le router
$router->run();
```

### 3. Controller

```php
class UserController extends Controller
{
    public function index()
    {
        // Retourner un succès
        $this->success(['users' => [...]], 'Liste des utilisateurs');
    }

    public function create()
    {
        // Récupérer les données JSON
        $data = $this->getJsonInput();

        // Valider
        $errors = $this->validate($data, [
            'email' => 'required|email',
            'password' => 'required|min:6',
            'name' => 'required|alpha'
        ]);

        if (!empty($errors)) {
            $this->error('Erreurs de validation', 422, $errors);
        }

        // ... création de l'utilisateur
    }
}
```

### 4. Model

```php
class User extends Model
{
    protected string $table = 'users';
    protected string $primaryKey = 'id';

    // Utilisation des méthodes héritées
    public function getAllUsers()
    {
        return $this->all();
    }

    public function getUserById($id)
    {
        return $this->find($id);
    }

    public function getUserByEmail($email)
    {
        return $this->findBy('email', $email);
    }

    public function createUser(array $data)
    {
        return $this->create($data);
    }

    // Méthode personnalisée
    public function getActiveUsers()
    {
        return $this->query(
            "SELECT * FROM {$this->table} WHERE status = ?",
            ['active']
        );
    }
}
```

## 🔧 Fonctionnalités Incluses

### Database.php
- ✅ Pattern Singleton
- ✅ Connexion PDO sécurisée
- ✅ Support des variables d'environnement Docker
- ✅ Gestion des erreurs
- ✅ Helpers pour transactions
- ✅ Test de connexion

### Router.php
- ✅ Support GET, POST, PUT, DELETE
- ✅ Paramètres dynamiques dans l'URI `{id}`, `{slug}`
- ✅ Parsing automatique de l'URI
- ✅ Gestion d'erreurs 404
- ✅ Dispatch vers contrôleurs

### Controller.php
- ✅ Méthodes `success()` et `error()` pour réponses JSON
- ✅ Récupération de données JSON, POST, GET
- ✅ Validation simple des données
- ✅ Support des vues (si nécessaire)
- ✅ Redirection

### Model.php
- ✅ CRUD complet (Create, Read, Update, Delete)
- ✅ Méthodes `all()`, `find()`, `findBy()`, `where()`
- ✅ Requêtes personnalisées `query()` et `execute()`
- ✅ Pagination `paginate()`
- ✅ Comptage `count()`

## 🚀 Test de l'API

### 1. Démarrer Docker

```bash
docker-compose -f docker-compose-marrakech.yml up -d
```

### 2. Tester les Endpoints

```bash
# Page d'accueil de l'API
curl http://localhost:8081/

# Health check
curl http://localhost:8081/health
```

**Réponse Attendue (/):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "app_name": "Marrakech Services API",
    "version": "1.0.0",
    "status": "running",
    "timestamp": 1705161234,
    "message": "Bienvenue sur l'API Marrakech Services"
  }
}
```

**Réponse Attendue (/health):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "status": "healthy",
    "timestamp": 1705161234,
    "checks": {
      "database": "connected",
      "php_version": "8.2.0",
      "server_time": "2025-01-13 14:30:45"
    }
  }
}
```

## 📝 Structure Complète Actuelle

```
marrakech-backend/
├── app/
│   ├── controllers/
│   │   ├── HomeController.php    ✅
│   │   └── .gitkeep
│   ├── models/
│   │   └── .gitkeep
│   └── views/
│       └── .gitkeep
│
├── core/
│   ├── Database.php               ✅
│   ├── Router.php                 ✅
│   ├── Controller.php             ✅
│   └── Model.php                  ✅
│
├── config/
│   └── config.php                 ✅
│
├── database/
│   ├── schema.sql                 ✅
│   ├── seeds.sql                  ✅
│   ├── init.sql                   ✅
│   ├── 00-init.sh                 ✅
│   └── README.md                  ✅
│
├── public/
│   ├── index.php                  ✅
│   └── .htaccess                  ✅
│
├── routes/
│   └── web.php                    ✅
│
├── Dockerfile                     ✅
└── .env.example                   ✅
```

## 🎯 Prochaines Étapes

### 1. Créer les Modèles
```
app/models/
├── User.php
├── Provider.php
├── Category.php
├── Service.php
├── Order.php
└── Review.php
```

### 2. Créer les Contrôleurs
```
app/controllers/
├── AuthController.php
├── UserController.php
├── ProviderController.php
├── CategoryController.php
├── ServiceController.php
├── OrderController.php
└── ReviewController.php
```

### 3. Implémenter les Routes
Décommenter et activer les routes dans `routes/web.php`

### 4. Ajouter les Fonctionnalités
- Authentification JWT
- Upload d'images
- Géolocalisation
- Système de notifications

## 🔒 Sécurité

- ✅ Requêtes préparées PDO (protection injection SQL)
- ✅ Headers CORS configurés
- ✅ Gestion d'erreurs sécurisée
- ✅ Autoloader personnalisé
- ✅ Protection des fichiers sensibles (.htaccess)

## 📚 Documentation

- **DATABASE-SCHEMA.md** - Schéma complet de la base de données
- **DATABASE-QUICKSTART.md** - Guide de démarrage rapide BD
- **MARRAKECH-SERVICES.md** - Vue d'ensemble du projet
- **BACKEND-CORE.md** - Ce document

---

**Créé le** : 2025-01-13
**Version** : 1.0
**Status** : ✅ Core fonctionnel et testé
