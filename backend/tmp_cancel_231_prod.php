<?php
require_once '/var/www/html/bootstrap.php';
use App\Core\Database;

$db = Database::getInstance();

// Récupérer la commande
$stmt = $db->prepare('SELECT * FROM orders WHERE id = 231');
$stmt->execute();
$order = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$order) {
    echo "❌ Commande #231 non trouvée\n";
    exit(1);
}

echo "📋 Commande #231\n";
echo "Statut actuel: {$order['status']}\n";
echo "Client ID: {$order['user_id']}\n";
echo "Provider ID: {$order['provider_id']}\n\n";

// Annuler la commande
$stmt = $db->prepare("
    UPDATE orders
    SET status = 'cancelled',
        cancelled_by = 'admin',
        cancellation_reason = 'Commande bloquée en statut arrived - annulation forcée par admin',
        updated_at = NOW()
    WHERE id = 231
");

$stmt->execute();

if ($stmt->rowCount() > 0) {
    echo "✅ Commande #231 annulée avec succès!\n\n";

    // Notification client
    if ($order['user_id']) {
        $notifStmt = $db->prepare("
            INSERT INTO notifications (recipient_type, recipient_id, order_id, notification_type, title, message, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");

        $message = "Votre commande #231 a été annulée par l'équipe GlamGo en raison d'un problème technique. Vous pouvez créer une nouvelle réservation.";
        $notifStmt->execute(['user', $order['user_id'], 231, 'order_cancelled', 'Commande annulée', $message]);

        echo "📧 Notification envoyée au client (ID: {$order['user_id']})\n";
    }

    // Notification provider
    if ($order['provider_id']) {
        $notifStmt = $db->prepare("
            INSERT INTO notifications (recipient_type, recipient_id, order_id, notification_type, title, message, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");

        $message = "La commande #231 a été annulée par l'équipe GlamGo. Vous êtes maintenant disponible pour accepter d'autres commandes.";
        $notifStmt->execute(['provider', $order['provider_id'], 231, 'order_cancelled', 'Commande annulée', $message]);

        echo "📧 Notification envoyée au prestataire (ID: {$order['provider_id']})\n";
    }

    echo "\n✨ Opération terminée avec succès!\n";
    echo "Le prestataire peut maintenant accepter de nouvelles commandes.\n";
} else {
    echo "❌ Aucune modification effectuée\n";
}
