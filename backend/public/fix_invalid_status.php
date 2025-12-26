<?php
/**
 * Fix: Corriger les statuts invalides et recréer la contrainte CHECK
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

    $results[] = "=== Fix: Statuts invalides ===";

    // 1. Lister tous les statuts uniques
    $results[] = "1. Statuts existants:";
    $statuses = $db->query("SELECT status, COUNT(*) as count FROM orders GROUP BY status ORDER BY count DESC")->fetchAll();
    foreach ($statuses as $s) {
        $results[] = "   - {$s['status']}: {$s['count']} orders";
    }

    // Statuts valides
    $validStatuses = ['pending', 'accepted', 'on_way', 'arrived', 'in_progress', 'completed', 'cancelled'];

    // 2. Trouver et corriger les statuts invalides
    $results[] = "2. Recherche statuts invalides...";
    $invalidOrders = $db->query("
        SELECT id, status FROM orders
        WHERE status NOT IN ('pending', 'accepted', 'on_way', 'arrived', 'in_progress', 'completed', 'cancelled')
    ")->fetchAll();

    if (count($invalidOrders) > 0) {
        $results[] = "   Trouvé " . count($invalidOrders) . " orders avec statut invalide:";
        foreach ($invalidOrders as $order) {
            $results[] = "   - Order #{$order['id']}: '{$order['status']}'";

            // Corriger selon la logique
            $newStatus = 'cancelled'; // Par défaut
            if ($order['status'] === 'confirmed') {
                $newStatus = 'accepted';
            } elseif ($order['status'] === 'rejected') {
                $newStatus = 'cancelled';
            } elseif ($order['status'] === 'started' || $order['status'] === 'active') {
                $newStatus = 'in_progress';
            } elseif ($order['status'] === 'done' || $order['status'] === 'finished') {
                $newStatus = 'completed';
            }

            $db->exec("UPDATE orders SET status = '{$newStatus}' WHERE id = {$order['id']}");
            $results[] = "     → Corrigé en '{$newStatus}'";
        }
    } else {
        $results[] = "   ✓ Aucun statut invalide trouvé";
    }

    // 3. Vérifier à nouveau
    $results[] = "3. Vérification après correction:";
    $statuses = $db->query("SELECT status, COUNT(*) as count FROM orders GROUP BY status ORDER BY count DESC")->fetchAll();
    foreach ($statuses as $s) {
        $isValid = in_array($s['status'], $validStatuses) ? '✓' : '✗';
        $results[] = "   {$isValid} {$s['status']}: {$s['count']} orders";
    }

    // 4. Ajouter la contrainte CHECK
    $results[] = "4. Ajout contrainte CHECK...";
    try {
        $db->exec("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check");
        $db->exec("ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'accepted', 'on_way', 'arrived', 'in_progress', 'completed', 'cancelled'))");
        $results[] = "   ✓ Contrainte ajoutée";
    } catch (PDOException $e) {
        $results[] = "   ✗ " . $e->getMessage();
    }

    // 5. Vérifier la contrainte
    $results[] = "5. Vérification contrainte:";
    $constraint = $db->query("
        SELECT conname, pg_get_constraintdef(oid) as definition
        FROM pg_constraint
        WHERE conrelid = 'orders'::regclass
        AND conname = 'orders_status_check'
    ")->fetch();

    if ($constraint) {
        $results[] = "   ✓ {$constraint['conname']}";
        $results[] = "   Définition: {$constraint['definition']}";
    } else {
        $results[] = "   ⚠ Contrainte non trouvée";
    }

    $results[] = "";
    $results[] = "=== Terminé! ===";

    echo json_encode([
        'success' => true,
        'message' => 'Fix terminé',
        'details' => $results
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'details' => $results
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
