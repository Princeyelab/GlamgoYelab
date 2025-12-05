# GlamGo - Plateforme de Services à Domicile

Application mobile-first pour commander des services à domicile à Marrakech.

## Stack Technique

### Backend
- **PHP 8.2+** - Architecture MVC pure
- **MySQL 8.0** - Base de données
- **Nginx** - Serveur web
- **JWT** - Authentification

### Frontend
- **Next.js 15** (sans TypeScript)
- **Turbopack** - Bundler rapide
- **React** - Interface utilisateur

### Infrastructure
- **Docker** - Conteneurisation
- **Docker Compose** - Orchestration

## Architecture

```
YelabGo/
├── backend/
│   ├── app/
│   │   ├── controllers/    # Contrôleurs MVC
│   │   ├── models/         # Modèles (accès BD)
│   │   ├── core/           # Classes core (Router, Controller, Model, etc.)
│   │   ├── middlewares/    # Middlewares (Auth, etc.)
│   │   └── helpers/        # Helpers (JWT, Password, etc.)
│   ├── config/             # Configuration
│   ├── database/
│   │   ├── migrations/     # Scripts SQL
│   │   └── seeds/          # Données de test
│   ├── public/
│   │   └── index.php       # Point d'entrée
│   └── routes/
│       └── api.php         # Définition des routes
├── frontend/
│   └── src/                # Code Next.js
├── nginx/
│   └── default.conf        # Configuration Nginx
└── docker-compose.yml      # Orchestration Docker
```

## Démarrage Rapide

### 1. Cloner et configurer

```bash
cd YelabGo

# Copier le fichier d'environnement
cp backend/.env.example backend/.env
```

### 2. Lancer avec Docker

```bash
# Construire et démarrer tous les services
docker-compose up -d --build

# Vérifier que tout fonctionne
docker-compose ps
```

Les services sont disponibles sur :
- **Backend API** : http://localhost:8080
- **Frontend** : http://localhost:3000
- **MySQL** : localhost:3306

### 3. Initialiser la base de données

Les migrations SQL sont automatiquement exécutées au démarrage de MySQL.

Pour réinitialiser :
```bash
docker-compose exec mysql-db mysql -u glamgo_user -pglamgo_password glamgo < backend/database/migrations/001_create_tables.sql
docker-compose exec mysql-db mysql -u glamgo_user -pglamgo_password glamgo < backend/database/seeds/002_seed_data.sql
```

### 4. Tester l'API

```bash
# Health check
curl http://localhost:8080/api/health

# Créer un utilisateur
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "0612345678"
  }'

# Lister les catégories
curl http://localhost:8080/api/categories

# Lister les services
curl http://localhost:8080/api/services
```

## API Endpoints

### Authentification (Publique)
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/forgot-password` - Mot de passe oublié
- `POST /api/auth/reset-password` - Réinitialiser mot de passe

### OAuth (Préparé)
- `GET /api/auth/google` - OAuth Google
- `GET /api/auth/facebook` - OAuth Facebook

### Utilisateur (Authentifié)
- `GET /api/user/profile` - Profil
- `PUT /api/user/profile` - Mettre à jour profil
- `GET /api/user/addresses` - Liste adresses
- `POST /api/user/addresses` - Créer adresse
- `PUT /api/user/addresses/{id}` - Modifier adresse
- `DELETE /api/user/addresses/{id}` - Supprimer adresse

### Services (Publique)
- `GET /api/categories` - Liste catégories
- `GET /api/categories/{id}` - Détail catégorie
- `GET /api/categories/{id}/services` - Services d'une catégorie
- `GET /api/services` - Liste services
- `GET /api/services/{id}` - Détail service

### Commandes (Authentifié)
- `POST /api/orders` - Créer commande
- `GET /api/orders` - Mes commandes
- `GET /api/orders/{id}` - Détail commande
- `PATCH /api/orders/{id}/cancel` - Annuler commande
- `POST /api/orders/{id}/review` - Évaluer commande

### Chat (Authentifié)
- `GET /api/orders/{id}/messages` - Messages
- `POST /api/orders/{id}/messages` - Envoyer message

### Géolocalisation (Authentifié)
- `GET /api/orders/{id}/location` - Position du prestataire
- `POST /api/provider/location` - MAJ position (prestataire)

### Prestataires
- `POST /api/provider/register` - Inscription prestataire
- `GET /api/provider/profile` - Profil prestataire
- `GET /api/provider/services` - Services proposés
- `POST /api/provider/services` - Ajouter service
- `GET /api/provider/orders` - Commandes reçues
- `PATCH /api/provider/orders/{id}/accept` - Accepter commande

## Fonctionnalités

### MVP Implémenté ✅
- Authentification (Email/Password)
- Gestion profil utilisateur
- Gestion adresses
- Système de parrainage
- Catalogue services (catégories, sous-catégories)
- Création de commandes
- Workflow complet des commandes
- Système d'évaluation et pourboires
- Chat entre utilisateur et prestataire
- Géolocalisation en temps réel

### À Implémenter 🚧
- OAuth (Google, Facebook)
- Traduction automatique du chat (API externe)
- Upload d'images (avatars, photos)
- Système de paiement
- Notifications push
- Recherche avancée
- Filtres géographiques

## Base de Données

### Tables Principales
- `users` - Utilisateurs (clients)
- `providers` - Prestataires
- `categories` - Catégories de services
- `services` - Services disponibles
- `orders` - Commandes
- `reviews` - Évaluations
- `messages` - Chat
- `user_addresses` - Adresses des utilisateurs
- `provider_services` - Services par prestataire
- `location_tracking` - Suivi GPS

## Développement

### Backend

```bash
# Logs
docker-compose logs -f php-backend

# Accéder au conteneur PHP
docker-compose exec php-backend bash

# Redémarrer un service
docker-compose restart php-backend
```

### Frontend

Le frontend Next.js sera développé dans la prochaine phase.

Structure prévue :
```
frontend/src/
├── app/              # App Router Next.js
├── components/       # Composants React
├── lib/             # Utilitaires
└── styles/          # Styles CSS
```

### Base de Données

```bash
# Connexion MySQL
docker-compose exec mysql-db mysql -u glamgo_user -pglamgo_password glamgo

# Backup
docker-compose exec mysql-db mysqldump -u glamgo_user -pglamgo_password glamgo > backup.sql

# Restore
docker-compose exec -T mysql-db mysql -u glamgo_user -pglamgo_password glamgo < backup.sql
```

## Commandes Utiles

```bash
# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes
docker-compose down -v

# Rebuild complet
docker-compose down -v && docker-compose up -d --build

# Voir les logs
docker-compose logs -f

# Statistiques des conteneurs
docker stats
```

## Sécurité

- Mots de passe hashés avec bcrypt (cost 12)
- JWT pour l'authentification
- Validation des inputs
- Protection CORS configurée
- Requêtes SQL préparées (protection injection SQL)

## Performance

- Nginx en reverse proxy
- Indexes sur les colonnes clés
- Cache navigateur pour assets statiques
- Turbopack pour le frontend (dev rapide)

## Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing`)
5. Ouvrir une Pull Request

## Licence

Propriétaire - Tous droits réservés

## Support

Pour toute question : contact@glamgo.ma
