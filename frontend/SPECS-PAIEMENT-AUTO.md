# 💳 Spécifications - Système de Paiement Automatique

## 📋 Vue d'ensemble

Le paiement ne se fait **PLUS manuellement** par le client. Il est déclenché **AUTOMATIQUEMENT** quand le prestataire marque la commande comme terminée.

## 🎯 Règles de gestion

### Règle 1: Carte bancaire obligatoire
- **Client**: Carte enregistrée lors de l'onboarding
- **Prestataire**: Carte enregistrée lors de l'onboarding
- La carte est validée mais **PAS chargée** avant la fin du service

### Règle 2: Commission GlamGo = 20%
- **Pour TOUS les paiements** (carte OU espèces)
- Commission **TOUJOURS prélevée** par l'application
- **Aucune exception** - La commission s'applique sur les deux modes de paiement

## 💰 Flux de paiement selon le mode

### CAS 1: Paiement par CARTE 💳

**Exemple: Service à 100 MAD**

```
1. Service terminé → Prestataire clique "Marquer comme terminé"

2. Backend déclenche paiement automatique:
   └─ Prélever 100 MAD sur carte CLIENT

3. Distribution:
   ├─ GlamGo garde: 20 MAD (20%)
   └─ Prestataire reçoit: 80 MAD (80%)

4. Mise à jour BDD:
   ├─ status: "completed"
   ├─ payment_status: "paid"
   └─ payment_method: "card"
```

### CAS 2: Paiement en ESPÈCES 💵

**Exemple: Service à 100 MAD**

```
1. Service terminé → Client paie 100 MAD en ESPÈCES au prestataire

2. Prestataire clique "Marquer comme terminé"

3. Backend prélève la commission:
   └─ Prélever 20 MAD sur carte PRESTATAIRE (pour la commission GlamGo)

4. Distribution finale:
   ├─ Client a payé: 100 MAD espèces
   ├─ Prestataire a reçu: 100 MAD espèces
   ├─ Prestataire débité: 20 MAD sur sa carte
   ├─ GlamGo reçoit: 20 MAD
   └─ Prestataire garde net: 80 MAD (100 espèces - 20 carte)

5. Mise à jour BDD:
   ├─ status: "completed"
   ├─ payment_status: "paid"
   └─ payment_method: "cash"
```

## 🔧 Modifications Backend requises

### Endpoint concerné: `PATCH /provider/orders/{id}/complete`

**Logique actuelle:**
```php
// Actuellement, change juste le statut
status = 'completed'
```

**NOUVELLE logique à implémenter:**
```php
public function completeOrder($orderId) {
    // 1. Récupérer la commande
    $order = getOrder($orderId);

    // 2. Vérifier que le prestataire est bien assigné
    if ($order->provider_id !== $currentProviderId) {
        return error('Non autorisé');
    }

    // 3. Vérifier que le statut est bien 'in_progress'
    if ($order->status !== 'in_progress') {
        return error('La commande n\'est pas en cours');
    }

    // 4. Déclencher le paiement selon le mode
    if ($order->payment_method === 'card') {
        // CARTE: Prélever sur CLIENT
        $payment = PaymentGateway::charge([
            'amount' => $order->total,  // 100 MAD
            'user_id' => $order->user_id,  // Client
            'description' => "Paiement service #{$orderId}"
        ]);

        if (!$payment->success) {
            return error('Échec du paiement');
        }

        // Distribution:
        // - GlamGo: 20 MAD (automatique via gateway)
        // - Prestataire: 80 MAD (versement différé)

    } else if ($order->payment_method === 'cash') {
        // ESPÈCES: Prélever commission sur PRESTATAIRE
        $payment = PaymentGateway::charge([
            'amount' => $order->total * 0.20,  // 20 MAD (20%)
            'user_id' => $order->provider_id,  // Prestataire
            'description' => "Commission GlamGo pour commande #{$orderId}"
        ]);

        if (!$payment->success) {
            return error('Échec du prélèvement commission');
        }
    }

    // 5. Mettre à jour la commande
    $order->status = 'completed';
    $order->payment_status = 'paid';
    $order->completed_at = now();
    $order->save();

    // 6. Créer l'enregistrement de paiement
    createPaymentRecord([
        'order_id' => $orderId,
        'amount' => $order->total,
        'payment_method' => $order->payment_method,
        'status' => 'paid',
        'transaction_id' => $payment->transaction_id
    ]);

    // 7. Notifications
    sendNotificationToClient($order->user_id, 'Service terminé, paiement effectué');

    return success('Commande terminée et paiement effectué');
}
```

## 📊 Modifications BDD

### Table `orders`
- Ajouter colonne: `payment_method` ENUM('card', 'cash') DEFAULT 'card'
- S'assurer que `payment_status` existe: ENUM('pending', 'paid', 'refunded')

### Table `payments`
```sql
CREATE TABLE IF NOT EXISTS payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('card', 'cash') NOT NULL,
    status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    transaction_id VARCHAR(255),
    charged_user_id INT NOT NULL COMMENT 'User qui a été chargé',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

## ✅ Frontend déjà implémenté

### Côté CLIENT (orders/[id]/page.js):
- ✅ Affiche mode de paiement (Carte / Espèces)
- ✅ Affiche statut paiement
- ✅ Message informatif selon le mode:
  - Carte: "Le paiement sera automatiquement effectué à la fin du service"
  - Espèces: "Payez en espèces au prestataire. La commission GlamGo (20%) sera prélevée sur la carte du prestataire"
- ✅ **Aucun bouton de paiement manuel**

### Côté PRESTATAIRE (provider/dashboard/page.js):
- ✅ Bouton "Marquer comme terminé"
- ✅ Modal de confirmation
- ✅ Appel API: `PATCH /provider/orders/{id}/complete`

## 🧪 Tests à effectuer

### Test 1: Paiement CARTE
1. Client crée commande avec `payment_method = 'card'`
2. Prestataire accepte
3. Prestataire marque "Terminé"
4. ✅ Vérifier: 100 MAD débités de la carte client
5. ✅ Vérifier: payment_status = 'paid'
6. ✅ Vérifier: status = 'completed'

### Test 2: Paiement ESPÈCES
1. Client crée commande avec `payment_method = 'cash'`
2. Prestataire accepte
3. Prestataire marque "Terminé"
4. ✅ Vérifier: 20 MAD débités de la carte prestataire
5. ✅ Vérifier: payment_status = 'paid'
6. ✅ Vérifier: status = 'completed'

### Test 3: Échec paiement
1. Carte invalide ou expirée
2. ✅ Vérifier: Erreur retournée
3. ✅ Vérifier: status reste 'in_progress'
4. ✅ Vérifier: payment_status reste 'pending'

## 📝 Notes importantes

1. **Sécurité**: Vérifier que seul le prestataire assigné peut compléter la commande
2. **Atomicité**: Toutes les opérations (paiement + mise à jour BDD) doivent être dans une transaction
3. **Gestion d'erreurs**: Si le paiement échoue, la commande NE DOIT PAS être marquée comme terminée
4. **Notifications**: Envoyer notification au client quand paiement effectué
5. **Logs**: Logger tous les paiements pour audit

## 🚀 Prochaines étapes

1. ✅ **Frontend**: Complet et fonctionnel
2. ⏳ **Backend**: À implémenter selon ces specs
3. ⏳ **Tests**: À effectuer une fois backend implémenté
4. ⏳ **Documentation**: Mettre à jour API docs

---

**Date de création**: 26 novembre 2025
**Système**: GlamGo - Plateforme de services beauté au Maroc
**Commission**: 20% sur tous les paiements
