<?php

// Parse DATABASE_URL si disponible (format Render/Heroku)
$databaseUrl = getenv('DATABASE_URL') ?: ($_ENV['DATABASE_URL'] ?? ($_SERVER['DATABASE_URL'] ?? null));
$dbConfig = [];

if ($databaseUrl) {
    $parsed = parse_url($databaseUrl);
    $dbConfig = [
        'driver' => $parsed['scheme'] === 'postgres' ? 'pgsql' : $parsed['scheme'],
        'host' => $parsed['host'],
        'port' => $parsed['port'] ?? 5432,
        'name' => ltrim($parsed['path'], '/'),
        'user' => $parsed['user'],
        'password' => $parsed['pass'],
        'charset' => 'utf8'
    ];
} else {
    $dbConfig = [
        'driver' => getenv('DB_CONNECTION') ?: 'mysql',
        'host' => getenv('DB_HOST') ?: 'mysql-db',
        'port' => getenv('DB_PORT') ?: '3306',
        'name' => getenv('DB_DATABASE') ?: (getenv('DB_NAME') ?: 'glamgo'),
        'user' => getenv('DB_USERNAME') ?: (getenv('DB_USER') ?: 'glamgo_user'),
        'password' => getenv('DB_PASSWORD') ?: 'glamgo_password',
        'charset' => 'utf8'
    ];
}

return [
    // Configuration de la base de données
    'database' => $dbConfig,

    // Configuration de l'application
    'app' => [
        'name' => 'GlamGo',
        'url' => getenv('APP_URL') ?: 'http://localhost:8080',
        'timezone' => 'Africa/Casablanca',
        'locale' => 'fr',
        'debug' => getenv('APP_DEBUG') === 'true',
    ],

    // Configuration JWT
    'jwt' => [
        'secret' => getenv('JWT_SECRET') ?: 'your-secret-key-change-in-production',
        'expiration' => 3600 * 24 * 7, // 7 jours
    ],

    // Configuration OAuth (à implémenter)
    'oauth' => [
        'google' => [
            'client_id' => getenv('GOOGLE_CLIENT_ID') ?: '',
            'client_secret' => getenv('GOOGLE_CLIENT_SECRET') ?: '',
            'redirect_uri' => getenv('GOOGLE_REDIRECT_URI') ?: '',
        ],
        'facebook' => [
            'app_id' => getenv('FACEBOOK_APP_ID') ?: '',
            'app_secret' => getenv('FACEBOOK_APP_SECRET') ?: '',
            'redirect_uri' => getenv('FACEBOOK_REDIRECT_URI') ?: '',
        ]
    ],

    // Configuration de géolocalisation
    'geolocation' => [
        'default_lat' => 31.6295, // Marrakech
        'default_lng' => -7.9811,
        'radius_km' => 20, // Rayon de recherche des prestataires
    ],

    // Configuration des paiements (placeholder)
    'payment' => [
        'currency' => 'MAD',
        'tax_rate' => 0.20, // TVA 20%
    ]
];
