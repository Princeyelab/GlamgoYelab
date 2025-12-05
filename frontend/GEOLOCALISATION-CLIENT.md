# 📍 Géolocalisation GPS pour les clients

**Date**: 20 novembre 2025
**Fonctionnalité**: Partage optionnel de la position GPS du client

---

## 🎯 Objectif

À Marrakech, beaucoup d'adresses sont similaires (ex: "123 Avenue Mohammed V" existe dans plusieurs quartiers).
Le partage de position GPS permet au prestataire de localiser précisément le client.

---

## ✅ Implémentation

### 1. Frontend - Composant LocationPicker

**Fichier**: `src/components/LocationPicker/LocationPicker.js`

**Fonctionnalités**:
- ✅ Champ d'adresse textuelle (obligatoire)
- ✅ Bouton "Partager ma position GPS" (optionnel)
- ✅ Utilise l'API Geolocation du navigateur
- ✅ Demande la permission à l'utilisateur
- ✅ Affiche les coordonnées et la précision
- ✅ Permet de supprimer la position partagée

**Interface**:
```javascript
<LocationPicker
  onLocationChange={(data) => {
    // data = { address, latitude, longitude }
  }}
  initialAddress="Adresse initiale"
/>
```

**Gestion des permissions**:
```javascript
navigator.permissions.query({ name: 'geolocation' })
  .then((result) => {
    // result.state: 'granted', 'denied', 'prompt'
  });
```

**Obtenir la position**:
```javascript
navigator.geolocation.getCurrentPosition(
  (position) => {
    const { latitude, longitude, accuracy } = position.coords;
    // Précision en mètres
  },
  (error) => {
    // PERMISSION_DENIED, POSITION_UNAVAILABLE, TIMEOUT
  },
  {
    enableHighAccuracy: true,  // GPS haute précision
    timeout: 10000,             // 10 secondes
    maximumAge: 0               // Pas de cache
  }
);
```

---

### 2. Frontend - Intégration dans le formulaire de réservation

**Fichier**: `src/app/booking/[id]/page.js`

**Modifications**:
```javascript
// State étendu
const [formData, setFormData] = useState({
  address: '',
  latitude: null,   // Nouveau
  longitude: null,  // Nouveau
  // ...
});

// Handler pour LocationPicker
const handleLocationChange = (locationData) => {
  setFormData((prev) => ({
    ...prev,
    address: locationData.address,
    latitude: locationData.latitude,
    longitude: locationData.longitude,
  }));
};

// Envoi au backend (mode bidding)
await apiClient.createBiddingOrder({
  service_id: parseInt(params.id),
  user_proposed_price: parseFloat(formData.user_proposed_price),
  address: formData.address,
  latitude: formData.latitude,     // Nouveau
  longitude: formData.longitude,   // Nouveau
  notes: formData.notes,
  bid_expiry_hours: parseInt(formData.bid_expiry_hours),
});

// Envoi au backend (mode classique)
await apiClient.createOrder({
  service_id: parseInt(params.id),
  address: formData.address,
  latitude: formData.latitude,     // Nouveau
  longitude: formData.longitude,   // Nouveau
  scheduled_at: scheduledAt,
  notes: formData.notes,
});
```

**Rendu**:
```jsx
<LocationPicker
  onLocationChange={handleLocationChange}
  initialAddress={formData.address}
/>
```

---

### 3. Backend - Sauvegarde des coordonnées GPS

#### A. BiddingController.php (lignes 36-65)

```php
// Gérer l'adresse avec coordonnées GPS optionnelles
elseif (!empty($data['address'])) {
    $db = Database::getInstance();
    $stmt = $db->prepare(
        "INSERT INTO user_addresses (user_id, label, address_line, city, latitude, longitude)
         VALUES (?, ?, ?, ?, ?, ?)"
    );

    // Récupérer les coordonnées si présentes
    $latitude = isset($data['latitude']) && is_numeric($data['latitude'])
        ? $data['latitude']
        : null;
    $longitude = isset($data['longitude']) && is_numeric($data['longitude'])
        ? $data['longitude']
        : null;

    $stmt->execute([
        $userId,
        'Commande enchères',
        $data['address'],
        'Marrakech',
        $latitude,
        $longitude
    ]);
    $addressId = $db->lastInsertId();

    if ($latitude && $longitude) {
        error_log("🗺️ [BIDDING] GPS coordinates saved: Lat {$latitude}, Lng {$longitude}");
    }
}
```

#### B. OrderController.php (lignes 45-67)

```php
// Identique à BiddingController
// Créer une nouvelle adresse temporaire avec coordonnées GPS optionnelles
$latitude = isset($data['latitude']) && is_numeric($data['latitude']) ? $data['latitude'] : null;
$longitude = isset($data['longitude']) && is_numeric($data['longitude']) ? $data['longitude'] : null;

$stmt->execute([$userId, 'Réservation', $data['address'], 'Marrakech', $latitude, $longitude]);
```

---

### 4. Base de données

**Table**: `user_addresses`

```sql
CREATE TABLE user_addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    label VARCHAR(50) NOT NULL,
    address_line TEXT NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Marrakech',
    postal_code VARCHAR(10),
    latitude DECIMAL(10,8) NULL,      -- Latitude GPS (optionnelle)
    longitude DECIMAL(11,8) NULL,     -- Longitude GPS (optionnelle)
    is_default TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Précision**:
- `DECIMAL(10,8)` pour latitude : ±90° avec 8 décimales (~1mm de précision)
- `DECIMAL(11,8)` pour longitude : ±180° avec 8 décimales (~1mm de précision)

**Exemples de coordonnées Marrakech**:
- Place Jemaa el-Fna : `31.625964, -7.989145`
- Jardin Majorelle : `31.641070, -8.002860`
- Gare de Marrakech : `31.623800, -8.022900`

---

## 🧪 Tests

### Test 1: Création de commande avec GPS

```bash
# Frontend (navigateur)
1. Aller sur /booking/{service_id}?mode=bidding
2. Remplir le formulaire
3. Cliquer sur "Partager ma position GPS"
4. Autoriser la géolocalisation
5. Vérifier que les coordonnées s'affichent
6. Soumettre le formulaire

# Backend (logs)
docker logs glamgo-php --tail 50 | grep "GPS"
# Résultat attendu:
# 🗺️ [BIDDING] GPS coordinates saved: Lat 31.625964, Lng -7.989145
```

### Test 2: Vérification BDD

```sql
-- Récupérer les adresses avec GPS
SELECT
    id,
    user_id,
    address_line,
    latitude,
    longitude,
    created_at
FROM user_addresses
WHERE latitude IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- Résultat attendu:
-- Des adresses avec latitude et longitude remplies
```

### Test 3: Calcul de distance

```sql
-- Distance entre deux points (formule Haversine simplifiée)
-- Exemple: Distance entre l'adresse client et le prestataire
SELECT
    ua.address_line as client_address,
    ua.latitude as client_lat,
    ua.longitude as client_lng,
    p.latitude as provider_lat,
    p.longitude as provider_lng,
    (
        6371 * acos(
            cos(radians(ua.latitude)) *
            cos(radians(p.latitude)) *
            cos(radians(p.longitude) - radians(ua.longitude)) +
            sin(radians(ua.latitude)) *
            sin(radians(p.latitude))
        )
    ) AS distance_km
FROM user_addresses ua
CROSS JOIN providers p
WHERE ua.latitude IS NOT NULL
  AND p.latitude IS NOT NULL
LIMIT 10;
```

---

## 📱 Utilisation côté prestataire

### Affichage des coordonnées

Quand le prestataire consulte une commande, il peut voir:

1. **L'adresse textuelle** (toujours disponible)
   ```
   123 Avenue Mohammed V, Guéliz, Marrakech
   ```

2. **Les coordonnées GPS** (si partagées)
   ```
   📍 Position GPS: 31.625964, -7.989145
   Précision: ±15m
   ```

3. **Lien Google Maps** (si coordonnées disponibles)
   ```
   <a href="https://www.google.com/maps?q=31.625964,-7.989145" target="_blank">
     Ouvrir dans Google Maps
   </a>
   ```

4. **Lien Waze** (si coordonnées disponibles)
   ```
   <a href="https://www.waze.com/ul?ll=31.625964,-7.989145&navigate=yes" target="_blank">
     Naviguer avec Waze
   </a>
   ```

---

## 🔐 Sécurité et confidentialité

### Consentement explicite
✅ Le partage de position est **OPTIONNEL**
✅ L'utilisateur doit **autoriser** explicitement via le navigateur
✅ L'utilisateur peut **supprimer** la position avant envoi

### Stockage
✅ Les coordonnées sont stockées dans `user_addresses` (table sécurisée)
✅ Accessible uniquement :
   - Par le client propriétaire
   - Par le prestataire assigné à la commande
   - Pas d'accès public

### Utilisation
✅ Les coordonnées ne sont utilisées QUE pour :
   - Faciliter la localisation par le prestataire
   - Calculer des distances (fonctionnalité future)
   - Optimiser les trajets

❌ Les coordonnées ne sont JAMAIS :
   - Partagées avec des tiers
   - Utilisées pour du tracking continu
   - Vendues ou monétisées

---

## 🚀 Améliorations futures

### 1. Reverse Geocoding
Utiliser l'API Google Maps Geocoding pour obtenir automatiquement l'adresse depuis les coordonnées GPS.

```javascript
// Exemple
const geocoder = new google.maps.Geocoder();
geocoder.geocode({ location: { lat, lng } }, (results, status) => {
  if (status === 'OK' && results[0]) {
    setAddress(results[0].formatted_address);
  }
});
```

### 2. Carte interactive
Afficher une carte dans le formulaire pour que le client puisse :
- Voir sa position actuelle
- Ajuster manuellement le marqueur
- Vérifier visuellement l'adresse

### 3. Calcul de distance automatique
Afficher au prestataire sa distance par rapport au client :
```
📍 Client à 2.3 km de vous
⏱️ Environ 8 minutes en voiture
```

### 4. Suggestions d'itinéraire
Intégration avec Google Maps Directions API pour proposer l'itinéraire optimal.

---

## ✅ Résumé

| Composant | Status | Fichier |
|-----------|--------|---------|
| Composant LocationPicker | ✅ Créé | `src/components/LocationPicker/` |
| Intégration formulaire | ✅ Fait | `src/app/booking/[id]/page.js` |
| Backend BiddingController | ✅ Modifié | `backend/app/controllers/BiddingController.php` |
| Backend OrderController | ✅ Modifié | `backend/app/controllers/OrderController.php` |
| Base de données | ✅ OK | Table `user_addresses` déjà prête |

**Fonctionnalité opérationnelle !** 🎉

Le client peut maintenant partager sa position GPS de manière optionnelle lors de la création d'une commande.
Les coordonnées sont sauvegardées et pourront être utilisées par le prestataire pour naviguer facilement.
