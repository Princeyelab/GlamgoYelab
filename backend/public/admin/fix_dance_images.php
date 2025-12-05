<?php
header('Content-Type: text/html; charset=utf-8');

$host = getenv('DB_HOST') ?: 'mysql-db';
$dbname = getenv('DB_NAME') ?: 'glamgo';
$user = getenv('DB_USER') ?: 'glamgo_user';
$pass = getenv('DB_PASSWORD') ?: 'glamgo_password';

try {
    $db = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Erreur de connexion: " . $e->getMessage());
}

echo "<pre>";
echo "==============================================\n";
echo "  Correction des chemins d'images de danse\n";
echo "==============================================\n\n";

try {
    // Mettre à jour les images avec le bon chemin
    $stmt = $db->prepare(
        "UPDATE services 
         SET image = ? 
         WHERE slug = ?"
    );

    $services = [
        ['slug' => 'danse-orientale', 'image' => '/images/services/danse-orientale.svg'],
        ['slug' => 'danse-salon', 'image' => '/images/services/danse-salon.svg']
    ];

    foreach ($services as $service) {
        $stmt->execute([$service['image'], $service['slug']]);
        echo "✅ Image mise à jour pour '{$service['slug']}'\n";
        echo "   Nouveau chemin: {$service['image']}\n\n";
    }

    echo "🎉 Terminé !\n";

} catch (PDOException $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
}

echo "</pre>";
