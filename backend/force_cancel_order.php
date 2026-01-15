<?php
/**
 * Script pour forcer l'annulation d'une commande bloquée
 * Usage: php force_cancel_order.php <order_id>
 * Exemple: php force_cancel_order.php 231
 */

require_once __DIR__ . '/bootstrap.php';

use App\Core\Database;

// Récupérer l'ID de la commande depuis les arguments
$orderId = $argv[1] ?? null;

if (!$orderId) {
    echo "❌ Usage: php force_cancel_order.php <order_id>\n";
    echo "   Exemple: php force_cancel_order.php 231\n";
    exit(1);
}

$db = Database::getInstance();

// Récupérer la commande
$stmt = $db->prepare("SELECT * FROM orders WHERE id = ?");
$stmt->execute([$orderId]);
$order = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$order) {
    echo "❌ Commande #{$orderId} non trouvée\n";
    exit(1);
}

echo "📋 Commande #{$orderId} - Statut actuel: {$order['status']}\n";
echo "👤 Client ID: {$order['user_id']}\n";
echo "🔧 Prestataire ID: " . ($order['provider_id'] ?? 'Non assigné') . "\n";
echo "\n";

// Demander confirmation
echo "⚠️  Voulez-vous forcer l'annulation de cette commande ? (yes/no): ";
$confirmation = trim(fgets(STDIN));

if (strtolower($confirmation) !== 'yes') {
    echo "❌ Annulation abandonnée\n";
    exit(0);
}

// Forcer l'annulation
try {
    $stmt = $db->prepare("
        UPDATE orders
        SET status = 'cancelled',
            cancelled_at = NOW(),
            cancelled_by = 'admin',
            cancellation_reason = 'Annulation forcée - commande bloquée en statut arrived'
        WHERE id = ?
    ");

    $stmt->execute([$orderId]);

    if ($stmt->rowCount() > 0) {
        echo "✅ Commande #{$orderId} annulée avec succès!\n";

        // Créer une notification pour le client
        if ($order['user_id']) {
            $notifStmt = $db->prepare("
                INSERT INTO notifications (user_id, type, title, message, created_at)
                VALUES (?, 'order_cancelled', 'Commande annulée', ?, NOW())
            ");

            $message = "Votre commande #{$orderId} a été annulée par l'équipe GlamGo en raison d'un problème technique. Vous pouvez créer une nouvelle réservation.";
            $notifStmt->execute([$order['user_id'], $message]);

            echo "📧 Notification envoyée au client\n";
        }

        // Créer une notification pour le prestataire si assigné
        if ($order['provider_id']) {
            $notifStmt = $db->prepare("
                INSERT INTO notifications (user_id, type, title, message, created_at)
                VALUES (?, 'order_cancelled', 'Commande annulée', ?, NOW())
            ");

            $message = "La commande #{$orderId} a été annulée par l'équipe GlamGo. Vous êtes maintenant disponible pour accepter d'autres commandes.";
            $notifStmt->execute([$order['provider_id'], $message]);

            echo "📧 Notification envoyée au prestataire\n";
        }

        echo "\n✨ Opération terminée avec succès!\n";
    } else {
        echo "❌ Aucune modification effectuée\n";
    }

} catch (Exception $e) {
    echo "❌ Erreur lors de l'annulation: " . $e->getMessage() . "\n";
    exit(1);
}
