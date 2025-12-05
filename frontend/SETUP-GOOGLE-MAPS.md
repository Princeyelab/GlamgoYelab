# Configuration Google Maps API pour GlamGo

## 📍 Fonctionnalité : Autocomplétion d'adresse avec coordonnées GPS

GlamGo utilise l'API Google Places pour :
- **Autocomplétion intelligente** des adresses lors de l'inscription
- **Récupération automatique** des coordonnées GPS (latitude/longitude)
- **Amélioration de l'UX** : recherche par rayon et carte des services

---

## 🔑 Étape 1 : Obtenir une clé API Google Maps

### 1. Créer un compte Google Cloud Platform
1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet (ex: "GlamGo Marrakech")
3. Activez la facturation (carte bancaire requise, mais crédit gratuit de $300 USD offert)

### 2. Activer les APIs nécessaires
Dans Google Cloud Console :
1. Allez dans **APIs & Services** > **Library**
2. Activez les APIs suivantes :
   - ✅ **Places API**
   - ✅ **Maps JavaScript API**
   - ✅ **Geocoding API** (optionnel, pour plus de fonctionnalités)

### 3. Créer une clé API
1. Allez dans **APIs & Services** > **Credentials**
2. Cliquez sur **Create Credentials** > **API Key**
3. Une clé sera générée (ex: `AIzaSyC...`)
4. **Important** : Cliquez sur **Restrict Key** pour sécuriser

### 4. Restreindre la clé API (SÉCURITÉ)
Pour éviter les abus et la facturation excessive :

#### Option A : Restriction par domaine (Production)
- Type : **HTTP referrers (web sites)**
- Domaines autorisés :
  ```
  localhost:3000/*
  localhost:3001/*
  localhost:3002/*
  glamgo.ma/*
  *.glamgo.ma/*
  ```

#### Option B : Restriction par API
- Limitez l'utilisation aux APIs :
  - ✅ Places API
  - ✅ Maps JavaScript API

---

## ⚙️ Étape 2 : Configuration dans le projet

### 1. Créer le fichier `.env.local`
À la racine du projet frontend (`/frontend`), créez un fichier `.env.local` :

```bash
# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...votre_clé_ici
```

### 2. Redémarrer le serveur
```bash
npm run dev
```

### 3. Vérification
Ouvrez la console du navigateur lors de l'inscription. Vous devriez voir :
```
✅ Google Places Autocomplete initialisé
```

---

## 💾 Structure de la base de données

### Table `users` (Clients)

Ajoutez ces colonnes à votre table clients :

```sql
ALTER TABLE users ADD COLUMN address VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD COLUMN latitude DECIMAL(10, 8) DEFAULT NULL;
ALTER TABLE users ADD COLUMN longitude DECIMAL(11, 8) DEFAULT NULL;
```

**Important** :
- ✅ Les colonnes acceptent `NULL`
- ✅ L'inscription fonctionne même sans coordonnées GPS
- ✅ Si l'utilisateur tape manuellement, seule l'adresse est enregistrée

### Exemple de données enregistrées

#### Cas 1 : Adresse sélectionnée (avec GPS)
```json
{
  "first_name": "Ahmed",
  "last_name": "Bennani",
  "email": "ahmed@example.ma",
  "phone": "0612345678",
  "address": "Avenue Mohammed V, Marrakech, Maroc",
  "city": "Marrakech",
  "latitude": 31.6295,
  "longitude": -7.9811,
  "terms_accepted": true,
  "terms_accepted_at": "2025-01-20T14:32:15.678Z"
}
```

#### Cas 2 : Adresse tapée manuellement (sans GPS)
```json
{
  "first_name": "Fatima",
  "last_name": "Alaoui",
  "email": "fatima@example.ma",
  "phone": "0687654321",
  "address": "Quartier Gueliz",
  "city": "Marrakech",
  "latitude": null,
  "longitude": null,
  "terms_accepted": true,
  "terms_accepted_at": "2025-01-20T15:45:22.123Z"
}
```

---

## 🎯 Utilisation dans l'application

### 1. Recherche par rayon
Avec les coordonnées GPS, vous pouvez :
```javascript
// Exemple : Trouver des prestataires dans un rayon de 5 km
SELECT * FROM providers
WHERE (
  6371 * acos(
    cos(radians(:client_lat)) *
    cos(radians(latitude)) *
    cos(radians(longitude) - radians(:client_lon)) +
    sin(radians(:client_lat)) *
    sin(radians(latitude))
  )
) <= 5;
```

### 2. Affichage sur carte
```javascript
// React component avec Leaflet ou Google Maps
<Map center={[user.latitude, user.longitude]} zoom={13}>
  <Marker position={[user.latitude, user.longitude]} />
</Map>
```

---

## 💰 Coûts et limites

### Google Places API - Tarification
- **Autocomplétion** : $2.83 pour 1000 requêtes (après crédit gratuit)
- **Crédit mensuel gratuit** : $200 USD/mois
- **Équivalent** : ~70,000 autocompletions gratuites par mois

### Optimisations pour réduire les coûts
1. ✅ **Debouncing** : Le composant attend que l'utilisateur arrête de taper
2. ✅ **Restriction géographique** : Limité au Maroc (`componentRestrictions: { country: 'ma' }`)
3. ✅ **Champs minimaux** : On ne récupère que les données nécessaires
4. ✅ **Cache** : Google met en cache les résultats côté client

---

## 🧪 Tests

### Test 1 : Avec sélection d'adresse
1. Allez sur `/register`
2. Tapez "Avenue Mohammed V, Marrakech"
3. Sélectionnez une suggestion
4. Vérifiez la console : `✅ Adresse sélectionnée avec GPS`
5. Inscrivez-vous
6. Vérifiez en base : `latitude` et `longitude` doivent être remplis

### Test 2 : Sans sélection (saisie manuelle)
1. Tapez "Mon adresse personnelle"
2. Ne sélectionnez PAS de suggestion
3. Inscrivez-vous
4. Vérifiez en base : `latitude` et `longitude` doivent être `NULL`

---

## 🐛 Dépannage

### Problème : Autocomplétion ne s'affiche pas
**Causes possibles** :
- ❌ Clé API manquante ou invalide
- ❌ APIs non activées dans Google Cloud
- ❌ Restriction de domaine trop stricte
- ❌ Bloqueur de publicités (AdBlock peut bloquer Google APIs)

**Solution** :
1. Vérifiez la console navigateur pour les erreurs
2. Testez avec une clé API sans restrictions
3. Désactivez temporairement AdBlock

### Problème : "This page can't load Google Maps correctly"
**Cause** : Facturation non activée sur Google Cloud

**Solution** :
1. Allez dans Google Cloud > Billing
2. Activez la facturation (carte bancaire requise)
3. Le crédit gratuit de $200/mois sera appliqué

### Problème : Coordonnées GPS toujours NULL
**Cause** : L'utilisateur ne sélectionne pas de suggestion

**Solution** : C'est normal ! L'inscription fonctionne quand même. Les coordonnées GPS sont **optionnelles**.

---

## 📚 Ressources

- [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service/overview)
- [Tarification Google Maps Platform](https://developers.google.com/maps/billing-and-pricing/pricing)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

## ✅ Checklist de mise en production

- [ ] Clé API Google créée et configurée
- [ ] Restrictions API activées (domaine + type d'API)
- [ ] Variable d'environnement `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` définie
- [ ] Colonnes `latitude` et `longitude` ajoutées en base de données
- [ ] Backend accepte les champs `latitude` et `longitude` (nullable)
- [ ] Tests effectués (avec et sans sélection)
- [ ] Facturation Google Cloud configurée avec alertes de budget

---

**Note importante** : L'autocomplétion d'adresse est une **amélioration progressive**. Si Google Maps n'est pas configuré, l'inscription fonctionne toujours avec un champ texte classique.
