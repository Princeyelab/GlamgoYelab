# Système de Suivi GPS en Temps Réel - GlamGo

## Vue d'ensemble

Système de partage de position GPS en temps réel entre prestataires et clients, similaire à Uber/InDriver.
Le prestataire partage sa position quand il est "en route" vers le client, permettant au client de suivre son arrivée.

---

## Architecture

### Composants Frontend

#### 1. **LiveLocationTracker** (Prestataire)
**Fichier**: `src/components/LiveLocationTracker/LiveLocationTracker.js`

**Fonctionnalités**:
- Utilise `navigator.geolocation.watchPosition()` pour le suivi GPS continu
- Met à jour automatiquement le backend à chaque changement de position
- Affiche les statistiques en temps réel : position, précision, vitesse, direction
- Boutons Activer/Désactiver le GPS
- Gestion des erreurs de géolocalisation

**Props**:
- `orderId` (number, required) - ID de la commande
- `autoStart` (boolean, optional) - Démarrer automatiquement le tracking
- `onLocationUpdate` (function, optional) - Callback appelé à chaque mise à jour de position

**Utilisation**:
```jsx
<LiveLocationTracker
  orderId={order.id}
  autoStart={false}
/>
```

**Intégration**:
- Affiché dans le dashboard prestataire (`src/app/provider/dashboard/page.js`)
- Visible uniquement quand le statut de la commande est `on_way` ou `in_progress`

---

#### 2. **ProviderLocationMap** (Client)
**Fichier**: `src/components/ProviderLocationMap/ProviderLocationMap.js`

**Fonctionnalités**:
- Récupère la position du prestataire toutes les 5 secondes (polling)
- Calcule la distance en utilisant la formule Haversine
- Estime le temps d'arrivée (vitesse moyenne 30 km/h)
- Affiche les positions du prestataire et du client
- Liens vers Google Maps et Waze pour navigation

**Props**:
- `orderId` (number, required) - ID de la commande
- `clientAddress` (string, optional) - Adresse du client
- `clientLat` (number, optional) - Latitude du client
- `clientLng` (number, optional) - Longitude du client

**Utilisation**:
```jsx
<ProviderLocationMap
  orderId={order.id}
  clientAddress={order.address_line}
  clientLat={order.latitude}
  clientLng={order.longitude}
/>
```

**Intégration**:
- Affiché dans la page détail commande client (`src/app/orders/[id]/page.js`)
- Visible uniquement quand le statut de la commande est `on_way` ou `in_progress`

---

### Backend (Déjà existant)

#### LocationController
**Fichier**: `backend/app/controllers/LocationController.php`

**Endpoint**: `POST /api/provider/location`

**Body**:
```json
{
  "latitude": 31.6295,
  "longitude": -7.9811,
  "order_id": 30
}
```

**Authentification**: Requiert token prestataire

**Fonctionnement**:
1. Met à jour `providers.current_latitude` et `providers.current_longitude`
2. Enregistre dans `location_tracking` si `order_id` fourni
3. Retourne succès

---

#### OrderController / LocationController
**Endpoint**: `GET /api/orders/{orderId}/location`

**Authentification**: Requiert token client

**Réponse**:
```json
{
  "success": true,
  "data": {
    "latitude": "31.6295",
    "longitude": "-7.9811",
    "updated_at": "2025-11-20 10:30:00"
  }
}
```

---

## Base de données

### Table: `providers`
Colonnes utilisées:
- `current_latitude` (DECIMAL) - Position actuelle du prestataire
- `current_longitude` (DECIMAL) - Position actuelle du prestataire

### Table: `location_tracking` (optionnelle)
Historique des positions pour une commande:
- `order_id` - ID de la commande
- `provider_id` - ID du prestataire
- `latitude` - Latitude
- `longitude` - Longitude
- `created_at` - Timestamp

---

## Flux d'utilisation

### Scénario complet

1. **Client crée une commande** (mode bidding ou réservation directe)
   - Commande en statut `pending`

2. **Prestataire accepte la commande**
   - Statut passe à `accepted`
   - Prestataire peut voir la commande dans l'onglet "En cours"

3. **Prestataire clique "En route"**
   - Statut passe à `on_way`
   - Le composant `LiveLocationTracker` apparaît automatiquement
   - Prestataire active le GPS manuellement

4. **Partage GPS actif**
   - `watchPosition()` envoie la position toutes les secondes (ou à chaque changement)
   - Backend reçoit et stocke la position

5. **Client suit en temps réel**
   - Page commande client affiche `ProviderLocationMap`
   - Polling toutes les 5 secondes pour récupérer la position
   - Affichage de la distance et du temps estimé

6. **Prestataire arrive et démarre le service**
   - Statut passe à `in_progress`
   - Prestataire peut désactiver le GPS manuellement
   - Composant reste visible (optionnel pendant le service)

7. **Prestataire termine la commande**
   - Statut passe à `completed`
   - Composant GPS disparaît automatiquement

---

## API Client Methods

Ajoutés dans `src/lib/apiClient.js`:

```javascript
// Prestataire: Mettre à jour sa position
await apiClient.updateProviderLocation(latitude, longitude, orderId);

// Client: Récupérer la position du prestataire
const response = await apiClient.getProviderLocation(orderId);
```

---

## Sécurité et permissions

### Permissions navigateur
- Le prestataire doit autoriser l'accès à la géolocalisation
- Demandé automatiquement par `navigator.geolocation.getCurrentPosition()`
- Gestion des erreurs: PERMISSION_DENIED, POSITION_UNAVAILABLE, TIMEOUT

### Authentification API
- **POST /provider/location**: Token prestataire requis
- **GET /orders/{id}/location**: Token client requis (propriétaire de la commande)

### Protection des données
- Position GPS visible uniquement pour:
  - Le prestataire assigné à la commande
  - Le client propriétaire de la commande
- Historique dans `location_tracking` lié à une commande spécifique

---

## Configuration GPS

### Options de géolocalisation (LiveLocationTracker)

```javascript
{
  enableHighAccuracy: true,  // Utiliser le GPS (haute précision)
  maximumAge: 5000,           // Cache de 5 secondes max
  timeout: 10000,             // Timeout de 10 secondes
}
```

### Fréquence de mise à jour
- **Prestataire → Backend**: À chaque changement de position (1-5 secondes)
- **Client ← Backend**: Polling toutes les 5 secondes

---

## Calcul de distance (Formule Haversine)

Implémenté dans `ProviderLocationMap.js` (lignes 62-81):

```javascript
const calculateDistance = () => {
  if (!providerLocation || !clientLat || !clientLng) return null;

  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(clientLat - providerLocation.lat);
  const dLon = toRad(clientLng - providerLocation.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(providerLocation.lat)) *
      Math.cos(toRad(clientLat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance en km
};
```

**Résultat**: Distance à vol d'oiseau en kilomètres

---

## Estimation du temps d'arrivée

Implémenté dans `ProviderLocationMap.js` (lignes 97-106):

```javascript
const estimatedTime = (distanceKm) => {
  if (!distanceKm) return 'N/A';

  // Estimation: vitesse moyenne 30 km/h en ville
  const hours = distanceKm / 30;
  const minutes = Math.round(hours * 60);

  if (minutes < 1) return '< 1 min';
  return `~${minutes} min`;
};
```

**Hypothèse**: Vitesse moyenne de 30 km/h en milieu urbain (Marrakech)

---

## Intégration Google Maps / Waze

### Google Maps
```javascript
const openInGoogleMaps = () => {
  const url = `https://www.google.com/maps?q=${providerLocation.lat},${providerLocation.lng}`;
  window.open(url, '_blank');
};
```

### Waze
```javascript
const openInWaze = () => {
  const url = `https://www.waze.com/ul?ll=${providerLocation.lat},${providerLocation.lng}&navigate=yes`;
  window.open(url, '_blank');
};
```

---

## Gestion des erreurs

### Côté prestataire (LiveLocationTracker)

**Erreurs gérées**:
- `PERMISSION_DENIED` → "Vous avez refusé l'accès à votre position"
- `POSITION_UNAVAILABLE` → "Position indisponible. Vérifiez que le GPS est activé"
- `TIMEOUT` → "Délai dépassé. Essayez à nouveau"
- Erreur réseau → Log dans console uniquement

### Côté client (ProviderLocationMap)

**Erreurs gérées**:
- Position non disponible → "Le prestataire n'a pas encore partagé sa position"
- Erreur de connexion → "Erreur de connexion"
- Affichage d'un message informatif avec icône 📍

---

## Statistiques affichées

### LiveLocationTracker (Prestataire)
- **Position**: Latitude, Longitude (6 décimales)
- **Précision**: ±X mètres
- **Vitesse**: X km/h (convertie depuis m/s)
- **Direction**: N/NE/E/SE/S/SO/O/NO + degrés
- **Mises à jour**: Compteur d'envois au backend
- **Dernière MàJ**: Temps écoulé depuis dernière position

### ProviderLocationMap (Client)
- **Distance**: X.X km ou X m si < 1 km
- **Temps estimé**: ~X min
- **Position prestataire**: Coordonnées GPS
- **Position client**: Adresse + coordonnées GPS
- **Dernière MàJ**: Temps écoulé depuis dernier polling

---

## Styles SCSS

### LiveLocationTracker
**Fichier**: `src/components/LiveLocationTracker/LiveLocationTracker.module.scss`

**Composants stylistiques**:
- Header avec gradient primaire
- Badge "EN DIRECT" avec animation pulse
- Grille de statistiques (stats)
- Icônes emoji pour une meilleure UX
- Boutons d'action (Activer/Désactiver GPS)

### ProviderLocationMap
**Fichier**: `src/components/ProviderLocationMap/ProviderLocationMap.module.scss`

**Composants stylistiques**:
- Cartes de distance et temps (distanceCard)
- Marqueurs prestataire 🚗 et client 🏠
- Boutons pour Google Maps et Waze
- Animation pulse sur le badge "EN DIRECT"

---

## Améliorations futures possibles

### 1. WebSocket au lieu du polling
**Avantage**: Mises à jour instantanées côté client
**Implémentation**: Utiliser Socket.io ou Pusher

### 2. Historique du trajet
**Avantage**: Afficher le chemin parcouru sur une carte
**Implémentation**: Stocker toutes les positions dans `location_tracking`

### 3. Carte interactive (Google Maps API)
**Avantage**: Affichage sur vraie carte avec marqueurs animés
**Implémentation**: Intégrer `@react-google-maps/api`

### 4. Notification push à l'arrivée
**Avantage**: Alerter le client quand le prestataire est proche
**Implémentation**: Calculer distance et déclencher notification < 500m

### 5. Vitesse réelle du prestataire
**Avantage**: Estimation plus précise du temps d'arrivée
**Implémentation**: Utiliser `position.coords.speed` au lieu de moyenne

---

## Tests recommandés

### Test 1: Partage GPS prestataire
1. Se connecter comme prestataire (Baptiste)
2. Accepter une commande
3. Cliquer "En route" pour passer en statut `on_way`
4. Vérifier que le composant LiveLocationTracker apparaît
5. Cliquer "Activer le GPS"
6. Autoriser la géolocalisation dans le navigateur
7. Vérifier que la position s'affiche avec statistiques
8. Ouvrir la console et confirmer les logs `📍 [TRACKING] Position sent to backend`

### Test 2: Suivi côté client
1. Se connecter comme client (Khadim)
2. Ouvrir la commande dans "Mes commandes"
3. Vérifier que le composant ProviderLocationMap apparaît
4. Vérifier que la position du prestataire s'affiche
5. Vérifier le calcul de distance et temps estimé
6. Tester les boutons Google Maps et Waze

### Test 3: Désactivation GPS
1. Côté prestataire, cliquer "Désactiver" dans LiveLocationTracker
2. Vérifier que le tracking s'arrête
3. Côté client, vérifier que la dernière position reste affichée
4. Vérifier que le timestamp "Mis à jour il y a X secondes" augmente

### Test 4: Erreurs de géolocalisation
1. Refuser les permissions de géolocalisation
2. Vérifier que le message d'erreur s'affiche correctement
3. Activer les permissions et réessayer
4. Vérifier que le tracking fonctionne après autorisation

---

## Troubleshooting

### Le GPS ne démarre pas côté prestataire
**Causes possibles**:
- Permissions géolocalisation refusées
- Navigateur ne supporte pas la géolocalisation
- Connexion HTTPS requise (géolocalisation ne fonctionne pas en HTTP)

**Solution**: Vérifier les permissions dans les paramètres du navigateur

### La position ne s'affiche pas côté client
**Causes possibles**:
- Le prestataire n'a pas activé le GPS
- Erreur de connexion au backend
- Commande pas dans le bon statut (`on_way` ou `in_progress`)

**Solution**: Vérifier la console pour erreurs API, confirmer le statut de la commande

### Distance incorrecte
**Cause**: Coordonnées GPS du client manquantes dans la commande
**Solution**: S'assurer que `order.latitude` et `order.longitude` sont renseignés

### Backend retourne 403 Forbidden
**Cause**: Token d'authentification invalide ou manquant
**Solution**: Vérifier que le token est correctement stocké et envoyé dans les headers

---

## Résumé des modifications

### Nouveaux fichiers
1. `src/components/LiveLocationTracker/LiveLocationTracker.js`
2. `src/components/LiveLocationTracker/LiveLocationTracker.module.scss`
3. `src/components/LiveLocationTracker/index.js`
4. `src/components/ProviderLocationMap/ProviderLocationMap.js`
5. `src/components/ProviderLocationMap/ProviderLocationMap.module.scss`
6. `src/components/ProviderLocationMap/index.js`

### Fichiers modifiés
1. `src/lib/apiClient.js` - Ajout de `updateProviderLocation()` et `getProviderLocation()`
2. `src/app/orders/[id]/page.js` - Intégration de ProviderLocationMap
3. `src/app/provider/dashboard/page.js` - Intégration de LiveLocationTracker + nettoyage ancien code GPS

### Ancien code supprimé
- Fonctions `startLocationSharing()`, `stopLocationSharing()`, `sendLocation()` du dashboard prestataire
- États `sharingLocation`, `locationError`, `locationWatchRef`
- Boutons GPS manuels remplacés par le composant

---

## Conclusion

Le système de suivi GPS en temps réel est maintenant pleinement fonctionnel et intégré dans l'application.
Les prestataires peuvent partager leur position pendant qu'ils sont en route, et les clients peuvent les suivre sur une carte avec distance et temps d'arrivée estimés.

L'implémentation suit le modèle Uber/InDriver et offre une excellente expérience utilisateur pour les deux parties.
