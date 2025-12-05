<?php
/**
 * Page d'administration des frais kilométriques
 *
 * Permet de configurer :
 * - Les paramètres par défaut par ville
 * - Le rayon d'intervention par défaut
 * - Le prix par km par défaut
 * - Les exceptions pour certains prestataires
 */

require_once __DIR__ . '/../../config/config.php';

// Connexion DB directe (comme transactions.php)
$config = require __DIR__ . '/../../config/config.php';
$db_config = $config['database'];

try {
    $db = new PDO(
        "mysql:host={$db_config['host']};dbname={$db_config['name']};charset={$db_config['charset']}",
        $db_config['user'],
        $db_config['password']
    );
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Erreur connexion DB: " . $e->getMessage());
}

$message = '';
$error = '';

// Traitement des formulaires
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $action = $_POST['action'] ?? '';

        switch ($action) {
            case 'update_city':
                $cityId = (int) $_POST['city_id'];
                $defaultRadius = (int) $_POST['default_radius_km'];
                $defaultPrice = (float) $_POST['default_price_per_km'];
                $maxRadius = (int) $_POST['max_radius_km'];
                $isActive = isset($_POST['is_active']) ? 1 : 0;

                $stmt = $db->prepare("
                    UPDATE city_distance_configs
                    SET default_radius_km = ?,
                        default_price_per_km = ?,
                        max_radius_km = ?,
                        is_active = ?,
                        updated_at = NOW()
                    WHERE id = ?
                ");
                $stmt->execute([$defaultRadius, $defaultPrice, $maxRadius, $isActive, $cityId]);
                $message = "Configuration mise à jour avec succès";
                break;

            case 'add_city':
                $cityName = trim($_POST['city_name']);
                $defaultRadius = (int) $_POST['default_radius_km'];
                $defaultPrice = (float) $_POST['default_price_per_km'];
                $maxRadius = (int) $_POST['max_radius_km'];

                $stmt = $db->prepare("
                    INSERT INTO city_distance_configs (city_name, default_radius_km, default_price_per_km, max_radius_km)
                    VALUES (?, ?, ?, ?)
                ");
                $stmt->execute([$cityName, $defaultRadius, $defaultPrice, $maxRadius]);
                $message = "Nouvelle ville ajoutée avec succès";
                break;

            case 'update_provider':
                $providerId = (int) $_POST['provider_id'];
                $interventionRadius = (int) $_POST['intervention_radius_km'];
                $pricePerKm = (float) $_POST['price_per_extra_km'];

                $stmt = $db->prepare("
                    UPDATE providers
                    SET intervention_radius_km = ?,
                        price_per_extra_km = ?
                    WHERE id = ?
                ");
                $stmt->execute([$interventionRadius, $pricePerKm, $providerId]);
                $message = "Prestataire mis à jour avec succès";
                break;

            case 'bulk_update':
                $defaultRadius = (int) $_POST['bulk_radius'];
                $defaultPrice = (float) $_POST['bulk_price'];

                $stmt = $db->prepare("
                    UPDATE providers
                    SET intervention_radius_km = COALESCE(intervention_radius_km, ?),
                        price_per_extra_km = COALESCE(price_per_extra_km, ?)
                    WHERE intervention_radius_km IS NULL OR price_per_extra_km IS NULL
                ");
                $stmt->execute([$defaultRadius, $defaultPrice]);
                $affected = $stmt->rowCount();
                $message = "$affected prestataires mis à jour avec les valeurs par défaut";
                break;
        }
    } catch (Exception $e) {
        $error = "Erreur: " . $e->getMessage();
    }
}

// Récupérer les configurations par ville
$stmt = $db->query("SELECT * FROM city_distance_configs ORDER BY city_name");
$cityConfigs = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Récupérer les prestataires avec leurs configurations de distance
$stmt = $db->query("
    SELECT p.id, p.first_name, p.last_name, p.email,
           p.intervention_radius_km, p.price_per_extra_km,
           p.is_available, p.is_verified,
           (SELECT COUNT(*) FROM orders WHERE provider_id = p.id) as total_orders
    FROM providers p
    ORDER BY p.first_name, p.last_name
");
$providers = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Statistiques
$stmt = $db->query("
    SELECT
        COUNT(*) as total_orders,
        SUM(distance_fee) as total_distance_fees,
        AVG(distance_km) as avg_distance,
        COUNT(CASE WHEN distance_fee > 0 THEN 1 END) as orders_with_fees
    FROM orders
    WHERE distance_km IS NOT NULL
");
$stats = $stmt->fetch(PDO::FETCH_ASSOC);

?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestion des frais kilométriques - GlamGo Admin</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            padding: 20px;
            line-height: 1.5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            color: #e91e63;
            margin-bottom: 20px;
            font-size: 24px;
        }
        h2 {
            color: #333;
            margin: 30px 0 15px;
            font-size: 18px;
            border-bottom: 2px solid #e91e63;
            padding-bottom: 8px;
        }
        .message {
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            text-align: center;
        }
        .stat-value {
            font-size: 28px;
            font-weight: bold;
            color: #e91e63;
        }
        .stat-label {
            font-size: 13px;
            color: #666;
            margin-top: 5px;
        }
        .card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        th {
            background: #f9f9f9;
            font-weight: 600;
            color: #333;
        }
        tr:hover {
            background: #fafafa;
        }
        input[type="text"],
        input[type="number"] {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
        }
        input[type="number"] {
            width: 80px;
        }
        button {
            background: #e91e63;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s;
        }
        button:hover {
            background: #c2185b;
        }
        button.secondary {
            background: #6c757d;
        }
        button.secondary:hover {
            background: #545b62;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
        }
        .badge.active {
            background: #d4edda;
            color: #155724;
        }
        .badge.inactive {
            background: #f8d7da;
            color: #721c24;
        }
        .badge.verified {
            background: #cce5ff;
            color: #004085;
        }
        .form-inline {
            display: flex;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;
        }
        .form-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        .form-group label {
            font-size: 12px;
            color: #666;
            font-weight: 500;
        }
        .bulk-form {
            background: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .bulk-form h3 {
            color: #856404;
            font-size: 14px;
            margin-bottom: 10px;
        }
        .actions {
            display: flex;
            gap: 8px;
        }
        .help-text {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚗 Gestion des frais kilométriques</h1>

        <?php if ($message): ?>
            <div class="message success"><?= htmlspecialchars($message) ?></div>
        <?php endif; ?>

        <?php if ($error): ?>
            <div class="message error"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>

        <!-- Statistiques -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value"><?= number_format($stats['total_orders'] ?? 0) ?></div>
                <div class="stat-label">Commandes avec distance</div>
            </div>
            <div class="stat-card">
                <div class="stat-value"><?= number_format($stats['total_distance_fees'] ?? 0, 2) ?> MAD</div>
                <div class="stat-label">Total frais kilométriques</div>
            </div>
            <div class="stat-card">
                <div class="stat-value"><?= number_format($stats['avg_distance'] ?? 0, 1) ?> km</div>
                <div class="stat-label">Distance moyenne</div>
            </div>
            <div class="stat-card">
                <div class="stat-value"><?= number_format($stats['orders_with_fees'] ?? 0) ?></div>
                <div class="stat-label">Commandes avec frais</div>
            </div>
        </div>

        <!-- Configuration par ville -->
        <h2>📍 Configuration par ville</h2>
        <div class="card">
            <table>
                <thead>
                    <tr>
                        <th>Ville</th>
                        <th>Rayon par défaut</th>
                        <th>Prix/km</th>
                        <th>Rayon max</th>
                        <th>Statut</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($cityConfigs as $config): ?>
                    <tr>
                        <form method="POST">
                            <input type="hidden" name="action" value="update_city">
                            <input type="hidden" name="city_id" value="<?= $config['id'] ?>">
                            <td><strong><?= ucfirst(htmlspecialchars($config['city_name'])) ?></strong></td>
                            <td><input type="number" name="default_radius_km" value="<?= $config['default_radius_km'] ?>" min="1" max="100"> km</td>
                            <td><input type="number" name="default_price_per_km" value="<?= $config['default_price_per_km'] ?>" min="0" max="50" step="0.5"> MAD</td>
                            <td><input type="number" name="max_radius_km" value="<?= $config['max_radius_km'] ?>" min="10" max="200"> km</td>
                            <td>
                                <label>
                                    <input type="checkbox" name="is_active" <?= $config['is_active'] ? 'checked' : '' ?>>
                                    <span class="badge <?= $config['is_active'] ? 'active' : 'inactive' ?>">
                                        <?= $config['is_active'] ? 'Actif' : 'Inactif' ?>
                                    </span>
                                </label>
                            </td>
                            <td><button type="submit">Enregistrer</button></td>
                        </form>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>

            <!-- Ajouter une ville -->
            <form method="POST" style="margin-top: 20px;">
                <input type="hidden" name="action" value="add_city">
                <div class="form-inline">
                    <div class="form-group">
                        <label>Nouvelle ville</label>
                        <input type="text" name="city_name" placeholder="Nom de la ville" required>
                    </div>
                    <div class="form-group">
                        <label>Rayon (km)</label>
                        <input type="number" name="default_radius_km" value="10" min="1" max="100">
                    </div>
                    <div class="form-group">
                        <label>Prix/km (MAD)</label>
                        <input type="number" name="default_price_per_km" value="5" min="0" max="50" step="0.5">
                    </div>
                    <div class="form-group">
                        <label>Max (km)</label>
                        <input type="number" name="max_radius_km" value="50" min="10" max="200">
                    </div>
                    <div class="form-group">
                        <label>&nbsp;</label>
                        <button type="submit" class="secondary">+ Ajouter</button>
                    </div>
                </div>
            </form>
        </div>

        <!-- Configuration des prestataires -->
        <h2>👤 Configuration des prestataires</h2>

        <!-- Mise à jour en masse -->
        <div class="bulk-form">
            <h3>⚡ Mise à jour en masse des prestataires sans configuration</h3>
            <form method="POST">
                <input type="hidden" name="action" value="bulk_update">
                <div class="form-inline">
                    <div class="form-group">
                        <label>Rayon par défaut</label>
                        <input type="number" name="bulk_radius" value="10" min="1" max="100"> km
                    </div>
                    <div class="form-group">
                        <label>Prix par km</label>
                        <input type="number" name="bulk_price" value="5" min="0" max="50" step="0.5"> MAD
                    </div>
                    <div class="form-group">
                        <label>&nbsp;</label>
                        <button type="submit">Appliquer aux prestataires sans config</button>
                    </div>
                </div>
                <p class="help-text">Cette action mettra à jour uniquement les prestataires qui n'ont pas encore de configuration de frais kilométriques.</p>
            </form>
        </div>

        <div class="card">
            <table>
                <thead>
                    <tr>
                        <th>Prestataire</th>
                        <th>Email</th>
                        <th>Rayon</th>
                        <th>Prix/km</th>
                        <th>Statut</th>
                        <th>Commandes</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($providers as $provider): ?>
                    <tr>
                        <form method="POST">
                            <input type="hidden" name="action" value="update_provider">
                            <input type="hidden" name="provider_id" value="<?= $provider['id'] ?>">
                            <td>
                                <strong><?= htmlspecialchars($provider['first_name'] . ' ' . $provider['last_name']) ?></strong>
                                <?php if ($provider['is_verified']): ?>
                                    <span class="badge verified">Vérifié</span>
                                <?php endif; ?>
                            </td>
                            <td><?= htmlspecialchars($provider['email']) ?></td>
                            <td>
                                <input type="number" name="intervention_radius_km"
                                       value="<?= $provider['intervention_radius_km'] ?? 10 ?>"
                                       min="1" max="100"> km
                            </td>
                            <td>
                                <input type="number" name="price_per_extra_km"
                                       value="<?= $provider['price_per_extra_km'] ?? 5 ?>"
                                       min="0" max="50" step="0.5"> MAD
                            </td>
                            <td>
                                <span class="badge <?= $provider['is_available'] ? 'active' : 'inactive' ?>">
                                    <?= $provider['is_available'] ? 'Disponible' : 'Indisponible' ?>
                                </span>
                            </td>
                            <td><?= $provider['total_orders'] ?></td>
                            <td><button type="submit">Enregistrer</button></td>
                        </form>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>

        <!-- Documentation -->
        <h2>📚 Documentation</h2>
        <div class="card">
            <h3 style="margin-bottom: 10px;">Comment fonctionnent les frais kilométriques ?</h3>
            <ol style="margin-left: 20px;">
                <li><strong>Rayon d'intervention gratuit :</strong> Chaque prestataire a un rayon (en km) dans lequel il intervient sans frais supplémentaires.</li>
                <li><strong>Distance client :</strong> La distance entre le prestataire et le client est calculée automatiquement via GPS.</li>
                <li><strong>Calcul des frais :</strong> Si le client est au-delà du rayon, les frais sont :
                    <code>(Distance - Rayon) × Prix/km</code></li>
                <li><strong>Arrondi :</strong> La distance excédentaire est arrondie au kilomètre supérieur.</li>
            </ol>

            <h3 style="margin: 20px 0 10px;">Exemple de calcul</h3>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; font-family: monospace;">
                Rayon prestataire : 10 km<br>
                Distance client : 15.3 km<br>
                Prix par km : 5 MAD<br>
                <br>
                Distance excédentaire : 15.3 - 10 = 5.3 km → arrondi à 6 km<br>
                <strong>Frais de déplacement : 6 × 5 = 30 MAD</strong>
            </div>
        </div>
    </div>
</body>
</html>
