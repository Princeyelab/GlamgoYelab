<?php
/**
 * Fix schema - Ajoute les colonnes manquantes
 */

header('Content-Type: application/json');

$key = $_GET['key'] ?? '';
if ($key !== 'glamgo2024migrate') {
    die(json_encode(['success' => false, 'message' => 'Unauthorized']));
}

$config = require __DIR__ . '/../config/config.php';
$db = $config['database'];

try {
    $dsn = "pgsql:host={$db['host']};port={$db['port']};dbname={$db['name']}";
    $pdo = new PDO($dsn, $db['user'], $db['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    $fixes = [];

    // Ajouter is_blocked à messages si manquant
    try {
        $pdo->exec("ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE");
        $fixes[] = "Added is_blocked to messages";
    } catch (PDOException $e) {
        $fixes[] = "is_blocked: " . $e->getMessage();
    }

    // Autres colonnes potentiellement manquantes
    try {
        $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE");
        $fixes[] = "Added phone_verified to users";
    } catch (PDOException $e) {
        // Ignorer si existe déjà
    }

    try {
        $pdo->exec("ALTER TABLE providers ADD COLUMN IF NOT EXISTS bio TEXT");
        $fixes[] = "Added bio to providers";
    } catch (PDOException $e) {
        // Ignorer
    }

    try {
        $pdo->exec("ALTER TABLE providers ADD COLUMN IF NOT EXISTS service_area TEXT");
        $fixes[] = "Added service_area to providers";
    } catch (PDOException $e) {
        // Ignorer
    }

    echo json_encode([
        'success' => true,
        'message' => 'Schema fixed',
        'fixes' => $fixes
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error',
        'error' => $e->getMessage()
    ]);
}
