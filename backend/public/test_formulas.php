<?php
/**
 * Script de test pour le systeme de formules GlamGo
 *
 * Ce script teste :
 * 1. Le calcul de prix pour toutes les formules
 * 2. Les regles metier specifiques (Auto, Danse, Animaux)
 * 3. Les combinaisons de frais (nuit + distance)
 * 4. La commission GlamGo (20%)
 *
 * Usage: php test_formulas.php ou http://localhost:8080/test_formulas.php
 */

// Configuration
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json; charset=utf-8');

// Charger l'autoloader
require_once __DIR__ . '/../vendor/autoload.php';

use App\Helpers\PriceCalculator;
use App\Helpers\ServiceRules;

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
output("  TESTS DU SYSTEME DE FORMULES", BLUE);
output("====================================\n", BLUE);

// -----------------------------------------------------
// Test 1: Calcul prix formule Standard
// -----------------------------------------------------
output("--- Test 1: Formule Standard ---", YELLOW);

$service = [
    'id' => 1,
    'name' => 'Coupe Femme',
    'price' => 150,
    'category_name' => 'Beaute'
];

$params = [
    'formula_type' => 'standard',
    'scheduled_time' => '2025-11-28 14:00:00',
    'duration_hours' => 1,
    'distance_km' => 3,
    'quantity' => 1
];

$breakdown = PriceCalculator::calculate($service, $params);

$test1 = $breakdown['base_price'] == 150 &&
         $breakdown['formula_modifier'] == 0 &&
         $breakdown['total'] == 150;

$results['total']++;
if (testResult('Formule Standard base', $test1, "Total: {$breakdown['total']} MAD")) {
    $results['passed']++;
} else {
    $results['failed']++;
}
$results['tests'][] = ['name' => 'Standard base', 'passed' => $test1, 'breakdown' => $breakdown];

// -----------------------------------------------------
// Test 2: Formule Recurrent (-10%)
// -----------------------------------------------------
output("\n--- Test 2: Formule Recurrent ---", YELLOW);

$params['formula_type'] = 'recurring';
$breakdown = PriceCalculator::calculate($service, $params);

$expectedModifier = -15; // -10% de 150
$expectedTotal = 135;
$test2 = $breakdown['formula_modifier'] == $expectedModifier &&
         $breakdown['total'] == $expectedTotal;

$results['total']++;
if (testResult('Formule Recurrent -10%', $test2, "Modifier: {$breakdown['formula_modifier']}, Total: {$breakdown['total']} MAD")) {
    $results['passed']++;
} else {
    $results['failed']++;
}
$results['tests'][] = ['name' => 'Recurrent -10%', 'passed' => $test2, 'breakdown' => $breakdown];

// -----------------------------------------------------
// Test 3: Formule Premium (+30%)
// -----------------------------------------------------
output("\n--- Test 3: Formule Premium ---", YELLOW);

$params['formula_type'] = 'premium';
$breakdown = PriceCalculator::calculate($service, $params);

$expectedModifier = 45; // +30% de 150
$expectedTotal = 195;
$test3 = $breakdown['formula_modifier'] == $expectedModifier &&
         $breakdown['total'] == $expectedTotal;

$results['total']++;
if (testResult('Formule Premium +30%', $test3, "Modifier: {$breakdown['formula_modifier']}, Total: {$breakdown['total']} MAD")) {
    $results['passed']++;
} else {
    $results['failed']++;
}
$results['tests'][] = ['name' => 'Premium +30%', 'passed' => $test3, 'breakdown' => $breakdown];

// -----------------------------------------------------
// Test 4: Formule Urgent (+50 MAD fixe)
// -----------------------------------------------------
output("\n--- Test 4: Formule Urgent ---", YELLOW);

$params['formula_type'] = 'urgent';
$breakdown = PriceCalculator::calculate($service, $params);

$expectedModifier = 50;
$expectedTotal = 200;
$test4 = $breakdown['formula_modifier'] == $expectedModifier &&
         $breakdown['total'] == $expectedTotal;

$results['total']++;
if (testResult('Formule Urgent +50 MAD', $test4, "Modifier: {$breakdown['formula_modifier']}, Total: {$breakdown['total']} MAD")) {
    $results['passed']++;
} else {
    $results['failed']++;
}
$results['tests'][] = ['name' => 'Urgent +50 MAD', 'passed' => $test4, 'breakdown' => $breakdown];

// -----------------------------------------------------
// Test 5: Formule Nuit (+30 MAD fixe)
// -----------------------------------------------------
output("\n--- Test 5: Formule Nuit ---", YELLOW);

$params['formula_type'] = 'night';
$breakdown = PriceCalculator::calculate($service, $params);

$expectedModifier = 30;
$expectedTotal = 180;
$test5 = $breakdown['formula_modifier'] == $expectedModifier &&
         $breakdown['total'] == $expectedTotal;

$results['total']++;
if (testResult('Formule Nuit +30 MAD', $test5, "Modifier: {$breakdown['formula_modifier']}, Total: {$breakdown['total']} MAD")) {
    $results['passed']++;
} else {
    $results['failed']++;
}
$results['tests'][] = ['name' => 'Night +30 MAD', 'passed' => $test5, 'breakdown' => $breakdown];

// -----------------------------------------------------
// Test 6: Frais de distance (>5km)
// -----------------------------------------------------
output("\n--- Test 6: Frais de distance ---", YELLOW);

$params['formula_type'] = 'standard';
$params['distance_km'] = 15; // 15km - 5km gratuits = 10km * 2 MAD = 20 MAD
$breakdown = PriceCalculator::calculate($service, $params);

$expectedDistanceFee = 20;
$expectedTotal = 170;
$test6 = $breakdown['distance_fee'] == $expectedDistanceFee &&
         $breakdown['total'] == $expectedTotal;

$results['total']++;
if (testResult('Distance 15km = +20 MAD', $test6, "Distance fee: {$breakdown['distance_fee']}, Total: {$breakdown['total']} MAD")) {
    $results['passed']++;
} else {
    $results['failed']++;
}
$results['tests'][] = ['name' => 'Distance fee', 'passed' => $test6, 'breakdown' => $breakdown];

// -----------------------------------------------------
// Test 7: Supplement nuit automatique (22h-6h)
// -----------------------------------------------------
output("\n--- Test 7: Supplement nuit automatique ---", YELLOW);

$params['distance_km'] = 3;
$params['scheduled_time'] = '2025-11-28 23:00:00'; // Heure de nuit
$breakdown = PriceCalculator::calculate($service, $params);

$expectedNightFee = 30;
$test7 = $breakdown['night_fee'] == $expectedNightFee &&
         $breakdown['is_night_service'] === true;

$results['total']++;
if (testResult('Nuit auto 23h = +30 MAD', $test7, "Night fee: {$breakdown['night_fee']}, Is night: " . ($breakdown['is_night_service'] ? 'yes' : 'no'))) {
    $results['passed']++;
} else {
    $results['failed']++;
}
$results['tests'][] = ['name' => 'Night auto fee', 'passed' => $test7, 'breakdown' => $breakdown];

// -----------------------------------------------------
// Test 8: Combinaison Premium + Distance + Nuit
// -----------------------------------------------------
output("\n--- Test 8: Combinaison complete ---", YELLOW);

$params['formula_type'] = 'premium';
$params['distance_km'] = 15;
$params['scheduled_time'] = '2025-11-28 23:00:00';
$breakdown = PriceCalculator::calculate($service, $params);

// Premium: 150 + 45 = 195
// Distance: 20 MAD (15-5)*2
// Nuit: 30 MAD
// Total: 245 MAD
$expectedTotal = 245;
$test8 = $breakdown['total'] == $expectedTotal;

$results['total']++;
if (testResult('Premium+Distance+Nuit', $test8, "Total: {$breakdown['total']} MAD (attendu: 245)")) {
    $results['passed']++;
} else {
    $results['failed']++;
}
$results['tests'][] = ['name' => 'Full combo', 'passed' => $test8, 'breakdown' => $breakdown];

// -----------------------------------------------------
// Test 9: Commission GlamGo (20%)
// -----------------------------------------------------
output("\n--- Test 9: Commission GlamGo ---", YELLOW);

$params['formula_type'] = 'standard';
$params['distance_km'] = 0;
$params['scheduled_time'] = '2025-11-28 14:00:00';
$breakdown = PriceCalculator::calculate($service, $params);

$expectedCommission = 30; // 20% de 150
$expectedProvider = 120;
$test9 = $breakdown['commission_glamgo'] == $expectedCommission &&
         $breakdown['provider_amount'] == $expectedProvider;

$results['total']++;
if (testResult('Commission 20%', $test9, "Commission: {$breakdown['commission_glamgo']} MAD, Provider: {$breakdown['provider_amount']} MAD")) {
    $results['passed']++;
} else {
    $results['failed']++;
}
$results['tests'][] = ['name' => 'Commission 20%', 'passed' => $test9, 'breakdown' => $breakdown];

// -----------------------------------------------------
// Test 10: Regles metier - Danse orientale
// -----------------------------------------------------
output("\n--- Test 10: Regles metier Danse ---", YELLOW);

$danceService = [
    'id' => 50,
    'name' => 'Cours de Danse',
    'price' => 200,
    'category_name' => 'Danse'
];

$danceDetails = [
    'dance_type' => 'orientale',
    'session_type' => 'cours_prive',
    'participants' => 3
];

try {
    $validation = ServiceRules::validateBooking($danceService, 'standard', $danceDetails);
    $test10 = $validation['valid'] === true;
    $msg = 'Danse orientale acceptee';
} catch (Exception $e) {
    $test10 = false;
    $msg = 'Erreur: ' . $e->getMessage();
}

$results['total']++;
if (testResult('Danse orientale valide', $test10, $msg)) {
    $results['passed']++;
} else {
    $results['failed']++;
}

// -----------------------------------------------------
// Test 11: Regles metier - Danse non-orientale refusee
// -----------------------------------------------------
output("\n--- Test 11: Danse non-orientale refusee ---", YELLOW);

$danceDetails['dance_type'] = 'salsa';

try {
    ServiceRules::validateBooking($danceService, 'standard', $danceDetails);
    $test11 = false;
    $msg = 'ERREUR: Salsa aurait du etre refuse';
} catch (Exception $e) {
    $test11 = true;
    $msg = 'Correctement refuse: ' . substr($e->getMessage(), 0, 50);
}

$results['total']++;
if (testResult('Danse salsa refusee', $test11, $msg)) {
    $results['passed']++;
} else {
    $results['failed']++;
}

// -----------------------------------------------------
// Test 12: Regles metier - Animaux avec GPS
// -----------------------------------------------------
output("\n--- Test 12: Animaux avec GPS ---", YELLOW);

$animalService = [
    'id' => 60,
    'name' => 'Gardiennage Animaux',
    'price' => 100,
    'category_name' => 'Animaux'
];

$animalDetails = [
    'service_type' => 'gardiennage',
    'animal_type' => 'chien',
    'animal_count' => 1
];

try {
    $validation = ServiceRules::validateBooking($animalService, 'standard', $animalDetails);
    $hasGpsRequirement = false;
    foreach ($validation['requirements'] as $req) {
        if ($req['field'] === 'gps_consent') {
            $hasGpsRequirement = true;
            break;
        }
    }
    $test12 = $validation['valid'] && $hasGpsRequirement;
    $msg = 'GPS requis: ' . ($hasGpsRequirement ? 'oui' : 'non');
} catch (Exception $e) {
    $test12 = false;
    $msg = 'Erreur: ' . $e->getMessage();
}

$results['total']++;
if (testResult('Animaux GPS requis', $test12, $msg)) {
    $results['passed']++;
} else {
    $results['failed']++;
}

// -----------------------------------------------------
// Test 13: Animaux - Toilettage refuse
// -----------------------------------------------------
output("\n--- Test 13: Toilettage animaux refuse ---", YELLOW);

$animalDetails['service_type'] = 'toilettage';

try {
    ServiceRules::validateBooking($animalService, 'standard', $animalDetails);
    $test13 = false;
    $msg = 'ERREUR: Toilettage aurait du etre refuse';
} catch (Exception $e) {
    $test13 = true;
    $msg = 'Correctement refuse';
}

$results['total']++;
if (testResult('Toilettage refuse', $test13, $msg)) {
    $results['passed']++;
} else {
    $results['failed']++;
}

// -----------------------------------------------------
// Test 14: Auto - Mecanique refusee
// -----------------------------------------------------
output("\n--- Test 14: Auto mecanique refusee ---", YELLOW);

$autoService = [
    'id' => 70,
    'name' => 'Nettoyage Auto',
    'price' => 120,
    'category_name' => 'Auto'
];

$autoDetails = [
    'service_type' => 'mecanique'
];

try {
    ServiceRules::validateBooking($autoService, 'standard', $autoDetails);
    $test14 = false;
    $msg = 'ERREUR: Mecanique aurait du etre refuse';
} catch (Exception $e) {
    $test14 = true;
    $msg = 'Correctement refuse';
}

$results['total']++;
if (testResult('Auto mecanique refusee', $test14, $msg)) {
    $results['passed']++;
} else {
    $results['failed']++;
}

// -----------------------------------------------------
// Test 15: Duree multiple
// -----------------------------------------------------
output("\n--- Test 15: Duree multiple ---", YELLOW);

$params = [
    'formula_type' => 'standard',
    'scheduled_time' => '2025-11-28 14:00:00',
    'duration_hours' => 3,
    'distance_km' => 0,
    'quantity' => 1
];

$breakdown = PriceCalculator::calculate($service, $params);
$expectedTotal = 450; // 150 * 3
$test15 = $breakdown['total'] == $expectedTotal;

$results['total']++;
if (testResult('Duree 3h = x3', $test15, "Total: {$breakdown['total']} MAD")) {
    $results['passed']++;
} else {
    $results['failed']++;
}

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
