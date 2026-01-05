<?php

// Timezone Marrakech
date_default_timezone_set('Africa/Casablanca');

// Encodage interne UTF-8
mb_internal_encoding('UTF-8');
mb_http_output('UTF-8');

// Gestion des erreurs
error_reporting(E_ALL);
ini_set('display_errors', '1');

// Servir les fichiers statiques directement (images, uploads, etc.)
$requestUri = $_SERVER['REQUEST_URI'];
$requestPath = parse_url($requestUri, PHP_URL_PATH);

// Liste des extensions de fichiers statiques à servir directement
$staticExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'css', 'js', 'pdf', 'doc', 'docx'];
$extension = strtolower(pathinfo($requestPath, PATHINFO_EXTENSION));

if (in_array($extension, $staticExtensions)) {
    $filePath = __DIR__ . $requestPath;

    if (file_exists($filePath) && is_file($filePath)) {
        // Définir le Content-Type approprié
        $mimeTypes = [
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            'svg' => 'image/svg+xml',
            'ico' => 'image/x-icon',
            'css' => 'text/css',
            'js' => 'application/javascript',
            'pdf' => 'application/pdf',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        $mimeType = $mimeTypes[$extension] ?? 'application/octet-stream';

        // Headers CORS pour les fichiers statiques aussi
        header('Access-Control-Allow-Origin: *');
        header('Content-Type: ' . $mimeType);
        header('Content-Length: ' . filesize($filePath));
        header('Cache-Control: public, max-age=31536000'); // Cache 1 an pour les images

        readfile($filePath);
        exit();
    }
}

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

// Autoloader simple (compatible Linux - casse des dossiers)
spl_autoload_register(function ($class) {
    $prefix = 'App\\';

    $baseDir = __DIR__ . '/../app/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relativeClass = substr($class, $len);

    // Convertir le namespace en chemin (minuscules pour les dossiers)
    $parts = explode('\\', $relativeClass);
    $className = array_pop($parts); // Garder le nom de classe original
    $path = '';
    foreach ($parts as $part) {
        $path .= strtolower($part) . '/';
    }
    $file = $baseDir . $path . $className . '.php';

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
