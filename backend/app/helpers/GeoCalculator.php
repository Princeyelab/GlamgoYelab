<?php

namespace App\Helpers;

use App\Core\Database;
use PDO;
use DateTime;
use DateInterval;

/**
 * Helper pour les calculs géographiques
 * Utilisé pour trouver les prestataires les plus proches
 *
 * @package GlamGo
 * @author GlamGo Team
 */
class GeoCalculator
{
    // Rayon de la Terre en kilomètres
    const EARTH_RADIUS_KM = 6371;

    // Rayon par défaut de recherche (Marrakech)
    const DEFAULT_RADIUS_KM = 30;

    // Prix par km supplémentaire par défaut
    const DEFAULT_PRICE_PER_EXTRA_KM = 5.00;

    // Rayon d'intervention par défaut des prestataires
    const DEFAULT_INTERVENTION_RADIUS = 10;

    /**
     * Calcule la distance entre deux points GPS en utilisant la formule Haversine
     */
    public static function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $lat1Rad = deg2rad($lat1);
        $lat2Rad = deg2rad($lat2);
        $lon1Rad = deg2rad($lon1);
        $lon2Rad = deg2rad($lon2);

        $deltaLat = $lat2Rad - $lat1Rad;
        $deltaLon = $lon2Rad - $lon1Rad;

        $a = sin($deltaLat / 2) ** 2 +
             cos($lat1Rad) * cos($lat2Rad) * sin($deltaLon / 2) ** 2;

        $c = 2 * asin(sqrt($a));

        return self::EARTH_RADIUS_KM * $c;
    }

    /**
     * Trouve les prestataires dans un rayon donné offrant un service spécifique
     */
    public static function findProvidersInRadius(
        float $lat,
        float $lng,
        float $radiusKm,
        int $serviceId,
        array $options = []
    ): array {
        $db = Database::getInstance();

        // Extraire les options
        $formula = $options['formula_type'] ?? $options['formula'] ?? 'standard';
        $onlyAvailable = $options['only_available'] ?? true;
        $limit = $options['limit'] ?? 20;
        // Mode test: ignorer la vérification pour afficher tous les prestataires
        $testMode = $options['test_mode'] ?? false;

        $latDelta = $radiusKm / 111;
        $lngDelta = $radiusKm / (111 * cos(deg2rad($lat)));

        $minLat = $lat - $latDelta;
        $maxLat = $lat + $latDelta;
        $minLng = $lng - $lngDelta;
        $maxLng = $lng + $lngDelta;

        $sql = "SELECT
                    p.id,
                    p.first_name,
                    p.last_name,
                    p.phone,
                    p.email,
                    p.avatar,
                    p.current_latitude as latitude,
                    p.current_longitude as longitude,
                    p.rating,
                    p.total_reviews,
                    p.account_status as status,
                    p.is_available,
                    p.is_verified,
                    COALESCE(p.intervention_radius_km, :default_radius) as intervention_radius_km,
                    COALESCE(p.price_per_extra_km, :default_price_km) as price_per_extra_km,
                    s.price as service_base_price,
                    s.name as service_name,
                    s.duration_minutes,
                    c.name as category_name
                FROM providers p
                INNER JOIN provider_services ps ON p.id = ps.provider_id
                INNER JOIN services s ON ps.service_id = s.id
                INNER JOIN categories c ON s.category_id = c.id
                WHERE ps.service_id = :service_id
                  AND p.current_latitude IS NOT NULL
                  AND p.current_longitude IS NOT NULL
                  AND p.current_latitude BETWEEN :min_lat AND :max_lat
                  AND p.current_longitude BETWEEN :min_lng AND :max_lng";

        // En mode test, ne pas filtrer par is_verified
        if (!$testMode) {
            $sql .= " AND p.is_verified = 1";
        }

        if ($onlyAvailable) {
            $sql .= " AND p.is_available = 1";
        }

        $sql .= " ORDER BY p.rating DESC, p.total_reviews DESC LIMIT :limit";

        $stmt = $db->prepare($sql);
        $stmt->bindValue(':service_id', $serviceId, PDO::PARAM_INT);
        $stmt->bindValue(':min_lat', $minLat);
        $stmt->bindValue(':max_lat', $maxLat);
        $stmt->bindValue(':min_lng', $minLng);
        $stmt->bindValue(':max_lng', $maxLng);
        $stmt->bindValue(':default_radius', self::DEFAULT_INTERVENTION_RADIUS);
        $stmt->bindValue(':default_price_km', self::DEFAULT_PRICE_PER_EXTRA_KM);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        $providers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $filteredProviders = [];

        foreach ($providers as $provider) {
            $distance = self::calculateDistance(
                $lat, $lng,
                (float) $provider['latitude'],
                (float) $provider['longitude']
            );

            if ($distance <= $radiusKm) {
                $provider['distance'] = round($distance, 2);

                $interventionRadius = (float) $provider['intervention_radius_km'];
                $extraDistance = max(0, $distance - $interventionRadius);
                $provider['extra_distance_km'] = round($extraDistance, 2);
                $provider['distance_fee'] = round($extraDistance * (float) $provider['price_per_extra_km'], 2);

                $provider['price_breakdown'] = self::calculatePriceBreakdown(
                    $provider,
                    $formula,
                    $distance
                );
                $provider['calculated_price'] = $provider['price_breakdown']['total'];

                $provider['is_available_now'] = self::checkRealTimeAvailability($provider['id']);
                $provider['next_availability'] = self::getNextAvailability($provider['id']);

                $filteredProviders[] = $provider;
            }
        }

        return $filteredProviders;
    }

    /**
     * Trie les prestataires par distance croissante
     */
    public static function sortByDistance(array $providers, float $clientLat, float $clientLng): array
    {
        usort($providers, function ($a, $b) {
            return $a['distance'] <=> $b['distance'];
        });

        return $providers;
    }

    /**
     * Calcule le détail du prix pour un prestataire
     */
    public static function calculatePriceBreakdown(array $provider, string $formula, float $distance): array
    {
        $basePrice = (float) ($provider['service_base_price'] ?? 0);

        $formulaMultipliers = [
            'express' => 1.5,
            'premium' => 1.3,
            'standard' => 1.0,
            'eco' => 0.9
        ];

        $multiplier = $formulaMultipliers[$formula] ?? 1.0;
        $formulaPrice = $basePrice * $multiplier;
        $formulaAdjustment = $formulaPrice - $basePrice;

        $interventionRadius = (float) ($provider['intervention_radius_km'] ?? self::DEFAULT_INTERVENTION_RADIUS);
        $pricePerExtraKm = (float) ($provider['price_per_extra_km'] ?? self::DEFAULT_PRICE_PER_EXTRA_KM);

        $extraDistance = max(0, $distance - $interventionRadius);
        $distanceFee = round($extraDistance * $pricePerExtraKm, 2);

        $total = round($formulaPrice + $distanceFee, 2);

        return [
            'base_price' => $basePrice,
            'formula' => $formula,
            'formula_multiplier' => $multiplier,
            'formula_adjustment' => round($formulaAdjustment, 2),
            'formula_price' => round($formulaPrice, 2),
            'intervention_radius_km' => $interventionRadius,
            'distance_km' => round($distance, 2),
            'extra_distance_km' => round($extraDistance, 2),
            'price_per_extra_km' => $pricePerExtraKm,
            'distance_fee' => $distanceFee,
            'total' => $total,
            'currency' => 'MAD'
        ];
    }

    /**
     * Vérifie la disponibilité en temps réel d'un prestataire
     */
    public static function checkRealTimeAvailability(int $providerId): bool
    {
        $db = Database::getInstance();

        $stmt = $db->prepare(
            "SELECT id FROM orders
             WHERE provider_id = :provider_id
               AND status IN ('accepted', 'en_route', 'in_progress')
             LIMIT 1"
        );
        $stmt->bindValue(':provider_id', $providerId, PDO::PARAM_INT);
        $stmt->execute();

        if ($stmt->fetch()) {
            return false;
        }

        $stmt = $db->prepare(
            "SELECT account_status, is_available FROM providers WHERE id = :id"
        );
        $stmt->bindValue(':id', $providerId, PDO::PARAM_INT);
        $stmt->execute();
        $provider = $stmt->fetch(PDO::FETCH_ASSOC);

        return $provider &&
               $provider['is_available'] &&
               $provider['account_status'] === 'active';
    }

    /**
     * Obtient la prochaine disponibilité d'un prestataire
     */
    public static function getNextAvailability(int $providerId): ?string
    {
        if (self::checkRealTimeAvailability($providerId)) {
            return null;
        }

        $db = Database::getInstance();

        $stmt = $db->prepare(
            "SELECT o.id, o.started_at, s.duration_minutes
             FROM orders o
             JOIN services s ON o.service_id = s.id
             WHERE o.provider_id = :provider_id
               AND o.status IN ('in_progress')
             LIMIT 1"
        );
        $stmt->bindValue(':provider_id', $providerId, PDO::PARAM_INT);
        $stmt->execute();
        $currentOrder = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($currentOrder && $currentOrder['started_at']) {
            $startTime = new DateTime($currentOrder['started_at']);
            $duration = (int) $currentOrder['duration_minutes'];
            $startTime->add(new DateInterval("PT{$duration}M"));
            return $startTime->format('H:i');
        }

        $now = new DateTime();
        $now->add(new DateInterval('PT30M'));
        return $now->format('H:i');
    }

    /**
     * Calcule le centre géographique d'un ensemble de points
     */
    public static function calculateCenter(array $points): array
    {
        if (empty($points)) {
            return ['lat' => 31.6295, 'lng' => -7.9811];
        }

        $sumLat = 0;
        $sumLng = 0;
        $count = count($points);

        foreach ($points as $point) {
            $sumLat += $point['lat'] ?? $point['latitude'] ?? 0;
            $sumLng += $point['lng'] ?? $point['longitude'] ?? 0;
        }

        return [
            'lat' => $sumLat / $count,
            'lng' => $sumLng / $count
        ];
    }

    /**
     * Calcule le zoom optimal pour afficher tous les points sur une carte
     */
    public static function calculateOptimalZoom(array $points, float $clientLat, float $clientLng): int
    {
        if (empty($points)) {
            return 14;
        }

        $maxDistance = 0;

        foreach ($points as $point) {
            $lat = $point['lat'] ?? $point['latitude'] ?? $clientLat;
            $lng = $point['lng'] ?? $point['longitude'] ?? $clientLng;

            $distance = self::calculateDistance($clientLat, $clientLng, $lat, $lng);
            $maxDistance = max($maxDistance, $distance);
        }

        if ($maxDistance < 1) return 16;
        if ($maxDistance < 2) return 15;
        if ($maxDistance < 5) return 14;
        if ($maxDistance < 10) return 13;
        if ($maxDistance < 20) return 12;
        if ($maxDistance < 40) return 11;
        return 10;
    }
}
