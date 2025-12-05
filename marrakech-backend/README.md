# Backend Marrakech Services

API REST en PHP 8+ avec architecture MVC pure

## 🚀 Démarrage Rapide

```bash
# Depuis le dossier YelabGo
docker-compose -f docker-compose-marrakech.yml up -d

# Tester l'API
curl http://localhost:8081/
curl http://localhost:8081/health
```

## 📁 Structure

```
marrakech-backend/
├── app/
│   ├── controllers/     # Contrôleurs MVC
│   ├── models/         # Modèles (accès BD)
│   └── views/          # Vues (non utilisé pour API)
├── core/               # Classes fondamentales
│   ├── Database.php    # Singleton PDO
│   ├── Router.php      # Système de routing
│   ├── Controller.php  # Base des contrôleurs
│   └── Model.php       # Base des modèles
├── config/             # Configuration
├── database/           # SQL scripts
├── public/             # Point d'entrée web
│   ├── index.php       # Entry point
│   └── .htaccess       # Réécriture URL
└── routes/             # Définition des routes
```

## 🎯 Fonctionnalités

✅ Architecture MVC pure
✅ Router avec paramètres dynamiques
✅ Base de données PDO avec Singleton
✅ CRUD générique dans Model
✅ Validation des données
✅ Réponses JSON standardisées
✅ Health check endpoint

## 📖 Documentation

- **BACKEND-CORE.md** - Documentation complète du core
- **DATABASE-SCHEMA.md** - Schéma de la base de données
- **database/README.md** - Guide base de données

## 🔧 Configuration

Variables d'environnement Docker :
- `DB_HOST=mysql-db`
- `DB_NAME=marrakech_services`
- `DB_USER=marrakech_user`
- `DB_PASSWORD=marrakech_password`

## 🧪 Tests

```bash
# Test connexion DB
curl http://localhost:8081/health

# Devrait retourner:
{
  "success": true,
  "data": {
    "status": "healthy",
    "checks": {
      "database": "connected"
    }
  }
}
```

## 📌 Prochaines Étapes

1. Créer les modèles (User, Provider, Service, etc.)
2. Créer les contrôleurs (AuthController, UserController, etc.)
3. Activer les routes dans `routes/web.php`
4. Implémenter l'authentification JWT

---

**Version** : 1.0
**PHP** : 8+
**Database** : MySQL 8
**Port** : 8081
