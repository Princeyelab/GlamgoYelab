<?php
/**
 * Cleanup Providers - Desactiver tous les prestataires sauf ceux specifies
 *
 * Usage: /cleanup_providers.php?keep=bamba,autre_nom
 * ou: /cleanup_providers.php?keep_id=1,2,3
 */

// Autoloader
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $baseDir = __DIR__ . '/../app/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) return;
    $relativeClass = substr($class, $len);
    $parts = explode('\\', $relativeClass);
    $className = array_pop($parts);
    $path = '';
    foreach ($parts as $part) {
        $path .= strtolower($part) . '/';
    }
    $file = $baseDir . $path . $className . '.php';
    if (file_exists($file)) require $file;
});

use App\Core\Database;

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    $db = Database::getInstance();

    $keepNames = isset($_GET['keep']) ? explode(',', $_GET['keep']) : [];
    $keepIds = isset($_GET['keep_id']) ? array_map('intval', explode(',', $_GET['keep_id'])) : [];

    // Si aucun parametre, juste lister les prestataires actifs
    if (empty($keepNames) && empty($keepIds)) {
        $stmt = $db->query("
            SELECT id, first_name, last_name, email, is_available, is_verified, account_status
            FROM providers
            ORDER BY id DESC
        ");
        $providers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'message' => 'Liste des prestataires (aucune modification)',
            'usage' => '/cleanup_providers.php?keep=nom1,nom2 pour desactiver tous sauf ceux specifies',
            'providers' => array_map(function($p) {
                return [
                    'id' => $p['id'],
                    'name' => $p['first_name'] . ' ' . $p['last_name'],
                    'email' => $p['email'],
                    'is_available' => (bool)$p['is_available'],
                    'is_verified' => (bool)$p['is_verified'],
                    'account_status' => $p['account_status'],
                ];
            }, $providers)
        ], JSON_PRETTY_PRINT);
        exit;
    }

    // Trouver les IDs a garder
    $idsToKeep = $keepIds;

    if (!empty($keepNames)) {
        foreach ($keepNames as $name) {
            $name = trim($name);
            $stmt = $db->prepare("
                SELECT id FROM providers
                WHERE LOWER(first_name) LIKE LOWER(:name)
                   OR LOWER(last_name) LIKE LOWER(:name)
            ");
            $stmt->execute(['name' => '%' . $name . '%']);
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $idsToKeep[] = $row['id'];
            }
        }
    }

    $idsToKeep = array_unique($idsToKeep);

    if (empty($idsToKeep)) {
        echo json_encode([
            'success' => false,
            'error' => 'Aucun prestataire trouve avec ces noms/IDs'
        ]);
        exit;
    }

    // Desactiver tous les autres prestataires
    $placeholders = implode(',', array_fill(0, count($idsToKeep), '?'));
    $stmt = $db->prepare("
        UPDATE providers SET
            is_available = FALSE,
            updated_at = NOW()
        WHERE id NOT IN ($placeholders)
    ");
    $stmt->execute($idsToKeep);
    $deactivatedCount = $stmt->rowCount();

    // Activer les prestataires a garder
    $stmt = $db->prepare("
        UPDATE providers SET
            account_status = 'active',
            is_available = TRUE,
            is_verified = TRUE,
            updated_at = NOW()
        WHERE id IN ($placeholders)
    ");
    $stmt->execute($idsToKeep);

    // Recuperer les prestataires actifs
    $stmt = $db->prepare("
        SELECT id, first_name, last_name, email, is_available
        FROM providers WHERE id IN ($placeholders)
    ");
    $stmt->execute($idsToKeep);
    $activeProviders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'message' => "Nettoyage termine",
        'deactivated_count' => $deactivatedCount,
        'active_providers' => array_map(function($p) {
            return [
                'id' => $p['id'],
                'name' => $p['first_name'] . ' ' . $p['last_name'],
                'email' => $p['email'],
                'is_available' => (bool)$p['is_available'],
            ];
        }, $activeProviders)
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
