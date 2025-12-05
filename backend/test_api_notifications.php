<?php

/**
 * Test de l'endpoint API des notifications prestataire
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

$db = Database::getInstance();

echo "🧪 Test de l'API des notifications prestataire\n";
echo "===============================================\n\n";

// Prestataire ID 7
$providerId = 7;

echo "📊 Vérification des notifications dans la BDD...\n";
$stmt = $db->prepare(
    "SELECT COUNT(*) as count FROM notifications
     WHERE recipient_type = 'provider' AND recipient_id = ? AND is_read = FALSE"
);
$stmt->execute([$providerId]);
$result = $stmt->fetch();
echo "✅ Notifications non lues en BDD pour prestataire #{$providerId}: {$result['count']}\n\n";

echo "📋 Détail des notifications:\n";
$stmt = $db->prepare(
    "SELECT id, notification_type, title, message, created_at
     FROM notifications
     WHERE recipient_type = 'provider' AND recipient_id = ?
     ORDER BY created_at DESC
     LIMIT 5"
);
$stmt->execute([$providerId]);
$notifications = $stmt->fetchAll();

foreach ($notifications as $notif) {
    $read = $notif['is_read'] ?? 0;
    $status = $read ? '✅ Lu' : '🔔 Non lu';
    echo "   [{$status}] ID:{$notif['id']} - {$notif['title']}\n";
    echo "       Type: {$notif['notification_type']}\n";
    echo "       Message: {$notif['message']}\n";
    echo "       Date: {$notif['created_at']}\n\n";
}

echo "🔍 Test de la méthode du modèle Notification...\n";
use App\Models\Notification;
$notificationModel = new Notification();

$count = $notificationModel->getUnreadCount('provider', $providerId);
echo "✅ Méthode getUnreadCount() retourne: {$count}\n\n";

$providerNotifs = $notificationModel->getProviderNotifications($providerId, 10);
echo "📋 Méthode getProviderNotifications() retourne: " . count($providerNotifs) . " notifications\n";

foreach ($providerNotifs as $notif) {
    echo "   - ID:{$notif['id']} - {$notif['title']} (Read: {$notif['is_read']})\n";
}

echo "\n✅ Test terminé!\n";
