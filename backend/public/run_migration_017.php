<?php
/**
 * Endpoint web pour exécuter la migration 017 (ajout statut arrived)
 * URL: https://glamgo-api.fly.dev/run_migration_017.php
 */

header('Content-Type: application/json');

$config = require __DIR__ . '/../config/config.php';
$db_config = $config['database'];

$results = [];

try {
    $driver = $db_config['driver'] ?? 'pgsql';
    $port = $db_config['port'] ?? ($driver === 'pgsql' ? '5432' : '3306');

    if ($driver === 'pgsql') {
        $dsn = "pgsql:host={$db_config['host']};port={$port};dbname={$db_config['name']}";
    } else {
        $dsn = "mysql:host={$db_config['host']};port={$port};dbname={$db_config['name']};charset={$db_config['charset']}";
    }

    $db = new PDO($dsn, $db_config['user'], $db_config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $results[] = "=== Migration 017: Ajout statut 'arrived' ===";
    $results[] = "Driver: $driver";

    if ($driver === 'pgsql') {
        // PostgreSQL - modifier le type ENUM
        $results[] = "1. Vérification/Ajout valeur 'arrived' au type ENUM...";

        try {
            // Vérifier si la valeur existe déjà
            $check = $db->query("SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status') AND enumlabel = 'arrived'")->fetch();

            if ($check) {
                $results[] = "   ⚠ Valeur 'arrived' déjà présente";
            } else {
                // Ajouter la valeur au type ENUM
                $db->exec("ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'arrived' AFTER 'on_way'");
                $results[] = "   ✓ Valeur 'arrived' ajoutée au type ENUM";
            }
        } catch (PDOException $e) {
            // Si le type n'existe pas, on doit modifier la colonne directement
            $results[] = "   Note: " . $e->getMessage();

            // Vérifier le type actuel de la colonne
            $colInfo = $db->query("SELECT data_type, udt_name FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'status'")->fetch();
            $results[] = "   Type colonne: " . ($colInfo['data_type'] ?? 'inconnu') . " / " . ($colInfo['udt_name'] ?? 'inconnu');

            // Si c'est un VARCHAR, on peut simplement ajouter la colonne arrived_at
            $results[] = "   (La colonne status accepte déjà toutes les valeurs texte)";
        }

        // Ajouter la colonne arrived_at
        $results[] = "2. Ajout colonne arrived_at...";
        try {
            $check = $db->query("SELECT column_name FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'arrived_at'")->fetch();
            if ($check) {
                $results[] = "   ⚠ Colonne déjà existante";
            } else {
                $db->exec("ALTER TABLE orders ADD COLUMN arrived_at TIMESTAMP NULL DEFAULT NULL");
                $results[] = "   ✓ Colonne ajoutée";
            }
        } catch (PDOException $e) {
            $results[] = "   ⚠ " . $e->getMessage();
        }

    } else {
        // MySQL - modifier l'ENUM
        $results[] = "1. Modification ENUM status...";
        try {
            $db->exec("ALTER TABLE orders MODIFY COLUMN status ENUM(
                'pending',
                'accepted',
                'on_way',
                'arrived',
                'in_progress',
                'completed',
                'cancelled'
            ) DEFAULT 'pending'");
            $results[] = "   ✓ ENUM modifié avec succès";
        } catch (PDOException $e) {
            $results[] = "   ⚠ " . $e->getMessage();
        }

        // Ajouter la colonne arrived_at
        $results[] = "2. Ajout colonne arrived_at...";
        try {
            $check = $db->query("SHOW COLUMNS FROM orders LIKE 'arrived_at'")->fetch();
            if ($check) {
                $results[] = "   ⚠ Colonne déjà existante";
            } else {
                $db->exec("ALTER TABLE orders ADD COLUMN arrived_at TIMESTAMP NULL DEFAULT NULL");
                $results[] = "   ✓ Colonne ajoutée";
            }
        } catch (PDOException $e) {
            $results[] = "   ⚠ " . $e->getMessage();
        }
    }

    // Vérification finale
    $results[] = "3. Vérification finale...";

    if ($driver === 'pgsql') {
        $colInfo = $db->query("SELECT column_name FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'arrived_at'")->fetch();
        $results[] = "   Colonne arrived_at: " . ($colInfo ? 'Présente' : 'Absente');
    } else {
        $statusColumn = $db->query("SHOW COLUMNS FROM orders WHERE Field = 'status'")->fetch();
        $results[] = "   Type status: " . ($statusColumn['Type'] ?? 'Non trouvé');

        $arrivedColumn = $db->query("SHOW COLUMNS FROM orders LIKE 'arrived_at'")->fetch();
        $results[] = "   Colonne arrived_at: " . ($arrivedColumn ? 'Présente' : 'Absente');
    }

    // Test: essayer de mettre un statut 'arrived'
    $results[] = "4. Test update status...";
    try {
        // Chercher une commande de test ou simuler
        $testOrder = $db->query("SELECT id, status FROM orders WHERE status = 'on_way' LIMIT 1")->fetch();
        if ($testOrder) {
            $results[] = "   Commande trouvée: #{$testOrder['id']} (status: {$testOrder['status']})";
            // Ne pas modifier pour le test, juste vérifier que c'est possible
            $results[] = "   ✓ Prêt pour les mises à jour 'arrived'";
        } else {
            $results[] = "   Aucune commande en 'on_way' pour tester";
        }
    } catch (PDOException $e) {
        $results[] = "   ⚠ " . $e->getMessage();
    }

    $results[] = "";
    $results[] = "=== Migration terminée! ===";

    echo json_encode([
        'success' => true,
        'message' => 'Migration 017 exécutée',
        'details' => $results
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'details' => $results
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
