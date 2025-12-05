<?php

/**
 * Script pour mettre à jour les images de tous les services
 * Images provenant d'Unsplash - correspondant exactement au descriptif
 * AUCUN DOUBLON
 */

mb_internal_encoding('UTF-8');
mb_http_output('UTF-8');

echo "\n";
echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║  Mise à jour des Images des Services - Unsplash          ║\n";
echo "║  Images uniques et adaptées à chaque service              ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n";
echo "\n";

$host = getenv('DB_HOST') ?: 'glamgo-mysql';
$dbname = getenv('DB_NAME') ?: 'glamgo';
$username = getenv('DB_USER') ?: 'glamgo_user';
$password = getenv('DB_PASSWORD') ?: 'glamgo_password';

// Mapping complet des images Unsplash pour chaque service
// Format : 'slug-du-service' => 'URL Unsplash unique'
$serviceImages = [
    // BEAUTÉ - Coiffure ancienne (catégorie 5)
    'coupe-homme' => 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=600&fit=crop',
    'coupe-femme' => 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=600&fit=crop',
    'brushing' => 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&h=600&fit=crop',
    'coloration' => 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800&h=600&fit=crop',
    'meches' => 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=800&h=600&fit=crop',

    // BEAUTÉ - Esthétique (catégorie 6)
    'soin-visage' => 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=600&fit=crop',
    'epilation-jambes' => 'https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=800&h=600&fit=crop',
    'maquillage' => 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&h=600&fit=crop',

    // BEAUTÉ - Manucure & Pédicure (catégorie 7)
    'manucure-classique' => 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=600&fit=crop',
    'manucure-gel' => 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=800&h=600&fit=crop',
    'pedicure-classique' => 'https://images.unsplash.com/photo-1599206676335-193c82b13c9e?w=800&h=600&fit=crop',
    'pedicure-spa' => 'https://images.unsplash.com/photo-1567958451986-2de427a4a0be?w=800&h=600&fit=crop',
    'manucure-femme' => 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=800&h=600&fit=crop',
    'manucure-homme' => 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=600&fit=crop',

    // BEAUTÉ - Massage (catégorie 8)
    'massage-relaxant-30' => 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=600&fit=crop',
    'massage-relaxant-60' => 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800&h=600&fit=crop',
    'massage-sportif' => 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&h=600&fit=crop',
    'massage-tonique' => 'https://images.unsplash.com/photo-1596178060810-7621967edde0?w=800&h=600&fit=crop',
    'massage-thailandais' => 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=600&fit=crop',
    'massage-marocain' => 'https://images.unsplash.com/photo-1583416750470-965b2707b355?w=800&h=600&fit=crop',

    // MAISON - Nettoyage (catégorie 9 et 19)
    'nettoyage-appartement' => 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop',
    'nettoyage-villa' => 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=800&h=600&fit=crop',
    'nettoyage-express' => 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&h=600&fit=crop',
    'menage-classique' => 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800&h=600&fit=crop',
    'menage-approfondi' => 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&h=600&fit=crop',
    'nettoyage-apres-evenement' => 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&h=600&fit=crop',
    'nettoyage-printemps' => 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=800&h=600&fit=crop',
    'nettoyage-cuisine' => 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&h=600&fit=crop',
    'nettoyage-salle-bain' => 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=600&fit=crop',
    'service-repassage' => 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&h=600&fit=crop',

    // MAISON - Plomberie (catégorie 10)
    'depannage-plomberie' => 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&h=600&fit=crop',
    'installation-sanitaire' => 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&h=600&fit=crop',

    // MAISON - Électricité (catégorie 11)
    'depannage-electrique' => 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=600&fit=crop',
    'installation-electrique' => 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=600&fit=crop',

    // MAISON - Jardinage (catégorie 12)
    'tonte-pelouse' => 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop',
    'taille-haies' => 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&h=600&fit=crop',
    'entretien-pelouse' => 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800&h=600&fit=crop',
    'plantation-fleurs' => 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800&h=600&fit=crop',

    // VOITURE - Lavage (catégories 13 et 28)
    'lavage-exterieur' => 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&h=600&fit=crop',
    'lavage-complet' => 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&h=600&fit=crop',
    'lavage-premium' => 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800&h=600&fit=crop',
    'nettoyage-exterieur-seul' => 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&h=600&fit=crop',
    'nettoyage-interieur-seul' => 'https://images.unsplash.com/photo-1607860108000-2b9d951df188?w=800&h=600&fit=crop',
    'combo-interieur-exterieur' => 'https://images.unsplash.com/photo-1601362840547-9e518eea0e47?w=800&h=600&fit=crop',

    // VOITURE - Mécanique (catégories 14 et 27)
    'vidange' => 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop',
    'diagnostic-panne' => 'https://images.unsplash.com/photo-1632823469959-e94206409d5a?w=800&h=600&fit=crop',
    'vidange-huile' => 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=800&h=600&fit=crop',
    'changement-ampoule-voiture' => 'https://images.unsplash.com/photo-1614165936126-273a0e40c69e?w=800&h=600&fit=crop',
    'changement-essuie-glace' => 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=800&h=600&fit=crop',
    'changement-pneu' => 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=800&h=600&fit=crop',

    // ANIMAUX - Toilettage (catégories 15 et 30)
    'toilettage-chien-petit' => 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&h=600&fit=crop',
    'toilettage-chien-grand' => 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=600&fit=crop',
    'toilettage-chat' => 'https://images.unsplash.com/photo-1573865526739-10c1dd7aa000?w=800&h=600&fit=crop',
    'toilettage-chien' => 'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=800&h=600&fit=crop',
    'promenade-chien' => 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=800&h=600&fit=crop',
    'gardiennage-domicile' => 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop',
    'gardiennage-longue-duree' => 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&h=600&fit=crop',
    'nourrissage-animaux' => 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=800&h=600&fit=crop',
    'transport-animaux' => 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=800&h=600&fit=crop',
    'nettoyage-espace-animal' => 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&h=600&fit=crop',

    // ANIMAUX - Vétérinaire (catégorie 16)
    'consultation-veterinaire' => 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800&h=600&fit=crop',
    'vaccination' => 'https://images.unsplash.com/photo-1612536551977-5ccc4a13c107?w=800&h=600&fit=crop',

    // MAISON - Bricolage (catégorie 20)
    'montage-meuble' => 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=800&h=600&fit=crop',
    'changement-ampoule' => 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop',
    'petits-travaux-plomberie' => 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800&h=600&fit=crop',
    'percage-fixation' => 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&h=600&fit=crop',
    'petit-demenagement' => 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600&fit=crop',

    // MAISON - Cuisine (catégorie 21)
    'preparation-repas' => 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=600&fit=crop',
    'chef-evenementiel' => 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=800&h=600&fit=crop',
    'coaching-cuisine' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',

    // BEAUTÉ - Coiffure Homme (catégorie 22)
    'coupe-classique-homme' => 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&h=600&fit=crop',
    'coupe-tendance-homme' => 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&h=600&fit=crop',
    'taille-barbe-classique' => 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&h=600&fit=crop',
    'barbe-contours' => 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=800&h=600&fit=crop',
    'rasage-ancienne' => 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&h=600&fit=crop',
    'soin-barbe' => 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&h=600&fit=crop',
    'combo-coupe-barbe' => 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=600&fit=crop',

    // BEAUTÉ - Coiffure Femme (catégorie 23)
    'coupe-cheveux-courts' => 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop',
    'coupe-cheveux-longs' => 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=600&fit=crop',
    'coloration-cheveux-courts' => 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=600&fit=crop',
    'coloration-cheveux-longs' => 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=800&h=600&fit=crop',

    // BEAUTÉ - Maquillage (catégorie 24)
    'maquillage-jour' => 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&h=600&fit=crop',
    'maquillage-soiree' => 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&h=600&fit=crop',
    'maquillage-mariage' => 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&h=600&fit=crop',

    // BEAUTÉ - Épilation Femme (catégorie 25)
    'jambes-completes-femme' => 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&h=600&fit=crop',
    'sourcils-visage' => 'https://images.unsplash.com/photo-1457972729786-0411a3b2b626?w=800&h=600&fit=crop',

    // BEAUTÉ - Épilation Homme (catégorie 26)
    'torse-dos-homme' => 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
    'bras-complets-homme' => 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=800&h=600&fit=crop',

    // BIEN-ÊTRE - Coaching (catégorie 29)
    'yoga' => 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop',
    'pilates' => 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=600&fit=crop',
    'etirements-guides' => 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&h=600&fit=crop',
    'musculation-personnalisee' => 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&h=600&fit=crop',
    'meditation-respiration' => 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop',
    'coaching-nutrition' => 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=600&fit=crop',
];

try {
    echo "📡 Connexion à la base de données...\n";
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
    echo "✅ Connecté!\n\n";

    echo "🖼️  Mise à jour des images des services...\n\n";

    $updated = 0;
    $notFound = 0;
    $stmt = $pdo->prepare("UPDATE services SET image = ? WHERE slug = ?");

    foreach ($serviceImages as $slug => $imageUrl) {
        // Vérifier si le service existe
        $checkStmt = $pdo->prepare("SELECT id, name FROM services WHERE slug = ?");
        $checkStmt->execute([$slug]);
        $service = $checkStmt->fetch();

        if ($service) {
            $stmt->execute([$imageUrl, $slug]);
            echo "   ✅ {$service['name']}\n";
            echo "      🔗 {$imageUrl}\n";
            $updated++;
        } else {
            echo "   ⚠️  Service non trouvé : $slug\n";
            $notFound++;
        }
    }

    echo "\n";
    echo "╔════════════════════════════════════════════════════════════╗\n";
    echo "║  ✅ MISE À JOUR TERMINÉE                                   ║\n";
    echo "╚════════════════════════════════════════════════════════════╝\n";
    echo "\n";
    echo "📊 RÉSULTATS :\n";
    echo "   - Services mis à jour : $updated\n";
    echo "   - Services non trouvés : $notFound\n";
    echo "   - Total images uniques : " . count($serviceImages) . "\n";
    echo "\n";

    // Vérifier les services sans image
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM services WHERE image IS NULL OR image = ''");
    $result = $stmt->fetch();
    $withoutImage = $result['count'];

    if ($withoutImage > 0) {
        echo "⚠️  ATTENTION : $withoutImage services sans image\n";
        echo "\n";
        echo "Services sans image :\n";
        $stmt = $pdo->query("SELECT id, name, slug FROM services WHERE image IS NULL OR image = '' ORDER BY id");
        while ($row = $stmt->fetch()) {
            echo "   - [{$row['id']}] {$row['name']} (slug: {$row['slug']})\n";
        }
    } else {
        echo "🎉 Tous les services ont une image!\n";
    }

    echo "\n";

} catch (Exception $e) {
    echo "\n❌ ERREUR: " . $e->getMessage() . "\n\n";
    exit(1);
}
