# 🧪 Guide de Test - Autocomplétion GPS

## Test rapide (sans configuration Google Maps)

Si vous n'avez pas encore configuré Google Maps API, l'autocomplétion fonctionnera quand même en mode dégradé (champ texte simple).

### ✅ Ce qui fonctionne SANS Google Maps API :
- ✅ Inscription client normale
- ✅ Saisie manuelle de l'adresse
- ✅ Validation du formulaire
- ✅ Envoi des données au backend

### ❌ Ce qui ne fonctionne pas SANS Google Maps API :
- ❌ Suggestions d'adresses
- ❌ Récupération automatique des coordonnées GPS

---

## 🔧 Configuration pour tester l'autocomplétion

### Étape 1 : Créer le fichier .env.local

```bash
cd frontend
cp .env.local.example .env.local
```

### Étape 2 : Ajouter une clé API de test

Éditez `.env.local` :
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=VOTRE_CLE_ICI
```

**Obtenir une clé de test :**
1. Allez sur https://console.cloud.google.com/
2. Créez un projet "GlamGo Test"
3. Activez "Places API" et "Maps JavaScript API"
4. Créez une clé API
5. Copiez-la dans `.env.local`

### Étape 3 : Redémarrer le serveur

```bash
npm run dev
```

---

## ✅ Scénarios de test

### Test 1 : Autocomplétion avec sélection

**Objectif** : Vérifier que les coordonnées GPS sont récupérées

**Étapes :**
1. Allez sur http://localhost:3000/register
2. Remplissez nom, prénom, email, téléphone
3. Dans le champ "Adresse", tapez : `Avenue Mohammed V, Marrakech`
4. **Attendez** que les suggestions apparaissent
5. **Cliquez** sur une suggestion
6. Ouvrez la console du navigateur (F12)
7. Vérifiez le message : `✅ Adresse sélectionnée avec GPS: { latitude: ..., longitude: ... }`
8. Finalisez l'inscription

**Résultat attendu :**
- ✅ Adresse complétée automatiquement
- ✅ Coordonnées GPS enregistrées
- ✅ Message dans la console avec latitude/longitude

---

### Test 2 : Saisie manuelle (sans sélection)

**Objectif** : Vérifier que l'inscription fonctionne sans GPS

**Étapes :**
1. Allez sur http://localhost:3000/register
2. Remplissez nom, prénom, email, téléphone
3. Dans le champ "Adresse", tapez : `Mon quartier personnel`
4. **Ne cliquez PAS** sur une suggestion (si elle apparaît)
5. Continuez et finalisez l'inscription

**Résultat attendu :**
- ✅ Inscription réussie
- ✅ Adresse = "Mon quartier personnel"
- ✅ Latitude = null
- ✅ Longitude = null

---

### Test 3 : Sans clé API Google

**Objectif** : Vérifier le fallback

**Étapes :**
1. Supprimez ou commentez `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` dans `.env.local`
2. Redémarrez le serveur
3. Allez sur http://localhost:3000/register
4. Ouvrez la console (F12)
5. Vérifiez le warning : `⚠️ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY non définie`
6. Tapez dans le champ adresse

**Résultat attendu :**
- ✅ Champ adresse fonctionne comme un input normal
- ✅ Pas d'autocomplétion
- ✅ Inscription fonctionne quand même

---

## 🔍 Vérification des données envoyées

### Avec coordonnées GPS

Ouvrez l'onglet **Network** dans les DevTools (F12) lors de l'inscription.

Recherchez la requête `POST /api/register`, cliquez dessus, et vérifiez le **Payload** :

```json
{
  "first_name": "Ahmed",
  "last_name": "Bennani",
  "email": "ahmed@test.ma",
  "phone": "0612345678",
  "whatsapp": "0612345678",
  "address": "Avenue Mohammed V, Marrakech, Maroc",
  "city": "Marrakech",
  "latitude": 31.6295,        ← Présent
  "longitude": -7.9811,        ← Présent
  "password": "test123",
  "password_confirmation": "test123",
  "terms_accepted": true,
  "terms_accepted_at": "2025-01-20T14:32:15.678Z"
}
```

### Sans coordonnées GPS

```json
{
  ...
  "address": "Mon quartier",
  "latitude": null,            ← null
  "longitude": null,           ← null
  ...
}
```

---

## 🐛 Dépannage

### Problème : Suggestions ne s'affichent pas

**Vérifications :**

1. **Clé API présente ?**
   ```bash
   # Vérifiez que la variable est bien définie
   echo $NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
   ```

2. **Console du navigateur :**
   ```
   ⚠️ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY non définie
   ```
   → Ajoutez la clé dans `.env.local` et redémarrez

3. **Erreur "This page can't load Google Maps correctly" :**
   ```
   ❌ Google Maps JavaScript API error: ApiNotActivatedMapError
   ```
   → Activez "Maps JavaScript API" dans Google Cloud Console

4. **Erreur 403 Forbidden :**
   ```
   ❌ Google Maps JavaScript API error: RefererNotAllowedMapError
   ```
   → Ajoutez `localhost:3000` aux restrictions de la clé API

---

### Problème : Coordonnées toujours NULL

**Vérifications :**

1. **Avez-vous cliqué sur une suggestion ?**
   - ❌ Si vous tapez sans cliquer → Pas de GPS
   - ✅ Si vous cliquez sur suggestion → GPS récupéré

2. **Console du navigateur :**
   ```javascript
   ✅ Adresse sélectionnée avec GPS: { address: "...", latitude: 31.6295, longitude: -7.9811 }
   ```
   Si ce message n'apparaît pas → Vous n'avez pas cliqué sur une suggestion

---

## 📊 Métriques de test

### Indicateurs de succès

- [ ] Autocomplétion s'affiche (suggestions Google)
- [ ] Clic sur suggestion remplit l'adresse
- [ ] Console affiche les coordonnées GPS
- [ ] Inscription fonctionne avec GPS
- [ ] Inscription fonctionne sans GPS (saisie manuelle)
- [ ] Inscription fonctionne sans clé API (fallback)

### Temps de réponse attendu

- Chargement Google Maps API : ~500ms
- Affichage des suggestions : ~200-500ms (après frappe)
- Récupération GPS : instantané (au clic)

---

## 🎯 Tests avancés

### Test géolocalisation navigateur

Vous pouvez combiner avec la géolocalisation du navigateur :

```javascript
// Dans la console du navigateur
navigator.geolocation.getCurrentPosition(
  (position) => {
    console.log('Position actuelle:', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    });
  }
);
```

### Test avec différentes adresses marocaines

- ✅ `Jemaa el-Fna, Marrakech`
- ✅ `Hassan II Mosque, Casablanca`
- ✅ `Rabat Ville Train Station`
- ✅ `Kasbah des Oudayas, Rabat`
- ✅ `Place 9 Avril, Tanger`

---

## ✅ Checklist finale

Avant de considérer la fonctionnalité comme prête :

- [ ] Google Maps API key configurée
- [ ] Autocomplétion fonctionne sur inscription client
- [ ] Coordonnées GPS récupérées quand suggestion sélectionnée
- [ ] Inscription fonctionne sans sélection (fallback)
- [ ] Backend accepte `latitude` et `longitude` (nullable)
- [ ] Tests en base de données confirment les valeurs NULL/non-NULL
- [ ] Documentation lue et comprise

---

**🎉 Félicitations !** Vous avez maintenant une autocomplétion d'adresse intelligente avec récupération GPS optionnelle, sans friction pour l'utilisateur !
