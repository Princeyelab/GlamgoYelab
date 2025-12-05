<?php

/**
 * Point d'entr�e de l'application Marrakech Services
 *
 * Ce fichier initialise l'application et dispatch les requ�tes
 */

// Gestion des erreurs en d�veloppement
ini_set('display_errors', 1);
error_reporting(E_ALL);

// D�finir le timezone
date_default_timezone_set('Africa/Casablanca');

// Headers CORS pour permettre les requ�tes du frontend
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// G�rer les requ�tes OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// D�finir les constantes de chemin
define('ROOT_PATH', dirname(__DIR__));
define('APP_PATH', ROOT_PATH . '/app');
define('CORE_PATH', ROOT_PATH . '/core');
define('CONFIG_PATH', ROOT_PATH . '/config');

// Autoloader simple pour charger automatiquement les classes
spl_autoload_register(function ($class) {
    // Liste des dossiers o� chercher les classes
    $directories = [
        CORE_PATH,
        APP_PATH . '/controllers',
        APP_PATH . '/models',
        APP_PATH . '/helpers',
        APP_PATH . '/middleware',
    ];

    foreach ($directories as $directory) {
        $file = $directory . '/' . $class . '.php';

        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
});

// Charger la configuration
if (file_exists(CONFIG_PATH . '/config.php')) {
    $config = require CONFIG_PATH . '/config.php';
} else {
    $config = [];
}

// Initialiser la connexion � la base de donn�es
try {
    // Tester la connexion
    $dbConnected = Database::testConnection();

    if (!$dbConnected) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Database connection failed'
        ]);
        exit;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
    exit;
}

// Cr�er le router
$router = new Router();

// Charger les routes
if (file_exists(ROOT_PATH . '/routes/web.php')) {
    require ROOT_PATH . '/routes/web.php';
} else {
    // Route par d�faut si le fichier de routes n'existe pas
    $router->get('/', 'HomeController', 'index');
}

// Ex�cuter le router
try {
    $router->run();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Router error: ' . $e->getMessage()
    ]);
    exit;
}
