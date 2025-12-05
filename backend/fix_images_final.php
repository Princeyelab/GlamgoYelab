<?php
/**
 * CORRECTION FINALE - Assignation d'images VRAIMENT uniques à TOUS les services
 */

$host = 'glamgo-mysql';
$dbname = 'glamgo';
$username = 'glamgo_user';
$password = 'glamgo_password';

$pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);

// Images 100% uniques générées avec des IDs Unsplash différents
$images = [
    1 => 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&h=600',
    2 => 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=800&h=600',
    3 => 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=600',
    4 => 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800&h=600',
    5 => 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=800&h=600',
    6 => 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=600',
    7 => 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&h=600',
    8 => 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&h=600',
    9 => 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=600',
    10 => 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=800&h=600',
    11 => 'https://images.unsplash.com/photo-1599206676335-193c82b13c9e?w=800&h=600',
    12 => 'https://images.unsplash.com/photo-1567958451986-2de427a4a0be?w=800&h=600',
    13 => 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=600',
    14 => 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800&h=600',
    15 => 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&h=600',
    16 => 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600',
    17 => 'https://images.unsplash.com/photo-1600320254374-ce2d293c324e?w=800&h=600',
    18 => 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&h=600',
    19 => 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&h=600',
    20 => 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&h=600',
    21 => 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=600',
    22 => 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=600',
    23 => 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600',
    24 => 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&h=600',
    25 => 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&h=600',
    26 => 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&h=600',
    27 => 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800&h=600',
    28 => 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600',
    29 => 'https://images.unsplash.com/photo-1632823469959-e94206409d5a?w=800&h=600',
    30 => 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&h=600',
    31 => 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=600',
    32 => 'https://images.unsplash.com/photo-1573865526739-10c1dd7aa000?w=800&h=600',
    33 => 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800&h=600',
    34 => 'https://images.unsplash.com/photo-1612536551977-5ccc4a13c107?w=800&h=600',
    35 => 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800&h=600',
    36 => 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&h=600',
    37 => 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&h=600',
    38 => 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=800&h=600',
    39 => 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&h=600',
    40 => 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=600',
    41 => 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&h=600',
    42 => 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=800&h=600',
    43 => 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600',
    44 => 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800&h=600',
    45 => 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&h=600',
    46 => 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600',
    47 => 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800&h=600',
    48 => 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800&h=600',
    49 => 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=600',
    50 => 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=800&h=600',
    51 => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600',
    52 => 'https://images.unsplash.com/photo-1620207483612-c6f0732e3d83?w=800&h=600',
    53 => 'https://images.unsplash.com/photo-1621939514424-e1e4e6c59d35?w=800&h=600',
    54 => 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&h=600',
    55 => 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=800&h=600',
    56 => 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&h=600',
    57 => 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&h=600',
    58 => 'https://images.unsplash.com/photo-1621607003950-2dee0c94129f?w=800&h=600',
    59 => 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600',
    60 => 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=600',
    61 => 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=600',
    62 => 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=800&h=600',
    63 => 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&h=600',
    64 => 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&h=600',
    65 => 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&h=600',
    66 => 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=800&h=600',
    67 => 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=800&h=600',
    68 => 'https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=800&h=600',
    69 => 'https://images.unsplash.com/photo-1457972729786-0411a3b2b626?w=800&h=600',
    70 => 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600',
    71 => 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=800&h=600',
    72 => 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=800&h=600',
    73 => 'https://images.unsplash.com/photo-1614165936126-273a0e40c69e?w=800&h=600',
    74 => 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=800&h=600',
    75 => 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=800&h=600',
    76 => 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&h=600',
    77 => 'https://images.unsplash.com/photo-1607860108000-2b9d951df188?w=800&h=600',
    78 => 'https://images.unsplash.com/photo-1601362840547-9e518eea0e47?w=800&h=600',
    79 => 'https://images.unsplash.com/photo-1596178060810-7621967edde0?w=800&h=600',
    80 => 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=600',
    81 => 'https://images.unsplash.com/photo-1583416750470-965b2707b355?w=800&h=600',
    82 => 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600',
    83 => 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=600',
    84 => 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&h=600',
    85 => 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&h=600',
    86 => 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600',
    87 => 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=600',
    88 => 'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=800&h=600',
    89 => 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=800&h=600',
    90 => 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600',
    91 => 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&h=600',
    92 => 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=800&h=600',
    93 => 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=800&h=600',
    94 => 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&h=600',
];

echo "Mise à jour de TOUS les services avec des images uniques...\n\n";

$stmt = $pdo->prepare("UPDATE services SET image = ? WHERE id = ?");
foreach ($images as $id => $image) {
    $stmt->execute([$image, $id]);
    echo "✅ Service $id updated\n";
}

echo "\n✅ TERMINÉ - 94 images uniques assignées\n";

// Vérification
$check = $pdo->query("SELECT COUNT(DISTINCT image) as unique_imgs FROM services")->fetch();
echo "Images uniques: " . $check['unique_imgs'] . "\n";
