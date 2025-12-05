# 🐛 Débogage : Les offres ne sont pas reçues par le client

## 📋 Problème rapporté

Vous avez fait une offre côté prestataire, mais le client ne l'a pas reçue.

## ✅ Ce qui est déjà en place (Frontend)

### Côté Prestataire (`/provider/bidding`)
Le prestataire peut créer des offres via :
```javascript
// Fichier: src/app/provider/bidding/page.js:62-91
const handleCreateBid = async (orderId, proposedPrice) => {
  const response = await apiClient.createBid({
    order_id: orderId,
    proposed_price: parseFloat(proposedPrice),
    estimated_arrival_minutes: 30,
    message: 'Je peux vous fournir un excellent service'
  });
}
```

**API utilisée** : `POST /bids`

### Côté Client (`/orders/[id]`)
Le client peut voir les offres via :
```javascript
// Fichier: src/app/orders/[id]/page.js:57-69
const fetchBids = async () => {
  const response = await apiClient.getOrderBids(params.id);
  if (response.success) {
    setBids(response.data.bids || []);
  }
}
```

**API utilisée** : `GET /orders/{orderId}/bids`

**Interface d'affichage** : Lignes 340-436
- Section "💰 Offres reçues"
- Bouton "🔄 Actualiser"
- Liste des offres avec détails (prix, prestataire, message)
- Bouton "✅ Accepter cette offre"

## 🔍 Points de vérification

### 1. ✅ Frontend - Création de l'offre (Prestataire)

**Fichier** : `src/app/provider/bidding/page.js`

**Vérifications à faire** :
```javascript
// Est-ce que la requête part bien ?
console.log('Creating bid for order:', orderId, 'with price:', proposedPrice);

// Est-ce que la réponse du serveur est OK ?
const response = await apiClient.createBid({...});
console.log('Bid creation response:', response);

// Y a-t-il une erreur ?
if (!response.success) {
  console.error('Bid creation failed:', response.message);
}
```

**Ajoutez ceci temporairement (ligne 69)** :
```javascript
const handleCreateBid = async (orderId, proposedPrice) => {
  console.log('🔵 Creating bid:', { orderId, proposedPrice }); // ← AJOUTEZ CECI

  // ... code existant ...

  if (response.success) {
    console.log('✅ Bid created successfully:', response); // ← AJOUTEZ CECI
    setSuccess(`✅ Offre créée avec succès !`);
  } else {
    console.error('❌ Bid creation failed:', response); // ← AJOUTEZ CECI
    setError(response.message || 'Erreur lors de la création de l\'offre');
  }
}
```

### 2. ✅ Frontend - Récupération des offres (Client)

**Fichier** : `src/app/orders/[id]/page.js`

**Vérifications à faire** :
```javascript
// Est-ce que la requête part bien ?
console.log('Fetching bids for order:', params.id);

// Est-ce que les offres sont reçues ?
const response = await apiClient.getOrderBids(params.id);
console.log('Bids response:', response);
console.log('Number of bids:', response.data?.bids?.length);
```

**Ajoutez ceci temporairement (ligne 57)** :
```javascript
const fetchBids = async () => {
  console.log('🔵 Fetching bids for order:', params.id); // ← AJOUTEZ CECI
  setLoadingBids(true);
  try {
    const response = await apiClient.getOrderBids(params.id);
    console.log('✅ Bids response:', response); // ← AJOUTEZ CECI
    console.log('Number of bids:', response.data?.bids?.length); // ← AJOUTEZ CECI

    if (response.success) {
      setBids(response.data.bids || []);
    }
  } catch (err) {
    console.error('❌ Error fetching bids:', err); // ← AJOUTEZ CECI
  } finally {
    setLoadingBids(false);
  }
}
```

### 3. 🔴 Backend - API `/bids` (POST)

**Ce qui DOIT être fait côté backend** :

#### Endpoint : `POST /bids`
```php
// Route Laravel (exemple)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/bids', [BidController::class, 'create']);
});

// Controller
public function create(Request $request)
{
    $validated = $request->validate([
        'order_id' => 'required|exists:orders,id',
        'proposed_price' => 'required|numeric|min:0',
        'estimated_arrival_minutes' => 'nullable|integer|min:0',
        'message' => 'nullable|string|max:500'
    ]);

    // Vérifier que la commande est en mode bidding
    $order = Order::findOrFail($validated['order_id']);

    if ($order->pricing_mode !== 'bidding') {
        return response()->json([
            'success' => false,
            'message' => 'Cette commande n\'accepte pas les enchères'
        ], 400);
    }

    // Vérifier que les enchères ne sont pas expirées
    if ($order->bid_expiry_time && now() > $order->bid_expiry_time) {
        return response()->json([
            'success' => false,
            'message' => 'Les enchères pour cette commande sont expirées'
        ], 400);
    }

    // Créer l'offre
    $bid = Bid::create([
        'order_id' => $validated['order_id'],
        'provider_id' => auth()->id(), // ID du prestataire authentifié
        'proposed_price' => $validated['proposed_price'],
        'estimated_arrival_minutes' => $validated['estimated_arrival_minutes'],
        'message' => $validated['message'],
        'status' => 'pending'
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Offre créée avec succès',
        'data' => [
            'bid' => $bid
        ]
    ]);
}
```

#### Endpoint : `GET /orders/{orderId}/bids`
```php
// Route
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/orders/{orderId}/bids', [OrderController::class, 'getBids']);
});

// Controller
public function getBids($orderId)
{
    $order = Order::findOrFail($orderId);

    // Vérifier que c'est la commande de l'utilisateur connecté
    if ($order->user_id !== auth()->id()) {
        return response()->json([
            'success' => false,
            'message' => 'Accès refusé'
        ], 403);
    }

    // Récupérer les offres avec les infos du prestataire
    $bids = Bid::where('order_id', $orderId)
        ->join('providers', 'bids.provider_id', '=', 'providers.id')
        ->select(
            'bids.*',
            'providers.first_name',
            'providers.last_name',
            'providers.phone',
            'providers.rating',
            'providers.review_count'
        )
        ->orderBy('bids.proposed_price', 'asc') // Prix croissant
        ->get();

    return response()->json([
        'success' => true,
        'data' => [
            'bids' => $bids
        ]
    ]);
}
```

### 4. 🗄️ Base de données - Table `bids`

**Schema requis** :
```sql
CREATE TABLE bids (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    provider_id BIGINT UNSIGNED NOT NULL,
    proposed_price DECIMAL(10,2) NOT NULL,
    estimated_arrival_minutes INT NULL,
    message TEXT NULL,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,

    INDEX idx_order_id (order_id),
    INDEX idx_provider_id (provider_id),
    INDEX idx_status (status)
);
```

**Vérifier que la table existe** :
```sql
SHOW TABLES LIKE 'bids';
```

**Vérifier les données** :
```sql
-- Toutes les offres
SELECT * FROM bids;

-- Offres pour une commande spécifique
SELECT * FROM bids WHERE order_id = 1;

-- Dernières offres créées
SELECT * FROM bids ORDER BY created_at DESC LIMIT 10;
```

## 🔧 Tests à effectuer

### Test 1 : Vérifier la création de l'offre

1. **Côté prestataire** :
   - Ouvrez la console du navigateur (F12)
   - Allez sur `/provider/bidding`
   - Créez une offre
   - Vérifiez les logs console :
     ```
     🔵 Creating bid: {orderId: 1, proposedPrice: "150"}
     ✅ Bid created successfully: {success: true, data: {...}}
     ```

2. **Vérifiez la requête réseau** :
   - Onglet "Network" dans DevTools
   - Cherchez la requête `POST /bids`
   - Vérifiez le statut : doit être `200 OK`
   - Vérifiez la réponse JSON

### Test 2 : Vérifier la base de données

```sql
-- Après avoir créé l'offre, vérifiez qu'elle existe
SELECT * FROM bids ORDER BY created_at DESC LIMIT 1;

-- Résultat attendu :
-- id | order_id | provider_id | proposed_price | status | created_at
-- 1  | 1        | 5           | 150.00         | pending| 2025-01-20...
```

### Test 3 : Vérifier la récupération côté client

1. **Côté client** :
   - Ouvrez la console (F12)
   - Allez sur `/orders/[id]` (remplacez [id] par l'ID de la commande)
   - Vérifiez les logs :
     ```
     🔵 Fetching bids for order: 1
     ✅ Bids response: {success: true, data: {bids: [...]}}
     Number of bids: 1
     ```

2. **Vérifiez la requête réseau** :
   - Onglet "Network"
   - Cherchez `GET /orders/1/bids`
   - Statut : `200 OK`
   - Réponse doit contenir les offres

### Test 4 : Test manuel complet

1. Créez une commande en mode enchères (client)
2. Notez l'ID de la commande
3. Connectez-vous en tant que prestataire
4. Créez une offre sur cette commande
5. Revenez sur le compte client
6. Allez sur la page de détail de la commande
7. Cliquez sur "🔄 Actualiser" dans la section offres
8. L'offre devrait apparaître

## 🚨 Problèmes possibles et solutions

### Problème 1 : L'offre n'apparaît pas du tout

**Causes possibles** :
- Backend ne sauvegarde pas l'offre
- Table `bids` n'existe pas
- Erreur SQL

**Solution** :
```bash
# Vérifier les logs backend
tail -f storage/logs/laravel.log  # Laravel
tail -f var/log/nginx/error.log    # Nginx

# Vérifier la base de données
mysql -u root -p
USE glamgo;
SELECT * FROM bids;
```

### Problème 2 : L'offre est créée mais le client ne la voit pas

**Causes possibles** :
- Endpoint `GET /orders/{id}/bids` ne retourne pas les données
- Frontend ne rafraîchit pas automatiquement
- Filtre SQL incorrect

**Solution** :
```javascript
// Ajouter un auto-refresh dans le frontend
useEffect(() => {
  if (order?.pricing_mode === 'bidding' && order?.status === 'pending') {
    const interval = setInterval(fetchBids, 10000); // Refresh toutes les 10s
    return () => clearInterval(interval);
  }
}, [order]);
```

### Problème 3 : Erreur 403 Forbidden

**Cause** : Le prestataire n'est pas authentifié correctement

**Solution** :
```javascript
// Vérifier le token
const token = localStorage.getItem('provider_token');
console.log('Provider token:', token);

// Vérifier que le token est bien envoyé
// Dans apiClient.js, ligne 84
headers['Authorization'] = `Bearer ${this.token}`;
```

### Problème 4 : Erreur 422 Validation

**Cause** : Données invalides envoyées au backend

**Solution** :
```javascript
// Vérifier les données envoyées
console.log('Bid data:', {
  order_id: orderId,
  proposed_price: parseFloat(proposedPrice),
  estimated_arrival_minutes: 30,
  message: 'Je peux vous fournir un excellent service'
});
```

## 📊 Checklist de débogage

### Frontend
- [ ] Console prestataire : logs "Creating bid" apparaissent
- [ ] Requête `POST /bids` envoyée avec succès (200 OK)
- [ ] Message de succès affiché côté prestataire
- [ ] Console client : logs "Fetching bids" apparaissent
- [ ] Requête `GET /orders/{id}/bids` retourne 200 OK
- [ ] Nombre de bids > 0 dans la réponse

### Backend
- [ ] Endpoint `POST /bids` existe et est accessible
- [ ] Endpoint `GET /orders/{id}/bids` existe
- [ ] Authentification fonctionne (token valide)
- [ ] Validation des données OK
- [ ] Pas d'erreurs dans les logs

### Base de données
- [ ] Table `bids` existe
- [ ] Les colonnes sont correctes
- [ ] Les foreign keys sont en place
- [ ] Données insérées correctement
- [ ] Données retournées par le SELECT

## 🔑 Points critiques

### 1. Authentification
Le prestataire DOIT être authentifié avec le bon token :
```javascript
// src/app/provider/bidding/page.js
// Le token est-il défini ?
console.log('Token:', apiClient.getToken());
```

### 2. Mode de la commande
La commande DOIT être en mode `bidding` :
```sql
SELECT id, pricing_mode, bid_expiry_time FROM orders WHERE id = 1;
-- Résultat attendu: pricing_mode = 'bidding'
```

### 3. Expiration des enchères
Les enchères ne doivent PAS être expirées :
```sql
SELECT
  id,
  bid_expiry_time,
  NOW() as now,
  CASE WHEN bid_expiry_time > NOW() THEN 'VALIDE' ELSE 'EXPIRÉ' END as statut
FROM orders
WHERE id = 1;
```

## 📞 Prochaines étapes

1. **Ajoutez les logs de débogage** dans le frontend (sections 1 et 2)
2. **Testez** la création d'une offre
3. **Vérifiez** la console du navigateur
4. **Examinez** la base de données
5. **Partagez** les résultats des logs

## 📝 Informations à collecter

Envoyez-moi ces informations pour un diagnostic précis :

1. **Console prestataire** (F12) au moment de créer l'offre
2. **Console client** (F12) au moment de voir les offres
3. **Requêtes Network** :
   - Screenshot de `POST /bids`
   - Screenshot de `GET /orders/{id}/bids`
4. **Base de données** :
   ```sql
   SELECT * FROM bids LIMIT 5;
   SELECT * FROM orders WHERE pricing_mode = 'bidding' LIMIT 5;
   ```
5. **Logs backend** (si disponibles)

---

**Date de création** : Novembre 2025
**Version** : 1.0
**Projet** : GlamGo - Système d'enchères
