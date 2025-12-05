<?php

// Encodage interne UTF-8
mb_internal_encoding('UTF-8');
mb_http_output('UTF-8');

// Gestion des erreurs
error_reporting(E_ALL);
ini_set('display_errors', '1');

// Headers CORS pour permettre les requêtes du frontend
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Max-Age: 86400');

// Gérer les requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header('Content-Type: application/json; charset=utf-8');

// Autoloader simple
spl_autoload_register(function ($class) {
    $prefix = 'App\\';

    $baseDir = __DIR__ . '/../app/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';


    if (file_exists($file)) {
        require $file;
    }
});

// Chargement du router
use App\Core\Router;

$router = new Router();

// Chargement des routes
require __DIR__ . '/../routes/api.php';

// Dispatch de la requête
$router->dispatch();
