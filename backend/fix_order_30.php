<?php

/**
 * Crée les notifications pour la commande #30
 */

// Autoloader
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

$db = Database::getInstance();
$orderModel = new Order();
$notificationModel = new Notification();

echo "🔧 Correction de la commande #30\n";
echo "================================\n\n";

// Récupérer la commande
$order = $orderModel->getDetailedOrder(30);

if (!$order) {
    die("❌ Commande #30 non trouvée\n");
}

echo "✅ Commande trouvée:\n";
echo "   - Service: {$order['service_name']}\n";
echo "   - Prix proposé: {$order['user_proposed_price']} MAD\n";
echo "   - Mode: {$order['pricing_mode']}\n\n";

// Créer les notifications
echo "🔔 Création des notifications pour les prestataires...\n";
$notificationModel->notifyProvidersForNewOrder($order);

// Vérifier
$stmt = $db->prepare("SELECT COUNT(*) as count FROM notifications WHERE order_id = 30");
$stmt->execute();
$result = $stmt->fetch();

echo "\n✅ Notifications créées: {$result['count']}\n";

// Lister les prestataires notifiés
$stmt = $db->prepare("
    SELECT n.id, p.first_name, p.last_name, n.title
    FROM notifications n
    JOIN providers p ON n.recipient_id = p.id
    WHERE n.order_id = 30 AND n.recipient_type = 'provider'
");
$stmt->execute();
$notifications = $stmt->fetchAll();

echo "\n📋 Prestataires notifiés:\n";
foreach ($notifications as $notif) {
    echo "   - {$notif['first_name']} {$notif['last_name']} (Notification #{$notif['id']})\n";
}

echo "\n✅ Terminé!\n";
