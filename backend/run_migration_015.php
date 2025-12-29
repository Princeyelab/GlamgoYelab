<?php
/**
 * Migration script for cancellation and disputes system
 */

require __DIR__ . '/app/core/Database.php';

use App\Core\Database;

$db = Database::getInstance();

$migrations = [
    // Orders table - cancellation fields
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_fee DECIMAL(10, 2) DEFAULT 0.00",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_fee_percentage INT DEFAULT 0",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(20) NULL",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP NULL",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_provider_lat DECIMAL(10, 8) NULL",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_provider_lng DECIMAL(11, 8) NULL",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_distance_traveled DECIMAL(10, 2) NULL",

    // Providers table - penalty fields
    "ALTER TABLE providers ADD COLUMN IF NOT EXISTS penalty_points INT DEFAULT 0",
    "ALTER TABLE providers ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE",
    "ALTER TABLE providers ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP NULL",
    "ALTER TABLE providers ADD COLUMN IF NOT EXISTS suspension_reason TEXT NULL",
    "ALTER TABLE providers ADD COLUMN IF NOT EXISTS total_cancellations INT DEFAULT 0",
    "ALTER TABLE providers ADD COLUMN IF NOT EXISTS cancellation_rate DECIMAL(5, 2) DEFAULT 0.00",

    // Provider penalties table
    "CREATE TABLE IF NOT EXISTS provider_penalties (
        id SERIAL PRIMARY KEY,
        provider_id INT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
        order_id INT NULL REFERENCES orders(id) ON DELETE SET NULL,
        penalty_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL DEFAULT 'warning',
        points INT NOT NULL DEFAULT 1,
        reason TEXT NULL,
        action_taken VARCHAR(50) NULL,
        suspension_until TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP NULL,
        resolved_by INT NULL,
        resolution_notes TEXT NULL
    )",

    // Disputes table
    "CREATE TABLE IF NOT EXISTS disputes (
        id SERIAL PRIMARY KEY,
        order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        opened_by_type VARCHAR(20) NOT NULL,
        opened_by_id INT NOT NULL,
        category VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        evidence_urls TEXT NULL,
        status VARCHAR(20) DEFAULT 'open',
        priority VARCHAR(20) DEFAULT 'normal',
        resolution_type VARCHAR(50) NULL,
        resolution_amount DECIMAL(10, 2) NULL,
        resolution_notes TEXT NULL,
        resolved_by INT NULL,
        resolved_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL
    )",

    // Dispute messages table
    "CREATE TABLE IF NOT EXISTS dispute_messages (
        id SERIAL PRIMARY KEY,
        dispute_id INT NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
        sender_type VARCHAR(20) NOT NULL,
        sender_id INT NOT NULL,
        message TEXT NOT NULL,
        attachment_url TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",

    // Cancellation rules table
    "CREATE TABLE IF NOT EXISTS cancellation_rules (
        id SERIAL PRIMARY KEY,
        status VARCHAR(20) NOT NULL,
        cancelled_by VARCHAR(20) NOT NULL,
        hours_before_appointment INT NULL,
        min_fee_percentage INT DEFAULT 0,
        max_fee_percentage INT DEFAULT 0,
        provider_penalty_points INT DEFAULT 0,
        description TEXT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",

    // Penalty thresholds table
    "CREATE TABLE IF NOT EXISTS penalty_thresholds (
        id SERIAL PRIMARY KEY,
        points_min INT NOT NULL,
        points_max INT NOT NULL,
        action VARCHAR(50) NOT NULL,
        suspension_hours INT NULL,
        description TEXT NULL
    )",

    // Indexes
    "CREATE INDEX IF NOT EXISTS idx_provider_penalties_provider ON provider_penalties(provider_id)",
    "CREATE INDEX IF NOT EXISTS idx_disputes_order ON disputes(order_id)",
    "CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status)",
    "CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute ON dispute_messages(dispute_id)",
];

echo "Starting migration...\n";

foreach ($migrations as $i => $sql) {
    try {
        $db->exec($sql);
        $preview = substr(preg_replace('/\s+/', ' ', $sql), 0, 70);
        echo "[" . ($i + 1) . "] OK: $preview...\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'already exists') !== false ||
            strpos($e->getMessage(), 'duplicate') !== false) {
            echo "[" . ($i + 1) . "] SKIP (exists): " . substr($sql, 0, 50) . "...\n";
        } else {
            echo "[" . ($i + 1) . "] ERROR: " . $e->getMessage() . "\n";
        }
    }
}

// Insert default cancellation rules
$rules = [
    ['pending', 'client', null, 0, 0, 0, 'Client annule commande en attente - Gratuit'],
    ['accepted', 'client', 2, 0, 0, 0, 'Client annule > 2h avant RDV - Gratuit'],
    ['accepted', 'client', 0, 50, 50, 0, 'Client annule < 2h avant RDV - 50% frais'],
    ['on_way', 'client', null, 50, 100, 0, 'Client annule prestataire en route - 50-100%'],
    ['pending', 'provider', null, 0, 0, 1, 'Prestataire annule commande en attente - 1 pt'],
    ['accepted', 'provider', 2, 0, 0, 2, 'Prestataire annule > 2h avant - 2 pts'],
    ['accepted', 'provider', 0, 0, 0, 5, 'Prestataire annule < 2h avant - 5 pts'],
    ['on_way', 'provider', null, 0, 0, 10, 'Prestataire annule en route - 10 pts'],
];

try {
    $count = $db->query("SELECT COUNT(*) FROM cancellation_rules")->fetchColumn();
    if ($count == 0) {
        $stmt = $db->prepare("INSERT INTO cancellation_rules
            (status, cancelled_by, hours_before_appointment, min_fee_percentage, max_fee_percentage, provider_penalty_points, description)
            VALUES (?, ?, ?, ?, ?, ?, ?)");
        foreach ($rules as $rule) {
            $stmt->execute($rule);
        }
        echo "Inserted " . count($rules) . " cancellation rules\n";
    } else {
        echo "Cancellation rules already exist ($count rows)\n";
    }
} catch (PDOException $e) {
    echo "Rules insert error: " . $e->getMessage() . "\n";
}

// Insert penalty thresholds
$thresholds = [
    [5, 9, 'warning', null, 'Avertissement envoyé'],
    [10, 19, 'suspension_24h', 24, 'Suspension 24 heures'],
    [20, 29, 'suspension_7d', 168, 'Suspension 7 jours'],
    [30, 49, 'suspension_30d', 720, 'Suspension 30 jours'],
    [50, 999, 'permanent_ban', null, 'Bannissement permanent'],
];

try {
    $count = $db->query("SELECT COUNT(*) FROM penalty_thresholds")->fetchColumn();
    if ($count == 0) {
        $stmt = $db->prepare("INSERT INTO penalty_thresholds
            (points_min, points_max, action, suspension_hours, description)
            VALUES (?, ?, ?, ?, ?)");
        foreach ($thresholds as $threshold) {
            $stmt->execute($threshold);
        }
        echo "Inserted " . count($thresholds) . " penalty thresholds\n";
    } else {
        echo "Penalty thresholds already exist ($count rows)\n";
    }
} catch (PDOException $e) {
    echo "Thresholds insert error: " . $e->getMessage() . "\n";
}

echo "\nMigration completed!\n";
