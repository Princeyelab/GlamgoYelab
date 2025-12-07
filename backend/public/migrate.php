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

    $executed = 0;
    $errors = [];

    // Créer les tables directement
    $tables = [
        // Users
        "CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            phone VARCHAR(20),
            avatar VARCHAR(255),
            referral_code VARCHAR(10) UNIQUE NOT NULL,
            referred_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",

        // User addresses
        "CREATE TABLE IF NOT EXISTS user_addresses (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            label VARCHAR(50) NOT NULL,
            address_line TEXT NOT NULL,
            city VARCHAR(100) NOT NULL DEFAULT 'Marrakech',
            postal_code VARCHAR(10),
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            is_default BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",

        // Providers
        "CREATE TABLE IF NOT EXISTS providers (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            avatar VARCHAR(255),
            is_verified BOOLEAN DEFAULT FALSE,
            is_available BOOLEAN DEFAULT TRUE,
            current_latitude DECIMAL(10, 8),
            current_longitude DECIMAL(11, 8),
            rating DECIMAL(3, 2) DEFAULT 0.00,
            total_reviews INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",

        // Categories
        "CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            slug VARCHAR(100) UNIQUE NOT NULL,
            description TEXT,
            icon VARCHAR(255),
            parent_id INT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            display_order INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",

        // Services
        "CREATE TABLE IF NOT EXISTS services (
            id SERIAL PRIMARY KEY,
            category_id INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            description TEXT,
            image VARCHAR(255),
            price DECIMAL(10, 2) NOT NULL,
            duration_minutes INT NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",

        // Provider services
        "CREATE TABLE IF NOT EXISTS provider_services (
            id SERIAL PRIMARY KEY,
            provider_id INT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
            service_id INT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (provider_id, service_id)
        )",

        // Orders
        "CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            provider_id INT NULL REFERENCES providers(id) ON DELETE SET NULL,
            service_id INT NOT NULL,
            address_id INT NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            scheduled_at TIMESTAMP NULL,
            accepted_at TIMESTAMP NULL,
            started_at TIMESTAMP NULL,
            completed_at TIMESTAMP NULL,
            price DECIMAL(10, 2) NOT NULL,
            tip DECIMAL(10, 2) DEFAULT 0.00,
            total DECIMAL(10, 2) NOT NULL,
            payment_status VARCHAR(20) DEFAULT 'pending',
            payment_method VARCHAR(50) NULL,
            notes TEXT NULL,
            cancellation_reason TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",

        // Reviews
        "CREATE TABLE IF NOT EXISTS reviews (
            id SERIAL PRIMARY KEY,
            order_id INT NOT NULL UNIQUE,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            provider_id INT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
            rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
            comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",

        // Messages
        "CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            order_id INT NOT NULL,
            sender_type VARCHAR(20) NOT NULL,
            sender_id INT NOT NULL,
            content TEXT NOT NULL,
            translated_content TEXT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",

        // Location tracking
        "CREATE TABLE IF NOT EXISTS location_tracking (
            id SERIAL PRIMARY KEY,
            order_id INT NOT NULL,
            provider_id INT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
            latitude DECIMAL(10, 8) NOT NULL,
            longitude DECIMAL(11, 8) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",

        // Password reset tokens
        "CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            token VARCHAR(255) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            used BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",

        // OAuth providers
        "CREATE TABLE IF NOT EXISTS oauth_providers (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            provider VARCHAR(50) NOT NULL,
            provider_user_id VARCHAR(255) NOT NULL,
            access_token TEXT,
            refresh_token TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (provider, provider_user_id)
        )",

        // Notifications
        "CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            user_id INT NULL REFERENCES users(id) ON DELETE CASCADE,
            provider_id INT NULL REFERENCES providers(id) ON DELETE CASCADE,
            type VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            data TEXT,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",

        // Bids
        "CREATE TABLE IF NOT EXISTS bids (
            id SERIAL PRIMARY KEY,
            order_id INT NOT NULL,
            provider_id INT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
            amount DECIMAL(10, 2) NOT NULL,
            message TEXT,
            status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (order_id, provider_id)
        )"
    ];

    // Exécuter chaque CREATE TABLE
    foreach ($tables as $sql) {
        try {
            $pdo->exec($sql);
            $executed++;
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'already exists') === false) {
                $errors[] = $e->getMessage();
            }
        }
    }

    // Insérer les données de base
    $inserts = [
        "INSERT INTO categories (name, slug, description, icon, is_active, display_order) VALUES
        ('Maison', 'maison', 'Services pour la maison', 'home', TRUE, 1),
        ('Beauté', 'beaute', 'Services de beauté', 'spa', TRUE, 2),
        ('Voiture', 'voiture', 'Services automobiles', 'car', TRUE, 3),
        ('Bien-être', 'bien-etre', 'Services de bien-être', 'heart', TRUE, 4),
        ('Animaux', 'animaux', 'Services pour animaux', 'paw', TRUE, 5)
        ON CONFLICT (slug) DO NOTHING",

        "INSERT INTO services (category_id, name, slug, description, image, price, duration_minutes, is_active) VALUES
        (1, 'Ménage complet', 'menage-complet', 'Nettoyage complet de votre maison', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952', 150.00, 120, TRUE),
        (1, 'Repassage', 'repassage', 'Service de repassage à domicile', 'https://images.unsplash.com/photo-1489274495757-95c7c837b101', 80.00, 60, TRUE),
        (2, 'Coiffure femme', 'coiffure-femme', 'Coupe et coiffage pour femme', 'https://images.unsplash.com/photo-1560066984-138dadb4c035', 200.00, 90, TRUE),
        (2, 'Manucure', 'manucure', 'Soin des ongles et pose de vernis', 'https://images.unsplash.com/photo-1604654894610-df63bc536371', 120.00, 45, TRUE),
        (3, 'Lavage auto', 'lavage-auto', 'Lavage intérieur et extérieur', 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f', 100.00, 60, TRUE),
        (4, 'Massage relaxant', 'massage-relaxant', 'Massage détente à domicile', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874', 250.00, 60, TRUE),
        (5, 'Toilettage chien', 'toilettage-chien', 'Toilettage complet pour chien', 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7', 180.00, 90, TRUE)
        ON CONFLICT (slug) DO NOTHING"
    ];

    foreach ($inserts as $sql) {
        try {
            $pdo->exec($sql);
            $executed++;
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'duplicate') === false) {
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
