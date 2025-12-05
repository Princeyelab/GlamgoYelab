# Guide de Déploiement GlamGo

## Architecture

```
[Frontend Vercel] --> [Backend Railway] --> [MySQL Railway]
     Next.js              PHP 8.2             Database
```

---

## ÉTAPE 1 : Déployer le Backend sur Railway

### 1.1 Créer un compte Railway

1. Aller sur https://railway.app
2. Cliquer sur **"Login"** → **"Login with GitHub"**
3. Autoriser Railway à accéder à votre GitHub

### 1.2 Créer le projet Backend

1. Cliquer sur **"New Project"**
2. Sélectionner **"Deploy from GitHub repo"**
3. Choisir le repository `YelabGo` (ou le nom de votre repo)
4. Railway détecte automatiquement le `Dockerfile.railway`

### 1.3 Ajouter la base de données MySQL

1. Dans votre projet Railway, cliquer sur **"+ New"**
2. Sélectionner **"Database"** → **"MySQL"**
3. Railway crée automatiquement la base de données

### 1.4 Configurer les variables d'environnement

Dans le service Backend, aller dans **"Variables"** et ajouter :

```env
# Connexion MySQL (utiliser les références Railway)
DB_HOST=${{MySQL.MYSQLHOST}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_PORT=${{MySQL.MYSQLPORT}}

# Application
APP_DEBUG=false
JWT_SECRET=votre-cle-secrete-unique-32-caracteres
```

### 1.5 Configurer le chemin du Dockerfile

1. Aller dans **"Settings"** du service Backend
2. Dans **"Build"**, définir :
   - **Root Directory** : `backend`
   - **Dockerfile Path** : `Dockerfile.railway`

### 1.6 Déployer

1. Cliquer sur **"Deploy"**
2. Attendre que le build soit terminé (environ 2-3 minutes)
3. Noter l'URL générée : `https://glamgo-backend-xxx.up.railway.app`

### 1.7 Importer la base de données

1. Aller dans le service **MySQL** sur Railway
2. Cliquer sur **"Connect"** → **"Connect via CLI"**
3. Copier la commande de connexion
4. Exécuter le script SQL d'initialisation :

```bash
# Option 1 : Via Railway CLI
railway run mysql < database/init.sql

# Option 2 : Via l'interface Railway "Query"
# Coller le contenu de database/init.sql
```

---

## ÉTAPE 2 : Déployer le Frontend sur Vercel

### 2.1 Créer un compte Vercel

1. Aller sur https://vercel.com
2. Cliquer sur **"Sign Up"** → **"Continue with GitHub"**

### 2.2 Importer le projet

1. Cliquer sur **"Add New..."** → **"Project"**
2. Sélectionner votre repository GitHub
3. Configurer :
   - **Framework Preset** : Next.js (détecté automatiquement)
   - **Root Directory** : `frontend`

### 2.3 Configurer les variables d'environnement

Avant de déployer, ajouter dans **"Environment Variables"** :

```env
NEXT_PUBLIC_API_URL=https://votre-backend.up.railway.app/api
```

**Important** : Remplacez `votre-backend.up.railway.app` par l'URL Railway obtenue à l'étape 1.6

### 2.4 Déployer

1. Cliquer sur **"Deploy"**
2. Attendre la fin du build (environ 1-2 minutes)
3. Votre application est en ligne !

---

## ÉTAPE 3 : Vérification

### 3.1 Tester le Backend

```bash
# Vérifier que l'API répond
curl https://votre-backend.up.railway.app/api/categories
```

### 3.2 Tester le Frontend

1. Ouvrir l'URL Vercel dans un navigateur
2. Vérifier que les catégories s'affichent
3. Tester la connexion avec un compte test

---

## URLs Finales

Après déploiement, vous aurez :

| Service | URL |
|---------|-----|
| Frontend | `https://glamgo.vercel.app` |
| Backend API | `https://glamgo-backend-xxx.up.railway.app/api` |

---

## Compte de Test

```
Email: m.bilucas@hotmail.fr
Mot de passe: laye123
```

---

## Dépannage

### Le frontend ne se connecte pas au backend

1. Vérifier que `NEXT_PUBLIC_API_URL` est correctement configuré sur Vercel
2. Vérifier que l'URL inclut `/api` à la fin
3. Redéployer après modification des variables

### Erreur de base de données

1. Vérifier les variables DB_* sur Railway
2. S'assurer que MySQL est bien démarré
3. Vérifier les logs du backend dans Railway

### CORS Errors

Le backend est déjà configuré pour accepter toutes les origines (`Access-Control-Allow-Origin: *`).
Si problème persiste, vérifier `public/index.php`.

---

## Commandes Utiles

```bash
# Voir les logs Railway
railway logs

# Voir les logs Vercel
vercel logs

# Redéployer Vercel
vercel --prod

# Redéployer Railway
git push origin main
```
