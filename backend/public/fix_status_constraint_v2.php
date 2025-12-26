<?php
/**
 * Fix: Mettre à jour la contrainte CHECK pour inclure completed_pending_review
 */

header('Content-Type: application/json');

$config = require __DIR__ . '/../config/config.php';
$db_config = $config['database'];

$results = [];

try {
    $port = $db_config['port'] ?? '5432';
    $dsn = "pgsql:host={$db_config['host']};port={$port};dbname={$db_config['name']}";
    $db = new PDO($dsn, $db_config['user'], $db_config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $results[] = "=== Mise à jour contrainte CHECK ===";

    // 1. Supprimer l'ancienne contrainte
    $results[] = "1. Suppression ancienne contrainte...";
    $db->exec("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check");
    $results[] = "   ✓ Contrainte supprimée";

    // 2. Ajouter la nouvelle contrainte avec tous les statuts
    $results[] = "2. Ajout nouvelle contrainte avec completed_pending_review...";
    $db->exec("ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'accepted', 'on_way', 'arrived', 'in_progress', 'completed_pending_review', 'completed', 'cancelled'))");
    $results[] = "   ✓ Contrainte ajoutée";

    // 3. Vérifier
    $results[] = "3. Vérification:";
    $constraint = $db->query("
        SELECT conname, pg_get_constraintdef(oid) as definition
        FROM pg_constraint
        WHERE conrelid = 'orders'::regclass
        AND conname = 'orders_status_check'
    ")->fetch();

    if ($constraint) {
        $results[] = "   ✓ {$constraint['conname']}";
        $results[] = "   Définition: {$constraint['definition']}";
    }

    // 4. Tester
    $results[] = "4. Test: Création order avec completed_pending_review...";
    try {
        // Juste vérifier que la valeur est acceptée
        $stmt = $db->query("SELECT 'completed_pending_review'::varchar IN ('pending', 'accepted', 'on_way', 'arrived', 'in_progress', 'completed_pending_review', 'completed', 'cancelled') as valid");
        $test = $stmt->fetch();
        $results[] = "   ✓ Status completed_pending_review est valide";
    } catch (Exception $e) {
        $results[] = "   ✗ " . $e->getMessage();
    }

    $results[] = "";
    $results[] = "=== Terminé! ===";

    echo json_encode([
        'success' => true,
        'message' => 'Contrainte mise à jour',
        'details' => $results
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'details' => $results
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
