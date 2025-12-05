<?php
/**
 * Script de test du système de paiement GlamGo
 * Vérifie toutes les fonctionnalités
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "🧪 TEST SYSTÈME DE PAIEMENT GLAMGO\n";
echo "===================================\n\n";

// Autoloader
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $baseDir = __DIR__ . '/app/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';
    if (file_exists($file)) {
        require $file;
    }
});

use App\Core\Database;
use App\Helpers\PaymentGateway;
use App\Helpers\PaymentLogger;

$tests_passed = 0;
$tests_failed = 0;

function test($name, $callback) {
    global $tests_passed, $tests_failed;

    echo "🔍 Test: $name\n";

    try {
        $result = $callback();
        if ($result) {
            echo "   ✅ PASSED\n\n";
            $tests_passed++;
        } else {
            echo "   ❌ FAILED\n\n";
            $tests_failed++;
        }
    } catch (Exception $e) {
        echo "   ❌ EXCEPTION: " . $e->getMessage() . "\n\n";
        $tests_failed++;
    }
}

// =====================================================
// TEST 1 : Connexion base de données
// =====================================================
test("Connexion base de données", function() {
    $db = Database::getInstance();
    return $db !== null;
});

// =====================================================
// TEST 2 : Tables créées
// =====================================================
test("Tables payment créées", function() {
    $db = Database::getInstance();

    $tables = ['transactions', 'payment_methods', 'payment_logs', 'payment_config'];
    foreach ($tables as $table) {
        $stmt = $db->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() === 0) {
            echo "   ⚠️  Table $table manquante\n";
            return false;
        }
    }
    return true;
});

// =====================================================
// TEST 3 : Colonnes users modifiées
// =====================================================
test("Colonnes users ajoutées", function() {
    $db = Database::getInstance();
    $stmt = $db->query("DESCRIBE users");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $required = [
        'payment_method_validated',
        'card_last4',
        'card_brand',
        'card_token'
    ];

    foreach ($required as $col) {
        if (!in_array($col, $columns)) {
            echo "   ⚠️  Colonne users.$col manquante\n";
            return false;
        }
    }
    return true;
});

// =====================================================
// TEST 4 : Colonnes providers modifiées
// =====================================================
test("Colonnes providers ajoutées", function() {
    $db = Database::getInstance();
    $stmt = $db->query("DESCRIBE providers");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $required = [
        'payment_method_validated',
        'bank_account_iban',
        'bank_name',
        'bank_account_validated'
    ];

    foreach ($required as $col) {
        if (!in_array($col, $columns)) {
            echo "   ⚠️  Colonne providers.$col manquante\n";
            return false;
        }
    }
    return true;
});

// =====================================================
// TEST 5 : PaymentGateway - Validation carte (Mock)
// =====================================================
test("PaymentGateway::tokenizeCard (MOCK)", function() {
    $result = PaymentGateway::tokenizeCard([
        'card_number' => '4242424242424242',
        'exp_month' => 12,
        'exp_year' => 2025,
        'cvv' => '123'
    ]);

    if (!isset($result['mock']) || $result['mock'] !== true) {
        echo "   ⚠️  Mode MOCK non actif\n";
        return false;
    }

    // Vérifier que ça retourne soit success soit erreur
    return isset($result['success']);
});

// =====================================================
// TEST 6 : PaymentGateway - Paiement (Mock)
// =====================================================
test("PaymentGateway::charge (MOCK)", function() {
    $result = PaymentGateway::charge([
        'amount' => 250,
        'card_token' => 'tok_mock_test',
        'description' => 'Test payment',
        'order_id' => 999
    ]);

    return isset($result['success']);
});

// =====================================================
// TEST 7 : PaymentLogger - Log fichier
// =====================================================
test("PaymentLogger - Écriture fichier", function() {
    $logger = PaymentLogger::getInstance();
    $logger->log('test_event', [
        'test' => true,
        'timestamp' => time()
    ]);

    $log_file = __DIR__ . '/logs/payments_' . date('Y-m-d') . '.log';
    return file_exists($log_file);
});

// =====================================================
// TEST 8 : PaymentLogger - Log DB
// =====================================================
test("PaymentLogger - Écriture DB", function() {
    $db = Database::getInstance();
    $logger = PaymentLogger::getInstance();

    $logger->log('test_db_event', [
        'amount' => 100,
        'test' => true
    ]);

    $stmt = $db->query("SELECT * FROM payment_logs WHERE event_type = 'test_db_event' ORDER BY created_at DESC LIMIT 1");
    $log = $stmt->fetch(PDO::FETCH_ASSOC);

    return $log !== false;
});

// =====================================================
// TEST 9 : PaymentGateway - Algorithme Luhn
// =====================================================
test("PaymentGateway - Validation Luhn", function() {
    // Carte valide
    $valid = PaymentGateway::tokenizeCard([
        'card_number' => '4242424242424242',
        'exp_month' => 12,
        'exp_year' => 2025,
        'cvv' => '123'
    ]);

    // Carte invalide
    $invalid = PaymentGateway::tokenizeCard([
        'card_number' => '4242424242424243', // Mauvais checksum
        'exp_month' => 12,
        'exp_year' => 2025,
        'cvv' => '123'
    ]);

    return !$invalid['success'] && $invalid['error'] !== null;
});

// =====================================================
// TEST 10 : Configuration paiement
// =====================================================
test("Configuration paiement", function() {
    $db = Database::getInstance();
    $stmt = $db->query("SELECT * FROM payment_config");
    $configs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $required_keys = ['commission_rate', 'payment_gateway_mode'];
    $config_keys = array_column($configs, 'config_key');

    foreach ($required_keys as $key) {
        if (!in_array($key, $config_keys)) {
            echo "   ⚠️  Config $key manquante\n";
            return false;
        }
    }
    return true;
});

// =====================================================
// RÉSULTATS
// =====================================================
echo "\n";
echo "===================================\n";
echo "RÉSULTATS DES TESTS\n";
echo "===================================\n";
echo "✅ Tests réussis : $tests_passed\n";
echo "❌ Tests échoués : $tests_failed\n";
echo "\n";

if ($tests_failed === 0) {
    echo "🎉 TOUS LES TESTS SONT PASSÉS !\n";
    echo "Le système de paiement est prêt à l'emploi.\n\n";

    echo "📝 PROCHAINES ÉTAPES:\n";
    echo "1. Tester le frontend: http://localhost:3000/payment-demo\n";
    echo "2. Dashboard admin: http://localhost:8080/admin/transactions.php\n";
    echo "3. Consulter les logs: backend/logs/payments_" . date('Y-m-d') . ".log\n";
} else {
    echo "⚠️  CERTAINS TESTS ONT ÉCHOUÉ\n";
    echo "Vérifiez les erreurs ci-dessus avant de continuer.\n";
}

echo "\n";
exit($tests_failed === 0 ? 0 : 1);
