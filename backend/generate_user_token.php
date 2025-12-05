<?php

/**
 * Genere un token JWT valide pour un utilisateur
 */

// Autoloader
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $baseDir = __DIR__ . '/app/';
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

use App\Core\Database;

$db = Database::getInstance();

// User ID - peut etre passe en argument
$userId = $argv[1] ?? 10;

// Recuperer les infos de l'utilisateur
$stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$userId]);
$user = $stmt->fetch();

if (!$user) {
    die("Utilisateur non trouve\n");
}

echo "User ID: {$user['id']}\n";
echo "Nom: {$user['first_name']} {$user['last_name']}\n";
echo "Email: {$user['email']}\n\n";

// Utiliser le meme secret que config.php
$jwtSecret = 'your-secret-key-change-in-production';

// Creer le payload
$header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
$payload = json_encode([
    'user_id' => $user['id'],
    'email' => $user['email'],
    'role' => 'user',
    'iat' => time(),
    'exp' => time() + (86400 * 30)
]);

// Encoder en Base64URL
$base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
$base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

// Signature
$signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $jwtSecret, true);
$base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

// Token complet
$jwt = $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;

echo "TOKEN: $jwt\n";
