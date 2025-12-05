<?php

/**
 * Script de test pour créer une commande et vérifier les notifications
 */

// Autoloader simple
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $baseDir = __DIR__ . '/app/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';
    if (file_exists($file)) {
        require $file;
    }
});

use App\Core\Database;
use App\Models\Order;
use App\Models\Notification;

// Connexion à la BDD
$db = Database::getInstance();

echo "🧪 Test de création de notifications\n";
echo "=====================================\n\n";

// Créer les modèles
$orderModel = new Order();
$notificationModel = new Notification();

// Données de la commande test
$testOrderData = [
    'user_id' => 20,
    'service_id' => 84,
    'address_id' => 1,
    'status' => 'pending',
    'scheduled_at' => '2025-11-25 14:00:00',
    'price' => 100,
    'total' => 100,
    'notes' => 'Test notification - Script manuel'
];

echo "📝 Création de la commande test...\n";
try {
    $orderId = $orderModel->create($testOrderData);
    echo "✅ Commande créée avec ID: {$orderId}\n\n";

    // Récupérer les détails de la commande
    echo "📦 Récupération des détails de la commande...\n";
    $order = $orderModel->getDetailedOrder($orderId);

    if (!$order) {
        echo "❌ Erreur: Impossible de récupérer les détails de la commande\n";
        exit(1);
    }

    echo "✅ Détails récupérés:\n";
    echo "   - ID: {$order['id']}\n";
    echo "   - Service ID: {$order['service_id']}\n";
    echo "   - Service: {$order['service_name']}\n";
    echo "   - User ID: {$order['user_id']}\n\n";

    // Créer les notifications
    echo "🔔 Création des notifications pour les prestataires...\n";
    $notificationModel->notifyProvidersForNewOrder($order);
    echo "✅ Notifications créées\n\n";

    // Vérifier les notifications créées
    echo "🔍 Vérification des notifications créées...\n";
    $stmt = $db->prepare(
        "SELECT * FROM notifications WHERE order_id = ? AND recipient_type = 'provider'"
    );
    $stmt->execute([$orderId]);
    $notifications = $stmt->fetchAll();

    echo "📊 Nombre de notifications créées: " . count($notifications) . "\n";

    if (count($notifications) > 0) {
        echo "✅ Notifications:\n";
        foreach ($notifications as $notif) {
            echo "   - Prestataire #{$notif['recipient_id']}: {$notif['title']}\n";
            echo "     Message: {$notif['message']}\n";
        }
    } else {
        echo "❌ Aucune notification créée!\n";
        echo "🔍 Vérification des prestataires disponibles...\n";

        $stmt = $db->prepare(
            "SELECT COUNT(*) as count FROM providers WHERE is_verified = TRUE AND is_available = TRUE"
        );
        $stmt->execute();
        $result = $stmt->fetch();
        echo "   Prestataires disponibles: {$result['count']}\n";
    }

} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n✅ Test terminé!\n";
