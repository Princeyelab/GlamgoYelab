<?php
/**
 * Test des frais de nuit - NightFeeCalculator
 *
 * Script de test pour vérifier le bon fonctionnement du calcul
 * des commissions nocturnes.
 *
 * URL: /test_night_fees.php
 */

require_once __DIR__ . '/../app/core/Database.php';
require_once __DIR__ . '/../app/helpers/NightFeeCalculator.php';

use App\Helpers\NightFeeCalculator;

header('Content-Type: text/html; charset=utf-8');

?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Frais de Nuit - GlamGo</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            padding: 2rem;
            color: #e8e8e8;
        }
        .container { max-width: 1000px; margin: 0 auto; }
        h1 {
            font-size: 2rem;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .subtitle { color: #94a3b8; margin-bottom: 2rem; }

        .section {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        }
        .section h2 {
            font-size: 1.25rem;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .test-case {
            background: rgba(0,0,0,0.2);
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
        }
        .test-case h3 {
            font-size: 1rem;
            color: #ffd700;
            margin-bottom: 0.5rem;
        }
        .test-input {
            color: #94a3b8;
            font-size: 0.9rem;
            margin-bottom: 0.5rem;
        }
        .test-result {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 0.75rem;
            margin-top: 0.75rem;
        }
        .result-item {
            background: rgba(255,255,255,0.05);
            padding: 0.5rem;
            border-radius: 6px;
        }
        .result-label {
            font-size: 0.75rem;
            color: #94a3b8;
            margin-bottom: 0.25rem;
        }
        .result-value {
            font-weight: 600;
            font-size: 1.1rem;
        }
        .result-value.none { color: #22c55e; }
        .result-value.single { color: #fbbf24; }
        .result-value.double { color: #ef4444; }

        .success { color: #22c55e; }
        .warning { color: #fbbf24; }
        .error { color: #ef4444; }

        .config-box {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
        }
        .config-item {
            background: linear-gradient(135deg, #0f3460 0%, #16213e 100%);
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
        }
        .config-label {
            font-size: 0.85rem;
            color: #94a3b8;
            margin-bottom: 0.5rem;
        }
        .config-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #ffd700;
        }

        .api-test {
            margin-top: 1rem;
            padding: 1rem;
            background: rgba(0,0,0,0.3);
            border-radius: 8px;
        }
        .api-test h4 {
            font-size: 0.9rem;
            color: #94a3b8;
            margin-bottom: 0.5rem;
        }
        .api-url {
            font-family: monospace;
            background: rgba(0,0,0,0.3);
            padding: 0.5rem;
            border-radius: 4px;
            font-size: 0.85rem;
            color: #60a5fa;
            word-break: break-all;
        }
        pre {
            background: rgba(0,0,0,0.3);
            padding: 1rem;
            border-radius: 8px;
            overflow-x: auto;
            font-size: 0.85rem;
            margin-top: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌙 Test Frais de Nuit</h1>
        <p class="subtitle">Vérification du NightFeeCalculator - GlamGo</p>

        <!-- Configuration actuelle -->
        <div class="section">
            <h2>⚙️ Configuration actuelle</h2>
            <?php
            $config = NightFeeCalculator::getConfiguration();
            $rates = $config['rates'];
            ?>
            <div class="config-box">
                <div class="config-item">
                    <div class="config-label">Tarif 1 nuit</div>
                    <div class="config-value"><?= number_format($rates['single'], 2) ?> MAD</div>
                </div>
                <div class="config-item">
                    <div class="config-label">Tarif 2+ nuits</div>
                    <div class="config-value"><?= number_format($rates['double'], 2) ?> MAD</div>
                </div>
            </div>
            <p style="margin-top: 1rem; color: #94a3b8; font-size: 0.9rem;">
                Horaires de nuit : <strong><?= NightFeeCalculator::NIGHT_START ?>h00 - <?= NightFeeCalculator::NIGHT_END ?>h00</strong>
            </p>
        </div>

        <!-- Scénarios de test -->
        <div class="section">
            <h2>🧪 Scénarios de test</h2>

            <?php
            // Définir les cas de test
            $testCases = [
                [
                    'name' => 'Intervention de nuit courte (23h → 01h)',
                    'scheduled_time' => date('Y-m-d') . ' 23:00:00',
                    'duration' => 2,
                    'expected_type' => 'single',
                    'description' => 'Intervention de 2h dans une seule période nocturne'
                ],
                [
                    'name' => 'Intervention traversant une nuit (23h → 08h)',
                    'scheduled_time' => date('Y-m-d') . ' 23:00:00',
                    'duration' => 9,
                    'expected_type' => 'single',
                    'description' => 'Intervention de 9h traversant une nuit complète'
                ],
                [
                    'name' => 'Intervention sur 2 nuits (22h J1 → 07h J3)',
                    'scheduled_time' => date('Y-m-d') . ' 22:00:00',
                    'duration' => 33,
                    'expected_type' => 'double',
                    'description' => 'Longue intervention traversant 2 périodes nocturnes'
                ],
                [
                    'name' => 'Intervention de journée (14h → 16h)',
                    'scheduled_time' => date('Y-m-d') . ' 14:00:00',
                    'duration' => 2,
                    'expected_type' => 'none',
                    'description' => 'Intervention en pleine journée'
                ],
                [
                    'name' => 'Fin de nuit (05h → 07h)',
                    'scheduled_time' => date('Y-m-d') . ' 05:00:00',
                    'duration' => 2,
                    'expected_type' => 'single',
                    'description' => 'Intervention commençant à la fin de la période nocturne'
                ],
                [
                    'name' => 'Transition jour→nuit (20h → 23h)',
                    'scheduled_time' => date('Y-m-d') . ' 20:00:00',
                    'duration' => 3,
                    'expected_type' => 'single',
                    'description' => 'Intervention commençant le jour et finissant la nuit'
                ],
                [
                    'name' => 'Exactement à 22h (22h → 00h)',
                    'scheduled_time' => date('Y-m-d') . ' 22:00:00',
                    'duration' => 2,
                    'expected_type' => 'single',
                    'description' => 'Intervention démarrant exactement au début de la nuit'
                ],
                [
                    'name' => 'Juste avant 6h (04h → 06h)',
                    'scheduled_time' => date('Y-m-d') . ' 04:00:00',
                    'duration' => 2,
                    'expected_type' => 'single',
                    'description' => 'Intervention finissant exactement à la fin de la nuit'
                ]
            ];

            foreach ($testCases as $i => $test):
                $result = NightFeeCalculator::calculate($test['scheduled_time'], $test['duration']);
                $passed = $result['type'] === $test['expected_type'];
            ?>
            <div class="test-case">
                <h3>
                    <?= $passed ? '✅' : '❌' ?>
                    Test <?= $i + 1 ?>: <?= htmlspecialchars($test['name']) ?>
                </h3>
                <div class="test-input">
                    📅 <?= $test['scheduled_time'] ?> | ⏱️ <?= $test['duration'] ?>h | <?= $test['description'] ?>
                </div>
                <div class="test-result">
                    <div class="result-item">
                        <div class="result-label">Type</div>
                        <div class="result-value <?= $result['type'] ?>"><?= strtoupper($result['type']) ?></div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">Frais</div>
                        <div class="result-value"><?= number_format($result['fee'], 2) ?> MAD</div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">Nuits comptées</div>
                        <div class="result-value"><?= $result['nights_count'] ?></div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">Attendu</div>
                        <div class="result-value <?= $passed ? 'success' : 'error' ?>">
                            <?= strtoupper($test['expected_type']) ?>
                            <?= $passed ? '✓' : '✗' ?>
                        </div>
                    </div>
                </div>
                <details style="margin-top: 0.5rem;">
                    <summary style="cursor: pointer; color: #94a3b8; font-size: 0.85rem;">Voir détails</summary>
                    <pre><?= htmlspecialchars(json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) ?></pre>
                </details>
            </div>
            <?php endforeach; ?>
        </div>

        <!-- Test fonction isNightTime -->
        <div class="section">
            <h2>🕐 Test isNightTime()</h2>
            <?php
            $timeTests = [
                '2024-01-15 14:00:00' => false,
                '2024-01-15 21:59:00' => false,
                '2024-01-15 22:00:00' => true,
                '2024-01-15 23:30:00' => true,
                '2024-01-16 00:00:00' => true,
                '2024-01-16 03:00:00' => true,
                '2024-01-16 05:59:00' => true,
                '2024-01-16 06:00:00' => false,
                '2024-01-16 06:01:00' => false,
            ];
            ?>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <th style="text-align: left; padding: 0.5rem;">Heure</th>
                    <th style="text-align: center; padding: 0.5rem;">Attendu</th>
                    <th style="text-align: center; padding: 0.5rem;">Résultat</th>
                    <th style="text-align: center; padding: 0.5rem;">Status</th>
                </tr>
                <?php foreach ($timeTests as $time => $expected):
                    $result = NightFeeCalculator::isNightTime($time);
                    $passed = $result === $expected;
                ?>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 0.5rem; font-family: monospace;"><?= $time ?></td>
                    <td style="text-align: center; padding: 0.5rem;"><?= $expected ? '🌙 Nuit' : '☀️ Jour' ?></td>
                    <td style="text-align: center; padding: 0.5rem;"><?= $result ? '🌙 Nuit' : '☀️ Jour' ?></td>
                    <td style="text-align: center; padding: 0.5rem;" class="<?= $passed ? 'success' : 'error' ?>">
                        <?= $passed ? '✅' : '❌' ?>
                    </td>
                </tr>
                <?php endforeach; ?>
            </table>
        </div>

        <!-- Test API endpoints -->
        <div class="section">
            <h2>🔌 Endpoints API</h2>

            <div class="api-test">
                <h4>POST /api/pricing/check-night</h4>
                <div class="api-url">
                    curl -X POST http://localhost:8000/api/pricing/check-night \<br>
                    &nbsp;&nbsp;-H "Content-Type: application/json" \<br>
                    &nbsp;&nbsp;-d '{"scheduled_time": "2024-01-15 23:00:00", "estimated_duration_hours": 3}'
                </div>
            </div>

            <div class="api-test">
                <h4>GET /api/pricing/check-night-quick</h4>
                <div class="api-url">
                    curl "http://localhost:8000/api/pricing/check-night-quick?time=2024-01-15T23:00"
                </div>
            </div>

            <div class="api-test">
                <h4>GET /api/pricing/night-rates</h4>
                <div class="api-url">
                    curl http://localhost:8000/api/pricing/night-rates
                </div>
            </div>
        </div>

        <!-- Warning generator test -->
        <div class="section">
            <h2>⚠️ Test generateWarning()</h2>
            <?php
            $warningTest = NightFeeCalculator::generateWarning(date('Y-m-d') . ' 23:00:00', 3);
            if ($warningTest):
            ?>
            <div style="background: rgba(255, 215, 0, 0.1); border: 1px solid rgba(255, 215, 0, 0.3); border-radius: 8px; padding: 1rem;">
                <h4 style="color: #ffd700; margin-bottom: 0.5rem;"><?= $warningTest['title'] ?></h4>
                <p style="color: #e8e8e8; margin-bottom: 0.5rem;"><?= $warningTest['message'] ?></p>
                <p style="color: #94a3b8; font-size: 0.9rem;">
                    Sévérité: <?= $warningTest['severity'] ?> |
                    Frais: <?= $warningTest['fee'] ?> MAD |
                    Nuits: <?= $warningTest['nights_count'] ?>
                </p>
            </div>
            <?php else: ?>
            <p class="success">Aucun avertissement (intervention de jour)</p>
            <?php endif; ?>
        </div>

        <p style="text-align: center; color: #64748b; margin-top: 2rem;">
            GlamGo - Test NightFeeCalculator - <?= date('Y-m-d H:i:s') ?>
        </p>
    </div>
</body>
</html>
