<?php
/**
 * Script pour ajouter les services manquants aux prestataires
 * À SUPPRIMER après utilisation
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: text/plain; charset=utf-8');

echo "=== FIX PROVIDER SERVICES ===\n\n";

$host = getenv('DB_HOST') ?: 'mysql-db';
$dbname = getenv('DB_NAME') ?: 'glamgo';
$username = getenv('DB_USER') ?: 'glamgo_user';
$password = getenv('DB_PASSWORD') ?: 'glamgo_password';

echo "DB Host: $host\n";
echo "DB Name: $dbname\n";
echo "DB User: $username\n\n";

try {
    echo "Connecting to database...\n";
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Connected!\n\n";

    // Provider ID 40 = Doudou
    $providerId = 40;
    echo "Provider ID: $providerId\n\n";

    // Chercher les vrais IDs des services
    echo "Searching for services...\n";
    $stmt = $pdo->query("SELECT id, name FROM services WHERE name LIKE '%Coiffure%' OR name LIKE '%Gardiennage%' OR name LIKE '%animaux%'");
    $foundServices = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Found " . count($foundServices) . " services:\n";
    foreach ($foundServices as $s) {
        echo "  - ID {$s['id']}: {$s['name']}\n";
    }
    echo "\n";

    // Services à ajouter pour Doudou
    $serviceIds = [104]; // Gardiennage d'Animaux

    // Ajouter aussi les services de coiffure s'ils existent
    foreach ($foundServices as $s) {
        if (stripos($s['name'], 'Coiffure Homme') !== false || stripos($s['name'], 'Gardiennage') !== false) {
            if (!in_array($s['id'], $serviceIds)) {
                $serviceIds[] = $s['id'];
            }
        }
    }

    echo "Adding services: " . implode(', ', $serviceIds) . "\n\n";

    // Ajouter chaque service
    foreach ($serviceIds as $serviceId) {
        try {
            $stmt = $pdo->prepare("INSERT IGNORE INTO provider_services (provider_id, service_id) VALUES (?, ?)");
            $stmt->execute([$providerId, $serviceId]);

            if ($stmt->rowCount() > 0) {
                echo "✅ Added service ID $serviceId\n";
            } else {
                echo "⚠️ Service ID $serviceId already exists or error\n";
            }
        } catch (Exception $e) {
            echo "❌ Error adding service ID $serviceId: " . $e->getMessage() . "\n";
        }
    }

    echo "\n=== VERIFICATION ===\n";
    $stmt = $pdo->prepare("SELECT ps.service_id, s.name FROM provider_services ps JOIN services s ON ps.service_id = s.id WHERE ps.provider_id = ?");
    $stmt->execute([$providerId]);
    $services = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Provider $providerId now has " . count($services) . " services:\n";
    foreach ($services as $s) {
        echo "  - ID {$s['service_id']}: {$s['name']}\n";
    }

    echo "\n=== DONE ===\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
