# Intégration Backend - Coordonnées GPS Client

## 📋 Modifications de la base de données

### Table `users` (Clients)

Ajoutez ces colonnes à votre table des utilisateurs clients :

```sql
-- Pour MySQL/MariaDB
ALTER TABLE users
ADD COLUMN address VARCHAR(255) DEFAULT NULL,
ADD COLUMN latitude DECIMAL(10, 8) DEFAULT NULL,
ADD COLUMN longitude DECIMAL(11, 8) DEFAULT NULL;

-- Pour PostgreSQL
ALTER TABLE users
ADD COLUMN address VARCHAR(255) DEFAULT NULL,
ADD COLUMN latitude NUMERIC(10, 8) DEFAULT NULL,
ADD COLUMN longitude NUMERIC(11, 8) DEFAULT NULL;
```

### ⚠️ Points importants
- ✅ Les colonnes doivent accepter `NULL`
- ✅ La validation backend ne doit **PAS** exiger latitude/longitude
- ✅ L'inscription doit fonctionner même sans coordonnées GPS

---

## 📥 Données reçues du frontend

### Exemple de payload d'inscription client

```json
{
  "first_name": "Ahmed",
  "last_name": "Bennani",
  "email": "ahmed@example.ma",
  "phone": "0612345678",
  "whatsapp": "0612345678",
  "address": "Avenue Mohammed V, Marrakech, Maroc",
  "city": "Marrakech",
  "latitude": 31.6295,
  "longitude": -7.9811,
  "password": "motdepasse123",
  "password_confirmation": "motdepasse123",
  "terms_accepted": true,
  "terms_accepted_at": "2025-01-20T14:32:15.678Z"
}
```

### Cas sans coordonnées GPS (saisie manuelle)

```json
{
  "first_name": "Fatima",
  "last_name": "Alaoui",
  "email": "fatima@example.ma",
  "phone": "0687654321",
  "whatsapp": null,
  "address": "Quartier Gueliz",
  "city": "Marrakech",
  "latitude": null,
  "longitude": null,
  "password": "password456",
  "password_confirmation": "password456",
  "terms_accepted": true,
  "terms_accepted_at": "2025-01-20T15:45:22.123Z"
}
```

---

## ✅ Validation backend (Laravel/PHP exemple)

### Règles de validation

```php
public function rules()
{
    return [
        'first_name' => 'required|string|max:100',
        'last_name' => 'required|string|max:100',
        'email' => 'required|email|unique:users,email',
        'phone' => ['required', 'regex:/^(06|07)[0-9]{8}$/'],
        'whatsapp' => ['nullable', 'regex:/^(06|07)[0-9]{8}$/'],
        'address' => 'required|string|max:255',
        'city' => 'required|string|max:100',

        // Coordonnées GPS optionnelles
        'latitude' => 'nullable|numeric|between:-90,90',
        'longitude' => 'nullable|numeric|between:-180,180',

        'password' => 'required|string|min:6|confirmed',
        'terms_accepted' => 'required|boolean|accepted',
        'terms_accepted_at' => 'required|date_format:Y-m-d\TH:i:s.v\Z',
    ];
}
```

### Messages personnalisés

```php
public function messages()
{
    return [
        'latitude.between' => 'Latitude invalide (doit être entre -90 et 90)',
        'longitude.between' => 'Longitude invalide (doit être entre -180 et 180)',
        'terms_accepted.accepted' => 'Vous devez accepter les conditions générales',
    ];
}
```

---

## 🎯 Cas d'usage des coordonnées GPS

### 1. Recherche de prestataires par rayon (MySQL)

```sql
-- Trouver les prestataires dans un rayon de 5 km autour du client
SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.phone,
    (
        6371 * acos(
            cos(radians(:client_latitude)) *
            cos(radians(p.latitude)) *
            cos(radians(p.longitude) - radians(:client_longitude)) +
            sin(radians(:client_latitude)) *
            sin(radians(p.latitude))
        )
    ) AS distance_km
FROM providers p
WHERE
    p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
HAVING distance_km <= 5
ORDER BY distance_km ASC;
```

### 2. Recherche de prestataires par rayon (Laravel)

```php
use Illuminate\Support\Facades\DB;

public function findNearbyProviders($clientLatitude, $clientLongitude, $radiusKm = 5)
{
    return Provider::select('providers.*')
        ->selectRaw(
            '(6371 * acos(
                cos(radians(?)) *
                cos(radians(latitude)) *
                cos(radians(longitude) - radians(?)) +
                sin(radians(?)) *
                sin(radians(latitude))
            )) AS distance',
            [$clientLatitude, $clientLongitude, $clientLatitude]
        )
        ->whereNotNull('latitude')
        ->whereNotNull('longitude')
        ->havingRaw('distance <= ?', [$radiusKm])
        ->orderBy('distance', 'asc')
        ->get();
}
```

### 3. Vérifier si un client a des coordonnées GPS

```php
public function hasGpsCoordinates()
{
    return !is_null($this->latitude) && !is_null($this->longitude);
}
```

### 4. Affichage conditionnel dans l'API

```php
public function toArray($request)
{
    return [
        'id' => $this->id,
        'name' => $this->first_name . ' ' . $this->last_name,
        'email' => $this->email,
        'phone' => $this->phone,
        'address' => $this->address,
        'city' => $this->city,

        // Coordonnées GPS disponibles uniquement si présentes
        'has_gps' => $this->hasGpsCoordinates(),
        'coordinates' => $this->hasGpsCoordinates() ? [
            'latitude' => (float) $this->latitude,
            'longitude' => (float) $this->longitude,
        ] : null,
    ];
}
```

---

## 🔒 Sécurité et validation

### Points de vigilance

1. **Ne jamais exposer les coordonnées exactes publiquement**
   ```php
   // ❌ Mauvais : exposer les coordonnées exactes
   return response()->json([
       'latitude' => $user->latitude,
       'longitude' => $user->longitude,
   ]);

   // ✅ Bon : arrondir ou utiliser une zone approximative
   return response()->json([
       'approximate_location' => [
           'latitude' => round($user->latitude, 2), // Précision ~1km
           'longitude' => round($user->longitude, 2),
       ],
   ]);
   ```

2. **Validation stricte des coordonnées**
   - Latitude : -90 à +90
   - Longitude : -180 à +180
   - Maroc : latitude ~27-36°N, longitude ~1-17°W

3. **Indexation pour performance**
   ```sql
   CREATE INDEX idx_user_location ON users(latitude, longitude);
   ```

---

## 📊 Statistiques et analytics

### Taux d'utilisation de l'autocomplétion

```sql
-- Pourcentage d'utilisateurs avec GPS
SELECT
    COUNT(*) as total_users,
    SUM(CASE WHEN latitude IS NOT NULL THEN 1 ELSE 0 END) as users_with_gps,
    ROUND(
        SUM(CASE WHEN latitude IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
        2
    ) as gps_percentage
FROM users;
```

### Distribution géographique

```sql
-- Nombre d'utilisateurs par ville avec GPS
SELECT
    city,
    COUNT(*) as total,
    SUM(CASE WHEN latitude IS NOT NULL THEN 1 ELSE 0 END) as with_gps
FROM users
GROUP BY city
ORDER BY total DESC;
```

---

## 🧪 Tests backend recommandés

### Test 1 : Inscription avec GPS
```json
POST /api/register
{
  "email": "test.gps@example.ma",
  "phone": "0612345678",
  "address": "Avenue Mohammed V, Marrakech",
  "latitude": 31.6295,
  "longitude": -7.9811,
  ...
}

Expected: 201 Created
Expected DB: latitude = 31.6295, longitude = -7.9811
```

### Test 2 : Inscription sans GPS
```json
POST /api/register
{
  "email": "test.nogps@example.ma",
  "phone": "0687654321",
  "address": "Mon quartier",
  "latitude": null,
  "longitude": null,
  ...
}

Expected: 201 Created
Expected DB: latitude = NULL, longitude = NULL
```

### Test 3 : Coordonnées invalides
```json
POST /api/register
{
  "latitude": 999,
  "longitude": -999,
  ...
}

Expected: 422 Validation Error
```

---

## 📝 Checklist Backend

- [ ] Colonnes `latitude` et `longitude` ajoutées (nullable)
- [ ] Colonne `address` ajoutée (required)
- [ ] Validation accepte `latitude` et `longitude` comme nullable
- [ ] Index créé sur `(latitude, longitude)` pour performance
- [ ] Tests d'inscription avec et sans GPS passent
- [ ] API retourne les coordonnées de manière sécurisée
- [ ] Fonction de recherche par rayon implémentée (optionnel)

---

## 💡 Améliorations futures possibles

1. **Géocodage inversé** : Remplir automatiquement la ville depuis les coordonnées
2. **Validation géographique** : Vérifier que les coordonnées sont bien au Maroc
3. **Calcul de zones de service** : Prévisualiser les prestataires disponibles
4. **Carte interactive** : Afficher une carte dans le profil utilisateur

---

**Note** : L'objectif est de **ne pas bloquer** l'inscription si Google Maps n'est pas disponible ou si l'utilisateur préfère saisir manuellement. Les coordonnées GPS sont un **bonus** pour améliorer l'expérience.
