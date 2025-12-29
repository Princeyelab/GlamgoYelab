<?php
require_once __DIR__ . '/vendor/autoload.php';

use App\Core\Database;

// Charger la config
$config = require __DIR__ . '/config/database.php';

try {
    $db = Database::getInstance();
    
    echo "=== DEBUG: Recherche prestataire Doudou ===\n\n";
    
    // 1. Trouver le prestataire Doudou
    $stmt = $db->query("SELECT id, first_name, last_name, email, latitude, longitude, current_latitude, current_longitude, is_available, is_verified, account_status FROM providers WHERE first_name LIKE '%Doudou%' OR last_name LIKE '%Doudou%' OR email LIKE '%doudou%'");
    $providers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "1. Prestataires trouvés avec 'Doudou':\n";
    print_r($providers);
    
    if (!empty($providers)) {
        $providerId = $providers[0]['id'];
        
        // 2. Vérifier les services de ce prestataire
        echo "\n2. Services du prestataire ID $providerId:\n";
        $stmt = $db->prepare("SELECT ps.*, s.id as service_id, s.name as service_name FROM provider_services ps JOIN services s ON ps.service_id = s.id WHERE ps.provider_id = ?");
        $stmt->execute([$providerId]);
        $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
        print_r($services);
        
        // 3. Vérifier si le service 104 existe
        echo "\n3. Service ID 104:\n";
        $stmt = $db->query("SELECT * FROM services WHERE id = 104");
        $service104 = $stmt->fetch(PDO::FETCH_ASSOC);
        print_r($service104);
        
        // 4. Vérifier le service "Gardiennage d'Animaux"
        echo "\n4. Service 'Gardiennage' dans la base:\n";
        $stmt = $db->query("SELECT * FROM services WHERE name LIKE '%Gardiennage%' OR name LIKE '%animaux%'");
        $gardiennage = $stmt->fetchAll(PDO::FETCH_ASSOC);
        print_r($gardiennage);
    }
    
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
}
