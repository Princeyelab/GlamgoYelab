<?php
/**
 * Script de migration pour optimiser les requetes de base de donnees
 * Ajoute des index composites pour les requetes frequentes
 *
 * Usage: Appeler via https://glamgo-api.fly.dev/run_optimize_queries.php
 */

// Encodage interne UTF-8
mb_internal_encoding('UTF-8');

// Gestion des erreurs
error_reporting(E_ALL);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');

// Autoloader simple (compatible Linux - casse des dossiers)
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $baseDir = __DIR__ . '/../app/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    $relativeClass = substr($class, $len);
    $parts = explode('\\', $relativeClass);
    $className = array_pop($parts);
    $path = '';
    foreach ($parts as $part) {
        $path .= strtolower($part) . '/';
    }
    $file = $baseDir . $path . $className . '.php';
    if (file_exists($file)) {
        require $file;
    }
});

use App\Core\Database;

try {
    $db = Database::getInstance();
    $results = [];

    // Liste des index a creer
    $indexes = [
        // Orders - recherche par prestataire et statut
        ['orders', 'idx_orders_provider_status', 'provider_id, status'],
        ['orders', 'idx_orders_service_id', 'service_id'],
        ['orders', 'idx_orders_custom_service_id', 'custom_service_id'],
        ['orders', 'idx_orders_address_id', 'address_id'],

        // Reviews - calcul note moyenne
        ['reviews', 'idx_reviews_provider_id', 'provider_id'],
        ['reviews', 'idx_reviews_user_id', 'user_id'],
        ['reviews', 'idx_reviews_provider_rating', 'provider_id, rating'],

        // Notifications - type et non lues
        ['notifications', 'idx_notifications_type', 'type'],

        // Messages - recherche par commande et sender
        ['messages', 'idx_messages_order_sender', 'order_id, sender_type, sender_id'],

        // Provider services - composite
        ['provider_services', 'idx_provider_services_composite', 'provider_id, service_id'],

        // Bids - par commande et statut
        ['bids', 'idx_bids_order_status', 'order_id, status'],

        // Location tracking - par provider
        ['location_tracking', 'idx_location_tracking_provider', 'provider_id'],
    ];

    // Creer les index
    foreach ($indexes as $idx) {
        list($table, $name, $columns) = $idx;
        try {
            $db->exec("CREATE INDEX IF NOT EXISTS {$name} ON {$table}({$columns})");
            $results[] = "OK: Index '{$name}' cree sur {$table}";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'already exists') !== false) {
                $results[] = "SKIP: Index '{$name}' existe deja";
            } else {
                $results[] = "ERROR: Index '{$name}': " . $e->getMessage();
            }
        }
    }

    // Analyser les tables pour mettre a jour les statistiques PostgreSQL
    $tables = ['orders', 'providers', 'reviews', 'notifications', 'messages', 'provider_services', 'bids', 'location_tracking'];
    foreach ($tables as $table) {
        try {
            $db->exec("ANALYZE {$table}");
            $results[] = "OK: Table '{$table}' analysee";
        } catch (PDOException $e) {
            $results[] = "WARN: Analyse {$table}: " . $e->getMessage();
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Migration optimisation requetes terminee',
        'results' => $results
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
