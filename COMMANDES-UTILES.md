# 🛠️ Commandes Utiles - GlamGo

## 🚀 Démarrage de l'Application

### Démarrage Complet (Backend + Frontend)
```bash
cd C:\Dev\YelabGo\frontend
npm run dev:full
```

### Démarrage Backend Uniquement
```bash
cd C:\Dev\YelabGo
docker-compose up -d
```

### Démarrage Frontend Uniquement
```bash
cd C:\Dev\YelabGo\frontend
npm run dev
```

---

## 🐳 Gestion Docker

### Voir l'état des conteneurs
```bash
docker-compose ps
```

### Voir les logs
```bash
# Tous les services
docker-compose logs -f

# Service spécifique
docker-compose logs -f glamgo-mysql
docker-compose logs -f glamgo-php
docker-compose logs -f glamgo-nginx
```

### Arrêter les services
```bash
docker-compose down
```

### Redémarrer un service
```bash
docker-compose restart glamgo-php
docker-compose restart glamgo-mysql
```

---

## 🗄️ Base de Données

### Se connecter à MySQL
```bash
docker exec -it glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo
```

### Exécuter un script SQL
```bash
docker exec -i glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo < fichier.sql
```

### Backup de la base de données
```bash
docker exec glamgo-mysql mysqldump -u glamgo_user -pglamgo_password glamgo > backup_$(date +%Y%m%d).sql
```

### Restaurer une base de données
```bash
docker exec -i glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo < backup.sql
```

### Requêtes Utiles

#### Compter les catégories et services
```sql
SELECT
    'Categories principales' as Type,
    COUNT(*) as Total
FROM categories
WHERE parent_id IS NULL

UNION ALL

SELECT
    'Sous-categories' as Type,
    COUNT(*) as Total
FROM categories
WHERE parent_id IS NOT NULL

UNION ALL

SELECT
    'Services' as Type,
    COUNT(*) as Total
FROM services;
```

#### Voir les services par catégorie
```sql
SELECT
    c.name as Categorie,
    COUNT(s.id) as Nb_Services,
    MIN(s.price) as Prix_min,
    MAX(s.price) as Prix_max,
    AVG(s.duration_minutes) as Duree_moyenne
FROM categories c
LEFT JOIN services s ON c.id = s.category_id
WHERE c.parent_id IS NULL
GROUP BY c.id, c.name
ORDER BY c.display_order;
```

#### Trouver les services les plus chers
```sql
SELECT
    s.name as Service,
    c.name as Categorie,
    s.price as Prix,
    s.duration_minutes as Duree
FROM services s
JOIN categories c ON s.category_id = c.id
ORDER BY s.price DESC
LIMIT 10;
```

---

## 🔧 Scripts de Migration

### Ajouter les 5 catégories complètes
```bash
cd C:\Dev\YelabGo\backend
docker exec glamgo-php php update_services_safe.php
```

### Script alternatif (sans interaction)
```bash
docker exec glamgo-php php add_complete_services.php
```

---

## 🌐 API Backend

### Tester l'API

#### Health Check
```bash
curl http://localhost:8080/api/health
```

#### Lister toutes les catégories
```bash
curl http://localhost:8080/api/categories
```

#### Lister les services
```bash
# Tous les services
curl http://localhost:8080/api/services

# Services d'une catégorie spécifique (ID 1 = Beauté)
curl "http://localhost:8080/api/services?category=1"

# Rechercher un service
curl "http://localhost:8080/api/services?search=massage"
```

#### Obtenir un service spécifique
```bash
curl http://localhost:8080/api/services/1
```

---

## 🎨 Frontend

### Démarrage avec Turbo (plus rapide)
```bash
cd C:\Dev\YelabGo\frontend
npm run dev
```

### Build de production
```bash
npm run build
npm start
```

### Nettoyage du cache
```bash
rm -rf .next .turbo
npm run dev
```

---

## 📊 Monitoring

### Espace disque des conteneurs
```bash
docker system df
```

### Nettoyer Docker (ATTENTION : supprime les données non utilisées)
```bash
docker system prune -a
```

### Voir l'utilisation des ressources
```bash
docker stats
```

---

## 🔐 Sécurité

### Changer le mot de passe MySQL

1. Se connecter au conteneur
```bash
docker exec -it glamgo-mysql bash
```

2. Dans le conteneur
```bash
mysql -u root -p
# Mot de passe root : root_password

ALTER USER 'glamgo_user'@'%' IDENTIFIED BY 'nouveau_mot_de_passe';
FLUSH PRIVILEGES;
```

3. Mettre à jour `.env` du backend
```bash
DB_PASSWORD=nouveau_mot_de_passe
```

---

## 🐛 Dépannage

### Le backend ne répond pas

1. Vérifier que les conteneurs sont en cours d'exécution
```bash
docker-compose ps
```

2. Voir les logs pour identifier l'erreur
```bash
docker-compose logs -f glamgo-php
docker-compose logs -f glamgo-nginx
```

3. Redémarrer les services
```bash
docker-compose restart
```

### MySQL ne démarre pas

1. Vérifier les logs
```bash
docker-compose logs glamgo-mysql
```

2. Si corruption de données
```bash
docker-compose down
docker volume rm yelabgo_mysql_data
docker-compose up -d
# ATTENTION : Cela supprime toutes les données !
```

### Le frontend ne se connecte pas au backend

1. Vérifier que le backend est accessible
```bash
curl http://localhost:8080/api/health
```

2. Vérifier le fichier `.env.local` du frontend
```bash
cat frontend/.env.local
# Doit contenir : NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

3. Redémarrer le frontend
```bash
cd frontend
rm -rf .next
npm run dev
```

---

## 📝 Fichiers de Configuration Importants

### Backend
- `backend/.env` : Configuration de la base de données
- `backend/public/index.php` : Point d'entrée de l'API
- `backend/routes/api.php` : Définition des routes
- `backend/database/seeds/` : Scripts d'initialisation des données

### Frontend
- `frontend/.env.local` : Configuration de l'API
- `frontend/package.json` : Scripts et dépendances
- `frontend/src/lib/categoryServices.js` : Mapping des catégories

### Docker
- `docker-compose.yml` : Configuration des services
- `backend/Dockerfile` : Image du backend PHP
- `nginx/default.conf` : Configuration Nginx

---

## 💡 Astuces

### Exécuter des commandes PHP dans le conteneur
```bash
docker exec glamgo-php php -v
docker exec glamgo-php php -m  # Liste des modules PHP
```

### Accéder au shell du conteneur
```bash
# Backend PHP
docker exec -it glamgo-php bash

# MySQL
docker exec -it glamgo-mysql bash

# Nginx
docker exec -it glamgo-nginx sh
```

### Voir la structure de la base de données
```bash
docker exec glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo -e "SHOW TABLES;"
docker exec glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo -e "DESCRIBE categories;"
```

---

**Dernière mise à jour** : 18 Novembre 2025
