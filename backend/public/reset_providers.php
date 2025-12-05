<?php
spl_autoload_register(function ($class) {
    $file = __DIR__ . '/../' . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

use App\Core\Database;

header('Content-Type: application/json');

try {
    $db = Database::getInstance();

    // Supprimer toutes les notifications prestataires
    $stmt = $db->prepare("DELETE FROM notifications WHERE recipient_type = 'provider'");
    $stmt->execute();
    $deletedNotifs = $stmt->rowCount();

    // Supprimer toutes les relations provider_services
    $stmt = $db->prepare("DELETE FROM provider_services");
    $stmt->execute();
    $deletedServices = $stmt->rowCount();

    // Supprimer tous les prestataires
    $stmt = $db->prepare("DELETE FROM providers");
    $stmt->execute();
    $deletedProviders = $stmt->rowCount();

    // Créer Jean-Marc comme unique prestataire
    $hashedPassword = password_hash('Test123!', PASSWORD_DEFAULT);
    $stmt = $db->prepare("
        INSERT INTO providers (first_name, last_name, email, phone, password, is_verified, is_available, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");
    $stmt->execute([
        'Jean-Marc',
        'Dupont',
        'jeanmarc@glamgo.com',
        '0612345678',
        $hashedPassword,
        1, // is_verified
        1  // is_available
    ]);
    $jeanMarcId = $db->lastInsertId();

    // Créer 5 notifications de test pour Jean-Marc
    $notifications = [
        [
            'type' => 'new_order',
            'title' => 'Nouvelle commande disponible',
            'message' => 'Une nouvelle commande pour Coiffure homme est disponible.'
        ],
        [
            'type' => 'new_order',
            'title' => 'Nouvelle commande disponible',
            'message' => 'Une nouvelle commande pour Soin barbe est disponible.'
        ],
        [
            'type' => 'new_message',
            'title' => 'Nouveau message',
            'message' => 'Vous avez recu un nouveau message d un client.'
        ],
        [
            'type' => 'new_order',
            'title' => 'Nouvelle commande disponible',
            'message' => 'Une nouvelle commande pour Coupe classique homme est disponible.'
        ],
        [
            'type' => 'new_order',
            'title' => 'Nouvelle commande disponible',
            'message' => 'Une nouvelle commande pour Nettoyage voiture est disponible.'
        ]
    ];

    $stmt = $db->prepare("
        INSERT INTO notifications (recipient_type, recipient_id, notification_type, title, message, is_read, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");

    $createdNotifs = 0;
    foreach ($notifications as $notif) {
        $stmt->execute([
            'provider',
            $jeanMarcId,
            $notif['type'],
            $notif['title'],
            $notif['message'],
            0 // is_read = FALSE
        ]);
        $createdNotifs++;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Reset complete',
        'deleted_providers' => $deletedProviders,
        'deleted_notifications' => $deletedNotifs,
        'deleted_provider_services' => $deletedServices,
        'created_provider' => [
            'id' => $jeanMarcId,
            'name' => 'Jean-Marc Dupont',
            'email' => 'jeanmarc@glamgo.com',
            'password' => 'Test123!'
        ],
        'created_notifications' => $createdNotifs
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
