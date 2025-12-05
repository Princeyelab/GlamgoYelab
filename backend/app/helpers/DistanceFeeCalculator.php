<?php
/**
 * DistanceFeeCalculator - Calcul des frais de déplacement kilométriques
 *
 * Gère le calcul des frais de déplacement basé sur :
 * - Le rayon d'intervention personnalisé du prestataire
 * - Le tarif kilométrique du prestataire
 * - La distance entre prestataire et client
 *
 * @package GlamGo\Helpers
 * @author GlamGo Team
 */

namespace App\Helpers;

class DistanceFeeCalculator
{
    // Valeurs par défaut si non définies par le prestataire
    const DEFAULT_INTERVENTION_RADIUS_KM = 10;
    const DEFAULT_PRICE_PER_EXTRA_KM = 5.00;

    // Configuration par ville (extensible)
    const CITY_CONFIGS = [
        'marrakech' => [
            'default_radius' => 10,
            'default_price_per_km' => 5.00,
            'max_radius' => 50
        ],
        'casablanca' => [
            'default_radius' => 15,
            'default_price_per_km' => 4.00,
            'max_radius' => 60
        ],
        'default' => [
            'default_radius' => 10,
            'default_price_per_km' => 5.00,
            'max_radius' => 50
        ]
    ];

    /**
     * Calcule les frais de déplacement entre un prestataire et un client
     *
     * @param array $provider Données du prestataire [
     *   'latitude' => float,
     *   'longitude' => float,
     *   'intervention_radius_km' => int|null,
     *   'price_per_extra_km' => float|null,
     *   'city' => string|null
     * ]
     * @param array $clientLocation Position du client [
     *   'lat' => float,
     *   'lng' => float
     * ]
     * @return array Détail du calcul
     */
    public static function calculate(array $provider, array $clientLocation): array
    {
        // Valider les coordonnées
        if (!self::validateCoordinates($provider, $clientLocation)) {
            return self::getErrorResult('Coordonnées invalides');
        }

        // Récupérer la configuration selon la ville
        $city = strtolower($provider['city'] ?? 'default');
        $config = self::CITY_CONFIGS[$city] ?? self::CITY_CONFIGS['default'];

        // Paramètres du prestataire avec fallback
        $interventionRadius = floatval(
            $provider['intervention_radius_km']
            ?? $provider['intervention_radius']
            ?? $config['default_radius']
        );
        $pricePerExtraKm = floatval(
            $provider['price_per_extra_km']
            ?? $config['default_price_per_km']
        );

        // Coordonnées du prestataire
        $providerLat = floatval($provider['latitude'] ?? $provider['current_latitude'] ?? 0);
        $providerLng = floatval($provider['longitude'] ?? $provider['current_longitude'] ?? 0);

        // Calculer la distance
        $distance = GeoCalculator::calculateDistance(
            $providerLat,
            $providerLng,
            floatval($clientLocation['lat']),
            floatval($clientLocation['lng'])
        );

        $distance = round($distance, 2);

        // Vérifier si dans le rayon d'intervention
        if ($distance <= $interventionRadius) {
            return [
                'success' => true,
                'distance_km' => $distance,
                'is_in_radius' => true,
                'intervention_radius_km' => $interventionRadius,
                'extra_distance_km' => 0,
                'price_per_extra_km' => $pricePerExtraKm,
                'fee' => 0,
                'fee_formatted' => '0 MAD',
                'message' => self::getInRadiusMessage($interventionRadius),
                'explanation' => null
            ];
        }

        // Calculer la distance excédentaire et les frais
        $extraDistance = $distance - $interventionRadius;
        $extraDistanceCeiled = ceil($extraDistance); // Arrondi au km supérieur
        $fee = round($extraDistanceCeiled * $pricePerExtraKm, 2);

        return [
            'success' => true,
            'distance_km' => $distance,
            'is_in_radius' => false,
            'intervention_radius_km' => $interventionRadius,
            'extra_distance_km' => round($extraDistance, 2),
            'extra_distance_km_ceiled' => $extraDistanceCeiled,
            'price_per_extra_km' => $pricePerExtraKm,
            'fee' => $fee,
            'fee_formatted' => number_format($fee, 2) . ' MAD',
            'message' => self::getExplanationMessage([
                'intervention_radius' => $interventionRadius,
                'distance_km' => $distance,
                'fee' => $fee,
                'extra_distance' => $extraDistanceCeiled,
                'price_per_km' => $pricePerExtraKm
            ]),
            'explanation' => [
                'steps' => self::getCalculationSteps($distance, $interventionRadius, $extraDistanceCeiled, $pricePerExtraKm, $fee)
            ]
        ];
    }

    /**
     * Calcule les frais avec une distance pré-calculée
     *
     * @param float $distanceKm Distance déjà calculée
     * @param float $interventionRadius Rayon d'intervention du prestataire
     * @param float $pricePerKm Prix par km supplémentaire
     * @return array Détail du calcul
     */
    public static function calculateFromDistance(
        float $distanceKm,
        float $interventionRadius = null,
        float $pricePerKm = null
    ): array {
        $interventionRadius = $interventionRadius ?? self::DEFAULT_INTERVENTION_RADIUS_KM;
        $pricePerKm = $pricePerKm ?? self::DEFAULT_PRICE_PER_EXTRA_KM;
        $distanceKm = round($distanceKm, 2);

        if ($distanceKm <= $interventionRadius) {
            return [
                'success' => true,
                'distance_km' => $distanceKm,
                'is_in_radius' => true,
                'intervention_radius_km' => $interventionRadius,
                'extra_distance_km' => 0,
                'price_per_extra_km' => $pricePerKm,
                'fee' => 0,
                'fee_formatted' => '0 MAD'
            ];
        }

        $extraDistance = $distanceKm - $interventionRadius;
        $extraDistanceCeiled = ceil($extraDistance);
        $fee = round($extraDistanceCeiled * $pricePerKm, 2);

        return [
            'success' => true,
            'distance_km' => $distanceKm,
            'is_in_radius' => false,
            'intervention_radius_km' => $interventionRadius,
            'extra_distance_km' => round($extraDistance, 2),
            'extra_distance_km_ceiled' => $extraDistanceCeiled,
            'price_per_extra_km' => $pricePerKm,
            'fee' => $fee,
            'fee_formatted' => number_format($fee, 2) . ' MAD'
        ];
    }

    /**
     * Génère le message explicatif pour le client
     *
     * @param array $calculation Résultat du calcul
     * @return string Message explicatif
     */
    public static function getExplanationMessage(array $calculation): string
    {
        if ($calculation['is_in_radius'] ?? false) {
            return sprintf(
                "Ce prestataire intervient dans un rayon de %d km. Votre adresse est à %.1f km, aucuns frais de déplacement ne s'appliquent.",
                $calculation['intervention_radius'],
                $calculation['distance_km']
            );
        }

        return sprintf(
            "Ce prestataire intervient gratuitement jusqu'à %d km. Votre adresse est à %.1f km, des frais de déplacement de %.2f MAD s'appliquent (%d km × %.2f MAD/km).",
            $calculation['intervention_radius'],
            $calculation['distance_km'],
            $calculation['fee'],
            $calculation['extra_distance'],
            $calculation['price_per_km']
        );
    }

    /**
     * Génère le message pour les clients dans le rayon
     *
     * @param float $radius Rayon d'intervention
     * @return string Message
     */
    public static function getInRadiusMessage(float $radius): string
    {
        return sprintf(
            "Ce prestataire intervient dans votre zone (rayon de %d km) sans frais de déplacement supplémentaires.",
            $radius
        );
    }

    /**
     * Retourne les étapes détaillées du calcul pour affichage
     *
     * @param float $distance Distance totale
     * @param float $radius Rayon d'intervention
     * @param int $extraKm KM supplémentaires (arrondi)
     * @param float $pricePerKm Prix par km
     * @param float $fee Frais total
     * @return array Étapes du calcul
     */
    private static function getCalculationSteps(
        float $distance,
        float $radius,
        int $extraKm,
        float $pricePerKm,
        float $fee
    ): array {
        return [
            [
                'step' => 1,
                'label' => 'Distance totale',
                'value' => number_format($distance, 1) . ' km',
                'icon' => '📍'
            ],
            [
                'step' => 2,
                'label' => 'Rayon d\'intervention gratuit',
                'value' => $radius . ' km',
                'icon' => '🎯'
            ],
            [
                'step' => 3,
                'label' => 'Distance excédentaire',
                'value' => $extraKm . ' km',
                'calculation' => number_format($distance, 1) . ' - ' . $radius . ' = ' . number_format($distance - $radius, 1) . ' → arrondi à ' . $extraKm . ' km',
                'icon' => '📏'
            ],
            [
                'step' => 4,
                'label' => 'Calcul des frais',
                'value' => number_format($fee, 2) . ' MAD',
                'calculation' => $extraKm . ' km × ' . number_format($pricePerKm, 2) . ' MAD/km = ' . number_format($fee, 2) . ' MAD',
                'icon' => '💰'
            ]
        ];
    }

    /**
     * Valide les coordonnées du prestataire et du client
     *
     * @param array $provider Données prestataire
     * @param array $clientLocation Position client
     * @return bool Validité
     */
    private static function validateCoordinates(array $provider, array $clientLocation): bool
    {
        $providerLat = $provider['latitude'] ?? $provider['current_latitude'] ?? null;
        $providerLng = $provider['longitude'] ?? $provider['current_longitude'] ?? null;
        $clientLat = $clientLocation['lat'] ?? null;
        $clientLng = $clientLocation['lng'] ?? null;

        // Vérifier que toutes les coordonnées sont présentes
        if ($providerLat === null || $providerLng === null ||
            $clientLat === null || $clientLng === null) {
            return false;
        }

        // Vérifier les plages valides
        $providerLat = floatval($providerLat);
        $providerLng = floatval($providerLng);
        $clientLat = floatval($clientLat);
        $clientLng = floatval($clientLng);

        if ($providerLat < -90 || $providerLat > 90) return false;
        if ($providerLng < -180 || $providerLng > 180) return false;
        if ($clientLat < -90 || $clientLat > 90) return false;
        if ($clientLng < -180 || $clientLng > 180) return false;

        return true;
    }

    /**
     * Retourne un résultat d'erreur formaté
     *
     * @param string $message Message d'erreur
     * @return array
     */
    private static function getErrorResult(string $message): array
    {
        return [
            'success' => false,
            'error' => $message,
            'distance_km' => 0,
            'is_in_radius' => true,
            'fee' => 0,
            'fee_formatted' => '0 MAD'
        ];
    }

    /**
     * Compare les frais de plusieurs prestataires pour un même client
     *
     * @param array $providers Liste des prestataires
     * @param array $clientLocation Position du client
     * @return array Prestataires triés par frais croissants
     */
    public static function compareProviders(array $providers, array $clientLocation): array
    {
        $results = [];

        foreach ($providers as $provider) {
            $calculation = self::calculate($provider, $clientLocation);
            $results[] = [
                'provider_id' => $provider['id'] ?? null,
                'provider_name' => $provider['first_name'] ?? 'Prestataire',
                'distance_km' => $calculation['distance_km'],
                'is_in_radius' => $calculation['is_in_radius'],
                'fee' => $calculation['fee'],
                'intervention_radius_km' => $calculation['intervention_radius_km'] ?? 0
            ];
        }

        // Trier par frais croissants
        usort($results, function ($a, $b) {
            return $a['fee'] <=> $b['fee'];
        });

        return $results;
    }

    /**
     * Récupère la configuration par défaut pour une ville
     *
     * @param string $city Nom de la ville
     * @return array Configuration
     */
    public static function getCityConfig(string $city = 'default'): array
    {
        $city = strtolower($city);
        return self::CITY_CONFIGS[$city] ?? self::CITY_CONFIGS['default'];
    }
}
