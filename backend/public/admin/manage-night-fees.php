<?php
/**
 * Page d'administration - Gestion des tarifs de nuit
 *
 * Permet aux administrateurs de :
 * - Consulter les tarifs actuels de nuit
 * - Modifier les tarifs (1 nuit, 2+ nuits)
 * - Voir l'historique des modifications
 *
 * URL: /admin/manage-night-fees.php
 */

require_once __DIR__ . '/../../app/core/Database.php';
require_once __DIR__ . '/../../app/helpers/NightFeeCalculator.php';

use App\Core\Database;
use App\Helpers\NightFeeCalculator;

// Traitement du formulaire
$message = null;
$messageType = 'info';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $singleFee = filter_input(INPUT_POST, 'night_single', FILTER_VALIDATE_FLOAT);
    $doubleFee = filter_input(INPUT_POST, 'night_double', FILTER_VALIDATE_FLOAT);

    if ($singleFee !== false && $doubleFee !== false) {
        if ($singleFee < 0 || $doubleFee < 0) {
            $message = 'Les tarifs ne peuvent pas être négatifs.';
            $messageType = 'error';
        } elseif ($doubleFee < $singleFee) {
            $message = 'Le tarif 2 nuits doit être supérieur ou égal au tarif 1 nuit.';
            $messageType = 'error';
        } else {
            $result = NightFeeCalculator::updateRates($singleFee, $doubleFee, null);
            if ($result['success']) {
                $message = 'Tarifs mis à jour avec succès !';
                $messageType = 'success';
            } else {
                $message = 'Erreur: ' . ($result['error'] ?? 'Inconnue');
                $messageType = 'error';
            }
        }
    } else {
        $message = 'Veuillez entrer des valeurs valides.';
        $messageType = 'error';
    }
}

// Récupérer la configuration actuelle
$config = NightFeeCalculator::getConfiguration();
$rates = $config['rates'];

// Récupérer l'historique
$history = [];
try {
    $db = Database::getInstance();
    $stmt = $db->prepare("
        SELECT prh.*, pr.rule_type
        FROM pricing_rules_history prh
        LEFT JOIN pricing_rules pr ON prh.pricing_rule_id = pr.id
        ORDER BY prh.changed_at DESC
        LIMIT 20
    ");
    $stmt->execute();
    $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Exception $e) {
    // Ignorer si table n'existe pas encore
}

?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestion tarifs de nuit - GlamGo Admin</title>
    <style>
        :root {
            --primary: #D4A574;
            --primary-dark: #c49a6c;
            --dark: #1a1a2e;
            --dark-light: #16213e;
            --gold: #ffd700;
            --danger: #e94560;
            --success: #22c55e;
            --gray: #6b7280;
            --gray-light: #f3f4f6;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            min-height: 100vh;
            padding: 2rem;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
        }

        h1 {
            color: var(--dark);
            font-size: 1.75rem;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .subtitle {
            color: var(--gray);
            margin-bottom: 2rem;
        }

        .card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            margin-bottom: 1.5rem;
            overflow: hidden;
        }

        .card-header {
            padding: 1rem 1.5rem;
            background: linear-gradient(135deg, var(--dark) 0%, var(--dark-light) 100%);
            color: white;
        }

        .card-header h2 {
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .card-body {
            padding: 1.5rem;
        }

        .message {
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .message.success {
            background: #d1fae5;
            color: #065f46;
            border: 1px solid #10b981;
        }

        .message.error {
            background: #fee2e2;
            color: #991b1b;
            border: 1px solid #ef4444;
        }

        .message.info {
            background: #dbeafe;
            color: #1e40af;
            border: 1px solid #3b82f6;
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        label {
            display: block;
            font-weight: 500;
            color: var(--dark);
            margin-bottom: 0.5rem;
        }

        .label-description {
            font-size: 0.85rem;
            color: var(--gray);
            font-weight: normal;
            display: block;
            margin-top: 0.25rem;
        }

        input[type="number"] {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.2s;
        }

        input[type="number"]:focus {
            outline: none;
            border-color: var(--primary);
        }

        .input-group {
            position: relative;
        }

        .input-suffix {
            position: absolute;
            right: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--gray);
            font-weight: 500;
        }

        .input-group input {
            padding-right: 4rem;
        }

        .btn {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn-primary {
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(212, 165, 116, 0.4);
        }

        .current-rates {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .rate-box {
            background: linear-gradient(135deg, var(--dark) 0%, var(--dark-light) 100%);
            border-radius: 10px;
            padding: 1rem;
            text-align: center;
            color: white;
        }

        .rate-box.double {
            border: 2px solid var(--gold);
        }

        .rate-label {
            font-size: 0.85rem;
            opacity: 0.8;
            margin-bottom: 0.5rem;
        }

        .rate-value {
            font-size: 1.75rem;
            font-weight: 700;
            color: var(--gold);
        }

        .rate-value small {
            font-size: 0.875rem;
            font-weight: normal;
        }

        .history-table {
            width: 100%;
            border-collapse: collapse;
        }

        .history-table th,
        .history-table td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }

        .history-table th {
            background: var(--gray-light);
            font-weight: 600;
            color: var(--dark);
        }

        .history-table tr:hover {
            background: #f9fafb;
        }

        .badge {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 500;
        }

        .badge-single {
            background: #dbeafe;
            color: #1e40af;
        }

        .badge-double {
            background: #fef3c7;
            color: #92400e;
        }

        .change-arrow {
            color: var(--gray);
        }

        .night-hours-info {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1rem;
            background: rgba(26, 26, 46, 0.05);
            border-radius: 8px;
            font-size: 0.9rem;
            color: var(--dark);
            margin-bottom: 1.5rem;
        }

        .empty-state {
            text-align: center;
            padding: 2rem;
            color: var(--gray);
        }

        @media (max-width: 640px) {
            body {
                padding: 1rem;
            }

            .current-rates {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌙 Gestion des tarifs de nuit</h1>
        <p class="subtitle">Configuration des commissions pour interventions nocturnes</p>

        <?php if ($message): ?>
        <div class="message <?= $messageType ?>">
            <?php if ($messageType === 'success'): ?>✅
            <?php elseif ($messageType === 'error'): ?>❌
            <?php else: ?>ℹ️
            <?php endif; ?>
            <?= htmlspecialchars($message) ?>
        </div>
        <?php endif; ?>

        <!-- Tarifs actuels -->
        <div class="card">
            <div class="card-header">
                <h2>📊 Tarifs actuels</h2>
            </div>
            <div class="card-body">
                <div class="night-hours-info">
                    <span>🕐</span>
                    <span>Horaires de nuit : <strong>22h00 - 06h00</strong></span>
                </div>

                <div class="current-rates">
                    <div class="rate-box">
                        <div class="rate-label">1 nuit</div>
                        <div class="rate-value">
                            <?= number_format($rates['single'], 2) ?> <small>MAD</small>
                        </div>
                    </div>
                    <div class="rate-box double">
                        <div class="rate-label">2+ nuits consécutives</div>
                        <div class="rate-value">
                            <?= number_format($rates['double'], 2) ?> <small>MAD</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Formulaire de modification -->
        <div class="card">
            <div class="card-header">
                <h2>✏️ Modifier les tarifs</h2>
            </div>
            <div class="card-body">
                <form method="POST">
                    <div class="form-group">
                        <label for="night_single">
                            Tarif 1 nuit
                            <span class="label-description">Appliqué pour une intervention touchant une seule période nocturne</span>
                        </label>
                        <div class="input-group">
                            <input
                                type="number"
                                id="night_single"
                                name="night_single"
                                value="<?= $rates['single'] ?>"
                                min="0"
                                step="0.01"
                                required
                            >
                            <span class="input-suffix">MAD</span>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="night_double">
                            Tarif 2+ nuits consécutives
                            <span class="label-description">Appliqué pour une intervention traversant plusieurs nuits</span>
                        </label>
                        <div class="input-group">
                            <input
                                type="number"
                                id="night_double"
                                name="night_double"
                                value="<?= $rates['double'] ?>"
                                min="0"
                                step="0.01"
                                required
                            >
                            <span class="input-suffix">MAD</span>
                        </div>
                    </div>

                    <button type="submit" class="btn btn-primary">
                        💾 Enregistrer les modifications
                    </button>
                </form>
            </div>
        </div>

        <!-- Historique -->
        <div class="card">
            <div class="card-header">
                <h2>📜 Historique des modifications</h2>
            </div>
            <div class="card-body">
                <?php if (empty($history)): ?>
                <div class="empty-state">
                    <p>Aucune modification enregistrée</p>
                </div>
                <?php else: ?>
                <table class="history-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Modification</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($history as $entry): ?>
                        <tr>
                            <td><?= date('d/m/Y H:i', strtotime($entry['changed_at'])) ?></td>
                            <td>
                                <span class="badge <?= $entry['rule_type'] === 'night_single' ? 'badge-single' : 'badge-double' ?>">
                                    <?= $entry['rule_type'] === 'night_single' ? '1 nuit' : '2+ nuits' ?>
                                </span>
                            </td>
                            <td>
                                <?= number_format($entry['old_fee_amount'], 2) ?> MAD
                                <span class="change-arrow">→</span>
                                <?= number_format($entry['new_fee_amount'], 2) ?> MAD
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
                <?php endif; ?>
            </div>
        </div>

        <!-- Documentation -->
        <div class="card">
            <div class="card-header">
                <h2>📖 Documentation</h2>
            </div>
            <div class="card-body">
                <h3 style="margin-bottom: 0.5rem;">Règles de calcul</h3>
                <ul style="color: var(--gray); line-height: 1.8; margin-left: 1.5rem;">
                    <li>Intervention <strong>23h → 01h</strong> (2h) = 1 nuit = <?= number_format($rates['single'], 0) ?> MAD</li>
                    <li>Intervention <strong>23h → 08h</strong> lendemain (9h) = 1 nuit = <?= number_format($rates['single'], 0) ?> MAD</li>
                    <li>Intervention <strong>22h J1 → 07h J3</strong> (33h) = 2 nuits = <?= number_format($rates['double'], 0) ?> MAD</li>
                    <li>Intervention <strong>14h → 16h</strong> (2h) = journée = 0 MAD</li>
                    <li>Intervention <strong>05h → 07h</strong> (2h) = fin de nuit = <?= number_format($rates['single'], 0) ?> MAD</li>
                </ul>
            </div>
        </div>
    </div>
</body>
</html>
