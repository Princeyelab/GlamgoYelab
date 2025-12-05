<?php
/**
 * PricingController - Contrôleur pour la gestion des tarifications
 *
 * Gère les endpoints relatifs aux calculs de prix :
 * - Vérification des frais de nuit
 * - Configuration des tarifs (admin)
 * - Calcul complet avec tous les frais
 *
 * @package GlamGo\Controllers
 */

namespace App\Controllers;

use App\Helpers\NightFeeCalculator;
use App\Helpers\PriceCalculator;
use App\Core\Database;
use PDO;

class PricingController
{
    /**
     * POST /api/pricing/check-night
     *
     * Vérifie si une intervention tombe dans les horaires de nuit
     * et calcule les frais associés.
     *
     * Body JSON:
     * {
     *   "scheduled_time": "2024-01-15 23:00:00",
     *   "estimated_duration_hours": 3
     * }
     *
     * @return void Envoie une réponse JSON
     */
    public function checkNight(): void
    {
        header('Content-Type: application/json');

        // Récupérer les données de la requête
        $input = json_decode(file_get_contents('php://input'), true);

        $scheduledTime = $input['scheduled_time'] ?? null;
        $duration = (int) ($input['estimated_duration_hours'] ?? 2);

        // Validation
        if (!$scheduledTime) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'scheduled_time est requis'
            ]);
            return;
        }

        // Valider le format de la date
        $timestamp = strtotime($scheduledTime);
        if ($timestamp === false) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Format de date invalide. Utilisez: Y-m-d H:i:s'
            ]);
            return;
        }

        // Calculer les frais de nuit
        $nightCalc = NightFeeCalculator::calculate($scheduledTime, $duration);

        // Générer l'avertissement si nécessaire
        $warning = NightFeeCalculator::generateWarning($scheduledTime, $duration);

        echo json_encode([
            'success' => true,
            'data' => $nightCalc,
            'warning' => $warning,
            'scheduled_time' => $scheduledTime,
            'duration_hours' => $duration
        ]);
    }

    /**
     * GET /api/pricing/check-night-quick
     *
     * Vérification rapide si une heure est dans la plage nocturne
     *
     * Query params: ?time=2024-01-15T23:00
     */
    public function checkNightQuick(): void
    {
        header('Content-Type: application/json');

        $time = $_GET['time'] ?? date('Y-m-d H:i:s');

        $isNight = NightFeeCalculator::isNightTime($time);
        $needsWarning = NightFeeCalculator::needsWarning($time);

        echo json_encode([
            'success' => true,
            'is_night_time' => $isNight,
            'needs_warning' => $needsWarning,
            'time' => $time,
            'night_hours' => [
                'start' => NightFeeCalculator::NIGHT_START . 'h00',
                'end' => NightFeeCalculator::NIGHT_END . 'h00'
            ]
        ]);
    }

    /**
     * GET /api/pricing/night-rates
     *
     * Récupère les tarifs de nuit actuels
     */
    public function getNightRates(): void
    {
        header('Content-Type: application/json');

        $config = NightFeeCalculator::getConfiguration();

        echo json_encode([
            'success' => true,
            'rates' => $config['rates'],
            'night_hours' => $config['night_hours']
        ]);
    }

    /**
     * POST /api/pricing/calculate
     *
     * Calcul complet du prix avec tous les frais
     *
     * Body JSON:
     * {
     *   "service_id": 55,
     *   "formula_type": "standard",
     *   "scheduled_time": "2024-01-15 23:00:00",
     *   "duration_hours": 2,
     *   "distance_km": 12.5
     * }
     */
    public function calculate(): void
    {
        header('Content-Type: application/json');

        $input = json_decode(file_get_contents('php://input'), true);

        // Validation
        if (empty($input['service_id'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'service_id est requis'
            ]);
            return;
        }

        // Calcul avec PriceCalculator
        $result = PriceCalculator::calculate([
            'service_id' => (int) $input['service_id'],
            'formula_type' => $input['formula_type'] ?? 'standard',
            'scheduled_time' => $input['scheduled_time'] ?? date('Y-m-d H:i:s'),
            'duration_hours' => (int) ($input['duration_hours'] ?? 1),
            'distance_km' => (float) ($input['distance_km'] ?? 0),
            'quantity' => (int) ($input['quantity'] ?? 1)
        ]);

        echo json_encode($result);
    }

    /**
     * GET /api/admin/pricing/night-config
     *
     * Configuration complète des tarifs de nuit (admin)
     */
    public function getAdminNightConfig(): void
    {
        header('Content-Type: application/json');

        // TODO: Vérifier authentification admin

        $config = NightFeeCalculator::getConfiguration();

        echo json_encode([
            'success' => true,
            'config' => $config
        ]);
    }

    /**
     * PUT /api/admin/pricing/night-rates
     *
     * Mise à jour des tarifs de nuit (admin)
     *
     * Body JSON:
     * {
     *   "single_night_fee": 30.00,
     *   "double_night_fee": 60.00
     * }
     */
    public function updateNightRates(): void
    {
        header('Content-Type: application/json');

        // TODO: Vérifier authentification admin

        $input = json_decode(file_get_contents('php://input'), true);

        $singleFee = (float) ($input['single_night_fee'] ?? 30.00);
        $doubleFee = (float) ($input['double_night_fee'] ?? 60.00);

        // Validation
        if ($singleFee < 0 || $doubleFee < 0) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Les tarifs ne peuvent pas être négatifs'
            ]);
            return;
        }

        if ($doubleFee < $singleFee) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Le tarif 2 nuits doit être supérieur ou égal au tarif 1 nuit'
            ]);
            return;
        }

        // TODO: Récupérer l'ID admin depuis le token JWT
        $adminId = null;

        $result = NightFeeCalculator::updateRates($singleFee, $doubleFee, $adminId);

        if ($result['success']) {
            echo json_encode($result);
        } else {
            http_response_code(500);
            echo json_encode($result);
        }
    }

    /**
     * GET /api/admin/pricing/history
     *
     * Historique des modifications de tarifs (admin)
     */
    public function getPricingHistory(): void
    {
        header('Content-Type: application/json');

        // TODO: Vérifier authentification admin

        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("
                SELECT
                    prh.*,
                    u.first_name, u.last_name
                FROM pricing_rules_history prh
                LEFT JOIN users u ON prh.changed_by = u.id
                ORDER BY prh.changed_at DESC
                LIMIT 50
            ");
            $stmt->execute();
            $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'history' => $history
            ]);

        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }
}
