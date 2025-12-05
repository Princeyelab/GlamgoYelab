# Marrakech Services - Environment Docker & Structure

## 📦 Environnement Docker Créé

### Services Docker (docker-compose-marrakech.yml)

```yaml
✅ mysql-db (mysql:8)
   - Base de données: marrakech_services
   - User: marrakech_user
   - Password: marrakech_password
   - Port: 3307 (mappé de 3306)

✅ php-backend (PHP 8-FPM avec Dockerfile custom)
   - Extensions: PDO MySQL, mbstring, GD, etc.
   - Volume: ./marrakech-backend:/var/www/html
   - Variables d'environnement pour la DB

✅ nginx (nginx:latest)
   - Configuration: nginx/marrakech.conf
   - Port: 8081 (mappé de 80)
   - FastCGI vers php-backend:9000
```

## 📁 Structure des Fichiers Backend MVC

```
marrakech-backend/
│
├── app/
│   ├── controllers/          # Contrôleurs MVC (vide pour l'instant)
│   │   └── .gitkeep
│   ├── models/              # Modèles (accès base de données)
│   │   └── .gitkeep
│   └── views/               # Vues (non utilisé pour API)
│       └── .gitkeep
│
├── core/                    # Classes fondamentales du framework
│   ├── Database.php         # Gestion de la connexion PDO
│   ├── Router.php           # Système de routing
│   ├── Controller.php       # Classe de base des contrôleurs
│   └── Model.php            # Classe de base des modèles
│
├── config/                  # Configuration
│   └── config.php           # Fichier de configuration principal
│
├── database/                # Scripts de base de données
│   └── .gitkeep
│
├── public/                  # Point d'entrée web
│   └── index.php            # Fichier index (point d'entrée unique)
│
├── routes/                  # Définition des routes
│   └── web.php              # Fichier de routes
│
└── Dockerfile               # Image Docker personnalisée PHP 8
```

## 🚀 Commandes de Démarrage

### Lancer l'environnement

```bash
# Construction et démarrage des conteneurs
docker-compose -f docker-compose-marrakech.yml up -d --build

# Vérifier que tout fonctionne
docker-compose -f docker-compose-marrakech.yml ps
```

### Accès aux services

- **API Backend** : http://localhost:8081
- **MySQL** : localhost:3307
  ```bash
  docker-compose -f docker-compose-marrakech.yml exec mysql-db mysql -u marrakech_user -pmarrakech_password marrakech_services
  ```

### Commandes utiles

```bash
# Voir les logs
docker-compose -f docker-compose-marrakech.yml logs -f

# Redémarrer un service
docker-compose -f docker-compose-marrakech.yml restart php-backend

# Arrêter tous les services
docker-compose -f docker-compose-marrakech.yml down

# Arrêter et supprimer les volumes
docker-compose -f docker-compose-marrakech.yml down -v
```

## 📝 Fichiers Créés

### 1. docker-compose-marrakech.yml
Orchestration des 3 services Docker avec networks et volumes configurés.

### 2. nginx/marrakech.conf
Configuration Nginx avec :
- Point d'entrée : `index.php`
- FastCGI vers `php-backend:9000`
- Réécriture d'URL pour le routeur PHP
- Logs séparés pour Marrakech Services

### 3. marrakech-backend/Dockerfile
Image PHP personnalisée avec :
- PHP 8-FPM
- Extensions : pdo_mysql, mbstring, gd, bcmath, etc.
- Configuration des permissions

### 4. Structure MVC vide
Tous les dossiers et fichiers de base créés et prêts à recevoir le code.

## 🔧 Configuration Nginx

Le fichier `nginx/marrakech.conf` est configuré pour :

```nginx
- Root: /var/www/html/public
- Index: index.php
- Réécriture: try_files $uri $uri/ /index.php?$query_string
- FastCGI: php-backend:9000
```

## 📊 Prochaines Étapes

1. **Implémenter les classes Core**
   - Database.php (connexion PDO)
   - Router.php (système de routing)
   - Controller.php (base des contrôleurs)
   - Model.php (base des modèles)

2. **Créer le point d'entrée**
   - public/index.php (bootstrap de l'application)

3. **Configuration**
   - config/config.php (paramètres de l'application)

4. **Base de données**
   - Créer les migrations SQL
   - Définir le schéma de données

5. **Routes et Contrôleurs**
   - Définir les routes dans routes/web.php
   - Créer les contrôleurs dans app/controllers/

## 🎯 Différences avec le projet GlamGo

- **Port MySQL** : 3307 (au lieu de 3306)
- **Port Nginx** : 8081 (au lieu de 8080)
- **Dossier Backend** : marrakech-backend/ (au lieu de backend/)
- **Base de données** : marrakech_services (au lieu de glamgo)
- **Configuration Nginx** : marrakech.conf (séparée)

Les deux projets peuvent coexister sans conflit !

## 📌 Notes Importantes

- Les fichiers core sont vides et prêts à être implémentés
- La structure MVC est en place
- Docker est configuré et prêt à l'emploi
- Les extensions PHP nécessaires sont installées
- La configuration Nginx est optimisée pour le routing PHP

---

**Projet** : Marrakech Services
**Status** : Environment Docker ✅ | Structure MVC ✅ | Core Classes ⏳
