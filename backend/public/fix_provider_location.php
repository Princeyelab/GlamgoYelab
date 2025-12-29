<?php
/**
 * Mettre à jour la position de Doudou à Casablanca
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: text/plain; charset=utf-8');

echo "=== FIX PROVIDER LOCATION ===\n\n";

$host = getenv('DB_HOST') ?: 'mysql-db';
$dbname = getenv('DB_NAME') ?: 'glamgo';
$username = getenv('DB_USER') ?: 'glamgo_user';
$password = getenv('DB_PASSWORD') ?: 'glamgo_password';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $providerId = 40; // Doudou

    // Coordonnées Casablanca (Maarif)
    $lat = 33.5731;
    $lng = -7.6298;

    echo "Provider ID: $providerId\n";
    echo "New coordinates: $lat, $lng (Casablanca)\n\n";

    // Avant
    $stmt = $pdo->prepare("SELECT latitude, longitude, current_latitude, current_longitude FROM providers WHERE id = ?");
    $stmt->execute([$providerId]);
    $before = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "BEFORE:\n";
    echo "  latitude: {$before['latitude']}\n";
    echo "  longitude: {$before['longitude']}\n";
    echo "  current_latitude: {$before['current_latitude']}\n";
    echo "  current_longitude: {$before['current_longitude']}\n\n";

    // Mise à jour
    $stmt = $pdo->prepare("UPDATE providers SET current_latitude = ?, current_longitude = ? WHERE id = ?");
    $stmt->execute([$lat, $lng, $providerId]);

    echo "Updated " . $stmt->rowCount() . " row(s)\n\n";

    // Après
    $stmt = $pdo->prepare("SELECT latitude, longitude, current_latitude, current_longitude FROM providers WHERE id = ?");
    $stmt->execute([$providerId]);
    $after = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "AFTER:\n";
    echo "  latitude: {$after['latitude']}\n";
    echo "  longitude: {$after['longitude']}\n";
    echo "  current_latitude: {$after['current_latitude']}\n";
    echo "  current_longitude: {$after['current_longitude']}\n\n";

    echo "=== DONE ===\n";
    echo "\nNow test: http://localhost:8080/api/services/104/nearby-providers?lat=33.5731&lng=-7.5898&radius=50&test_mode=true\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
