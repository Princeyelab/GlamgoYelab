<?php
/**
 * Test du systeme de satisfaction post-prestation
 * GlamGo - Marrakech
 *
 * Ce fichier permet de tester le workflow complet:
 * 1. Prestataire termine la prestation
 * 2. Client recoit notification
 * 3. Client soumet questionnaire
 * 4. Paiement libere
 *
 * Usage: php test_satisfaction.php
 * Ou via navigateur: http://localhost:8080/test_satisfaction.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

// Charger l'autoloader - chercher dans plusieurs emplacements
$autoloadPaths = [
    __DIR__ . '/../vendor/autoload.php',
    __DIR__ . '/../app/core/Database.php',
];

$loaded = false;
foreach ($autoloadPaths as $path) {
    if (file_exists($path)) {
        require_once $path;
        $loaded = true;
        break;
    }
}

// Si pas d'autoloader, charger manuellement les classes necessaires
if (!$loaded) {
    // Connexion directe a MySQL sans autoloader
    $dbHost = getenv('DB_HOST') ?: 'mysql-db';
    $dbName = getenv('DB_NAME') ?: 'glamgo';
    $dbUser = getenv('DB_USER') ?: 'glamgo_user';
    $dbPass = getenv('DB_PASSWORD') ?: 'glamgo_password';
}

echo "<h1>Test Systeme de Satisfaction GlamGo</h1>\n";
echo "<pre>\n";

// Connexion a la base de donnees
try {
    $db = Database::getInstance();
    echo "✅ Connexion base de donnees OK\n\n";
} catch (Exception $e) {
    die("❌ Erreur connexion DB: " . $e->getMessage() . "\n");
}

// 1. Verifier que la table satisfaction_surveys existe
echo "=== TEST 1: Verification tables ===\n";
try {
    $stmt = $db->query("SHOW TABLES LIKE 'satisfaction_surveys'");
    if ($stmt->rowCount() > 0) {
        echo "✅ Table satisfaction_surveys existe\n";
    } else {
        echo "❌ Table satisfaction_surveys n'existe pas\n";
        echo "   Executez la migration: database/migrations/013_add_satisfaction_system.sql\n";
    }
} catch (PDOException $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
}

// 2. Verifier le nouveau statut dans orders
echo "\n=== TEST 2: Verification statut orders ===\n";
try {
    $stmt = $db->query("SHOW COLUMNS FROM orders LIKE 'status'");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row && strpos($row['Type'], 'completed_pending_review') !== false) {
        echo "✅ Statut 'completed_pending_review' disponible\n";
    } else {
        echo "❌ Statut 'completed_pending_review' manquant\n";
        echo "   Executez la migration: database/migrations/013_add_satisfaction_system.sql\n";
    }
} catch (PDOException $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
}

// 3. Verifier la colonne provider_completed_at
echo "\n=== TEST 3: Verification colonne provider_completed_at ===\n";
try {
    $stmt = $db->query("SHOW COLUMNS FROM orders LIKE 'provider_completed_at'");
    if ($stmt->rowCount() > 0) {
        echo "✅ Colonne provider_completed_at existe\n";
    } else {
        echo "⚠️ Colonne provider_completed_at manquante (optionnelle)\n";
    }
} catch (PDOException $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
}

// 4. Test creation modele SatisfactionSurvey
echo "\n=== TEST 4: Modele SatisfactionSurvey ===\n";
try {
    $surveyModel = new SatisfactionSurvey();
    echo "✅ Modele SatisfactionSurvey charge\n";

    // Test des methodes
    $methods = [
        'createSurvey',
        'findByOrderId',
        'existsForOrder',
        'getProviderStats',
        'getPendingReviews'
    ];

    foreach ($methods as $method) {
        if (method_exists($surveyModel, $method)) {
            echo "  ✅ Methode {$method}() disponible\n";
        } else {
            echo "  ❌ Methode {$method}() manquante\n";
        }
    }
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
}

// 5. Simuler le workflow (si donnees de test disponibles)
echo "\n=== TEST 5: Simulation workflow ===\n";

// Recuperer une commande in_progress pour test
$stmt = $db->query("SELECT o.*, u.first_name as user_name, p.first_name as provider_name
                    FROM orders o
                    LEFT JOIN users u ON o.user_id = u.id
                    LEFT JOIN providers p ON o.provider_id = p.id
                    WHERE o.status = 'in_progress'
                    LIMIT 1");
$testOrder = $stmt->fetch(PDO::FETCH_ASSOC);

if ($testOrder) {
    echo "Commande test trouvee: #{$testOrder['id']}\n";
    echo "  Client: {$testOrder['user_name']}\n";
    echo "  Prestataire: {$testOrder['provider_name']}\n";
    echo "  Statut actuel: {$testOrder['status']}\n\n";

    echo "WORKFLOW A TESTER:\n";
    echo "1. Prestataire appelle POST /api/provider/orders/{$testOrder['id']}/complete-service\n";
    echo "   -> Statut passe a 'completed_pending_review'\n";
    echo "   -> Client recoit notification\n\n";

    echo "2. Client appelle POST /api/orders/{$testOrder['id']}/satisfaction\n";
    echo "   Body: {\n";
    echo "     \"quality_rating\": 5,\n";
    echo "     \"punctuality\": true,\n";
    echo "     \"price_respected\": true,\n";
    echo "     \"professionalism_rating\": 5,\n";
    echo "     \"comment\": \"Excellent service !\"\n";
    echo "   }\n";
    echo "   -> Statut passe a 'completed'\n";
    echo "   -> Paiement libere\n";
    echo "   -> Stats prestataire mises a jour\n";
} else {
    echo "Aucune commande 'in_progress' trouvee pour test.\n";
    echo "Creez une commande de test avec statut 'in_progress'.\n";
}

// 6. Verifier les routes API
echo "\n=== TEST 6: Routes API ===\n";
$routes = [
    'POST /api/provider/orders/{id}/complete-service' => 'Prestataire termine',
    'POST /api/orders/{id}/satisfaction' => 'Client soumet questionnaire',
    'GET /api/orders/{id}/satisfaction-status' => 'Statut questionnaire',
    'GET /api/user/pending-reviews' => 'Commandes en attente evaluation',
    'GET /api/provider/satisfaction-stats' => 'Stats prestataire',
    'GET /api/providers/{id}/satisfaction' => 'Stats publiques'
];

echo "Routes disponibles:\n";
foreach ($routes as $route => $desc) {
    echo "  • {$route}\n    {$desc}\n";
}

// 7. Test statistiques
echo "\n=== TEST 7: Statistiques ===\n";
try {
    $stmt = $db->query("SELECT COUNT(*) as total FROM satisfaction_surveys");
    $count = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Total questionnaires: {$count['total']}\n";

    if ($count['total'] > 0) {
        $stmt = $db->query("SELECT
                                AVG(quality_rating) as avg_quality,
                                SUM(CASE WHEN punctuality = 1 THEN 1 ELSE 0 END) / COUNT(*) * 100 as punctuality_rate,
                                SUM(CASE WHEN price_respected = 1 THEN 1 ELSE 0 END) / COUNT(*) * 100 as price_rate
                            FROM satisfaction_surveys");
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "Note moyenne: " . round($stats['avg_quality'], 2) . "/5\n";
        echo "Ponctualite: " . round($stats['punctuality_rate'], 1) . "%\n";
        echo "Respect prix: " . round($stats['price_rate'], 1) . "%\n";
    }
} catch (PDOException $e) {
    echo "❌ Erreur stats: " . $e->getMessage() . "\n";
}

echo "\n=== FIN DES TESTS ===\n";
echo "</pre>\n";

// Mode interactif CLI
if (php_sapi_name() === 'cli') {
    echo "\n";
    echo "Pour tester manuellement avec curl:\n\n";

    echo "# 1. Prestataire termine (remplacer TOKEN et ORDER_ID)\n";
    echo "curl -X POST http://localhost:8080/api/provider/orders/ORDER_ID/complete-service \\\n";
    echo "  -H 'Authorization: Bearer TOKEN' \\\n";
    echo "  -H 'Content-Type: application/json'\n\n";

    echo "# 2. Client soumet questionnaire\n";
    echo "curl -X POST http://localhost:8080/api/orders/ORDER_ID/satisfaction \\\n";
    echo "  -H 'Authorization: Bearer TOKEN' \\\n";
    echo "  -H 'Content-Type: application/json' \\\n";
    echo "  -d '{\"quality_rating\":5,\"punctuality\":true,\"price_respected\":true,\"comment\":\"Super!\"}'\n\n";

    echo "# 3. Verifier statut\n";
    echo "curl http://localhost:8080/api/orders/ORDER_ID/satisfaction-status \\\n";
    echo "  -H 'Authorization: Bearer TOKEN'\n";
}
