<?php
/**
 * Script simple pour annuler la commande #231
 * Exécuter: Ouvrir dans le navigateur http://localhost:8000/cancel_231.php
 */

require_once __DIR__ . '/bootstrap.php';

use App\Core\Database;

// Simple sécurité
$confirm = $_GET['confirm'] ?? '';

echo "<html><head><meta charset='UTF-8'></head><body style='font-family: Arial; padding: 40px; max-width: 600px; margin: 0 auto;'>";

if ($confirm !== 'yes') {
    echo "<h1>⚠️ Annuler la commande #231</h1>";
    echo "<p>Cette commande est bloquée au statut 'arrived' et empêche d'accepter de nouvelles commandes.</p>";
    echo "<p><strong>Voulez-vous forcer son annulation ?</strong></p>";
    echo "<a href='?confirm=yes' style='display: inline-block; background: #EF4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Oui, annuler la commande #231</a>";
    echo "</body></html>";
    exit;
}

// Annulation confirmée
try {
    $db = Database::getInstance();

    // Récupérer la commande
    $stmt = $db->prepare("SELECT * FROM orders WHERE id = 231");
    $stmt->execute();
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        echo "<h1>❌ Erreur</h1>";
        echo "<p>Commande #231 non trouvée.</p>";
        exit;
    }

    echo "<h1>📋 Commande #231</h1>";
    echo "<p><strong>Statut actuel:</strong> {$order['status']}</p>";
    echo "<p><strong>Client ID:</strong> {$order['user_id']}</p>";
    echo "<p><strong>Provider ID:</strong> {$order['provider_id']}</p>";
    echo "<hr>";

    // Annuler la commande
    $stmt = $db->prepare("
        UPDATE orders
        SET status = 'cancelled',
            cancelled_at = NOW(),
            cancelled_by = 'admin',
            cancellation_reason = 'Commande bloquée en statut arrived - annulation forcée par admin'
        WHERE id = 231
    ");

    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        echo "<h2 style='color: green;'>✅ Commande annulée avec succès!</h2>";

        // Notification client
        if ($order['user_id']) {
            $notifStmt = $db->prepare("
                INSERT INTO notifications (user_id, type, title, message, created_at)
                VALUES (?, 'order_cancelled', 'Commande annulée', ?, NOW())
            ");

            $message = "Votre commande #231 a été annulée par l'équipe GlamGo en raison d'un problème technique. Vous pouvez créer une nouvelle réservation.";
            $notifStmt->execute([$order['user_id'], $message]);

            echo "<p>✅ Notification envoyée au client (ID: {$order['user_id']})</p>";
        }

        // Notification provider
        if ($order['provider_id']) {
            $notifStmt = $db->prepare("
                INSERT INTO notifications (user_id, type, title, message, created_at)
                VALUES (?, 'order_cancelled', 'Commande annulée', ?, NOW())
            ");

            $message = "La commande #231 a été annulée par l'équipe GlamGo. Vous êtes maintenant disponible pour accepter d'autres commandes.";
            $notifStmt->execute([$order['provider_id'], $message]);

            echo "<p>✅ Notification envoyée au prestataire (ID: {$order['provider_id']})</p>";
        }

        echo "<hr>";
        echo "<h3 style='color: green;'>✨ Opération terminée avec succès!</h3>";
        echo "<p>Le prestataire peut maintenant accepter de nouvelles commandes.</p>";
        echo "<p><a href='/provider/dashboard' style='color: #4F46E5; font-weight: bold;'>→ Retour au dashboard</a></p>";

    } else {
        echo "<h2 style='color: red;'>❌ Erreur</h2>";
        echo "<p>Aucune modification effectuée. La commande est peut-être déjà annulée.</p>";
    }

} catch (Exception $e) {
    echo "<h2 style='color: red;'>❌ Erreur</h2>";
    echo "<p>" . htmlspecialchars($e->getMessage()) . "</p>";
}

echo "</body></html>";
