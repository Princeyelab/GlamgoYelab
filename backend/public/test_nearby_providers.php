<?php
/**
 * Script de test pour le systeme de geolocalisation GlamGo
 *
 * Ce script teste :
 * 1. Le calcul de distance Haversine
 * 2. La recherche de prestataires dans un rayon
 * 3. Le tri par proximite
 * 4. Le calcul de prix avec distance
 *
 * Usage: php test_nearby_providers.php ou http://localhost:8080/test_nearby_providers.php
 */

// Configuration
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json; charset=utf-8');

// Charger l'autoloader
require_once __DIR__ . '/../vendor/autoload.php';

use App\Helpers\GeoCalculator;
use App\Helpers\PriceCalculator;

// Couleurs pour la console
define('GREEN', "\033[32m");
define('RED', "\033[31m");
define('YELLOW', "\033[33m");
define('BLUE', "\033[34m");
define('RESET', "\033[0m");

// Determiner si on est en CLI ou web
$isCli = php_sapi_name() === 'cli';

function output($message, $color = null) {
    global $isCli;
    if ($isCli && $color) {
        echo $color . $message . RESET . "\n";
    } else {
        echo $message . "\n";
    }
}

function testResult($name, $passed, $details = '') {
    global $isCli;
    $status = $passed ? 'PASS' : 'FAIL';
    $color = $passed ? GREEN : RED;

    if ($isCli) {
        echo $color . "[{$status}]" . RESET . " {$name}";
        if ($details) echo " - {$details}";
        echo "\n";
    } else {
        echo "[{$status}] {$name}";
        if ($details) echo " - {$details}";
        echo "<br>";
    }

    return $passed;
}

// =====================================================
// TESTS
// =====================================================

$results = [
    'total' => 0,
    'passed' => 0,
    'failed' => 0,
    'tests' => []
];

output("\n====================================", BLUE);
output("  TESTS GEOLOCALISATION PRESTATAIRES", BLUE);
output("====================================\n", BLUE);

// -----------------------------------------------------
// Test 1: Calcul distance Haversine - Cas simple
// -----------------------------------------------------
output("--- Test 1: Distance Haversine (Jemaa el-Fna -> Gueliz) ---", YELLOW);

// Jemaa el-Fna: 31.6258, -7.9891
// Gueliz: 31.6400, -8.0100
$distance = GeoCalculator::calculateDistance(31.6258, -7.9891, 31.6400, -8.0100);

// Distance attendue: environ 2.5-3.5 km
$test1 = $distance >= 2.0 && $distance <= 4.0;

$results['total']++;
if (testResult('Distance Jemaa-Gueliz', $test1, "Distance: {$distance} km (attendu: ~3 km)")) {
    $results['passed']++;
} else {
    $results['failed']++;
}
$results['tests'][] = ['name' => 'Haversine Jemaa-Gueliz', 'passed' => $test1, 'distance' => $distance];

// -----------------------------------------------------
// Test 2: Distance zero (meme point)
// -----------------------------------------------------
output("\n--- Test 2: Distance zero (meme point) ---", YELLOW);

$distance = GeoCalculator::calculateDistance(31.6258, -7.9891, 31.6258, -7.9891);
$test2 = $distance == 0;

$results['total']++;
if (testResult('Distance zero', $test2, "Distance: {$distance} km")) {
    $results['passed']++;
} else {
    $results['failed']++;
}
$results['tests'][] = ['name' => 'Distance zero', 'passed' => $test2, 'distance' => $distance];

// -----------------------------------------------------
// Test 3: Distance longue (Marrakech -> Casablanca)
// -----------------------------------------------------
output("\n--- Test 3: Distance longue (Marrakech -> Casablanca) ---", YELLOW);

// Marrakech: 31.6258, -7.9891
// Casablanca: 33.5731, -7.5898
$distance = GeoCalculator::calculateDistance(31.6258, -7.9891, 33.5731, -7.5898);

// Distance attendue: environ 220-240 km
$test3 = $distance >= 200 && $distance <= 250;

$results['total']++;
if (testResult('Distance Marrakech-Casa', $test3, "Distance: {$distance} km (attendu: ~220 km)")) {
    $results['passed']++;
} else {
    $results['failed']++;
}
$results['tests'][] = ['name' => 'Distance longue', 'passed' => $test3, 'distance' => $distance];

// -----------------------------------------------------
// Test 4: Validation coordonnees invalides
// -----------------------------------------------------
output("\n--- Test 4: Validation coordonnees invalides ---", YELLOW);

$test4 = false;
try {
    GeoCalculator::calculateDistance(91, -7.9891, 31.6258, -7.9891);
    $msg = 'ERREUR: Latitude invalide non detectee';
} catch (InvalidArgumentException $e) {
    $test4 = true;
    $msg = 'Exception correctement levee';
}

$results['total']++;
if (testResult('Latitude invalide', $test4, $msg)) {
    $results['passed']++;
} else {
    $results['failed']++;
}
$results['tests'][] = ['name' => 'Validation latitude', 'passed' => $test4];

// -----------------------------------------------------
// Test 5: Formatage distance
// -----------------------------------------------------
output("\n--- Test 5: Formatage distance ---", YELLOW);

$formatted1 = GeoCalculator::formatDistance(0.5);
$formatted2 = GeoCalculator::formatDistance(3.7);
$formatted3 = GeoCalculator::formatDistance(15.123);

$test5 = $formatted1 === '500 m' &&
         $formatted2 === '3.7 km' &&
         $formatted3 === '15.1 km';

$results['total']++;
if (testResult('Formatage distance', $test5, "0.5km={$formatted1}, 3.7km={$formatted2}, 15.123km={$formatted3}")) {
    $results['passed']++;
} else {
    $results['failed']++;
}
$results['tests'][] = ['name' => 'Formatage distance', 'passed' => $test5];

// -----------------------------------------------------
// Test 6: Bounding box
// -----------------------------------------------------
output("\n--- Test 6: Calcul bounding box ---", YELLOW);

$bbox = GeoCalculator::getBoundingBox(31.6258, -7.9891, 10);

$test6 = isset($bbox['min_lat']) &&
         isset($bbox['max_lat']) &&
         isset($bbox['min_lng']) &&
         isset($bbox['max_lng']) &&
         $bbox['min_lat'] < 31.6258 &&
         $bbox['max_lat'] > 31.6258;

$results['total']++;
if (testResult('Bounding box 10km', $test6, "min_lat: {$bbox['min_lat']}, max_lat: {$bbox['max_lat']}")) {
    $results['passed']++;
} else {
    $results['failed']++;
}
$results['tests'][] = ['name' => 'Bounding box', 'passed' => $test6, 'bbox' => $bbox];

// -----------------------------------------------------
// Test 7: Recherche prestataires (si DB disponible)
// -----------------------------------------------------
output("\n--- Test 7: Recherche prestataires dans rayon ---", YELLOW);

try {
    $providers = GeoCalculator::findProvidersInRadius(
        31.6258,  // Jemaa el-Fna
        -7.9891,
        30,       // 30 km
        1,        // Service ID 1
        ['only_available' => false]
    );

    $test7 = is_array($providers);
    $count = count($providers);
    $msg = "Trouve {$count} prestataire(s)";

    // Verifier structure si resultats
    if ($count > 0) {
        $first = $providers[0];
        $hasRequiredFields = isset($first['id']) &&
                            isset($first['distance']) &&
                            isset($first['calculated_price']);
        $test7 = $test7 && $hasRequiredFields;

        if (!$hasRequiredFields) {
            $msg .= " - ERREUR: Champs manquants";
        } else {
            $msg .= " - Distance premier: {$first['distance']} km, Prix: {$first['calculated_price']} MAD";
        }
    }
} catch (Exception $e) {
    $test7 = false;
    $msg = 'Exception: ' . substr($e->getMessage(), 0, 50);
}

$results['total']++;
if (testResult('Recherche prestataires', $test7, $msg)) {
    $results['passed']++;
} else {
    $results['failed']++;
}
$results['tests'][] = ['name' => 'Recherche prestataires', 'passed' => $test7, 'count' => $count ?? 0];

// -----------------------------------------------------
// Test 8: Tri par distance
// -----------------------------------------------------
output("\n--- Test 8: Tri par distance ---", YELLOW);

$mockProviders = [
    ['id' => 1, 'latitude' => 31.6400, 'longitude' => -8.0100], // ~3 km
    ['id' => 2, 'latitude' => 31.6258, 'longitude' => -7.9891], // 0 km
    ['id' => 3, 'latitude' => 31.6800, 'longitude' => -7.9600], // ~6 km
];

$sorted = GeoCalculator::sortByDistance($mockProviders, 31.6258, -7.9891);

$test8 = $sorted[0]['id'] == 2 && // Le plus proche (0 km)
         $sorted[1]['id'] == 1 && // Ensuite (~3 km)
         $sorted[2]['id'] == 3;   // Le plus loin (~6 km)

$distances = array_map(fn($p) => $p['distance'], $sorted);
$msg = "Ordre: " . implode(', ', array_column($sorted, 'id')) . " (distances: " . implode(', ', $distances) . " km)";

$results['total']++;
if (testResult('Tri par distance', $test8, $msg)) {
    $results['passed']++;
} else {
    $results['failed']++;
}
$results['tests'][] = ['name' => 'Tri par distance', 'passed' => $test8];

// -----------------------------------------------------
// Test 9: Calcul frais de distance
// -----------------------------------------------------
output("\n--- Test 9: Calcul frais de distance ---", YELLOW);

$service = [
    'id' => 1,
    'name' => 'Test Service',
    'price' => 100
];

$params = [
    'formula_type' => 'standard',
    'scheduled_time' => '2025-11-28 14:00:00',
    'duration_hours' => 1,
    'distance_km' => 15, // 15 - 5 gratuits = 10 km * 2 MAD = 20 MAD frais
    'quantity' => 1
];

$breakdown = PriceCalculator::calculate($service, $params);

$test9 = $breakdown['distance_fee'] == 20 &&
         $breakdown['total'] == 120; // 100 + 20 frais distance

$results['total']++;
if (testResult('Frais distance 15km', $test9, "Frais: {$breakdown['distance_fee']} MAD, Total: {$breakdown['total']} MAD")) {
    $results['passed']++;
} else {
    $results['failed']++;
}
$results['tests'][] = ['name' => 'Frais distance', 'passed' => $test9, 'breakdown' => $breakdown];

// -----------------------------------------------------
// Test 10: Distance gratuite (< 5km)
// -----------------------------------------------------
output("\n--- Test 10: Distance gratuite (<5km) ---", YELLOW);

$params['distance_km'] = 4;
$breakdown = PriceCalculator::calculate($service, $params);

$test10 = $breakdown['distance_fee'] == 0 &&
          $breakdown['total'] == 100;

$results['total']++;
if (testResult('Distance gratuite 4km', $test10, "Frais: {$breakdown['distance_fee']} MAD, Total: {$breakdown['total']} MAD")) {
    $results['passed']++;
} else {
    $results['failed']++;
}
$results['tests'][] = ['name' => 'Distance gratuite', 'passed' => $test10, 'breakdown' => $breakdown];

// -----------------------------------------------------
// Test 11: Combinaison formule + distance
// -----------------------------------------------------
output("\n--- Test 11: Combinaison Premium + Distance ---", YELLOW);

$params = [
    'formula_type' => 'premium',
    'scheduled_time' => '2025-11-28 14:00:00',
    'duration_hours' => 1,
    'distance_km' => 15,
    'quantity' => 1
];

$breakdown = PriceCalculator::calculate($service, $params);

// Premium: 100 + 30% = 130
// Distance: 20 MAD
// Total: 150 MAD
$expectedTotal = 150;
$test11 = $breakdown['total'] == $expectedTotal;

$results['total']++;
if (testResult('Premium + Distance', $test11, "Total: {$breakdown['total']} MAD (attendu: {$expectedTotal})")) {
    $results['passed']++;
} else {
    $results['failed']++;
}
$results['tests'][] = ['name' => 'Premium + Distance', 'passed' => $test11, 'breakdown' => $breakdown];

// -----------------------------------------------------
// Test 12: API endpoint (si disponible)
// -----------------------------------------------------
output("\n--- Test 12: Test API endpoint ---", YELLOW);

$apiUrl = 'http://localhost:8080/api/services/1/nearby-providers?lat=31.6258&lng=-7.9891&radius=30';

$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$test12 = false;
$msg = "HTTP {$httpCode}";

if ($httpCode == 200) {
    $data = json_decode($response, true);
    $test12 = isset($data['success']) && $data['success'] === true;
    if ($test12) {
        $totalFound = $data['data']['total_found'] ?? $data['total_found'] ?? 0;
        $msg .= " - {$totalFound} prestataire(s) trouve(s)";
    } else {
        $msg .= " - Reponse invalide";
    }
} else if ($httpCode == 0) {
    $msg = "API non accessible (serveur eteint?)";
}

$results['total']++;
if (testResult('API nearby-providers', $test12, $msg)) {
    $results['passed']++;
} else {
    $results['failed']++;
}
$results['tests'][] = ['name' => 'API endpoint', 'passed' => $test12, 'http_code' => $httpCode];

// =====================================================
// RESUME
// =====================================================

output("\n====================================", BLUE);
output("           RESUME", BLUE);
output("====================================", BLUE);

$passRate = $results['total'] > 0 ? round(($results['passed'] / $results['total']) * 100) : 0;

output("Tests totaux:  {$results['total']}", null);
output("Reussis:       {$results['passed']}", GREEN);
output("Echoues:       {$results['failed']}", $results['failed'] > 0 ? RED : GREEN);
output("Taux succes:   {$passRate}%", $passRate == 100 ? GREEN : ($passRate >= 80 ? YELLOW : RED));

output("\n====================================", BLUE);

// Retourner JSON si appel API
if (!$isCli) {
    echo json_encode([
        'success' => $results['failed'] === 0,
        'summary' => [
            'total' => $results['total'],
            'passed' => $results['passed'],
            'failed' => $results['failed'],
            'pass_rate' => $passRate . '%'
        ],
        'tests' => $results['tests']
    ], JSON_PRETTY_PRINT);
}

exit($results['failed'] > 0 ? 1 : 0);
