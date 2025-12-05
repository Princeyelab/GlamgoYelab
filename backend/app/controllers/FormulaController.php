<?php
/**
 * FormulaController - Gestion des formules de services
 *
 * Endpoints:
 * - GET /api/services/{id}/formulas - Formules disponibles pour un service
 * - POST /api/pricing/calculate - Calculer le prix avec formule
 * - GET /api/formulas/rules/{id} - Règles spéciales d'un service
 *
 * @package GlamGo\Controllers
 */

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Database;
use App\Helpers\PriceCalculator;
use PDO;

class FormulaController extends Controller
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * GET /api/services/{id}/formulas
     * Récupérer les formules disponibles pour un service
     */
    public function getServiceFormulas(string $serviceId): void
    {
        $result = PriceCalculator::getServiceFormulas((int) $serviceId);

        if (!$result['success']) {
            $this->error($result['error'], 404);
            return;
        }

        $this->success($result);
    }

    /**
     * POST /api/pricing/calculate
     * Calculer le prix détaillé avec formule
     *
     * Body: {
     *   service_id: int (requis),
     *   formula_type: string (standard|recurring|premium|urgent|night),
     *   scheduled_time: string (datetime),
     *   duration_hours: int,
     *   distance_km: float,
     *   quantity: int
     * }
     */
    public function calculatePrice(): void
    {
        $data = $this->getJsonInput();

        if (empty($data['service_id'])) {
            $this->error('service_id est requis', 400);
            return;
        }

        $params = [
            'service_id' => (int) $data['service_id'],
            'formula_type' => $data['formula_type'] ?? 'standard',
            'scheduled_time' => $data['scheduled_time'] ?? date('Y-m-d H:i:s'),
            'duration_hours' => (int) ($data['duration_hours'] ?? 1),
            'distance_km' => floatval($data['distance_km'] ?? 0),
            'quantity' => (int) ($data['quantity'] ?? 1)
        ];

        $result = PriceCalculator::calculate($params);

        if (!$result['success']) {
            $this->error($result['error'], 400);
            return;
        }

        $this->success($result);
    }

    /**
     * GET /api/formulas/rules/{id}
     * Récupérer les règles spéciales d'un service
     */
    public function getSpecialRules(string $serviceId): void
    {
        $stmt = $this->db->prepare("
            SELECT
                s.id,
                s.name,
                s.special_rules,
                s.allowed_formulas,
                s.min_booking_hours,
                s.max_booking_hours,
                c.name as category_name
            FROM services s
            LEFT JOIN categories c ON s.category_id = c.id
            WHERE s.id = ?
        ");
        $stmt->execute([(int) $serviceId]);
        $service = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$service) {
            $this->error('Service non trouvé', 404);
            return;
        }

        $this->success([
            'service_id' => $service['id'],
            'service_name' => $service['name'],
            'category' => $service['category_name'],
            'special_rules' => json_decode($service['special_rules'] ?? '{}', true),
            'allowed_formulas' => json_decode($service['allowed_formulas'] ?? '["standard"]', true),
            'booking_constraints' => [
                'min_hours' => (int) ($service['min_booking_hours'] ?? 1),
                'max_hours' => (int) ($service['max_booking_hours'] ?? 8)
            ]
        ]);
    }

    /**
     * GET /api/formulas
     * Lister toutes les formules avec métadonnées
     */
    public function index(): void
    {
        $formulas = [
            [
                'type' => 'standard',
                'label' => 'Standard',
                'icon' => '⚡',
                'description' => 'Intervention ponctuelle au tarif de base',
                'badge' => 'Prix de base',
                'color' => 'blue',
                'modifier_type' => 'percentage',
                'modifier_value' => 0
            ],
            [
                'type' => 'recurring',
                'label' => 'Récurrent',
                'icon' => '🔄',
                'description' => 'Abonnement hebdomadaire ou mensuel',
                'badge' => '-10%',
                'color' => 'green',
                'modifier_type' => 'percentage',
                'modifier_value' => -10
            ],
            [
                'type' => 'premium',
                'label' => 'Premium',
                'icon' => '⭐',
                'description' => 'Service haut de gamme avec équipements premium',
                'badge' => '+30%',
                'color' => 'purple',
                'modifier_type' => 'percentage',
                'modifier_value' => 30
            ],
            [
                'type' => 'urgent',
                'label' => 'Urgence',
                'icon' => '🚨',
                'description' => 'Intervention en moins de 2 heures',
                'badge' => '+50 MAD',
                'color' => 'red',
                'modifier_type' => 'fixed',
                'modifier_value' => 50
            ],
            [
                'type' => 'night',
                'label' => 'Nuit',
                'icon' => '🌙',
                'description' => 'Intervention entre 22h et 6h',
                'badge' => '+30 MAD',
                'color' => 'dark',
                'modifier_type' => 'fixed',
                'modifier_value' => 30
            ]
        ];

        $this->success([
            'formulas' => $formulas,
            'commission_rate' => '20%',
            'night_hours' => ['start' => 22, 'end' => 6],
            'urgent_max_hours' => 2,
            'free_distance_km' => 5,
            'distance_fee_per_km' => 2
        ]);
    }

    /**
     * GET /api/services/{id}/price-preview
     * Aperçu rapide des prix pour toutes les formules d'un service
     */
    public function pricePreview(string $serviceId): void
    {
        $result = PriceCalculator::getServiceFormulas((int) $serviceId);

        if (!$result['success']) {
            $this->error($result['error'], 404);
            return;
        }

        $previews = [];
        foreach ($result['formulas'] as $formula) {
            $previews[] = [
                'formula_type' => $formula['formula_type'],
                'label' => ucfirst($formula['formula_type']),
                'icon' => $formula['icon'] ?? '⚡',
                'price' => $formula['calculated_price'],
                'price_formatted' => number_format($formula['calculated_price'], 2) . ' MAD',
                'badge' => $formula['badge'] ?? '',
                'color' => $formula['color'] ?? 'blue'
            ];
        }

        $this->success([
            'service' => $result['service'],
            'price_previews' => $previews
        ]);
    }
}
