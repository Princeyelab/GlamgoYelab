<?php
/**
 * Script de migration PostgreSQL pour Render
 * Accès: https://glamgo-api.onrender.com/migrate.php?key=glamgo2024migrate
 */

header('Content-Type: application/json');

// Sécurité: clé requise
$key = $_GET['key'] ?? '';
if ($key !== 'glamgo2024migrate') {
    die(json_encode(['success' => false, 'message' => 'Unauthorized']));
}

// Charger la config
$config = require __DIR__ . '/../config/config.php';
$db = $config['database'];

try {
    // Connexion PostgreSQL
    $dsn = "pgsql:host={$db['host']};port={$db['port']};dbname={$db['name']}";
    $pdo = new PDO($dsn, $db['user'], $db['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // Lire le fichier SQL
    $sqlFile = __DIR__ . '/../database/migrations/001_create_tables_postgres.sql';
    if (!file_exists($sqlFile)) {
        die(json_encode(['success' => false, 'message' => 'Migration file not found']));
    }

    $sql = file_get_contents($sqlFile);

    // Exécuter les requêtes une par une
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    $executed = 0;
    $errors = [];

    foreach ($statements as $statement) {
        if (empty($statement) || strpos($statement, '--') === 0) {
            continue;
        }
        try {
            $pdo->exec($statement);
            $executed++;
        } catch (PDOException $e) {
            // Ignorer les erreurs "already exists"
            if (strpos($e->getMessage(), 'already exists') === false &&
                strpos($e->getMessage(), 'duplicate key') === false) {
                $errors[] = $e->getMessage();
            }
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Migration completed',
        'statements_executed' => $executed,
        'errors' => $errors
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed',
        'error' => $e->getMessage()
    ]);
}
