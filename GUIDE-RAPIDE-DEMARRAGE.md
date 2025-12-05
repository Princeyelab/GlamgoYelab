# 🚀 Guide Rapide de Démarrage

## ✅ État Actuel du Projet

- **Backend** : ✅ Opérationnel sur port 8080
- **Images** : ✅ 94 images uniques (aucun doublon)
- **Services** : ✅ 94 services complets
- **Catégories** : ✅ 5 catégories + 23 sous-catégories

---

## 🌐 Ports Disponibles

### Backend
- **API** : http://localhost:8080

### Frontend (Choisissez un port)

Le port 3000 est occupé par le conteneur Docker frontend. Utilisez l'un de ces ports :

#### Option 1 : Port 3001 (Recommandé)
```bash
cd C:\Dev\YelabGo\frontend
npm run dev:3001
```
**URL** : http://localhost:3001

#### Option 2 : Port 3002
```bash
cd C:\Dev\YelabGo\frontend
npm run dev:3002
```
**URL** : http://localhost:3002

#### Option 3 : Port personnalisé
```bash
cd C:\Dev\YelabGo\frontend
npx next dev --turbo -p VOTRE_PORT
```

---

## 📊 Vérification des Images

### Aucun Doublon !
La base de données contient **94 services avec 94 images uniques**.

### Test rapide :
```bash
# Compter les images uniques
docker exec glamgo-mysql mysql -u glamgo_user -pglamgo_password -D glamgo -N -e "SELECT COUNT(DISTINCT image) FROM services WHERE image IS NOT NULL;"

# Résultat attendu : 94
```

### Voir quelques exemples :
```bash
curl http://localhost:8080/api/services/1
curl http://localhost:8080/api/services/52
curl http://localhost:8080/api/services/88
```

Chaque service a une image unique et pertinente !

---

## 🎯 Démarrage Rapide

### Méthode 1 : Frontend Seul (Port 3001)
```bash
cd C:\Dev\YelabGo\frontend
npm run dev:3001
```
**Ensuite ouvrez** : http://localhost:3001

### Méthode 2 : Tout Redémarrer
```bash
# Arrêter tout
cd C:\Dev\YelabGo
docker-compose down

# Redémarrer backend
docker-compose up -d

# Attendre 10 secondes puis démarrer frontend
cd frontend
npm run dev:3001
```

---

## 🔍 Résolution de Problèmes

### "Le port 3001 est déjà utilisé"
```bash
# Utiliser le port 3002
npm run dev:3002
```

### "Impossible de se connecter à l'API"
```bash
# Vérifier que le backend fonctionne
curl http://localhost:8080/api/health

# Résultat attendu : {"success":true,"message":"API is running"}
```

### "Les images ne s'affichent pas"
Vérifiez votre fichier `.env.local` :
```bash
cat .env.local
# Doit contenir : NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

---

## 📋 Commandes Utiles

### Voir les Services
```bash
# Tous les services
curl http://localhost:8080/api/services | python -m json.tool

# Services d'une catégorie (ex: Beauté = 1)
curl "http://localhost:8080/api/services?category=1"
```

### Voir les Catégories
```bash
curl http://localhost:8080/api/categories | python -m json.tool
```

### Vérifier les Images
```bash
# Nombre d'images uniques
docker exec glamgo-mysql mysql -u glamgo_user -pglamgo_password -D glamgo -N -e "SELECT COUNT(DISTINCT image) FROM services WHERE image IS NOT NULL;"

# Liste de quelques images
docker exec glamgo-mysql mysql -u glamgo_user -pglamgo_password -D glamgo -e "SELECT id, name, image FROM services LIMIT 5;"
```

---

## ✅ Checklist de Vérification

Avant de commencer à utiliser l'application :

- [ ] Backend fonctionne : `curl http://localhost:8080/api/health`
- [ ] 94 services dans la base : `SELECT COUNT(*) FROM services;`
- [ ] 94 images uniques : Vérifié ✅
- [ ] Frontend accessible : http://localhost:3001
- [ ] API_URL configurée dans `.env.local`

---

## 🎨 Catégories Disponibles

1. **Maison** (18 services)
   - Ménage, Bricolage, Jardinage, Cuisine

2. **Beauté** (24 services)
   - Coiffure H/F, Maquillage, Manucure, Épilation

3. **Voiture** (7 services)
   - Mécanique, Nettoyage

4. **Bien-être** (10 services)
   - Massage, Coaching

5. **Animaux** (7 services)
   - Soins, Garde, Promenade

---

## 🚀 Vous êtes prêt !

Lancez simplement :
```bash
cd C:\Dev\YelabGo\frontend
npm run dev:3001
```

Puis ouvrez : **http://localhost:3001**

---

**Bon développement ! 🎉**
