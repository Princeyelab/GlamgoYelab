<?php
header('Content-Type: application/json');

$key = $_GET['key'] ?? '';
$expectedKey = getenv('MIGRATE_SECRET_KEY') ?: 'glamgo2024migrate';
if ($key !== $expectedKey) {
    http_response_code(401);
    die(json_encode(['success' => false, 'message' => 'Unauthorized']));
}

$config = require __DIR__ . '/../config/config.php';
$db = $config['database'];

try {
    $dsn = "pgsql:host={$db['host']};port={$db['port']};dbname={$db['name']}";
    $pdo = new PDO($dsn, $db['user'], $db['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $results = [];

    $migrations = [
        'ALTER TABLE providers ADD COLUMN IF NOT EXISTS date_of_birth DATE',
        'ALTER TABLE providers ADD COLUMN IF NOT EXISTS cin_number VARCHAR(20)',
        'ALTER TABLE providers ADD COLUMN IF NOT EXISTS cin_front_path VARCHAR(255)',
        'ALTER TABLE providers ADD COLUMN IF NOT EXISTS cin_back_path VARCHAR(255)',
        'ALTER TABLE providers ADD COLUMN IF NOT EXISTS professional_license VARCHAR(100)',
        'ALTER TABLE providers ADD COLUMN IF NOT EXISTS address TEXT',
        'ALTER TABLE providers ADD COLUMN IF NOT EXISTS city VARCHAR(100)',
        'ALTER TABLE providers ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8)',
        'ALTER TABLE providers ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8)',
        'ALTER TABLE providers ADD COLUMN IF NOT EXISTS bio TEXT',
        'ALTER TABLE providers ADD COLUMN IF NOT EXISTS experience_years INT DEFAULT 0',
        'ALTER TABLE providers ADD COLUMN IF NOT EXISTS starting_price DECIMAL(10,2)',
        'ALTER TABLE providers ADD COLUMN IF NOT EXISTS specialties JSONB',
        'ALTER TABLE providers ADD COLUMN IF NOT EXISTS coverage_area JSONB',
        'ALTER TABLE providers ADD COLUMN IF NOT EXISTS availability_schedule JSONB',
        'ALTER TABLE providers ADD COLUMN IF NOT EXISTS intervention_radius_km INT DEFAULT 10',
        'ALTER TABLE providers ADD COLUMN IF NOT EXISTS charter_accepted BOOLEAN DEFAULT FALSE',
        'ALTER TABLE providers ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE',
        'ALTER TABLE providers ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP',
        'ALTER TABLE providers ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE',
        'ALTER TABLE providers ADD COLUMN IF NOT EXISTS payment_method_validated BOOLEAN DEFAULT FALSE',
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE',
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP',
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE',
        'ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP',
        "ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'text'",
        'ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(500)',
        'ALTER TABLE orders ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8)',
        'ALTER TABLE orders ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8)',
        'ALTER TABLE orders ADD COLUMN IF NOT EXISTS base_price DECIMAL(10,2)',
        'ALTER TABLE orders ADD COLUMN IF NOT EXISTS formula_type VARCHAR(50)',
        'ALTER TABLE orders ADD COLUMN IF NOT EXISTS formula_fee DECIMAL(10,2) DEFAULT 0',
        'ALTER TABLE orders ADD COLUMN IF NOT EXISTS night_fee DECIMAL(10,2) DEFAULT 0',
        'ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 15.00',
        'ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2)',
        'ALTER TABLE orders ADD COLUMN IF NOT EXISTS provider_amount DECIMAL(10,2)',
        'ALTER TABLE orders ADD COLUMN IF NOT EXISTS distance_km DECIMAL(8,2)',
        'ALTER TABLE orders ADD COLUMN IF NOT EXISTS distance_fee DECIMAL(10,2) DEFAULT 0',
        'ALTER TABLE orders ADD COLUMN IF NOT EXISTS extra_distance_km DECIMAL(10,2) DEFAULT 0',
        'ALTER TABLE orders ADD COLUMN IF NOT EXISTS price_per_extra_km DECIMAL(10,2) DEFAULT 2',
        'ALTER TABLE orders ADD COLUMN IF NOT EXISTS intervention_radius_km INT',
        'ALTER TABLE orders ADD COLUMN IF NOT EXISTS address_text TEXT',
        'ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_live_latitude DECIMAL(10,8)',
        'ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_live_longitude DECIMAL(11,8)',
        'ALTER TABLE orders ADD COLUMN IF NOT EXISTS provider_completed_at TIMESTAMP',
        'ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_confirmed_at TIMESTAMP',
        'ALTER TABLE orders ADD COLUMN IF NOT EXISTS started_at TIMESTAMP',
        'ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP',
        'ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT',
        'ALTER TABLE services ADD COLUMN IF NOT EXISTS allowed_formulas JSONB',
        'ALTER TABLE services ADD COLUMN IF NOT EXISTS special_rules JSONB',
        'ALTER TABLE services ADD COLUMN IF NOT EXISTS min_booking_hours INT DEFAULT 24',
        'ALTER TABLE services ADD COLUMN IF NOT EXISTS max_booking_hours INT DEFAULT 720',
        'ALTER TABLE categories ADD COLUMN IF NOT EXISTS image VARCHAR(255)',
        'ALTER TABLE categories ADD COLUMN IF NOT EXISTS color VARCHAR(20)',
    ];

    foreach ($migrations as $sql) {
        try {
            $pdo->exec($sql);
            $results[] = ['sql' => substr($sql, 0, 70), 'status' => 'success'];
        } catch (PDOException $e) {
            $results[] = ['sql' => substr($sql, 0, 70), 'status' => 'error', 'error' => $e->getMessage()];
        }
    }

    $tables = [
        "CREATE TABLE IF NOT EXISTS service_formulas (id SERIAL PRIMARY KEY, service_id INT NOT NULL REFERENCES services(id) ON DELETE CASCADE, name VARCHAR(100) NOT NULL, slug VARCHAR(100) NOT NULL, description TEXT, price_modifier DECIMAL(5,2) DEFAULT 0, price_type VARCHAR(20) DEFAULT 'percentage', is_default BOOLEAN DEFAULT FALSE, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS user_onboarding_data (id SERIAL PRIMARY KEY, user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE, preferred_categories JSONB, preferred_schedule JSONB, notification_preferences JSONB, completed_steps JSONB, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS provider_onboarding_data (id SERIAL PRIMARY KEY, provider_id INT NOT NULL REFERENCES providers(id) ON DELETE CASCADE UNIQUE, selected_services JSONB, documents_uploaded JSONB, verification_status VARCHAR(20) DEFAULT 'pending', completed_steps JSONB, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS payment_methods (id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id) ON DELETE CASCADE, provider_id INT REFERENCES providers(id) ON DELETE CASCADE, type VARCHAR(50), card_last4 VARCHAR(4), card_brand VARCHAR(50), card_exp_month INT, card_exp_year INT, card_token VARCHAR(255), is_default BOOLEAN DEFAULT FALSE, is_active BOOLEAN DEFAULT TRUE, metadata JSONB, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, last_used_at TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS payment_logs (id SERIAL PRIMARY KEY, order_id INT REFERENCES orders(id) ON DELETE CASCADE, user_id INT, provider_id INT, transaction_id VARCHAR(255), event_type VARCHAR(50), amount DECIMAL(10,2), status VARCHAR(20), payment_method VARCHAR(50), error_code VARCHAR(50), error_message TEXT, request_data JSONB, response_data JSONB, ip_address VARCHAR(45), user_agent TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS message_reads (id SERIAL PRIMARY KEY, message_id INT NOT NULL REFERENCES messages(id) ON DELETE CASCADE, reader_type VARCHAR(20) NOT NULL, reader_id INT NOT NULL, read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(message_id, reader_type, reader_id))"
    ];

    foreach ($tables as $sql) {
        try {
            $pdo->exec($sql);
            preg_match('/CREATE TABLE IF NOT EXISTS (\w+)/', $sql, $m);
            $results[] = ['table' => $m[1] ?? 'unknown', 'status' => 'success'];
        } catch (PDOException $e) {
            $results[] = ['table' => 'error', 'status' => 'error', 'error' => $e->getMessage()];
        }
    }

    $indexes = [
        'CREATE INDEX IF NOT EXISTS idx_providers_city ON providers(city)',
        'CREATE INDEX IF NOT EXISTS idx_providers_available ON providers(is_available)',
        'CREATE INDEX IF NOT EXISTS idx_orders_scheduled_at ON orders(scheduled_at)',
    ];

    foreach ($indexes as $sql) { try { $pdo->exec($sql); } catch (PDOException $e) { } }

    $successCount = count(array_filter($results, fn($r) => $r['status'] === 'success'));
    $errorCount = count(array_filter($results, fn($r) => $r['status'] === 'error'));

    echo json_encode([
        'success' => true,
        'message' => "Migration terminee: $successCount succes, $errorCount erreurs",
        'total_migrations' => count($results),
        'results' => $results
    ], JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed', 'error' => $e->getMessage()]);
}
