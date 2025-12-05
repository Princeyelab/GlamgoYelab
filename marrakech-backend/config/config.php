<?php

/**
 * Fichier de configuration de l'application Marrakech Services
 */

return [
    // Configuration de l'application
    'app' => [
        'name' => 'Marrakech Services',
        'env' => getenv('APP_ENV') ?: 'development',
        'debug' => getenv('APP_DEBUG') === 'true',
        'url' => getenv('APP_URL') ?: 'http://localhost:8081',
        'timezone' => 'Africa/Casablanca',
        'locale' => 'fr'
    ],

    // Configuration de la base de données
    'database' => [
        'host' => getenv('DB_HOST') ?: 'mysql-db',
        'dbname' => getenv('DB_NAME') ?: 'marrakech_services',
        'user' => getenv('DB_USER') ?: 'marrakech_user',
        'password' => getenv('DB_PASSWORD') ?: 'marrakech_password',
        'charset' => 'utf8mb4',
        'port' => getenv('DB_PORT') ?: '3306'
    ],

    // Configuration de sécurité
    'security' => [
        'password_cost' => 12, // Coût bcrypt pour le hashage des mots de passe
        'token_expiration' => 3600 * 24 * 7, // 7 jours en secondes
    ],

    // Configuration des uploads
    'upload' => [
        'max_size' => 5 * 1024 * 1024, // 5 MB
        'allowed_types' => ['jpg', 'jpeg', 'png', 'gif', 'svg'],
        'path' => ROOT_PATH . '/public/uploads'
    ],

    // Configuration de la géolocalisation
    'geolocation' => [
        'default_lat' => 31.6295, // Marrakech
        'default_lon' => -7.9811,
        'search_radius_km' => 10 // Rayon de recherche par défaut
    ],

    // Configuration du paiement (placeholder)
    'payment' => [
        'enabled' => false,
        'currency' => 'MAD',
        'commission_rate' => 0.15 // 15% de commission
    ]
];
