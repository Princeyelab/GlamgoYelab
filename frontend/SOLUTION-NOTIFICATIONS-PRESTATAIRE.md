# 🔔 Solution : Notifications prestataire non reçues

## 📊 Diagnostic

### Ce qui fonctionne ✅
- Frontend : Le composant `ProviderNotificationDropdown` fonctionne
- API : L'endpoint `GET /provider/notifications/unread-count` répond
- Réponse : `{success: true, data: {count: 0}}`
- Token : Authentification OK

### Le problème 🔴
**Les notifications ne sont pas créées quand une commande est passée**

Commande #28 créée par le client → **Aucune notification créée pour les prestataires**

## 🎯 Cause du problème

Quand un client crée une commande, le backend doit :
1. ✅ Enregistrer la commande dans la BDD
2. ❌ **Créer une notification pour les prestataires concernés**
3. ❌ **Envoyer la notification en temps réel (optionnel)**

**Le point 2 n'est pas implémenté** dans le backend.

## 🛠️ Solution Backend

### 1. Table `provider_notifications`

**Schema requis** :
```sql
CREATE TABLE provider_notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    provider_id BIGINT UNSIGNED NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_order_id BIGINT UNSIGNED NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    FOREIGN KEY (related_order_id) REFERENCES orders(id) ON DELETE CASCADE,

    INDEX idx_provider_id (provider_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at),
    INDEX idx_notification_type (notification_type)
);
```

**Migration Laravel** :
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('provider_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('provider_id')->constrained()->onDelete('cascade');
            $table->string('notification_type', 50);
            $table->string('title', 255);
            $table->text('message');
            $table->foreignId('related_order_id')->nullable()->constrained('orders')->onDelete('cascade');
            $table->boolean('is_read')->default(false);
            $table->timestamps();

            $table->index('provider_id');
            $table->index('is_read');
            $table->index('created_at');
            $table->index('notification_type');
        });
    }

    public function down()
    {
        Schema::dropIfExists('provider_notifications');
    }
};
```

### 2. Modèle `ProviderNotification`

**Fichier** : `app/Models/ProviderNotification.php`
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProviderNotification extends Model
{
    protected $fillable = [
        'provider_id',
        'notification_type',
        'title',
        'message',
        'related_order_id',
        'is_read'
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Relation : une notification appartient à un prestataire
     */
    public function provider()
    {
        return $this->belongsTo(Provider::class);
    }

    /**
     * Relation : une notification peut être liée à une commande
     */
    public function order()
    {
        return $this->belongsTo(Order::class, 'related_order_id');
    }

    /**
     * Marquer comme lue
     */
    public function markAsRead()
    {
        $this->update(['is_read' => true]);
    }

    /**
     * Scope pour les notifications non lues
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    /**
     * Scope pour un prestataire spécifique
     */
    public function scopeForProvider($query, $providerId)
    {
        return $query->where('provider_id', $providerId);
    }
}
```

### 3. Service de notification

**Fichier** : `app/Services/ProviderNotificationService.php`
```php
<?php

namespace App\Services;

use App\Models\ProviderNotification;
use App\Models\Order;
use App\Models\Provider;

class ProviderNotificationService
{
    /**
     * Notifier les prestataires d'une nouvelle commande
     */
    public function notifyNewOrder(Order $order)
    {
        // Déterminer quels prestataires notifier
        $providers = $this->getEligibleProviders($order);

        foreach ($providers as $provider) {
            ProviderNotification::create([
                'provider_id' => $provider->id,
                'notification_type' => 'new_order',
                'title' => 'Nouvelle commande disponible',
                'message' => sprintf(
                    'Nouvelle commande #%d : %s. Prix proposé : %s MAD',
                    $order->id,
                    $order->service_name ?? 'Service',
                    number_format($order->price ?? $order->user_proposed_price, 2)
                ),
                'related_order_id' => $order->id
            ]);
        }
    }

    /**
     * Notifier un prestataire que sa commande est acceptée
     */
    public function notifyOrderAccepted(Order $order)
    {
        if (!$order->provider_id) return;

        ProviderNotification::create([
            'provider_id' => $order->provider_id,
            'notification_type' => 'order_accepted',
            'title' => 'Commande acceptée',
            'message' => sprintf(
                'Votre commande #%d a été acceptée par le client',
                $order->id
            ),
            'related_order_id' => $order->id
        ]);
    }

    /**
     * Notifier un prestataire d'une nouvelle offre acceptée
     */
    public function notifyBidAccepted($bid)
    {
        ProviderNotification::create([
            'provider_id' => $bid->provider_id,
            'notification_type' => 'bid_accepted',
            'title' => '🎉 Votre offre a été acceptée !',
            'message' => sprintf(
                'Le client a accepté votre offre de %s MAD pour la commande #%d',
                number_format($bid->proposed_price, 2),
                $bid->order_id
            ),
            'related_order_id' => $bid->order_id
        ]);
    }

    /**
     * Notifier un prestataire d'une offre rejetée
     */
    public function notifyBidRejected($bid)
    {
        ProviderNotification::create([
            'provider_id' => $bid->provider_id,
            'notification_type' => 'bid_rejected',
            'title' => 'Offre non retenue',
            'message' => sprintf(
                'Votre offre pour la commande #%d n\'a pas été retenue',
                $bid->order_id
            ),
            'related_order_id' => $bid->order_id
        ]);
    }

    /**
     * Notifier un prestataire d'une annulation
     */
    public function notifyOrderCancelled(Order $order)
    {
        if (!$order->provider_id) return;

        ProviderNotification::create([
            'provider_id' => $order->provider_id,
            'notification_type' => 'order_cancelled',
            'title' => 'Commande annulée',
            'message' => sprintf(
                'La commande #%d a été annulée',
                $order->id
            ),
            'related_order_id' => $order->id
        ]);
    }

    /**
     * Déterminer quels prestataires doivent être notifiés
     */
    private function getEligibleProviders(Order $order)
    {
        // Option 1 : Notifier TOUS les prestataires
        // return Provider::where('is_active', true)->get();

        // Option 2 : Notifier selon la ville
        if ($order->city) {
            return Provider::where('is_active', true)
                ->where(function($query) use ($order) {
                    $query->where('city', $order->city)
                          ->orWhereJsonContains('coverage_area', $order->city);
                })
                ->get();
        }

        // Option 3 : Notifier selon le service
        if ($order->service_id) {
            return Provider::where('is_active', true)
                ->whereHas('services', function($query) use ($order) {
                    $query->where('service_id', $order->service_id);
                })
                ->get();
        }

        // Par défaut : tous les prestataires actifs
        return Provider::where('is_active', true)->get();
    }
}
```

### 4. Intégrer dans le OrderController

**Fichier** : `app/Http/Controllers/OrderController.php`
```php
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\ProviderNotificationService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    protected $notificationService;

    public function __construct(ProviderNotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Créer une nouvelle commande
     */
    public function create(Request $request)
    {
        $validated = $request->validate([
            'service_id' => 'required|exists:services,id',
            'scheduled_at' => 'required|date',
            'address_line' => 'required|string',
            'city' => 'required|string',
            'notes' => 'nullable|string',
            'pricing_mode' => 'required|in:fixed,bidding',
            'user_proposed_price' => 'required_if:pricing_mode,bidding|numeric|min:0',
        ]);

        // Créer la commande
        $order = Order::create([
            'user_id' => auth()->id(),
            'service_id' => $validated['service_id'],
            'scheduled_at' => $validated['scheduled_at'],
            'address_line' => $validated['address_line'],
            'city' => $validated['city'],
            'notes' => $validated['notes'] ?? null,
            'pricing_mode' => $validated['pricing_mode'],
            'user_proposed_price' => $validated['user_proposed_price'] ?? null,
            'status' => 'pending',
        ]);

        // ✅ NOTIFICATION : Notifier les prestataires
        try {
            $this->notificationService->notifyNewOrder($order);
        } catch (\Exception $e) {
            // Logger l'erreur mais ne pas bloquer la création
            \Log::error('Failed to send provider notifications', [
                'order_id' => $order->id,
                'error' => $e->getMessage()
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Commande créée avec succès',
            'data' => [
                'order' => $order
            ]
        ], 201);
    }
}
```

### 5. Endpoints API pour notifications

**Fichier** : `routes/api.php`
```php
// Routes prestataires
Route::middleware('auth:sanctum')->prefix('provider')->group(function () {
    // Notifications
    Route::get('/notifications', [ProviderNotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [ProviderNotificationController::class, 'unreadCount']);
    Route::patch('/notifications/{id}/read', [ProviderNotificationController::class, 'markAsRead']);
    Route::patch('/notifications/read-all', [ProviderNotificationController::class, 'markAllAsRead']);
});
```

**Contrôleur** : `app/Http/Controllers/ProviderNotificationController.php`
```php
<?php

namespace App\Http\Controllers;

use App\Models\ProviderNotification;
use Illuminate\Http\Request;

class ProviderNotificationController extends Controller
{
    /**
     * Liste des notifications du prestataire
     */
    public function index(Request $request)
    {
        $limit = $request->input('limit', 50);

        $notifications = ProviderNotification::forProvider(auth()->id())
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        $unreadCount = ProviderNotification::forProvider(auth()->id())
            ->unread()
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'notifications' => $notifications,
                'unread_count' => $unreadCount
            ]
        ]);
    }

    /**
     * Nombre de notifications non lues
     */
    public function unreadCount()
    {
        $count = ProviderNotification::forProvider(auth()->id())
            ->unread()
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'count' => $count
            ]
        ]);
    }

    /**
     * Marquer une notification comme lue
     */
    public function markAsRead($id)
    {
        $notification = ProviderNotification::forProvider(auth()->id())
            ->findOrFail($id);

        $notification->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Notification marquée comme lue'
        ]);
    }

    /**
     * Marquer toutes les notifications comme lues
     */
    public function markAllAsRead()
    {
        ProviderNotification::forProvider(auth()->id())
            ->unread()
            ->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Toutes les notifications ont été marquées comme lues'
        ]);
    }
}
```

## 🧪 Test de la solution

### 1. Créer la table
```bash
php artisan migrate
```

### 2. Vérifier la table
```sql
SHOW TABLES LIKE 'provider_notifications';
DESC provider_notifications;
```

### 3. Test manuel
```sql
-- Créer une notification test
INSERT INTO provider_notifications
(provider_id, notification_type, title, message, related_order_id, is_read)
VALUES
(1, 'new_order', 'Nouvelle commande', 'Test notification', 28, 0);

-- Vérifier
SELECT * FROM provider_notifications;
```

### 4. Test via API
```bash
# Créer une commande (client)
curl -X POST http://localhost:8080/api/orders \
  -H "Authorization: Bearer CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": 1,
    "scheduled_at": "2025-01-25 14:00:00",
    "address_line": "123 Rue Test",
    "city": "Marrakech",
    "pricing_mode": "bidding",
    "user_proposed_price": 150
  }'

# Vérifier les notifications (prestataire)
curl -X GET http://localhost:8080/api/provider/notifications/unread-count \
  -H "Authorization: Bearer PROVIDER_TOKEN"

# Résultat attendu
{
  "success": true,
  "data": {
    "count": 1
  }
}
```

## 📊 Vérification BDD après création commande

```sql
-- Vérifier la commande
SELECT * FROM orders WHERE id = 28;

-- Vérifier les notifications créées
SELECT
    pn.*,
    p.first_name,
    p.last_name,
    o.service_name
FROM provider_notifications pn
JOIN providers p ON pn.provider_id = p.id
LEFT JOIN orders o ON pn.related_order_id = o.id
WHERE pn.related_order_id = 28;

-- Résultat attendu : 1+ notifications créées
```

## 🔔 Types de notifications à implémenter

```php
// Types de notifications
const NOTIFICATION_TYPES = [
    'new_order' => 'Nouvelle commande disponible',
    'bid_accepted' => 'Votre offre a été acceptée',
    'bid_rejected' => 'Votre offre n\'a pas été retenue',
    'order_cancelled' => 'Commande annulée',
    'new_message' => 'Nouveau message',
    'payment_received' => 'Paiement reçu',
];
```

## ✅ Checklist d'implémentation

### Backend
- [ ] Table `provider_notifications` créée
- [ ] Modèle `ProviderNotification` créé
- [ ] Service `ProviderNotificationService` créé
- [ ] Intégration dans `OrderController::create()`
- [ ] Contrôleur `ProviderNotificationController` créé
- [ ] Routes API ajoutées
- [ ] Test manuel réussi

### Frontend
- [x] Composant `ProviderNotificationDropdown` (déjà OK)
- [x] Polling automatique toutes les 15s (déjà OK)
- [x] Badge avec compteur (déjà OK)
- [x] Dropdown avec liste (déjà OK)

### Vérification
- [ ] Créer commande → Notification créée
- [ ] Notification visible dans le dropdown
- [ ] Badge affiche le bon nombre
- [ ] Marquer comme lu fonctionne

---

**Date** : Novembre 2025
**Projet** : GlamGo - Système de notifications prestataire
