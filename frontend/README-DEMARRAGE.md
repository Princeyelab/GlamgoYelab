# 🚀 Guide de Démarrage Rapide

## Démarrage de l'Application Complète (Backend + Frontend)

### Option 1 : Démarrage Automatique (Recommandé)

Cette méthode démarre automatiquement le backend (MySQL, PHP, Nginx) ET le frontend :

```bash
cd C:\Dev\YelabGo\frontend
npm run dev:full
```

Le script va :
- ✅ Vérifier si Docker est en cours d'exécution
- ✅ Démarrer automatiquement le backend si nécessaire (MySQL, PHP, Nginx)
- ✅ Attendre que MySQL soit prêt
- ✅ Démarrer le frontend Next.js

### Option 2 : Démarrage Frontend Uniquement

Si le backend est déjà en cours d'exécution :

```bash
cd C:\Dev\YelabGo\frontend
npm run dev
```

---

## 🌐 URLs des Services

Une fois démarrés, les services sont accessibles à :

- **Frontend Next.js** : http://localhost:3000
- **Backend API** : http://localhost:8080
- **MySQL** : localhost:3306

---

## 🔧 Gestion du Backend

### Vérifier l'état des services backend

```bash
cd C:\Dev\YelabGo
docker-compose ps
```

### Démarrer manuellement le backend

```bash
cd C:\Dev\YelabGo
docker-compose up -d
```

### Arrêter le backend

```bash
cd C:\Dev\YelabGo
docker-compose down
```

### Voir les logs du backend

```bash
cd C:\Dev\YelabGo
docker-compose logs -f
```

---

## 📊 Vérifier que tout fonctionne

### Test de l'API Backend

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
    "timestamp": 1763448099,
    "service": "GlamGo API",
    "version": "1.0.0"
  }
}
```

### Test du Frontend

Ouvrez votre navigateur et allez sur : http://localhost:3000

---

## 🐛 Dépannage

### Docker n'est pas en cours d'exécution

Si vous voyez cette erreur : `❌ Docker n'est pas en cours d'exécution`

**Solution** : Démarrez Docker Desktop avant de lancer l'application.

### Les ports sont déjà utilisés

Si les ports 3000 ou 8080 sont déjà utilisés :

**Solution** : Arrêtez les autres applications qui utilisent ces ports ou modifiez les ports dans `docker-compose.yml`.

### Le backend ne répond pas

**Solution** : Vérifiez les logs Docker :

```bash
cd C:\Dev\YelabGo
docker-compose logs -f
```

---

## 📝 Notes Importantes

1. **Docker Desktop doit être en cours d'exécution** avant de démarrer l'application
2. Le script `npm run dev:full` est la méthode recommandée pour démarrer l'application
3. Le backend reste actif même après avoir arrêté le frontend
4. Pour tout arrêter proprement, utilisez `docker-compose down`

---

**Bon développement ! 🎉**
