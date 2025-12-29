<?php
/**
 * Execute migration 016: Add reporter_type to emergency_reports
 */

require_once __DIR__ . '/app/core/Database.php';

use App\Core\Database;

try {
    $db = Database::getInstance();

    echo "Running migration 016: Add reporter_type to emergency_reports...\n";

    $sql = file_get_contents(__DIR__ . '/database/migrations/016_add_reporter_type_to_emergency.sql');

    $db->exec($sql);

    echo "Migration 016 completed successfully!\n";

} catch (Exception $e) {
    echo "Migration error: " . $e->getMessage() . "\n";
    exit(1);
}
