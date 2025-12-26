<?php
/**
 * Fix: Ajouter 'arrived' à la contrainte CHECK du status
 */

header('Content-Type: application/json');

$config = require __DIR__ . '/../config/config.php';
$db_config = $config['database'];

$results = [];

try {
    $driver = $db_config['driver'] ?? 'pgsql';
    $port = $db_config['port'] ?? ($driver === 'pgsql' ? '5432' : '3306');

    $dsn = "pgsql:host={$db_config['host']};port={$port};dbname={$db_config['name']}";
    $db = new PDO($dsn, $db_config['user'], $db_config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $results[] = "=== Fix: Contrainte CHECK status ===";

    // 1. Supprimer l'ancienne contrainte CHECK
    $results[] = "1. Suppression ancienne contrainte...";
    try {
        $db->exec("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check");
        $results[] = "   ✓ Ancienne contrainte supprimée";
    } catch (PDOException $e) {
        $results[] = "   Note: " . $e->getMessage();
    }

    // 2. Ajouter la nouvelle contrainte avec 'arrived'
    $results[] = "2. Ajout nouvelle contrainte avec 'arrived'...";
    try {
        $db->exec("ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'accepted', 'on_way', 'arrived', 'in_progress', 'completed', 'cancelled'))");
        $results[] = "   ✓ Nouvelle contrainte ajoutée";
    } catch (PDOException $e) {
        $results[] = "   ⚠ " . $e->getMessage();
    }

    // 3. Vérifier la contrainte
    $results[] = "3. Vérification...";
    $constraint = $db->query("
        SELECT conname, pg_get_constraintdef(oid) as definition
        FROM pg_constraint
        WHERE conrelid = 'orders'::regclass
        AND conname = 'orders_status_check'
    ")->fetch();

    if ($constraint) {
        $results[] = "   Contrainte: " . $constraint['conname'];
        $results[] = "   Définition: " . $constraint['definition'];
    } else {
        $results[] = "   ⚠ Contrainte non trouvée";
    }

    // 4. Test: mettre à jour un order en 'arrived'
    $results[] = "4. Test update...";
    $testOrder = $db->query("SELECT id FROM orders WHERE status = 'on_way' LIMIT 1")->fetch();
    if ($testOrder) {
        try {
            $db->exec("UPDATE orders SET status = 'arrived', arrived_at = NOW() WHERE id = " . $testOrder['id']);
            $results[] = "   ✓ Test réussi! Order #{$testOrder['id']} mis en 'arrived'";
        } catch (PDOException $e) {
            $results[] = "   ✗ Test échoué: " . $e->getMessage();
        }
    } else {
        $results[] = "   Pas d'order en 'on_way' pour tester";
    }

    $results[] = "";
    $results[] = "=== Fix terminé! ===";

    echo json_encode([
        'success' => true,
        'message' => 'Contrainte CHECK mise à jour',
        'details' => $results
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'details' => $results
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
