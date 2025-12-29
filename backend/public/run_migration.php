<?php
/**
 * Execute migrations
 */

header('Content-Type: application/json');

$config = require __DIR__ . '/../config/config.php';
$db_config = $config['database'];

$driver = $db_config['driver'] ?? 'pgsql';
$port = $db_config['port'] ?? ($driver === 'pgsql' ? '5432' : '3306');

try {
    if ($driver === 'pgsql') {
        $dsn = "pgsql:host={$db_config['host']};port={$port};dbname={$db_config['name']}";
    } else {
        $dsn = "mysql:host={$db_config['host']};port={$port};dbname={$db_config['name']};charset={$db_config['charset']}";
    }

    $db = new PDO($dsn, $db_config['user'], $db_config['password']);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $results = [];

    // Migration 016: Create emergency_reports table
    $sql = file_get_contents(__DIR__ . '/../database/migrations/016_create_emergency_reports.sql');

    $db->exec($sql);
    $results[] = "Migration 016: emergency_reports table created successfully";

    echo json_encode([
        'success' => true,
        'results' => $results
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
