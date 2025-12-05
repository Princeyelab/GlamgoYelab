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
echo "  Mise à jour des images de danse (Unsplash)\n";
echo "==============================================\n\n";

try {
    // Mettre à NULL pour laisser le système utiliser les URLs Unsplash depuis serviceImages.js
    $stmt = $db->prepare(
        "UPDATE services
         SET image = NULL
         WHERE slug IN ('danse-orientale', 'danse-salon')"
    );

    $stmt->execute();
    $count = $stmt->rowCount();

    echo "✅ Images mises à jour : $count service(s)\n";
    echo "   Les images Unsplash seront utilisées automatiquement\n\n";

    // Vérifier les services
    $stmt = $db->query(
        "SELECT id, name, slug, image
         FROM services
         WHERE slug IN ('danse-orientale', 'danse-salon')"
    );
    $services = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "📝 Services de danse :\n";
    foreach ($services as $service) {
        $imageStatus = $service['image'] ? $service['image'] : 'NULL (utilise Unsplash)';
        echo "   - {$service['name']} ({$service['slug']})\n";
        echo "     Image: {$imageStatus}\n";
    }

    echo "\n🎉 Terminé !\n";
    echo "🔗 Les photos de spectacles de danse sont maintenant affichées depuis Unsplash\n";

} catch (PDOException $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
}

echo "</pre>";
