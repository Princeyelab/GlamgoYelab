<?php
spl_autoload_register(function ($class) {
    $file = __DIR__ . '/../' . str_replace('\', '/', $class) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

use App\Core\Database;

header('Content-Type: application/json');

try {
    $db = Database::getInstance()->getConnection();
    
    // Récupérer un prestataire de test
    $stmt = $db->prepare("SELECT id, first_name, last_name FROM providers WHERE is_verified = TRUE LIMIT 1");
    $stmt->execute();
    $provider = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$provider) {
        echo json_encode(['success' => false, 'message' => 'Aucun prestataire trouvé']);
        exit;
    }
    
    // Créer 3 notifications de test
    $notifications = [
        [
            'recipient_type' => 'provider',
            'recipient_id' => $provider['id'],
            'notification_type' => 'new_order',
            'title' => 'Nouvelle commande disponible',
            'message' => 'Une nouvelle commande pour Coiffure homme est disponible.'
        ],
        [
            'recipient_type' => 'provider',
            'recipient_id' => $provider['id'],
            'notification_type' => 'new_message',
            'title' => 'Nouveau message',
            'message' => 'Vous avez reçu un nouveau message d un client.'
        ],
        [
            'recipient_type' => 'provider',
            'recipient_id' => $provider['id'],
            'notification_type' => 'order_completed',
            'title' => 'Service terminé',
            'message' => 'Félicitations ! Votre service a été marqué comme terminé.'
        ]
    ];
    
    $stmt = $db->prepare(
        "INSERT INTO notifications (recipient_type, recipient_id, notification_type, title, message, is_read) 
         VALUES (?, ?, ?, ?, ?, FALSE)"
    );
    
    $count = 0;
    foreach ($notifications as $notif) {
        $stmt->execute([
            $notif['recipient_type'],
            $notif['recipient_id'],
            $notif['notification_type'],
            $notif['title'],
            $notif['message']
        ]);
        $count++;
    }
    
    echo json_encode([
        'success' => true,
        'message' => "$count notifications créées pour {$provider['first_name']} {$provider['last_name']}",
        'provider' => $provider
    ]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
