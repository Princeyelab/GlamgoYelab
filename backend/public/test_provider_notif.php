<?php
// Test simple pour vérifier les notifications prestataire
header('Content-Type: application/json');

// Simuler une connexion à la base de données
$host = 'db';
$dbname = 'glamgo';
$username = 'glamgo_user';
$password = 'glamgo_pass';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Compter les prestataires
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM providers");
    $providerCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Compter les notifications prestataire
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM notifications WHERE recipient_type = 'provider'");
    $notifCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Récupérer un exemple de prestataire
    $stmt = $pdo->query("SELECT id, first_name, last_name, email FROM providers LIMIT 1");
    $provider = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Compter les notifications pour ce prestataire
    $providerNotifCount = 0;
    if ($provider) {
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM notifications WHERE recipient_type = 'provider' AND recipient_id = ?");
        $stmt->execute([$provider['id']]);
        $providerNotifCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    }
    
    echo json_encode([
        'success' => true,
        'providers_count' => $providerCount,
        'total_provider_notifications' => $notifCount,
        'sample_provider' => $provider,
        'sample_provider_notifications' => $providerNotifCount
    ], JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
