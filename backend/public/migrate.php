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
            is_blocked BOOLEAN DEFAULT FALSE,
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

    // Supprimer les anciennes données pour repartir propre
    $pdo->exec("DELETE FROM services");
    $pdo->exec("DELETE FROM categories");

    // Réinitialiser les séquences
    $pdo->exec("ALTER SEQUENCE categories_id_seq RESTART WITH 1");
    $pdo->exec("ALTER SEQUENCE services_id_seq RESTART WITH 1");

    // Insérer les catégories principales
    $inserts = [
        "INSERT INTO categories (name, slug, description, icon, parent_id, is_active, display_order) VALUES
        ('Beauté', 'beaute', 'Services de beauté et bien-être', 'beauty.svg', NULL, TRUE, 1),
        ('Maison', 'maison', 'Services pour la maison', 'home.svg', NULL, TRUE, 2),
        ('Voiture', 'voiture', 'Services pour votre véhicule', 'car.svg', NULL, TRUE, 3),
        ('Animaux', 'animaux', 'Services pour vos animaux de compagnie', 'pet.svg', NULL, TRUE, 4)",

        // Sous-catégories Beauté (parent_id = 1)
        "INSERT INTO categories (name, slug, description, icon, parent_id, is_active, display_order) VALUES
        ('Coiffure', 'coiffure', 'Coupe, coloration, coiffage', 'hair.svg', 1, TRUE, 1),
        ('Esthétique', 'esthetique', 'Soins du visage et du corps', 'face.svg', 1, TRUE, 2),
        ('Manucure & Pédicure', 'manucure-pedicure', 'Soins des mains et des pieds', 'nails.svg', 1, TRUE, 3),
        ('Massage', 'massage', 'Massages relaxants et thérapeutiques', 'massage.svg', 1, TRUE, 4)",

        // Sous-catégories Maison (parent_id = 2)
        "INSERT INTO categories (name, slug, description, icon, parent_id, is_active, display_order) VALUES
        ('Nettoyage', 'nettoyage', 'Nettoyage et entretien', 'clean.svg', 2, TRUE, 1),
        ('Plomberie', 'plomberie', 'Réparations et installations', 'plumbing.svg', 2, TRUE, 2),
        ('Électricité', 'electricite', 'Installations et dépannages électriques', 'electric.svg', 2, TRUE, 3),
        ('Jardinage', 'jardinage', 'Entretien d espaces verts', 'garden.svg', 2, TRUE, 4)",

        // Sous-catégories Voiture (parent_id = 3)
        "INSERT INTO categories (name, slug, description, icon, parent_id, is_active, display_order) VALUES
        ('Lavage', 'lavage', 'Lavage intérieur et extérieur', 'car-wash.svg', 3, TRUE, 1),
        ('Mécanique', 'mecanique', 'Réparations mécaniques', 'mechanic.svg', 3, TRUE, 2)",

        // Sous-catégories Animaux (parent_id = 4)
        "INSERT INTO categories (name, slug, description, icon, parent_id, is_active, display_order) VALUES
        ('Toilettage', 'toilettage', 'Toilettage et soins', 'pet-grooming.svg', 4, TRUE, 1),
        ('Vétérinaire', 'veterinaire', 'Soins vétérinaires à domicile', 'vet.svg', 4, TRUE, 2)",

        // Services Coiffure (category_id = 5)
        "INSERT INTO services (category_id, name, slug, description, image, price, duration_minutes, is_active) VALUES
        (5, 'Coupe Homme', 'coupe-homme', 'Coupe de cheveux classique pour homme', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1', 80.00, 30, TRUE),
        (5, 'Coupe Femme', 'coupe-femme', 'Coupe de cheveux pour femme', 'https://images.unsplash.com/photo-1560066984-138dadb4c035', 120.00, 45, TRUE),
        (5, 'Brushing', 'brushing', 'Brushing professionnel', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e', 100.00, 40, TRUE),
        (5, 'Coloration', 'coloration', 'Coloration complète', 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388', 250.00, 120, TRUE),
        (5, 'Mèches', 'meches', 'Mèches ou balayage', 'https://images.unsplash.com/photo-1519699047748-de8e457a634e', 300.00, 150, TRUE)",

        // Services Esthétique (category_id = 6)
        "INSERT INTO services (category_id, name, slug, description, image, price, duration_minutes, is_active) VALUES
        (6, 'Soin du visage', 'soin-visage', 'Soin complet du visage', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881', 200.00, 60, TRUE),
        (6, 'Épilation jambes', 'epilation-jambes', 'Épilation complète des jambes', 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2', 150.00, 45, TRUE),
        (6, 'Maquillage', 'maquillage', 'Maquillage professionnel', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9', 180.00, 60, TRUE)",

        // Services Manucure (category_id = 7)
        "INSERT INTO services (category_id, name, slug, description, image, price, duration_minutes, is_active) VALUES
        (7, 'Manucure classique', 'manucure-classique', 'Manucure avec vernis', 'https://images.unsplash.com/photo-1604654894610-df63bc536371', 80.00, 30, TRUE),
        (7, 'Manucure gel', 'manucure-gel', 'Pose de vernis semi-permanent', 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66', 120.00, 45, TRUE),
        (7, 'Pédicure classique', 'pedicure-classique', 'Pédicure avec vernis', 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b', 100.00, 45, TRUE),
        (7, 'Pédicure spa', 'pedicure-spa', 'Pédicure avec soin relaxant', 'https://images.unsplash.com/photo-1562322140-8baeececf3df', 150.00, 60, TRUE)",

        // Services Massage (category_id = 8)
        "INSERT INTO services (category_id, name, slug, description, image, price, duration_minutes, is_active) VALUES
        (8, 'Massage relaxant 30min', 'massage-relaxant-30', 'Massage relaxant de 30 minutes', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874', 150.00, 30, TRUE),
        (8, 'Massage relaxant 60min', 'massage-relaxant-60', 'Massage relaxant d une heure', 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2', 250.00, 60, TRUE),
        (8, 'Massage sportif', 'massage-sportif', 'Massage pour sportifs', 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1', 300.00, 60, TRUE)",

        // Services Nettoyage (category_id = 9)
        "INSERT INTO services (category_id, name, slug, description, image, price, duration_minutes, is_active) VALUES
        (9, 'Nettoyage appartement', 'nettoyage-appartement', 'Nettoyage complet d appartement', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952', 200.00, 120, TRUE),
        (9, 'Nettoyage villa', 'nettoyage-villa', 'Nettoyage complet de villa', 'https://images.unsplash.com/photo-1558317374-067fb5f30001', 400.00, 240, TRUE),
        (9, 'Nettoyage express', 'nettoyage-express', 'Nettoyage rapide', 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac', 120.00, 60, TRUE)",

        // Services Plomberie (category_id = 10)
        "INSERT INTO services (category_id, name, slug, description, image, price, duration_minutes, is_active) VALUES
        (10, 'Dépannage plomberie', 'depannage-plomberie', 'Intervention d urgence', 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7', 250.00, 60, TRUE),
        (10, 'Installation sanitaire', 'installation-sanitaire', 'Installation équipement sanitaire', 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1', 300.00, 120, TRUE)",

        // Services Électricité (category_id = 11)
        "INSERT INTO services (category_id, name, slug, description, image, price, duration_minutes, is_active) VALUES
        (11, 'Dépannage électrique', 'depannage-electrique', 'Intervention d urgence', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e', 250.00, 60, TRUE),
        (11, 'Installation électrique', 'installation-electrique', 'Installation équipement électrique', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64', 300.00, 120, TRUE)",

        // Services Jardinage (category_id = 12)
        "INSERT INTO services (category_id, name, slug, description, image, price, duration_minutes, is_active) VALUES
        (12, 'Tonte de pelouse', 'tonte-pelouse', 'Tonte et entretien de pelouse', 'https://images.unsplash.com/photo-1558904541-efa843a96f01', 150.00, 60, TRUE),
        (12, 'Taille de haies', 'taille-haies', 'Taille et formation de haies', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b', 180.00, 90, TRUE)",

        // Services Lavage auto (category_id = 13)
        "INSERT INTO services (category_id, name, slug, description, image, price, duration_minutes, is_active) VALUES
        (13, 'Lavage extérieur', 'lavage-exterieur', 'Lavage extérieur complet', 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f', 80.00, 30, TRUE),
        (13, 'Lavage complet', 'lavage-complet', 'Lavage intérieur et extérieur', 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc', 150.00, 60, TRUE),
        (13, 'Lavage premium', 'lavage-premium', 'Lavage premium avec cirage', 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785', 250.00, 90, TRUE)",

        // Services Mécanique (category_id = 14)
        "INSERT INTO services (category_id, name, slug, description, image, price, duration_minutes, is_active) VALUES
        (14, 'Vidange', 'vidange', 'Vidange et changement de filtre', 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc', 300.00, 45, TRUE),
        (14, 'Diagnostic panne', 'diagnostic-panne', 'Diagnostic mécanique', 'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f', 200.00, 60, TRUE)",

        // Services Toilettage (category_id = 15)
        "INSERT INTO services (category_id, name, slug, description, image, price, duration_minutes, is_active) VALUES
        (15, 'Toilettage chien petit', 'toilettage-chien-petit', 'Pour chiens de petite taille', 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7', 120.00, 45, TRUE),
        (15, 'Toilettage chien grand', 'toilettage-chien-grand', 'Pour chiens de grande taille', 'https://images.unsplash.com/photo-1587300003388-59208cc962cb', 200.00, 90, TRUE),
        (15, 'Toilettage chat', 'toilettage-chat', 'Toilettage pour chat', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba', 100.00, 45, TRUE)",

        // Services Vétérinaire (category_id = 16)
        "INSERT INTO services (category_id, name, slug, description, image, price, duration_minutes, is_active) VALUES
        (16, 'Consultation vétérinaire', 'consultation-veterinaire', 'Consultation à domicile', 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def', 250.00, 30, TRUE),
        (16, 'Vaccination', 'vaccination', 'Vaccination à domicile', 'https://images.unsplash.com/photo-1612531386530-97286d97c2d2', 200.00, 20, TRUE)"
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
