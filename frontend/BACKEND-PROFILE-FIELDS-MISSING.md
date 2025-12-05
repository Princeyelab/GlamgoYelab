# 🚨 PROBLÈME BACKEND - Champs manquants dans `/provider/profile`

**Date:** 22 janvier 2025
**Priorité:** 🔴 CRITIQUE

---

## 📋 Résumé du problème

L'endpoint **GET `/api/provider/profile`** ne retourne que **15 champs** au lieu de tous les champs de la table `providers`.

### Champs actuellement retournés (15) :
```json
{
  "id": 29,
  "email": "m.bi741@hotmail.fr",
  "first_name": "Marie",
  "last_name": "Laye",
  "phone": "0612345678",
  "avatar": null,
  "is_verified": true,
  "is_available": true,
  "current_latitude": null,
  "current_longitude": null,
  "rating": 4.0,
  "total_reviews": 0,
  "created_at": "2025-01-22...",
  "updated_at": "2025-01-22...",
  "services": [...]
}
```

---

## ❌ Champs MANQUANTS (critiques)

Ces champs sont **OBLIGATOIRES** lors de l'inscription mais **ne sont PAS retournés** par l'API :

### 1. **specialties** (CRITIQUE)
- **Type:** JSON array
- **Exemple:** `["barbier", "coiffure"]`
- **Impact:** Le système de validation des services ne fonctionne pas sans ce champ
- **Utilisé dans:** Page enchères, validation des offres

### 2. **whatsapp**
- **Type:** VARCHAR
- **Exemple:** `"0612345678"`
- **Validé à l'inscription:** Oui

### 3. **cin_number**
- **Type:** VARCHAR
- **Exemple:** `"AB123456"`
- **Validé à l'inscription:** Oui (obligatoire)

### 4. **address**
- **Type:** TEXT
- **Exemple:** `"123 Rue Mohammed V"`
- **Validé à l'inscription:** Oui

### 5. **city**
- **Type:** VARCHAR
- **Exemple:** `"Marrakech"`
- **Validé à l'inscription:** Oui

### 6. **latitude**
- **Type:** DECIMAL
- **Exemple:** `31.6295`

### 7. **longitude**
- **Type:** DECIMAL
- **Exemple:** `-7.9811`

### 8. **bio**
- **Type:** TEXT
- **Exemple:** `"Coiffeur professionnel avec 5 ans d'expérience"`

### 9. **experience_years**
- **Type:** INT
- **Exemple:** `5`
- **Validé à l'inscription:** Oui (obligatoire)

### 10. **coverage_area**
- **Type:** JSON array
- **Exemple:** `["Marrakech", "Casablanca"]`

### 11. **date_of_birth**
- **Type:** DATE
- **Exemple:** `"1990-05-15"`
- **Validé à l'inscription:** Oui (obligatoire, 18+)

### 12. Documents uploadés
- **diploma_certificate_path** - Chemin du diplôme
- **experience_proof_path** - Chemin de la preuve d'expérience
- **insurance_certificate_path** - Chemin de l'assurance

---

## 🔧 Solution requise

### Modifier le controller backend : `ProviderController.php`

**Méthode:** `getProfile()`

**Fichier probable:** `backend/app/Http/Controllers/ProviderController.php`

```php
public function getProfile(Request $request)
{
    $provider = $request->user(); // Ou Auth::guard('provider')->user()

    // AJOUTER TOUS LES CHAMPS
    return response()->json([
        'success' => true,
        'data' => [
            'id' => $provider->id,
            'email' => $provider->email,
            'first_name' => $provider->first_name,
            'last_name' => $provider->last_name,
            'phone' => $provider->phone,
            'whatsapp' => $provider->whatsapp,
            'cin_number' => $provider->cin_number,
            'date_of_birth' => $provider->date_of_birth,
            'address' => $provider->address,
            'city' => $provider->city,
            'latitude' => $provider->latitude,
            'longitude' => $provider->longitude,
            'bio' => $provider->bio,
            'experience_years' => $provider->experience_years,
            'specialties' => $provider->specialties, // JSON
            'coverage_area' => $provider->coverage_area, // JSON
            'avatar' => $provider->avatar,
            'is_verified' => $provider->is_verified,
            'is_available' => $provider->is_available,
            'current_latitude' => $provider->current_latitude,
            'current_longitude' => $provider->current_longitude,
            'rating' => $provider->rating,
            'total_reviews' => $provider->total_reviews,
            'diploma_certificate_path' => $provider->diploma_certificate_path,
            'experience_proof_path' => $provider->experience_proof_path,
            'insurance_certificate_path' => $provider->insurance_certificate_path,
            'created_at' => $provider->created_at,
            'updated_at' => $provider->updated_at,
            'services' => $provider->services,
        ]
    ]);
}
```

---

## 🧪 Test

Après correction, l'endpoint doit retourner :

```bash
curl -X GET "http://localhost:8080/api/provider/profile" \
  -H "Authorization: Bearer {token}"
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "id": 29,
    "email": "m.bi741@hotmail.fr",
    "first_name": "Marie",
    "last_name": "Laye",
    "phone": "0612345678",
    "whatsapp": "0612345678",
    "cin_number": "AB123456",
    "date_of_birth": "1995-03-15",
    "address": "123 Rue Mohammed V",
    "city": "Marrakech",
    "latitude": 31.6295,
    "longitude": -7.9811,
    "bio": "Barbier professionnel",
    "experience_years": 5,
    "specialties": ["barbier", "coiffure"],
    "coverage_area": ["Marrakech"],
    "avatar": null,
    "is_verified": true,
    "is_available": true,
    "current_latitude": null,
    "current_longitude": null,
    "rating": 4.0,
    "total_reviews": 0,
    "diploma_certificate_path": "/uploads/diplomas/...",
    "experience_proof_path": "/uploads/experience/...",
    "insurance_certificate_path": "/uploads/insurance/...",
    "created_at": "2025-01-22T10:00:00Z",
    "updated_at": "2025-01-22T10:00:00Z",
    "services": [...]
  }
}
```

---

## 📌 Impact actuel

### Bugs causés par ce problème :

1. ❌ **Validation des services ne fonctionne pas**
   - Les prestataires ne peuvent pas faire d'offres car `specialties` est undefined
   - Message d'erreur : "Missing data, returning false"

2. ❌ **Page de profil affiche "Non renseigné"**
   - WhatsApp, CIN, Ville, Adresse, Années d'expérience
   - Tous ces champs ont été validés à l'inscription mais n'apparaissent pas

3. ❌ **Impossible de modifier le profil correctement**
   - Les champs manquants ne peuvent pas être pré-remplis dans le formulaire d'édition

---

## ⚠️ Note importante

Les champs **`professional_license`** et **`starting_price`** ont été **SUPPRIMÉS** du formulaire d'inscription.
**NE PAS** les retourner dans l'API (ou mettre à NULL).

---

**Développeur frontend:** Claude
**Fichier de log:** Console browser - `🔍 [PROFILE PAGE]`
