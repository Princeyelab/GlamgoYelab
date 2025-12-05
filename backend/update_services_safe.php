<?php

/**
 * Script sécurisé pour mettre à jour les services
 * Vérifie l'existence avant d'insérer et met à jour si nécessaire
 */

mb_internal_encoding('UTF-8');
mb_http_output('UTF-8');

echo "\n";
echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║  Mise à jour Sécurisée des Services - GlamGo              ║\n";
echo "║  5 Catégories Populaires + Services Complets              ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n";
echo "\n";

$host = getenv('DB_HOST') ?: 'glamgo-mysql';
$dbname = getenv('DB_NAME') ?: 'glamgo';
$username = getenv('DB_USER') ?: 'glamgo_user';
$password = getenv('DB_PASSWORD') ?: 'glamgo_password';

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

    $pdo->beginTransaction();

    // Fonction helper pour trouver ou créer une catégorie
    function findOrCreateCategory($pdo, $name, $slug, $description, $icon, $parentId, $displayOrder) {
        $stmt = $pdo->prepare("SELECT id FROM categories WHERE slug = ?");
        $stmt->execute([$slug]);
        $result = $stmt->fetch();

        if ($result) {
            echo "   ℹ️  Catégorie '$name' existe déjà (ID: {$result['id']})\n";
            return $result['id'];
        }

        $stmt = $pdo->prepare("
            INSERT INTO categories (name, slug, description, icon, parent_id, is_active, display_order)
            VALUES (?, ?, ?, ?, ?, TRUE, ?)
        ");
        $stmt->execute([$name, $slug, $description, $icon, $parentId, $displayOrder]);
        $id = $pdo->lastInsertId();
        echo "   ✅ Catégorie '$name' créée (ID: $id)\n";
        return $id;
    }

    // Fonction helper pour créer un service
    function createService($pdo, $categoryId, $name, $slug, $description, $price, $duration) {
        $stmt = $pdo->prepare("SELECT id FROM services WHERE slug = ?");
        $stmt->execute([$slug]);
        $result = $stmt->fetch();

        if ($result) {
            echo "      ⏭️  Service '$name' existe déjà\n";
            return false;
        }

        $stmt = $pdo->prepare("
            INSERT INTO services (category_id, name, slug, description, price, duration_minutes, is_active)
            VALUES (?, ?, ?, ?, ?, ?, TRUE)
        ");
        $stmt->execute([$categoryId, $name, $slug, $description, $price, $duration]);
        echo "      ✅ Service '$name' créé\n";
        return true;
    }

    echo "🏗️  Création/Vérification des catégories et services...\n\n";

    // ===== 1. MAISON =====
    echo "1️⃣  MAISON\n";
    $maisonId = findOrCreateCategory($pdo, 'Maison', 'maison', 'Services pour votre maison et habitat', 'home.svg', null, 1);

    $menageId = findOrCreateCategory($pdo, 'Ménage', 'menage', 'Services de nettoyage et entretien', 'clean.svg', $maisonId, 1);
    createService($pdo, $menageId, 'Ménage classique', 'menage-classique', 'Nettoyage standard de votre logement', 100.00, 60);
    createService($pdo, $menageId, 'Ménage approfondi', 'menage-approfondi', 'Nettoyage en profondeur avec détails', 175.00, 90);
    createService($pdo, $menageId, 'Nettoyage après événement', 'nettoyage-apres-evenement', 'Remise en état après fête ou réception', 650.00, 210);
    createService($pdo, $menageId, 'Nettoyage de printemps', 'nettoyage-printemps', 'Grand nettoyage annuel complet', 1000.00, 480);
    createService($pdo, $menageId, 'Nettoyage cuisine', 'nettoyage-cuisine', 'Nettoyage complet de la cuisine', 400.00, 120);
    createService($pdo, $menageId, 'Nettoyage salle de bain', 'nettoyage-salle-bain', 'Nettoyage et désinfection sanitaires', 275.00, 90);
    createService($pdo, $menageId, 'Service repassage', 'service-repassage', 'Repassage professionnel à domicile', 200.00, 60);

    $bricolageId = findOrCreateCategory($pdo, 'Bricolage', 'bricolage', 'Petits travaux et réparations', 'tools.svg', $maisonId, 2);
    createService($pdo, $bricolageId, 'Montage meuble', 'montage-meuble', 'Assemblage de meubles en kit', 200.00, 60);
    createService($pdo, $bricolageId, 'Changement d\'ampoule', 'changement-ampoule', 'Remplacement d\'ampoules difficiles d\'accès', 65.00, 15);
    createService($pdo, $bricolageId, 'Petits travaux plomberie', 'petits-travaux-plomberie', 'Réparations simples de plomberie', 300.00, 60);
    createService($pdo, $bricolageId, 'Perçage et fixation', 'percage-fixation', 'Installation d\'étagères, cadres, etc.', 115.00, 30);
    createService($pdo, $bricolageId, 'Petit déménagement', 'petit-demenagement', 'Déplacement d\'objets lourds ou encombrants', 600.00, 120);

    $jardinageId = findOrCreateCategory($pdo, 'Jardinage', 'jardinage', 'Entretien d\'espaces verts', 'garden.svg', $maisonId, 3);
    createService($pdo, $jardinageId, 'Entretien pelouse', 'entretien-pelouse', 'Tonte et entretien de gazon', 250.00, 60);
    createService($pdo, $jardinageId, 'Taille haies', 'taille-haies', 'Taille et formation de haies', 325.00, 90);
    createService($pdo, $jardinageId, 'Plantation fleurs', 'plantation-fleurs', 'Plantation et aménagement floral', 200.00, 60);

    $cuisineId = findOrCreateCategory($pdo, 'Cuisine', 'cuisine-domicile', 'Services de chef à domicile', 'chef.svg', $maisonId, 4);
    createService($pdo, $cuisineId, 'Préparation repas', 'preparation-repas', 'Chef prépare vos repas à domicile', 500.00, 120);
    createService($pdo, $cuisineId, 'Chef événementiel', 'chef-evenementiel', 'Service traiteur pour événements', 1500.00, 240);
    createService($pdo, $cuisineId, 'Coaching cuisine', 'coaching-cuisine', 'Cours de cuisine personnalisé', 400.00, 90);

    echo "\n";

    // ===== 2. BEAUTÉ =====
    echo "2️⃣  BEAUTÉ\n";
    $beauteId = findOrCreateCategory($pdo, 'Beauté', 'beaute', 'Services de beauté et bien-être', 'beauty.svg', null, 2);

    $coiffureHommeId = findOrCreateCategory($pdo, 'Coiffure Homme', 'coiffure-homme', 'Coupes et soins capillaires masculins', 'hair-man.svg', $beauteId, 1);
    createService($pdo, $coiffureHommeId, 'Coupe classique homme', 'coupe-classique-homme', 'Coupe de cheveux classique', 135.00, 30);
    createService($pdo, $coiffureHommeId, 'Coupe tendance homme', 'coupe-tendance-homme', 'Coupe moderne et stylée', 175.00, 40);
    createService($pdo, $coiffureHommeId, 'Taille de barbe classique', 'taille-barbe-classique', 'Entretien de barbe simple', 100.00, 20);
    createService($pdo, $coiffureHommeId, 'Barbe et contours', 'barbe-contours', 'Taille précise avec contours nets', 125.00, 30);
    createService($pdo, $coiffureHommeId, 'Rasage à l\'ancienne', 'rasage-ancienne', 'Rasage traditionnel au rasoir', 175.00, 30);
    createService($pdo, $coiffureHommeId, 'Soin barbe', 'soin-barbe', 'Soin complet pour barbe', 150.00, 30);
    createService($pdo, $coiffureHommeId, 'Combo coupe + barbe', 'combo-coupe-barbe', 'Coupe cheveux et entretien barbe', 260.00, 60);

    $coiffureFemmeId = findOrCreateCategory($pdo, 'Coiffure Femme', 'coiffure-femme', 'Coupes et soins capillaires féminins', 'hair-woman.svg', $beauteId, 2);
    createService($pdo, $coiffureFemmeId, 'Coupe cheveux courts', 'coupe-cheveux-courts', 'Coupe pour cheveux courts', 225.00, 45);
    createService($pdo, $coiffureFemmeId, 'Coupe cheveux longs', 'coupe-cheveux-longs', 'Coupe pour cheveux longs', 300.00, 60);
    createService($pdo, $coiffureFemmeId, 'Coloration cheveux courts', 'coloration-cheveux-courts', 'Coloration complète cheveux courts', 450.00, 75);
    createService($pdo, $coiffureFemmeId, 'Coloration cheveux longs', 'coloration-cheveux-longs', 'Coloration complète cheveux longs', 700.00, 105);

    $maquillageId = findOrCreateCategory($pdo, 'Maquillage', 'maquillage', 'Maquillage professionnel', 'makeup.svg', $beauteId, 3);
    createService($pdo, $maquillageId, 'Maquillage jour', 'maquillage-jour', 'Maquillage naturel et léger', 300.00, 45);
    createService($pdo, $maquillageId, 'Maquillage soirée', 'maquillage-soiree', 'Maquillage sophistiqué pour soirée', 500.00, 60);
    createService($pdo, $maquillageId, 'Maquillage mariage', 'maquillage-mariage', 'Maquillage mariée avec essai', 1000.00, 120);

    $manucureId = findOrCreateCategory($pdo, 'Manucure & Pédicure', 'manucure-pedicure', 'Soins des mains et des pieds', 'nails.svg', $beauteId, 4);
    createService($pdo, $manucureId, 'Manucure femme', 'manucure-femme', 'Soin des mains et ongles', 175.00, 45);
    createService($pdo, $manucureId, 'Manucure homme', 'manucure-homme', 'Soin des ongles masculin', 135.00, 30);
    createService($pdo, $manucureId, 'Pédicure spa', 'pedicure-spa', 'Soin des pieds avec relaxation', 300.00, 60);

    $epilationFemmeId = findOrCreateCategory($pdo, 'Épilation Femme', 'epilation-femme', 'Épilation féminine', 'wax-woman.svg', $beauteId, 5);
    createService($pdo, $epilationFemmeId, 'Jambes complètes femme', 'jambes-completes-femme', 'Épilation jambes entières', 225.00, 45);
    createService($pdo, $epilationFemmeId, 'Sourcils et visage', 'sourcils-visage', 'Épilation zone visage', 125.00, 20);

    $epilationHommeId = findOrCreateCategory($pdo, 'Épilation Homme', 'epilation-homme', 'Épilation masculine', 'wax-man.svg', $beauteId, 6);
    createService($pdo, $epilationHommeId, 'Torse ou dos', 'torse-dos-homme', 'Épilation torse ou dos', 300.00, 45);
    createService($pdo, $epilationHommeId, 'Bras complets', 'bras-complets-homme', 'Épilation des deux bras', 250.00, 40);

    echo "\n";

    // ===== 3. VOITURE =====
    echo "3️⃣  VOITURE\n";
    $voitureId = findOrCreateCategory($pdo, 'Voiture', 'voiture', 'Services pour votre véhicule', 'car.svg', null, 3);

    $mecaniqueId = findOrCreateCategory($pdo, 'Mécanique', 'mecanique-domicile', 'Réparations mécaniques à domicile', 'mechanic.svg', $voitureId, 1);
    createService($pdo, $mecaniqueId, 'Vidange huile', 'vidange-huile', 'Vidange complète avec filtre', 500.00, 60);
    createService($pdo, $mecaniqueId, 'Changement ampoule voiture', 'changement-ampoule-voiture', 'Remplacement d\'ampoule auto', 100.00, 20);
    createService($pdo, $mecaniqueId, 'Changement essuie-glace', 'changement-essuie-glace', 'Remplacement balais essuie-glace', 125.00, 20);
    createService($pdo, $mecaniqueId, 'Changement pneu', 'changement-pneu', 'Démontage et montage de pneu', 325.00, 45);

    $lavageId = findOrCreateCategory($pdo, 'Lavage', 'lavage-auto', 'Nettoyage intérieur et extérieur', 'car-wash.svg', $voitureId, 2);
    createService($pdo, $lavageId, 'Nettoyage extérieur seul', 'nettoyage-exterieur-seul', 'Lavage extérieur complet', 150.00, 45);
    createService($pdo, $lavageId, 'Nettoyage intérieur seul', 'nettoyage-interieur-seul', 'Nettoyage intérieur approfondi', 185.00, 60);
    createService($pdo, $lavageId, 'Combo intérieur + extérieur', 'combo-interieur-exterieur', 'Nettoyage complet du véhicule', 325.00, 90);

    echo "\n";

    // ===== 4. BIEN-ÊTRE =====
    echo "4️⃣  BIEN-ÊTRE\n";
    $bienEtreId = findOrCreateCategory($pdo, 'Bien-être', 'bien-etre', 'Services de bien-être et relaxation', 'wellness.svg', null, 4);

    $massageId = findOrCreateCategory($pdo, 'Massage', 'massage', 'Massages relaxants et thérapeutiques', 'massage.svg', $bienEtreId, 1);
    createService($pdo, $massageId, 'Massage tonique', 'massage-tonique', 'Massage énergisant et stimulant', 400.00, 60);
    createService($pdo, $massageId, 'Massage sportif', 'massage-sportif', 'Massage pour récupération sportive', 450.00, 60);
    createService($pdo, $massageId, 'Massage thaïlandais', 'massage-thailandais', 'Massage traditionnel thaï', 600.00, 75);
    createService($pdo, $massageId, 'Massage marocain traditionnel', 'massage-marocain', 'Massage aux huiles orientales', 700.00, 90);

    $coachingId = findOrCreateCategory($pdo, 'Coaching', 'coaching', 'Coaching sportif et bien-être', 'coach.svg', $bienEtreId, 2);
    createService($pdo, $coachingId, 'Yoga', 'yoga', 'Séance de yoga à domicile', 250.00, 60);
    createService($pdo, $coachingId, 'Pilates', 'pilates', 'Séance de pilates personnalisée', 300.00, 60);
    createService($pdo, $coachingId, 'Étirements guidés', 'etirements-guides', 'Séance d\'étirements et souplesse', 250.00, 45);
    createService($pdo, $coachingId, 'Musculation personnalisée', 'musculation-personnalisee', 'Entraînement musculation sur mesure', 400.00, 60);
    createService($pdo, $coachingId, 'Méditation et respiration', 'meditation-respiration', 'Séance de méditation guidée', 250.00, 45);
    createService($pdo, $coachingId, 'Coaching nutrition', 'coaching-nutrition', 'Consultation nutritionnelle', 400.00, 60);

    echo "\n";

    // ===== 5. ANIMAUX =====
    echo "5️⃣  ANIMAUX\n";
    $animauxId = findOrCreateCategory($pdo, 'Animaux', 'animaux', 'Services pour vos animaux de compagnie', 'pet.svg', null, 5);

    $soinsAnimauxId = findOrCreateCategory($pdo, 'Soins Animaux', 'soins-animaux', 'Toilettage et soins pour animaux', 'pet-grooming.svg', $animauxId, 1);
    createService($pdo, $soinsAnimauxId, 'Toilettage chien', 'toilettage-chien', 'Toilettage complet pour chien', 325.00, 60);
    createService($pdo, $soinsAnimauxId, 'Promenade chien', 'promenade-chien', 'Balade quotidienne pour votre chien', 115.00, 30);
    createService($pdo, $soinsAnimauxId, 'Gardiennage à domicile', 'gardiennage-domicile', 'Garde d\'animaux par jour', 200.00, 1440);
    createService($pdo, $soinsAnimauxId, 'Gardiennage longue durée', 'gardiennage-longue-duree', 'Garde d\'animaux par semaine', 1250.00, 10080);
    createService($pdo, $soinsAnimauxId, 'Nourrissage animaux', 'nourrissage-animaux', 'Visite pour nourrir vos animaux', 65.00, 15);
    createService($pdo, $soinsAnimauxId, 'Transport animaux', 'transport-animaux', 'Transport sécurisé pour animaux', 200.00, 60);
    createService($pdo, $soinsAnimauxId, 'Nettoyage espace animal', 'nettoyage-espace-animal', 'Nettoyage de niche, litière, etc.', 150.00, 30);

    $pdo->commit();

    echo "\n╔════════════════════════════════════════════════════════════╗\n";
    echo "║  ✅ MISE À JOUR TERMINÉE AVEC SUCCÈS!                     ║\n";
    echo "╚════════════════════════════════════════════════════════════╝\n\n";

    // Statistiques finales
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM categories WHERE parent_id IS NULL");
    $mainCats = $stmt->fetch()['count'];

    $stmt = $pdo->query("SELECT COUNT(*) as count FROM categories WHERE parent_id IS NOT NULL");
    $subCats = $stmt->fetch()['count'];

    $stmt = $pdo->query("SELECT COUNT(*) as count FROM services");
    $totalServices = $stmt->fetch()['count'];

    echo "📊 STATISTIQUES FINALES :\n";
    echo "   - Catégories principales : $mainCats\n";
    echo "   - Sous-catégories : $subCats\n";
    echo "   - Services totaux : $totalServices\n";
    echo "\n";

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "\n❌ ERREUR: " . $e->getMessage() . "\n\n";
    exit(1);
}
