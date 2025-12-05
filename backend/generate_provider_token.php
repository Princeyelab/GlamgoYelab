<?php

/**
 * Génère un token JWT valide pour un prestataire
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

echo "🔑 Génération de token JWT pour prestataire #7\n";
echo "=============================================\n\n";

// Prestataire ID - peut etre passe en argument
$providerId = $argv[1] ?? 10;

// Récupérer les infos du prestataire
$stmt = $db->prepare("SELECT * FROM providers WHERE id = ?");
$stmt->execute([$providerId]);
$provider = $stmt->fetch();

if (!$provider) {
    die("❌ Prestataire non trouvé\n");
}

echo "👤 Prestataire:\n";
echo "   ID: {$provider['id']}\n";
echo "   Nom: {$provider['first_name']} {$provider['last_name']}\n";
echo "   Email: {$provider['email']}\n\n";

// Utiliser le meme secret que config.php
// Note: config.php utilise getenv('JWT_SECRET') ?: 'your-secret-key-change-in-production'
// Comme le .env n'est pas charge comme variable d'environnement, on utilise le fallback
$jwtSecret = 'your-secret-key-change-in-production';

echo "🔐 JWT Secret: $jwtSecret\n\n";

// Créer le payload
$header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
$payload = json_encode([
    'user_id' => $provider['id'],
    'email' => $provider['email'],
    'role' => 'provider',
    'iat' => time(),
    'exp' => time() + (86400 * 30) // 30 jours
]);

// Encoder en Base64URL
$base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
$base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

// Créer la signature
$signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $jwtSecret, true);
$base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

// Token complet
$jwt = $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;

echo "🎫 TOKEN JWT:\n";
echo "============================================\n";
echo "$jwt\n";
echo "============================================\n\n";

echo "📋 Test de l'API:\n";
echo "----------------\n";
echo "curl -X GET http://localhost:8080/api/provider/notifications/unread-count \\\n";
echo "  -H \"Authorization: Bearer $jwt\"\n\n";

echo "✅ Terminé!\n";
