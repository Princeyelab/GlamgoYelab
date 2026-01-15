<?php
/**
 * Page admin pour forcer l'annulation d'une commande bloquée
 * URL: http://localhost:8000/admin_cancel_order.php?order_id=231
 */

require_once __DIR__ . '/../bootstrap.php';

use App\Core\Database;

// Simple authentification (à améliorer en production)
$secret = $_GET['secret'] ?? '';
if ($secret !== 'glamgo2024admin') {
    die('❌ Accès refusé - secret invalide');
}

$orderId = $_GET['order_id'] ?? null;

if (!$orderId) {
    die('❌ Paramètre order_id manquant. Usage: ?order_id=231&secret=glamgo2024admin');
}

$db = Database::getInstance();

// Récupérer la commande
$stmt = $db->prepare("SELECT * FROM orders WHERE id = ?");
$stmt->execute([$orderId]);
$order = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$order) {
    die("❌ Commande #{$orderId} non trouvée");
}

echo "<html><head><meta charset='UTF-8'><style>
body { font-family: Arial; padding: 20px; max-width: 800px; margin: 0 auto; }
.info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 10px 0; }
.success { background: #c8e6c9; padding: 15px; border-radius: 5px; margin: 10px 0; }
.error { background: #ffcdd2; padding: 15px; border-radius: 5px; margin: 10px 0; }
button { background: #f44336; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
button:hover { background: #d32f2f; }
</style></head><body>";

echo "<h1>🔧 Admin - Annulation forcée</h1>";

echo "<div class='info'>";
echo "<h3>📋 Commande #{$orderId}</h3>";
echo "<p><strong>Statut actuel:</strong> {$order['status']}</p>";
echo "<p><strong>Client ID:</strong> {$order['user_id']}</p>";
echo "<p><strong>Prestataire ID:</strong> " . ($order['provider_id'] ?? 'Non assigné') . "</p>";
echo "<p><strong>Créée le:</strong> {$order['created_at']}</p>";
echo "</div>";

// Si confirmation demandée
if (isset($_GET['confirm']) && $_GET['confirm'] === 'yes') {
    try {
        // Forcer l'annulation
        $stmt = $db->prepare("
            UPDATE orders
            SET status = 'cancelled',
                cancelled_at = NOW(),
                cancelled_by = 'admin',
                cancellation_reason = 'Annulation forcée par admin - commande bloquée'
            WHERE id = ?
        ");

        $stmt->execute([$orderId]);

        if ($stmt->rowCount() > 0) {
            echo "<div class='success'>";
            echo "<h3>✅ Commande annulée avec succès!</h3>";

            // Créer une notification pour le client
            if ($order['user_id']) {
                $notifStmt = $db->prepare("
                    INSERT INTO notifications (user_id, type, title, message, created_at)
                    VALUES (?, 'order_cancelled', 'Commande annulée', ?, NOW())
                ");

                $message = "Votre commande #{$orderId} a été annulée par l'équipe GlamGo en raison d'un problème technique. Vous pouvez créer une nouvelle réservation.";
                $notifStmt->execute([$order['user_id'], $message]);

                echo "<p>📧 Notification envoyée au client</p>";
            }

            // Créer une notification pour le prestataire si assigné
            if ($order['provider_id']) {
                $notifStmt = $db->prepare("
                    INSERT INTO notifications (user_id, type, title, message, created_at)
                    VALUES (?, 'order_cancelled', 'Commande annulée', ?, NOW())
                ");

                $message = "La commande #{$orderId} a été annulée par l'équipe GlamGo. Vous êtes maintenant disponible pour accepter d'autres commandes.";
                $notifStmt->execute([$order['provider_id'], $message]);

                echo "<p>📧 Notification envoyée au prestataire</p>";
            }

            echo "<p><a href='?order_id={$orderId}&secret={$secret}'>🔄 Rafraîchir</a></p>";
            echo "</div>";
        } else {
            echo "<div class='error'>❌ Aucune modification effectuée</div>";
        }

    } catch (Exception $e) {
        echo "<div class='error'>❌ Erreur: " . htmlspecialchars($e->getMessage()) . "</div>";
    }
} else {
    // Afficher le bouton de confirmation
    echo "<form method='GET'>";
    echo "<input type='hidden' name='order_id' value='{$orderId}'>";
    echo "<input type='hidden' name='secret' value='{$secret}'>";
    echo "<input type='hidden' name='confirm' value='yes'>";
    echo "<p>⚠️ <strong>Attention:</strong> Cette action est irréversible.</p>";
    echo "<button type='submit'>🗑️ Confirmer l'annulation</button>";
    echo "</form>";
}

echo "</body></html>";
