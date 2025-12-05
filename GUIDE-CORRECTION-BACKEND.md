# 🔧 Guide de Correction Backend - Champs Manquants Providers

**Date:** 22 janvier 2025
**Priorité:** 🔴 CRITIQUE

---

## 📋 Fichiers créés

✅ **Migration SQL:** `backend/database/migrations/006_add_provider_complete_fields.sql`
✅ **Rollback SQL:** `backend/database/migrations/006_rollback_provider_complete_fields.sql`
✅ **Ce guide:** `GUIDE-CORRECTION-BACKEND.md`

---

## 🚀 ÉTAPE 1 : Exécuter la migration SQL

### Option A : Via script de migration

```bash
cd C:/Dev/YelabGo/backend/database
./migrate.sh
```

### Option B : Manuellement via MySQL

```bash
# Se connecter à MySQL
mysql -u root -p

# Sélectionner la base de données
USE glamgo;

# Exécuter la migration
SOURCE C:/Dev/YelabGo/backend/database/migrations/006_add_provider_complete_fields.sql;

# Vérifier que les colonnes ont été ajoutées
DESCRIBE providers;
```

### Vérification

Après la migration, la table `providers` doit avoir ces colonnes supplémentaires :

```sql
- whatsapp VARCHAR(20)
- cin_number VARCHAR(50)
- date_of_birth DATE
- address TEXT
- city VARCHAR(100)
- latitude DECIMAL(10,8)
- longitude DECIMAL(11,8)
- bio TEXT
- experience_years INT
- specialties JSON
- coverage_area JSON
- diploma_certificate_path VARCHAR(255)
- experience_proof_path VARCHAR(255)
- insurance_certificate_path VARCHAR(255)
```

---

## 🚀 ÉTAPE 2 : Modifier ProviderController.php

**Fichier:** `backend/app/controllers/ProviderController.php`

### 2.1 - Modifier la méthode `register()` (ligne 59)

**Remplacer:**
```php
public function register(): void
{
    $data = $this->getJsonInput();

    $errors = $this->validate($data, [
        'email' => 'required|email',
        'password' => 'required|min:6',
        'first_name' => 'required|min:2',
        'last_name' => 'required|min:2',
        'phone' => 'required'
    ]);

    if (!empty($errors)) {
        $this->error('Erreurs de validation', 422, $errors);
    }

    // Vérifier si l'email existe déjà
    if ($this->providerModel->findByEmail($data['email'])) {
        $this->error('Cet email est déjà utilisé', 409);
    }

    // Créer le prestataire
    $providerId = $this->providerModel->create([
        'email' => $data['email'],
        'password' => Password::hash($data['password']),
        'first_name' => $data['first_name'],
        'last_name' => $data['last_name'],
        'phone' => $data['phone'],
        'is_verified' => 0,
        'is_available' => 0
    ]);

    // Générer le token JWT
    $token = JWT::encode([
        'user_id' => $providerId,
        'user_type' => 'provider',
        'email' => $data['email']
    ]);

    $provider = $this->providerModel->find($providerId);
    unset($provider['password']);

    $this->success([
        'token' => $token,
        'provider' => $provider
    ], 'Inscription réussie', 201);
}
```

**Par:**
```php
public function register(): void
{
    $data = $this->getJsonInput();

    $errors = $this->validate($data, [
        'email' => 'required|email',
        'password' => 'required|min:6',
        'first_name' => 'required|min:2',
        'last_name' => 'required|min:2',
        'phone' => 'required',
        'whatsapp' => 'required',
        'cin_number' => 'required',
        'date_of_birth' => 'required',
        'address' => 'required',
        'city' => 'required',
        'experience_years' => 'required',
        'specialties' => 'required'
    ]);

    if (!empty($errors)) {
        $this->error('Erreurs de validation', 422, $errors);
    }

    // Vérifier si l'email existe déjà
    if ($this->providerModel->findByEmail($data['email'])) {
        $this->error('Cet email est déjà utilisé', 409);
    }

    // Préparer les données à insérer
    $insertData = [
        'email' => $data['email'],
        'password' => Password::hash($data['password']),
        'first_name' => $data['first_name'],
        'last_name' => $data['last_name'],
        'phone' => $data['phone'],
        'whatsapp' => $data['whatsapp'],
        'cin_number' => $data['cin_number'],
        'date_of_birth' => $data['date_of_birth'],
        'address' => $data['address'],
        'city' => $data['city'],
        'experience_years' => $data['experience_years'],
        'is_verified' => 0,
        'is_available' => 0
    ];

    // Ajouter les champs optionnels
    if (isset($data['latitude'])) {
        $insertData['latitude'] = $data['latitude'];
    }
    if (isset($data['longitude'])) {
        $insertData['longitude'] = $data['longitude'];
    }
    if (isset($data['bio'])) {
        $insertData['bio'] = $data['bio'];
    }

    // Convertir specialties et coverage_area en JSON
    if (isset($data['specialties'])) {
        $insertData['specialties'] = is_array($data['specialties'])
            ? json_encode($data['specialties'])
            : $data['specialties'];
    }
    if (isset($data['coverage_area'])) {
        $insertData['coverage_area'] = is_array($data['coverage_area'])
            ? json_encode($data['coverage_area'])
            : $data['coverage_area'];
    }

    // Gérer les fichiers uploadés
    if (isset($data['diploma_certificate_path'])) {
        $insertData['diploma_certificate_path'] = $data['diploma_certificate_path'];
    }
    if (isset($data['experience_proof_path'])) {
        $insertData['experience_proof_path'] = $data['experience_proof_path'];
    }
    if (isset($data['insurance_certificate_path'])) {
        $insertData['insurance_certificate_path'] = $data['insurance_certificate_path'];
    }

    // Créer le prestataire
    $providerId = $this->providerModel->create($insertData);

    // Générer le token JWT
    $token = JWT::encode([
        'user_id' => $providerId,
        'user_type' => 'provider',
        'email' => $data['email']
    ]);

    $provider = $this->providerModel->find($providerId);
    unset($provider['password']);

    // Décoder les JSON pour le frontend
    if (isset($provider['specialties']) && is_string($provider['specialties'])) {
        $provider['specialties'] = json_decode($provider['specialties'], true);
    }
    if (isset($provider['coverage_area']) && is_string($provider['coverage_area'])) {
        $provider['coverage_area'] = json_decode($provider['coverage_area'], true);
    }

    $this->success([
        'token' => $token,
        'provider' => $provider
    ], 'Inscription réussie', 201);
}
```

### 2.2 - Modifier la méthode `profile()` (ligne 110)

**Ajouter le décodage JSON après la ligne 119:**

```php
public function profile(): void
{
    $providerId = $_SERVER['USER_ID'];
    $provider = $this->providerModel->find($providerId);

    if (!$provider) {
        $this->error('Prestataire non trouvé', 404);
    }

    unset($provider['password']);

    // ⬇️ AJOUTER CES LIGNES
    // Décoder les JSON pour le frontend
    if (isset($provider['specialties']) && is_string($provider['specialties'])) {
        $provider['specialties'] = json_decode($provider['specialties'], true);
    }
    if (isset($provider['coverage_area']) && is_string($provider['coverage_area'])) {
        $provider['coverage_area'] = json_decode($provider['coverage_area'], true);
    }
    // ⬆️ FIN DE L'AJOUT

    // Ajouter les services
    $provider['services'] = $this->providerModel->getServices($providerId);

    $this->success($provider);
}
```

### 2.3 - Modifier la méthode `updateProfile()` (ligne 130)

**Remplacer ENTIÈREMENT:**

```php
public function updateProfile(): void
{
    $providerId = $_SERVER['USER_ID'];
    $data = $this->getJsonInput();

    $allowedFields = [
        'first_name', 'last_name', 'phone', 'whatsapp', 'cin_number',
        'date_of_birth', 'address', 'city', 'latitude', 'longitude',
        'bio', 'experience_years', 'specialties', 'coverage_area',
        'is_available'
    ];

    $updateData = [];

    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            // Convertir les tableaux en JSON pour specialties et coverage_area
            if ($field === 'specialties' || $field === 'coverage_area') {
                $updateData[$field] = is_array($data[$field])
                    ? json_encode($data[$field])
                    : $data[$field];
            } else {
                $updateData[$field] = $data[$field];
            }
        }
    }

    if (empty($updateData)) {
        $this->error('Aucune donnée à mettre à jour', 400);
    }

    $this->providerModel->update($providerId, $updateData);

    $provider = $this->providerModel->find($providerId);
    unset($provider['password']);

    // Décoder les JSON pour le frontend
    if (isset($provider['specialties']) && is_string($provider['specialties'])) {
        $provider['specialties'] = json_decode($provider['specialties'], true);
    }
    if (isset($provider['coverage_area']) && is_string($provider['coverage_area'])) {
        $provider['coverage_area'] = json_decode($provider['coverage_area'], true);
    }

    $this->success($provider, 'Profil mis à jour');
}
```

### 2.4 - Modifier la méthode `login()` (ligne 22)

**Ajouter le décodage JSON après unset:**

```php
unset($provider['password']);

// ⬇️ AJOUTER CES LIGNES
// Décoder les JSON pour le frontend
if (isset($provider['specialties']) && is_string($provider['specialties'])) {
    $provider['specialties'] = json_decode($provider['specialties'], true);
}
if (isset($provider['coverage_area']) && is_string($provider['coverage_area'])) {
    $provider['coverage_area'] = json_decode($provider['coverage_area'], true);
}
// ⬆️ FIN DE L'AJOUT

$this->success([
    'token' => $token,
    'provider' => $provider
], 'Connexion réussie');
```

---

## 🚀 ÉTAPE 3 : Mettre à jour les données existantes

Pour Marie Laye et les autres prestataires existants, mettre à jour manuellement :

```sql
-- Exemple pour Marie Laye (id=29)
UPDATE providers
SET
    whatsapp = '0612345678',
    cin_number = 'TEMPORAIRE',
    date_of_birth = '1990-01-01',
    address = 'Marrakech',
    city = 'Marrakech',
    experience_years = 5,
    specialties = '["barbier", "coiffure"]',
    coverage_area = '["Marrakech"]'
WHERE id = 29;
```

---

## 🧪 ÉTAPE 4 : Tester

### Test 1 : Profil prestataire
```bash
curl -X GET "http://localhost:8080/api/provider/profile" \
  -H "Authorization: Bearer {token}"
```

**Réponse attendue :** Doit contenir tous les nouveaux champs

### Test 2 : Nouvelle inscription
```bash
curl -X POST "http://localhost:8080/api/provider/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "password123",
    "first_name": "Test",
    "last_name": "User",
    "phone": "0612345678",
    "whatsapp": "0612345678",
    "cin_number": "AB123456",
    "date_of_birth": "1990-01-01",
    "address": "123 Rue Test",
    "city": "Marrakech",
    "experience_years": 5,
    "specialties": ["coiffure", "barbier"]
  }'
```

### Test 3 : Mise à jour profil
```bash
curl -X PUT "http://localhost:8080/api/provider/profile" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "specialties": ["barbier", "coiffure"],
    "bio": "Professionnel expérimenté"
  }'
```

---

## ✅ Vérification finale

Après toutes les modifications :

1. **Frontend** :
   - Aller sur `/provider/profile`
   - Tous les champs doivent s'afficher (pas de "Non renseigné")
   - Les spécialités doivent être visibles

2. **Validation services** :
   - Aller sur `/provider/bidding`
   - Les services compatibles doivent apparaître avec le bouton vert
   - Possibilité de faire une offre

3. **Console browser** :
   - Doit afficher : `✅ [PROVIDER DATA] Specialties merged: ["barbier", "coiffure"]`
   - Plus de message `❌ Invalid or empty specialties array`

---

## 📌 Résumé des changements

### Base de données
- ✅ 14 nouvelles colonnes ajoutées à `providers`
- ✅ 2 nouveaux indexes (city, location_full)

### Backend
- ✅ `register()` - Accepte et sauvegarde tous les champs
- ✅ `profile()` - Retourne tous les champs avec JSON décodé
- ✅ `updateProfile()` - Accepte 15 champs au lieu de 4
- ✅ `login()` - Retourne specialties décodées

### Frontend (déjà fait)
- ✅ Solution temporaire avec localStorage fonctionne
- ✅ Prêt à utiliser les données du backend quand disponibles

---

## 🔄 Rollback si nécessaire

Si un problème survient :

```bash
mysql -u root -p glamgo < C:/Dev/YelabGo/backend/database/migrations/006_rollback_provider_complete_fields.sql
```

Puis restaurer le controller :
```bash
cp C:/Dev/YelabGo/backend/app/controllers/ProviderController.php.backup C:/Dev/YelabGo/backend/app/controllers/ProviderController.php
```

---

**Créé par:** Claude
**Documentation frontend:** `SOLUTION-DONNEES-MANQUANTES.md`
