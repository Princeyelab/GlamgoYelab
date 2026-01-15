<?php
/**
 * PriceCalculator - Calcul dynamique des prix avec formules
 *
 * Gère le calcul complet des prix incluant:
 * - Modificateurs de formule (%, fixe)
 * - Frais de distance basés sur le rayon d'intervention du prestataire
 * - Supplément nuit
 * - Commission GlamGo (20%)
 *
 * @package GlamGo\Helpers
 */

namespace App\Helpers;

use App\Core\Database;
use PDO;

class PriceCalculator
{
    const COMMISSION_RATE = 0.20; // 20% commission GlamGo
    const NIGHT_START_HOUR = 22;
    const NIGHT_END_HOUR = 6;
    const URGENT_DELAY_HOURS = 2;
    const DISTANCE_FEE_PER_KM = 2; // Legacy: 2 MAD/km après 5km
    const FREE_DISTANCE_KM = 5;    // Legacy: rayon gratuit par défaut

    public static function calculate(array $params): array
    {
        $db = Database::getInstance();

        // Validation des paramètres requis
        if (empty($params['service_id'])) {
            return ['success' => false, 'error' => 'service_id requis'];
        }

        $serviceId = (int) $params['service_id'];
        $formulaType = $params['formula_type'] ?? 'standard';
        $scheduledTime = $params['scheduled_time'] ?? date('Y-m-d H:i:s');
        $durationHours = $params['duration_hours'] ?? 1;
        $distanceKm = $params['distance_km'] ?? 0;
        $quantity = $params['quantity'] ?? 1;
        $customBasePrice = isset($params['base_price']) ? floatval($params['base_price']) : null;

        // Récupérer le service
        $stmt = $db->prepare("
            SELECT s.*, c.name as category_name
            FROM services s
            LEFT JOIN categories c ON s.category_id = c.id
            WHERE s.id = ?
        ");
        $stmt->execute([$serviceId]);
        $service = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$service) {
            return ['success' => false, 'error' => 'Service non trouvé'];
        }

        // Utiliser le basePrice fourni en paramètre ou celui du service
        $basePrice = isset($params['base_price']) ? floatval($params['base_price']) : floatval($service['price']);

        // Vérifier si la formule est autorisée (basée sur la catégorie)
        $categoryName = strtolower($service['category_name'] ?? '');
        $allowedFormulas = self::getAllowedFormulasByCategory($categoryName);
        if (!in_array($formulaType, $allowedFormulas)) {
            return [
                'success' => false,
                'error' => "Formule '$formulaType' non disponible pour ce service",
                'allowed_formulas' => $allowedFormulas
            ];
        }

        // Récupérer la formule
        $stmt = $db->prepare("
            SELECT * FROM service_formulas
            WHERE service_id = ? AND formula_type = ? AND is_active = TRUE
        ");
        $stmt->execute([$serviceId, $formulaType]);
        $formula = $stmt->fetch(PDO::FETCH_ASSOC);

        // Initialiser le breakdown
        $breakdown = [
            'base_price' => $basePrice,
            'quantity' => $quantity,
            'duration_hours' => $durationHours,
            'formula_type' => $formulaType,
            'formula_modifier' => 0,
            'distance_fee' => 0,
            'night_fee' => 0,
            'subtotal' => 0,
            'commission_glamgo' => 0,
            'commission_rate' => self::COMMISSION_RATE * 100 . '%',
            'total' => 0,
            'provider_amount' => 0
        ];

        // 1. Appliquer le modificateur de formule
        $priceAfterFormula = $basePrice;
        if ($formula) {
            $breakdown['formula_description'] = $formula['description'];

            if ($formula['price_modifier_type'] === 'percentage') {
                $modifier = $basePrice * ($formula['price_modifier_value'] / 100);
                $priceAfterFormula = $basePrice + $modifier;
                $breakdown['formula_modifier'] = $modifier;
                $breakdown['formula_modifier_display'] = ($formula['price_modifier_value'] >= 0 ? '+' : '') . $formula['price_modifier_value'] . '%';
            } else {
                $priceAfterFormula = $basePrice + $formula['price_modifier_value'];
                $breakdown['formula_modifier'] = $formula['price_modifier_value'];
                $breakdown['formula_modifier_display'] = ($formula['price_modifier_value'] >= 0 ? '+' : '') . $formula['price_modifier_value'] . ' MAD';
            }
        }

        // 2. Appliquer la durée et quantité
        $priceWithDuration = $priceAfterFormula * $durationHours * $quantity;

        // 3. Calculer les frais de distance
        $distanceFee = self::calculateDistanceFee($distanceKm);
        $breakdown['distance_fee'] = $distanceFee;
        $breakdown['distance_km'] = $distanceKm;

        // 4. Calculer le supplément nuit avec détails complets
        $nightCalc = self::calculateNightFeeDetailed($scheduledTime, $durationHours, $formulaType);
        $nightFee = $nightCalc['fee'];
        $breakdown['night_fee'] = $nightFee;
        $breakdown['night'] = $nightCalc; // Détails complets (type, nights_count, explanation, periods)
        $breakdown['night_type'] = $nightCalc['type'];
        $breakdown['night_nights_count'] = $nightCalc['nights_count'] ?? 0;
        $breakdown['is_night_service'] = $nightFee > 0 || $formulaType === 'night';

        // 5. Calculer le sous-total
        $subtotal = $priceWithDuration + $distanceFee + $nightFee;
        $breakdown['subtotal'] = round($subtotal, 2);

        // 6. Calculer la commission GlamGo
        $commission = $subtotal * self::COMMISSION_RATE;
        $breakdown['commission_glamgo'] = round($commission, 2);

        // 7. Total et montant prestataire
        $breakdown['total'] = round($subtotal, 2);
        $breakdown['provider_amount'] = round($subtotal - $commission, 2);

        // Ajouter infos service
        $breakdown['service'] = [
            'id' => $service['id'],
            'name' => $service['name'],
            'category' => $service['category_name'],
            'base_price' => $basePrice
        ];

        // Règles spéciales si disponibles
        if (!empty($service['special_rules'])) {
            $breakdown['special_rules'] = json_decode($service['special_rules'], true);
        }

        return [
            'success' => true,
            'breakdown' => $breakdown,
            'formatted' => [
                'total' => number_format($breakdown['total'], 2) . ' MAD',
                'provider_amount' => number_format($breakdown['provider_amount'], 2) . ' MAD',
                'commission' => number_format($breakdown['commission_glamgo'], 2) . ' MAD'
            ]
        ];
    }

    /**
     * Calculer les frais de distance
     */
    private static function calculateDistanceFee(float $distanceKm): float
    {
        if ($distanceKm <= self::FREE_DISTANCE_KM) {
            return 0;
        }

        $chargeableDistance = $distanceKm - self::FREE_DISTANCE_KM;
        return round($chargeableDistance * self::DISTANCE_FEE_PER_KM, 2);
    }

    /**
     * Calculer le supplément nuit avec NightFeeCalculator
     *
     * Utilise le nouveau calculateur qui prend en compte :
     * - La durée de l'intervention
     * - Les nuits consécutives (commission doublée si 2+ nuits)
     * - Les tarifs configurables depuis la DB
     *
     * @param string $scheduledTime Heure de début
     * @param int $durationHours Durée en heures
     * @param string $formulaType Type de formule
     * @return array ['fee' => float, 'type' => string, 'details' => array]
     */
    private static function calculateNightFeeDetailed(string $scheduledTime, int $durationHours, string $formulaType): array
    {
        // Pas de supplément si déjà formule nuit
        if ($formulaType === 'night') {
            return [
                'fee' => 0,
                'type' => 'none',
                'nights_count' => 0,
                'explanation' => 'Formule nuit déjà appliquée.',
                'periods' => []
            ];
        }

        // Utiliser NightFeeCalculator pour le calcul complet
        return NightFeeCalculator::calculate($scheduledTime, $durationHours);
    }

    /**
     * Calculer le supplément nuit (méthode legacy pour compatibilité)
     */
    private static function calculateNightFee(string $scheduledTime, int $durationHours, string $formulaType): float
    {
        $result = self::calculateNightFeeDetailed($scheduledTime, $durationHours, $formulaType);
        return $result['fee'] ?? 0;
    }

    /**
     * Récupérer toutes les formules disponibles pour un service
     */
    public static function getServiceFormulas(int $serviceId): array
    {
        $db = Database::getInstance();

        // Récupérer le service avec ses formules autorisées
        $stmt = $db->prepare("
            SELECT s.id, s.name, s.price, s.allowed_formulas, s.special_rules
            FROM services s
            WHERE s.id = ?
        ");
        $stmt->execute([$serviceId]);
        $service = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$service) {
            return ['success' => false, 'error' => 'Service non trouvé'];
        }

        // Récupérer la catégorie du service pour appliquer les restrictions appropriées
        $stmt = $db->prepare("
            SELECT c.slug, c.name as category_name
            FROM categories c
            WHERE c.id = (SELECT category_id FROM services WHERE id = ?)
        ");
        $stmt->execute([$serviceId]);
        $category = $stmt->fetch(PDO::FETCH_ASSOC);
        $categorySlug = strtolower($category['slug'] ?? '');
        $categoryName = strtolower($category['category_name'] ?? '');

        // Toutes les formules sont disponibles pour tous les services
        $allowedFormulas = ['standard', 'recurring', 'premium', 'urgent', 'night'];

        // Récupérer les détails des formules
        $placeholders = implode(',', array_fill(0, count($allowedFormulas), '?'));
        $stmt = $db->prepare("
            SELECT sf.*,
                   CASE
                       WHEN sf.price_modifier_type = 'percentage' THEN ? * (1 + sf.price_modifier_value / 100)
                       ELSE ? + sf.price_modifier_value
                   END as calculated_price
            FROM service_formulas sf
            WHERE sf.service_id = ?
              AND sf.formula_type IN ($placeholders)
              AND sf.is_active = TRUE
            ORDER BY CASE sf.formula_type WHEN 'standard' THEN 1 WHEN 'recurring' THEN 2 WHEN 'premium' THEN 3 WHEN 'urgent' THEN 4 WHEN 'night' THEN 5 ELSE 6 END
        ");

        $params = array_merge(
            [$service['price'], $service['price'], $serviceId],
            $allowedFormulas
        );
        $stmt->execute($params);
        $formulas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Métadonnées et valeurs par défaut des formules
        $formulasDefaults = [
            'standard' => [
                'icon' => '⚡', 'color' => 'blue', 'badge' => 'Prix de base',
                'price_modifier_type' => 'percentage', 'price_modifier_value' => 0,
                'description' => 'Tarif de base - Intervention ponctuelle'
            ],
            'recurring' => [
                'icon' => '🔄', 'color' => 'green', 'badge' => '-10%',
                'price_modifier_type' => 'percentage', 'price_modifier_value' => -10,
                'description' => 'Abonnement hebdomadaire ou mensuel - Économisez 10%'
            ],
            'premium' => [
                'icon' => '⭐', 'color' => 'purple', 'badge' => '+30%',
                'price_modifier_type' => 'percentage', 'price_modifier_value' => 30,
                'description' => 'Service haut de gamme avec équipements premium'
            ],
            'urgent' => [
                'icon' => '🚨', 'color' => 'red', 'badge' => '+50 MAD',
                'price_modifier_type' => 'fixed', 'price_modifier_value' => 50,
                'description' => 'Intervention urgente en moins de 2 heures'
            ],
            'night' => [
                'icon' => '🌙', 'color' => 'dark', 'badge' => '+30 MAD',
                'price_modifier_type' => 'fixed', 'price_modifier_value' => 30,
                'description' => 'Intervention de nuit (22h - 6h)'
            ]
        ];

        // Vérifier quelles formules existent déjà
        $existingTypes = array_column($formulas, 'formula_type');

        // Enrichir les formules existantes avec les métadonnées
        foreach ($formulas as &$formula) {
            $type = $formula['formula_type'];
            if (isset($formulasDefaults[$type])) {
                $formula['icon'] = $formulasDefaults[$type]['icon'];
                $formula['color'] = $formulasDefaults[$type]['color'];
                $formula['badge'] = $formulasDefaults[$type]['badge'];
            }
            $formula['calculated_price'] = round($formula['calculated_price'], 2);
        }
        unset($formula);

        // Ajouter les formules manquantes avec les valeurs par défaut
        $basePrice = floatval($service['price']);
        foreach ($allowedFormulas as $formulaType) {
            if (!in_array($formulaType, $existingTypes) && isset($formulasDefaults[$formulaType])) {
                $default = $formulasDefaults[$formulaType];

                // Calculer le prix
                if ($default['price_modifier_type'] === 'percentage') {
                    $calculatedPrice = $basePrice * (1 + $default['price_modifier_value'] / 100);
                } else {
                    $calculatedPrice = $basePrice + $default['price_modifier_value'];
                }

                $formulas[] = [
                    'id' => null,
                    'service_id' => $serviceId,
                    'formula_type' => $formulaType,
                    'price_modifier_type' => $default['price_modifier_type'],
                    'price_modifier_value' => $default['price_modifier_value'],
                    'description' => $default['description'],
                    'is_active' => true,
                    'icon' => $default['icon'],
                    'color' => $default['color'],
                    'badge' => $default['badge'],
                    'calculated_price' => round($calculatedPrice, 2)
                ];
            }
        }

        // Trier les formules dans l'ordre souhaité
        $order = ['standard', 'recurring', 'premium', 'urgent', 'night'];
        usort($formulas, function($a, $b) use ($order) {
            $posA = array_search($a['formula_type'], $order);
            $posB = array_search($b['formula_type'], $order);
            return $posA - $posB;
        });

        return [
            'success' => true,
            'service' => [
                'id' => $service['id'],
                'name' => $service['name'],
                'base_price' => $basePrice,
                'special_rules' => json_decode($service['special_rules'] ?? '{}', true)
            ],
            'formulas' => $formulas,
            'allowed_types' => $allowedFormulas
        ];
    }


    /**
     * Obtenir les formules autorisées - toutes les formules sont disponibles pour tous les services
     */
    private static function getAllowedFormulasByCategory(string $categoryName): array
    {
        return ['standard', 'recurring', 'premium', 'urgent', 'night'];
    }

    /**
     * Vérifier si une heure est en période nuit
     */
    public static function isNightTime(string $datetime): bool
    {
        $hour = (int) date('G', strtotime($datetime));
        return ($hour >= self::NIGHT_START_HOUR || $hour < self::NIGHT_END_HOUR);
    }

    /**
     * Vérifier si une réservation est urgente (< 2h)
     */
    public static function isUrgent(string $scheduledTime): bool
    {
        $now = time();
        $scheduled = strtotime($scheduledTime);
        $hoursUntil = ($scheduled - $now) / 3600;

        return $hoursUntil > 0 && $hoursUntil <= self::URGENT_DELAY_HOURS;
    }

    /**
     * Calculer le prix complet avec informations du prestataire
     *
     * Cette méthode utilise le rayon d'intervention personnalisé du prestataire
     * pour calculer les frais de déplacement de manière précise.
     *
     * @param array $params [
     *   'service_base_price' => float,
     *   'provider' => array [
     *     'id' => int,
     *     'latitude' => float,
     *     'longitude' => float,
     *     'intervention_radius_km' => int,
     *     'price_per_extra_km' => float
     *   ],
     *   'client_location' => array ['lat' => float, 'lng' => float],
     *   'formula' => string (standard, premium, express, etc.),
     *   'scheduled_time' => string (datetime),
     *   'duration_hours' => int (optionnel, défaut 1),
     *   'quantity' => int (optionnel, défaut 1)
     * ]
     * @return array Prix détaillé avec breakdown complet
     */
    public static function calculateWithProvider(array $params): array
    {
        // Validation des paramètres requis
        if (empty($params['service_base_price'])) {
            return ['success' => false, 'error' => 'service_base_price requis'];
        }
        if (empty($params['provider'])) {
            return ['success' => false, 'error' => 'provider requis'];
        }
        if (empty($params['client_location'])) {
            return ['success' => false, 'error' => 'client_location requis'];
        }

        $basePrice = floatval($params['service_base_price']);
        $provider = $params['provider'];
        $clientLocation = $params['client_location'];
        $formulaType = $params['formula'] ?? 'standard';
        $scheduledTime = $params['scheduled_time'] ?? date('Y-m-d H:i:s');
        $durationHours = $params['duration_hours'] ?? 1;
        $quantity = $params['quantity'] ?? 1;

        // Initialiser le breakdown
        $breakdown = [
            'base_price' => $basePrice,
            'quantity' => $quantity,
            'duration_hours' => $durationHours,
            'formula_type' => $formulaType,
            'formula_fee' => 0,
            'formula_multiplier' => 1.0,
            'distance' => null,
            'distance_fee' => 0,
            'night_fee' => 0,
            'subtotal' => 0,
            'commission_glamgo' => 0,
            'commission_rate' => self::COMMISSION_RATE * 100,
            'total' => 0,
            'provider_amount' => 0,
            'currency' => 'MAD'
        ];

        // 1. Appliquer le modificateur de formule
        $formulaMultipliers = [
            'express' => 1.5,
            'premium' => 1.3,
            'standard' => 1.0,
            'eco' => 0.9,
            'recurring' => 0.9,
            'night' => 1.3,
            'urgent' => 1.5
        ];

        $multiplier = $formulaMultipliers[$formulaType] ?? 1.0;
        $priceAfterFormula = $basePrice * $multiplier;
        $formulaFee = $priceAfterFormula - $basePrice;

        $breakdown['formula_multiplier'] = $multiplier;
        $breakdown['formula_fee'] = round($formulaFee, 2);
        $breakdown['formula_price'] = round($priceAfterFormula, 2);

        // 2. Appliquer la durée et quantité
        $priceWithDuration = $priceAfterFormula * $durationHours * $quantity;

        // 3. Calculer les frais de distance avec DistanceFeeCalculator
        $distanceCalculation = DistanceFeeCalculator::calculate($provider, $clientLocation);
        $breakdown['distance'] = $distanceCalculation;
        $breakdown['distance_fee'] = $distanceCalculation['fee'] ?? 0;
        $breakdown['distance_km'] = $distanceCalculation['distance_km'] ?? 0;
        $breakdown['is_in_radius'] = $distanceCalculation['is_in_radius'] ?? true;
        $breakdown['intervention_radius_km'] = $distanceCalculation['intervention_radius_km'] ?? 10;
        $breakdown['extra_distance_km'] = $distanceCalculation['extra_distance_km'] ?? 0;
        $breakdown['price_per_extra_km'] = $distanceCalculation['price_per_extra_km'] ?? 5.00;
        $breakdown['distance_message'] = $distanceCalculation['message'] ?? null;

        // 4. Calculer le supplément nuit avec détails complets
        $nightCalc = self::calculateNightFeeDetailed($scheduledTime, $durationHours, $formulaType);
        $nightFee = $nightCalc['fee'];
        $breakdown['night_fee'] = $nightFee;
        $breakdown['night'] = $nightCalc; // Détails complets
        $breakdown['night_type'] = $nightCalc['type'];
        $breakdown['night_nights_count'] = $nightCalc['nights_count'] ?? 0;
        $breakdown['is_night_service'] = $nightFee > 0 || $formulaType === 'night';

        // 5. Calculer le sous-total (avant commission)
        $subtotal = $priceWithDuration + $breakdown['distance_fee'] + $nightFee;
        $breakdown['subtotal'] = round($subtotal, 2);

        // 6. Calculer la commission GlamGo
        $commission = $subtotal * self::COMMISSION_RATE;
        $breakdown['commission_glamgo'] = round($commission, 2);

        // 7. Total (le client paie le sous-total, la commission est prélevée)
        $breakdown['total'] = round($subtotal, 2);
        $breakdown['provider_amount'] = round($subtotal - $commission, 2);

        // Ajouter infos prestataire
        $breakdown['provider'] = [
            'id' => $provider['id'] ?? null,
            'name' => ($provider['first_name'] ?? '') . ' ' . ($provider['last_name'] ?? ''),
            'intervention_radius_km' => $breakdown['intervention_radius_km'],
            'price_per_extra_km' => $breakdown['price_per_extra_km']
        ];

        return [
            'success' => true,
            'breakdown' => $breakdown,
            'formatted' => [
                'base_price' => number_format($basePrice, 2) . ' MAD',
                'formula_fee' => ($formulaFee >= 0 ? '+' : '') . number_format($formulaFee, 2) . ' MAD',
                'distance_fee' => '+' . number_format($breakdown['distance_fee'], 2) . ' MAD',
                'night_fee' => '+' . number_format($nightFee, 2) . ' MAD',
                'subtotal' => number_format($breakdown['subtotal'], 2) . ' MAD',
                'commission' => number_format($breakdown['commission_glamgo'], 2) . ' MAD',
                'total' => number_format($breakdown['total'], 2) . ' MAD',
                'provider_amount' => number_format($breakdown['provider_amount'], 2) . ' MAD'
            ]
        ];
    }

    /**
     * Méthode simplifiée pour calculer uniquement le total
     * Utilisée pour l'affichage rapide dans les listes
     *
     * @param float $basePrice Prix de base du service
     * @param string $formula Type de formule
     * @param float $distanceKm Distance en km
     * @param float $interventionRadius Rayon d'intervention (optionnel)
     * @param float $pricePerKm Prix par km (optionnel)
     * @return float Total calculé
     */
    public static function calculateQuickTotal(
        float $basePrice,
        string $formula = 'standard',
        float $distanceKm = 0,
        ?float $interventionRadius = null,
        ?float $pricePerKm = null
    ): float {
        // Multiplicateurs de formule
        $formulaMultipliers = [
            'express' => 1.5,
            'premium' => 1.3,
            'standard' => 1.0,
            'eco' => 0.9
        ];

        $multiplier = $formulaMultipliers[$formula] ?? 1.0;
        $priceAfterFormula = $basePrice * $multiplier;

        // Calcul frais de distance
        $distanceCalc = DistanceFeeCalculator::calculateFromDistance(
            $distanceKm,
            $interventionRadius,
            $pricePerKm
        );

        return round($priceAfterFormula + $distanceCalc['fee'], 2);
    }
}
