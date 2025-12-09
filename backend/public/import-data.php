<?php
/**
 * Script d'import des données de production
 * Accès: https://glamgo-api.fly.dev/import-data.php?key=glamgo2024migrate
 */

header('Content-Type: application/json');

// Sécurité: clé requise
$key = $_GET['key'] ?? '';
$expectedKey = getenv('MIGRATE_SECRET_KEY') ?: 'glamgo2024migrate';
if ($key !== $expectedKey) {
    http_response_code(401);
    die(json_encode(['success' => false, 'message' => 'Unauthorized']));
}

// Charger la config
$config = require __DIR__ . '/../config/config.php';
$db = $config['database'];

// Base URL pour les images
$imgBase = 'https://glamgo-api.fly.dev/images/services';

try {
    // Connexion PostgreSQL
    $dsn = "pgsql:host={$db['host']};port={$db['port']};dbname={$db['name']}";
    $pdo = new PDO($dsn, $db['user'], $db['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // Truncate tables
    $pdo->exec("TRUNCATE services CASCADE");
    $pdo->exec("TRUNCATE categories CASCADE");

    // Insert 5 categories
    $pdo->exec("INSERT INTO categories (id, name, slug, description, icon, is_active, display_order) VALUES
        (1, 'Beauté', 'beaute', 'Services de beauté', 'spa', TRUE, 1),
        (2, 'Maison', 'maison', 'Services pour la maison', 'home', TRUE, 2),
        (3, 'Voiture', 'voiture', 'Services automobiles', 'car', TRUE, 3),
        (4, 'Animaux', 'animaux', 'Services pour animaux', 'paw', TRUE, 4),
        (5, 'Bien-être', 'bien-etre', 'Services de bien-être', 'heart', TRUE, 5)");

    // Reset category sequence
    $pdo->exec("SELECT setval('categories_id_seq', 5)");

    // Insert 24 services avec images locales
    $stmt = $pdo->prepare("INSERT INTO services (category_id, name, slug, description, image, price, duration_minutes, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)");

    $services = [
        // Beauté: Coiffure Homme (4 services)
        [1, 'Coiffure Homme Premium', 'coiffure-homme-premium', 'Coiffure haut de gamme homme avec soins capillaires : shampooing professionnel, coupe tendance, brushing et styling. Service premium digne des meilleurs salons.', "$imgBase/coiffure-homme-premium.jpg", 200.00, 45],
        [1, 'Coiffure Homme Simple', 'coiffure-homme-simple', 'Coupe classique homme avec finitions soignées. Shampooing et coiffage inclus. Idéal pour un look net et professionnel.', "$imgBase/coiffure-homme-simple.jpg", 100.00, 30],
        [1, 'Pack Coiffure + Barbe', 'pack-coiffure-barbe', 'Formule complète homme : coupe de cheveux et taille de barbe. Le combo parfait pour un look soigné de la tête aux pieds. Tarif avantageux.', "$imgBase/pack-coiffure-barbe.jpg", 150.00, 50],
        [1, 'Taille de Barbe', 'taille-de-barbe', 'Taille et entretien de barbe professionnel. Contours nets, rasage précis, huile nourrissante. Pour une barbe impeccable.', "$imgBase/taille-barbe.jpg", 100.00, 25],

        // Beauté: Coiffure Femme (3 services)
        [1, 'Coiffure Classique', 'coiffure-classique', 'Coiffure complète avec soins : shampoing, coupe, brushing, masque nourrissant.', "$imgBase/coiffure-classique.jpg", 250.00, 60],
        [1, 'Coiffure Express', 'coiffure-express', 'Coupe et brushing rapide à domicile. Service express pour un look soigné.', "$imgBase/coiffure-express.jpg", 125.00, 30],
        [1, 'Coiffure Mariage & Événement', 'coiffure-mariage-evenement', 'Coiffure professionnelle pour mariages et événements spéciaux. Essais inclus.', "$imgBase/coiffure-mariage.jpg", 1150.00, 120],

        // Maison: Ménage (1 service)
        [2, 'Ménage', 'menage', 'Nettoyage complet de votre domicile : sols, surfaces, cuisine, salle de bain, dépoussiérage, rangement.', "$imgBase/menage.jpg", 175.00, 180],

        // Maison: Bricolage (1 service)
        [2, 'Petits Bricolages', 'petits-bricolages', 'Petits travaux de réparation et maintenance à domicile : plomberie, électricité basique, montage de meubles, fixations murales.', "$imgBase/petits-bricolages.jpg", 200.00, 60],

        // Maison: Cuisine (3 services)
        [2, 'Chef à Domicile - 2 Personnes', 'chef-domicile-2-personnes', 'Chef professionnel pour repas gastronomique ou traditionnel marocain. Courses, préparation et service inclus.', "$imgBase/chef-domicile-2.jpg", 600.00, 180],
        [2, 'Chef à Domicile - 4 Personnes', 'chef-domicile-4-personnes', 'Chef professionnel pour 4 convives. Menu personnalisé, courses et service inclus.', "$imgBase/chef-domicile-4.jpg", 1000.00, 240],
        [2, 'Chef à Domicile - 8 Personnes', 'chef-domicile-8-personnes', 'Chef professionnel pour grande tablée. Idéal réceptions et fêtes familiales.', "$imgBase/chef-domicile-8.jpg", 1800.00, 300],

        // Maison: Jardinage (1 service)
        [2, 'Jardinage', 'jardinage', 'Entretien complet de jardins : taille de haies, tonte de pelouse, désherbage, arrosage, plantation.', "$imgBase/jardinage.jpg", 250.00, 120],

        // Voiture: Lavage (3 services)
        [3, 'Nettoyage Auto Complet', 'nettoyage-auto-complet', 'Nettoyage complet intérieur + extérieur. Votre véhicule comme neuf.', "$imgBase/nettoyage-auto-complet.jpg", 250.00, 90],
        [3, 'Nettoyage Auto Externe', 'nettoyage-auto-externe', 'Lavage extérieur complet : carrosserie, vitres, jantes, pneus.', "$imgBase/nettoyage-auto-externe.jpg", 150.00, 45],
        [3, 'Nettoyage Auto Interne', 'nettoyage-auto-interne', 'Nettoyage intérieur complet : aspirateur, tissus, tableau de bord, vitres intérieures.', "$imgBase/nettoyage-auto-interne.jpg", 150.00, 60],

        // Animaux: Garde d'animaux (2 services)
        [4, 'Gardiennage d\'Animaux', 'gardiennage-animaux', 'Garde à domicile avec photos régulières toutes les 2h. Pas de toilettage.', "$imgBase/gardiennage-animaux.jpg", 200.00, 480],
        [4, 'Promenade d\'Animaux', 'promenade-animaux', 'Balade quotidienne de votre animal avec suivi GPS en temps réel.', "$imgBase/promenade-animaux.jpg", 100.00, 60],

        // Bien-être: Massage (1 service)
        [5, 'Massage Relaxant', 'massage-relaxant', 'Massage relaxant aux huiles essentielles (60 min). Détente profonde garantie.', "$imgBase/massage-relaxant.jpg", 325.00, 60],

        // Bien-être: Hammam & Soins (2 services)
        [5, 'Hammam & Gommage', 'hammam-gommage', 'Hammam traditionnel avec gommage au savon noir. Rituel complet de purification.', "$imgBase/hammam-gommage.jpg", 400.00, 90],
        [5, 'Soin Premium Argan', 'soin-premium-argan', 'Soin complet aux produits d\'argan bio du Maroc. Visage, corps et cheveux.', "$imgBase/soin-premium-argan.jpg", 600.00, 120],

        // Bien-être: Yoga (1 service)
        [5, 'Yoga', 'yoga', 'Cours particuliers de yoga à domicile : Hatha, Vinyasa, Yin. Tous niveaux acceptés.', "$imgBase/yoga.jpg", 200.00, 60],

        // Bien-être: Coaching (1 service)
        [5, 'Coach Sportif', 'coach-sportif', 'Coaching sportif personnalisé : fitness, musculation, cardio, perte de poids, prise de masse.', "$imgBase/coach-sportif.jpg", 250.00, 60],

        // Bien-être: Danse (1 service)
        [5, 'Danse Orientale', 'danse-orientale', 'Cours particuliers de danse orientale à domicile avec professeur diplômé. Tous niveaux.', "$imgBase/danse-orientale.jpg", 200.00, 60],
    ];

    foreach ($services as $service) {
        $stmt->execute($service);
    }

    // Reset service sequence
    $pdo->exec("SELECT setval('services_id_seq', (SELECT MAX(id) FROM services))");

    // Get counts
    $catCount = $pdo->query("SELECT COUNT(*) FROM categories")->fetchColumn();
    $svcCount = $pdo->query("SELECT COUNT(*) FROM services")->fetchColumn();

    echo json_encode([
        'success' => true,
        'message' => 'Data imported successfully',
        'categories' => (int)$catCount,
        'services' => (int)$svcCount
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Import failed',
        'error' => $e->getMessage()
    ]);
}
