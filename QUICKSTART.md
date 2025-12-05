# Guide de Démarrage Rapide - GlamGo

## Étape 1 : Lancer l'application

```bash
cd YelabGo

# Construire et démarrer tous les services
docker-compose up -d --build

# Attendre 30 secondes que MySQL initialise la base de données
```

## Étape 2 : Vérifier que tout fonctionne

```bash
# Vérifier l'état des conteneurs
docker-compose ps

# Tous les services doivent être "Up"
```

## Étape 3 : Tester le Backend

### Test Health Check
```bash
curl http://localhost:8080/api/health
```

Réponse attendue :
```json
{
  "success": true,
  "message": "API is running",
  "data": {
    "status": "ok",
    "timestamp": 1234567890,
    "service": "GlamGo API",
    "version": "1.0.0"
  }
}
```

### Test Inscription
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@glamgo.ma",
    "password": "password123",
    "first_name": "Ahmed",
    "last_name": "Benali",
    "phone": "0612345678"
  }'
```

Réponse attendue :
```json
{
  "success": true,
  "message": "Inscription réussie",
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
      "id": 1,
      "email": "test@glamgo.ma",
      "first_name": "Ahmed",
      "last_name": "Benali",
      "referral_code": "ABC12345"
    }
  }
}
```

### Test Connexion
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@glamgo.ma",
    "password": "password123"
  }'
```

### Test Catégories
```bash
curl http://localhost:8080/api/categories
```

### Test Services
```bash
curl http://localhost:8080/api/services
```

## Étape 4 : Tester le Frontend

Ouvrir votre navigateur : http://localhost:3000

Vous devriez voir :
- La page d'accueil avec le logo GlamGo
- Le statut de l'API (vert)
- La liste des catégories de services

## Étape 5 : Créer une commande complète

### 1. S'inscrire comme utilisateur
Utiliser le endpoint `/api/auth/register` (voir ci-dessus)

Sauvegarder le TOKEN reçu.

### 2. Créer une adresse
```bash
TOKEN="votre_token_ici"

curl -X POST http://localhost:8080/api/user/addresses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "label": "Maison",
    "address_line": "Rue Yougoslavie, Guéliz",
    "city": "Marrakech",
    "latitude": 31.6295,
    "longitude": -7.9811,
    "is_default": true
  }'
```

### 3. Créer une commande
```bash
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "service_id": 1,
    "address_id": 1,
    "notes": "Merci d'\''être à l'\''heure"
  }'
```

### 4. Voir mes commandes
```bash
curl http://localhost:8080/api/orders \
  -H "Authorization: Bearer $TOKEN"
```

## Problèmes Courants

### Le backend ne répond pas
```bash
# Vérifier les logs
docker-compose logs php-backend

# Redémarrer le service
docker-compose restart php-backend
```

### La base de données n'est pas initialisée
```bash
# Se connecter à MySQL
docker-compose exec mysql-db mysql -u glamgo_user -pglamgo_password glamgo

# Vérifier les tables
SHOW TABLES;

# Si vide, réexécuter les migrations
docker-compose exec mysql-db mysql -u glamgo_user -pglamgo_password glamgo < backend/database/migrations/001_create_tables.sql
docker-compose exec mysql-db mysql -u glamgo_user -pglamgo_password glamgo < backend/database/seeds/002_seed_data.sql
```

### Le frontend ne se connecte pas à l'API
Vérifier que l'URL de l'API est correcte dans `docker-compose.yml` :
```yaml
environment:
  - NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### Erreur CORS
Les headers CORS sont configurés dans `backend/public/index.php`. Si vous avez une erreur, vérifiez que :
- Le frontend tourne sur le port 3000
- Le backend tourne sur le port 8080

## Commandes Utiles

```bash
# Arrêter tous les services
docker-compose down

# Redémarrer tous les services
docker-compose restart

# Voir les logs en temps réel
docker-compose logs -f

# Voir les logs d'un service spécifique
docker-compose logs -f php-backend

# Nettoyer complètement (volumes inclus)
docker-compose down -v

# Rebuild complet
docker-compose down -v && docker-compose up -d --build
```

## Prochaines Étapes

1. Créer les pages du frontend (login, register, services, orders)
2. Implémenter l'authentification OAuth (Google, Facebook)
3. Ajouter l'upload d'images
4. Intégrer une API de traduction pour le chat
5. Implémenter les notifications push
6. Ajouter un système de paiement

## Support

En cas de problème, vérifier :
1. Les logs Docker : `docker-compose logs`
2. L'état des services : `docker-compose ps`
3. La connexion MySQL : `docker-compose exec mysql-db mysql -u root -p`
