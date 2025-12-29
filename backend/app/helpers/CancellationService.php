<?php

namespace App\Helpers;

use App\Core\Database;

/**
 * Service de gestion des annulations avec calcul des frais
 */
class CancellationService
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Calcule les frais d'annulation pour une commande
     *
     * @param array $order Les données de la commande
     * @param string $cancelledBy 'client' ou 'provider'
     * @param array|null $providerLocation Position actuelle du prestataire [lat, lng]
     * @return array Informations sur les frais d'annulation
     */
    public function calculateCancellationFee(array $order, string $cancelledBy, ?array $providerLocation = null): array
    {
        $status = $order['status'];
        $scheduledAt = $order['scheduled_at'] ?? null;
        $totalPrice = (float)($order['total_price'] ?? $order['price'] ?? 0);

        // Calculer le temps avant le RDV
        $hoursUntilAppointment = null;
        if ($scheduledAt) {
            try {
                $scheduledTime = strtotime($scheduledAt);
                if ($scheduledTime !== false && $scheduledTime > 0) {
                    $now = time();
                    $hoursUntilAppointment = ($scheduledTime - $now) / 3600;
                }
            } catch (\Exception $e) {
                // Date invalide - ignorer
                error_log("[CancellationService] Invalid scheduled_at: " . $scheduledAt);
            }
        }

        // Récupérer la règle applicable
        $rule = $this->getApplicableRule($status, $cancelledBy, $hoursUntilAppointment);

        if (!$rule) {
            // Pas de règle = pas de frais
            return [
                'fee' => 0,
                'percentage' => 0,
                'reason' => 'no_rule_found',
                'penalty_points' => 0,
                'can_cancel' => true
            ];
        }

        $feePercentage = $rule['min_fee_percentage'];
        $fee = 0;
        $distanceTraveled = null;

        // Cas spécial: ON_WAY avec frais variables selon la distance
        if ($status === 'on_way' && $cancelledBy === 'client' && $providerLocation) {
            $result = $this->calculateOnWayFee($order, $providerLocation, $totalPrice, $rule);
            $feePercentage = $result['percentage'];
            $fee = $result['fee'];
            $distanceTraveled = $result['distance_traveled'];
        } else {
            // Frais fixes basés sur le pourcentage
            $fee = ($totalPrice * $feePercentage) / 100;
        }

        return [
            'fee' => round($fee, 2),
            'percentage' => $feePercentage,
            'reason' => $this->getReasonKey($status, $cancelledBy, $hoursUntilAppointment),
            'penalty_points' => $rule['provider_penalty_points'] ?? 0,
            'can_cancel' => true,
            'distance_traveled' => $distanceTraveled,
            'hours_until_appointment' => $hoursUntilAppointment,
            'rule_description' => $rule['description'] ?? null
        ];
    }

    /**
     * Calcule les frais pour une annulation ON_WAY (variable selon distance parcourue)
     */
    private function calculateOnWayFee(array $order, array $providerLocation, float $totalPrice, array $rule): array
    {
        // Position du client
        $clientLat = (float)($order['latitude'] ?? 0);
        $clientLng = (float)($order['longitude'] ?? 0);

        // Position actuelle du prestataire
        $providerLat = (float)$providerLocation['lat'];
        $providerLng = (float)$providerLocation['lng'];

        // Position de départ du prestataire (si disponible via tracking)
        $startPosition = $this->getProviderStartPosition($order['id']);

        if ($startPosition) {
            // Calculer la distance totale du trajet
            $totalDistance = $this->calculateDistance(
                $startPosition['lat'], $startPosition['lng'],
                $clientLat, $clientLng
            );

            // Calculer la distance déjà parcourue
            $distanceTraveled = $this->calculateDistance(
                $startPosition['lat'], $startPosition['lng'],
                $providerLat, $providerLng
            );

            // Calculer le pourcentage du trajet effectué
            $progressPercentage = $totalDistance > 0
                ? min(100, ($distanceTraveled / $totalDistance) * 100)
                : 0;

            // Frais = entre min et max selon la progression
            $minFee = $rule['min_fee_percentage'];
            $maxFee = $rule['max_fee_percentage'];
            $feePercentage = $minFee + (($maxFee - $minFee) * ($progressPercentage / 100));

        } else {
            // Pas de position de départ, calculer distance restante
            $distanceRemaining = $this->calculateDistance(
                $providerLat, $providerLng,
                $clientLat, $clientLng
            );

            // Si prestataire est proche (< 1km), frais max
            if ($distanceRemaining < 1) {
                $feePercentage = $rule['max_fee_percentage'];
            } elseif ($distanceRemaining < 5) {
                $feePercentage = ($rule['min_fee_percentage'] + $rule['max_fee_percentage']) / 2;
            } else {
                $feePercentage = $rule['min_fee_percentage'];
            }

            $distanceTraveled = null;
        }

        $fee = ($totalPrice * $feePercentage) / 100;

        return [
            'fee' => round($fee, 2),
            'percentage' => round($feePercentage, 0),
            'distance_traveled' => $distanceTraveled ? round($distanceTraveled, 2) : null
        ];
    }

    /**
     * Récupère la position de départ du prestataire depuis le tracking
     */
    private function getProviderStartPosition(int $orderId): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT latitude, longitude FROM location_tracking
             WHERE order_id = ?
             ORDER BY created_at ASC
             LIMIT 1"
        );
        $stmt->execute([$orderId]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);

        if ($result) {
            return [
                'lat' => (float)$result['latitude'],
                'lng' => (float)$result['longitude']
            ];
        }

        return null;
    }

    /**
     * Récupère la règle d'annulation applicable
     */
    private function getApplicableRule(string $status, string $cancelledBy, ?float $hoursUntil): ?array
    {
        // Chercher d'abord une règle avec hours_before_appointment
        if ($hoursUntil !== null) {
            $stmt = $this->db->prepare(
                "SELECT * FROM cancellation_rules
                 WHERE status = ? AND cancelled_by = ? AND is_active = true
                 AND hours_before_appointment IS NOT NULL
                 AND hours_before_appointment >= ?
                 ORDER BY hours_before_appointment ASC
                 LIMIT 1"
            );
            $stmt->execute([$status, $cancelledBy, floor($hoursUntil)]);
            $rule = $stmt->fetch(\PDO::FETCH_ASSOC);
            if ($rule) return $rule;
        }

        // Sinon, chercher une règle sans contrainte de temps
        $stmt = $this->db->prepare(
            "SELECT * FROM cancellation_rules
             WHERE status = ? AND cancelled_by = ? AND is_active = true
             AND hours_before_appointment IS NULL
             LIMIT 1"
        );
        $stmt->execute([$status, $cancelledBy]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    /**
     * Calcule la distance entre deux points GPS (formule Haversine)
     */
    private function calculateDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371; // km

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Génère une clé de raison pour la traduction frontend
     */
    private function getReasonKey(string $status, string $cancelledBy, ?float $hoursUntil): string
    {
        if ($status === 'pending') {
            return 'cancellation_free';
        }

        if ($status === 'accepted') {
            if ($hoursUntil !== null && $hoursUntil >= 2) {
                return 'cancellation_free_advance';
            }
            return 'cancellation_fee_short_notice';
        }

        if ($status === 'on_way') {
            return 'cancellation_fee_provider_traveling';
        }

        return 'cancellation_standard';
    }

    /**
     * Vérifie si une commande peut être annulée
     */
    public function canCancel(array $order, string $cancelledBy): array
    {
        $status = $order['status'];

        // Statuts non annulables
        $nonCancellableStatuses = ['in_progress', 'completed', 'cancelled'];

        if (in_array($status, $nonCancellableStatuses)) {
            return [
                'can_cancel' => false,
                'reason' => 'status_not_cancellable'
            ];
        }

        // Vérifier si le prestataire est suspendu (pour éviter abus)
        if ($cancelledBy === 'provider') {
            $provider = $this->getProvider($order['provider_id']);
            if ($provider && $provider['is_suspended']) {
                return [
                    'can_cancel' => false,
                    'reason' => 'provider_suspended'
                ];
            }
        }

        return ['can_cancel' => true, 'reason' => null];
    }

    /**
     * Récupère les infos du prestataire
     */
    private function getProvider(int $providerId): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM providers WHERE id = ?");
        $stmt->execute([$providerId]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }
}
