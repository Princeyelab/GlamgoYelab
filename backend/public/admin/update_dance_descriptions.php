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
echo "  Mise à jour des descriptions de spectacles\n";
echo "==============================================\n\n";

try {
    $updates = [
        [
            'slug' => 'danse-orientale',
            'name' => 'Spectacle de Danse Orientale',
            'description' => 'Spectacle de danse orientale à domicile - Une danseuse professionnelle se déplace chez vous pour un spectacle envoûtant de danse du ventre, parfait pour vos événements et célébrations'
        ],
        [
            'slug' => 'danse-salon',
            'name' => 'Spectacle de Danse de Salon',
            'description' => 'Spectacle de danse de salon à domicile - Un duo de danseurs professionnels se déplace chez vous pour un spectacle élégant de valse, tango, cha-cha-cha et autres danses de couple classiques'
        ]
    ];

    $stmt = $db->prepare(
        "UPDATE services
         SET name = ?, description = ?
         WHERE slug = ?"
    );

    foreach ($updates as $update) {
        $stmt->execute([
            $update['name'],
            $update['description'],
            $update['slug']
        ]);

        echo "✅ {$update['name']} mis à jour\n";
        echo "   Description: {$update['description']}\n\n";
    }

    echo "🎉 Terminé !\n";

} catch (PDOException $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
}

echo "</pre>";
