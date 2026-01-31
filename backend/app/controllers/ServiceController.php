<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Service;
use App\Helpers\GeoCalculator;
use App\Helpers\PriceCalculator;
use App\Helpers\JWT;

class ServiceController extends Controller
{
    private Service $serviceModel;

    public function __construct()
    {
        $this->serviceModel = new Service();
    }

    /**
     * Liste tous les services
     */
    public function index(): void
    {
        $queryParams = $this->getQueryParams();

        // Recherche
        if (isset($queryParams['search'])) {
            $services = $this->serviceModel->search($queryParams['search']);
        }
        // Par catégorie
        elseif (isset($queryParams['category_id'])) {
            $services = $this->serviceModel->getByCategory((int)$queryParams['category_id']);
        }
        // Tous
        else {
            $services = $this->serviceModel->getAllWithCategory();
        }

        $this->success($services);
    }

    /**
     * Récupère les services mis en avant
     * GET /api/services/featured
     */
    public function featured(): void
    {
        // Récupérer les services avec le plus de commandes ou les mieux notés
        $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 20) : 10;

        $db = \App\Core\Database::getInstance();

        // Sélectionner les services les plus populaires (avec le plus de commandes)
        $sql = "SELECT s.*, c.name as category_name, c.icon as category_icon,
                       COUNT(o.id) as order_count
                FROM services s
                LEFT JOIN categories c ON s.category_id = c.id
                LEFT JOIN orders o ON o.service_id = s.id
                WHERE s.is_active = 1 OR s.is_active IS NULL
                GROUP BY s.id
                ORDER BY order_count DESC, s.price ASC
                LIMIT ?";

        $stmt = $db->prepare($sql);
        $stmt->execute([$limit]);
        $services = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Si pas assez de résultats, compléter avec les services par catégorie
        if (count($services) < $limit) {
            $existingIds = array_column($services, 'id');
            $existingIdsStr = empty($existingIds) ? '0' : implode(',', $existingIds);

            $remaining = $limit - count($services);
            $sql2 = "SELECT s.*, c.name as category_name, c.icon as category_icon
                     FROM services s
                     LEFT JOIN categories c ON s.category_id = c.id
                     WHERE s.id NOT IN ($existingIdsStr)
                     AND (s.is_active = 1 OR s.is_active IS NULL)
                     ORDER BY s.category_id, s.name
                     LIMIT ?";

            $stmt2 = $db->prepare($sql2);
            $stmt2->execute([$remaining]);
            $additionalServices = $stmt2->fetchAll(\PDO::FETCH_ASSOC);

            $services = array_merge($services, $additionalServices);
        }

        $this->success($services);
    }

    /**
     * Récupère un service par ID
     * Supporte les services personnalisés avec ID préfixé "custom_"
     */
    public function show(string $id): void
    {
        // Vérifier si c'est un service personnalisé
        if (str_starts_with($id, 'custom_')) {
            $customId = (int) str_replace('custom_', '', $id);
            $service = $this->serviceModel->findCustomService($customId);

            if (!$service) {
                $this->error('Service personnalisé non trouvé', 404);
                return;
            }

            $this->success($service);
            return;
        }

        // Service standard
        $service = $this->serviceModel->find((int)$id);

        if (!$service) {
            $this->error('Service non trouvé', 404);
            return;
        }

        $this->success($service);
    }

    /**
     * GET /api/services/{id}/nearby-providers
     *
     * Trouve les prestataires à proximité pour un service donné
     *
     * Paramètres GET:
     * - lat: Latitude du client (requis)
     * - lng: Longitude du client (requis)
     * - radius: Rayon de recherche en km (optionnel, défaut 30)
     * - formula: Type de formule (optionnel, défaut 'standard')
     * - scheduled_time: Heure prévue (optionnel)
     * - only_available: Filtrer uniquement disponibles (optionnel, défaut true)
     *
     * @param string $id ID du service
     */
    public function getNearbyProviders(string $id): void
    {
        // Récupérer les paramètres d'abord pour la validation
        $queryParams = $this->getQueryParams();

        // Validation des coordonnées (requises)
        if (!isset($queryParams['lat']) || !isset($queryParams['lng'])) {
            $this->error('Les coordonnées lat et lng sont requises', 400);
            return;
        }

        $lat = (float) $queryParams['lat'];
        $lng = (float) $queryParams['lng'];

        // Vérifier si c'est un service personnalisé
        if (str_starts_with($id, 'custom_')) {
            $this->getNearbyProvidersForCustomService($id, $lat, $lng, $queryParams);
            return;
        }

        $serviceId = (int) $id;

        // Vérifier que le service existe
        $service = $this->serviceModel->find($serviceId);
        if (!$service) {
            $this->error('Service non trouvé', 404);
            return;
        }

        // Validation des coordonnées
        if ($lat < -90 || $lat > 90) {
            $this->error('Latitude invalide (doit être entre -90 et 90)', 400);
            return;
        }
        if ($lng < -180 || $lng > 180) {
            $this->error('Longitude invalide (doit être entre -180 et 180)', 400);
            return;
        }

        // Paramètres optionnels
        $radius = isset($queryParams['radius']) ? (float) $queryParams['radius'] : 30;
        $formulaType = $queryParams['formula'] ?? 'standard';
        $scheduledTime = $queryParams['scheduled_time'] ?? null;
        $onlyAvailable = !isset($queryParams['only_available']) || $queryParams['only_available'] !== 'false';
        $limit = isset($queryParams['limit']) ? min((int) $queryParams['limit'], 20) : 20;
        // Mode test: ignorer la vérification des prestataires
        $testMode = isset($queryParams['test_mode']) && $queryParams['test_mode'] === 'true';

        // Limiter le rayon maximum (5000km pour tests internationaux France-Maroc)
        $maxRadius = 5000;
        $radius = min($radius, $maxRadius);

        try {
            // Rechercher les prestataires à proximité
            $providers = GeoCalculator::findProvidersInRadius(
                $lat,
                $lng,
                $radius,
                $serviceId,
                [
                    'only_available' => $onlyAvailable,
                    'formula_type' => $formulaType,
                    'scheduled_time' => $scheduledTime,
                    'limit' => $limit,
                    'test_mode' => $testMode
                ]
            );

            // FILTRE: Exclure le prestataire connecté de sa propre liste
            // Cette route est publique, donc on vérifie d'abord s'il y a un utilisateur connecté
            $currentUserId = $this->getCurrentUserId();
            if ($currentUserId) {
                $providers = array_filter($providers, function($provider) use ($currentUserId) {
                    return $provider['user_id'] != $currentUserId;
                });
                // Réindexer le tableau après filtrage
                $providers = array_values($providers);
            }

            // Séparer le plus proche des alternatives
            $nearest = null;
            $alternatives = [];

            if (!empty($providers)) {
                $nearest = $providers[0];
                $alternatives = array_slice($providers, 1, 5); // 5 alternatives max
            }

            // Construire la réponse
            $response = [
                'success' => true,
                'service' => [
                    'id' => $service['id'],
                    'name' => $service['name'],
                    'base_price' => $service['price']
                ],
                'search_params' => [
                    'client_location' => [
                        'lat' => $lat,
                        'lng' => $lng
                    ],
                    'radius_km' => $radius,
                    'formula' => $formulaType,
                    'scheduled_time' => $scheduledTime
                ],
                'nearest' => $nearest,
                'alternatives' => $alternatives,
                'total_found' => count($providers),
                'has_providers_nearby' => !empty($providers)
            ];

            // Ajouter des statistiques de couverture si aucun prestataire trouvé
            if (empty($providers)) {
                $response['coverage_stats'] = [
                    'message' => 'Aucun prestataire disponible dans ce rayon',
                    'suggestion' => 'Essayez d\'augmenter le rayon de recherche'
                ];
            }

            $this->success($response);

        } catch (\InvalidArgumentException $e) {
            $this->error($e->getMessage(), 400);
        } catch (\Exception $e) {
            error_log("Erreur getNearbyProviders: " . $e->getMessage());
            $this->error('Erreur lors de la recherche de prestataires', 500);
        }
    }

    /**
     * GET /api/services/{id}/coverage
     *
     * Obtient les statistiques de couverture pour un service
     *
     * @param string $id ID du service
     */
    public function getCoverage(string $id): void
    {
        $serviceId = (int) $id;

        // Vérifier que le service existe
        $service = $this->serviceModel->find($serviceId);
        if (!$service) {
            $this->error('Service non trouvé', 404);
            return;
        }

        $queryParams = $this->getQueryParams();

        if (!isset($queryParams['lat']) || !isset($queryParams['lng'])) {
            $this->error('Les coordonnées lat et lng sont requises', 400);
            return;
        }

        $lat = (float) $queryParams['lat'];
        $lng = (float) $queryParams['lng'];

        try {
            $stats = GeoCalculator::getCoverageStats($serviceId, $lat, $lng);

            $this->success([
                'service' => [
                    'id' => $service['id'],
                    'name' => $service['name']
                ],
                'location' => [
                    'lat' => $lat,
                    'lng' => $lng
                ],
                'coverage' => $stats
            ]);

        } catch (\Exception $e) {
            error_log("Erreur getCoverage: " . $e->getMessage());
            $this->error('Erreur lors du calcul de couverture', 500);
        }
    }

    /**
     * Récupère l'ID de l'utilisateur connecté depuis le token JWT
     * Retourne null si pas de token ou erreur
     *
     * @return int|null
     */
    private function getCurrentUserId(): ?int
    {
        try {
            // Récupérer le token Bearer depuis les headers
            $headers = getallheaders();

            if (!isset($headers['Authorization'])) {
                return null;
            }

            // Extraire le token
            if (!preg_match('/Bearer\s+(.*)$/i', $headers['Authorization'], $matches)) {
                return null;
            }

            $token = $matches[1];

            // Décoder le token JWT
            $payload = JWT::decode($token);

            if (!$payload || !isset($payload['user_id'])) {
                return null;
            }

            return (int) $payload['user_id'];

        } catch (\Exception $e) {
            // En cas d'erreur (token invalide, expiré, etc.), retourner null
            error_log("Erreur décodage token dans getCurrentUserId: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Gère la recherche de prestataire pour un service personnalisé
     * Pour un service personnalisé, on retourne uniquement le prestataire créateur
     */
    private function getNearbyProvidersForCustomService(string $id, float $lat, float $lng, array $queryParams): void
    {
        $customId = (int) str_replace('custom_', '', $id);

        // Récupérer le service personnalisé avec les infos du prestataire
        $customService = $this->serviceModel->findCustomService($customId);

        if (!$customService) {
            $this->error('Service personnalisé non trouvé', 404);
            return;
        }

        try {
            $db = \App\Core\Database::getInstance();

            // Récupérer les coordonnées du prestataire
            $stmt = $db->prepare("
                SELECT
                    p.id,
                    p.first_name,
                    p.last_name,
                    p.phone,
                    p.email,
                    p.avatar,
                    COALESCE(p.current_latitude, p.latitude) as latitude,
                    COALESCE(p.current_longitude, p.longitude) as longitude,
                    p.rating,
                    p.total_reviews,
                    p.is_available,
                    p.is_verified,
                    COALESCE(p.intervention_radius_km, 15) as intervention_radius_km,
                    COALESCE(p.price_per_extra_km, 5) as price_per_extra_km
                FROM providers p
                WHERE p.id = ?
                  AND p.is_available = TRUE
                  AND p.account_status = 'active'
            ");
            $stmt->execute([$customService['provider_id']]);
            $provider = $stmt->fetch(\PDO::FETCH_ASSOC);

            if (!$provider) {
                $this->success([
                    'success' => true,
                    'service' => [
                        'id' => $customService['id'],
                        'name' => $customService['name'],
                        'base_price' => $customService['price'],
                        'is_custom' => true
                    ],
                    'nearest' => null,
                    'alternatives' => [],
                    'total_found' => 0,
                    'has_providers_nearby' => false,
                    'coverage_stats' => [
                        'message' => 'Le prestataire n\'est pas disponible actuellement'
                    ]
                ]);
                return;
            }

            // Calculer la distance
            $distance = GeoCalculator::calculateDistance(
                $lat, $lng,
                (float) $provider['latitude'],
                (float) $provider['longitude']
            );

            // Calcul des frais de déplacement
            $freeRadius = (float) $provider['intervention_radius_km'];
            $pricePerExtraKm = (float) $provider['price_per_extra_km'];
            $distanceFee = 0;

            if ($distance > $freeRadius) {
                $extraKm = $distance - $freeRadius;
                $distanceFee = round($extraKm * $pricePerExtraKm, 2);
            }

            // Construire les infos du prestataire
            $providerData = [
                'id' => $provider['id'],
                'user_id' => $provider['id'],
                'first_name' => $provider['first_name'],
                'last_name' => $provider['last_name'],
                'avatar' => $provider['avatar'],
                'rating' => $provider['rating'],
                'total_reviews' => $provider['total_reviews'],
                'is_verified' => $provider['is_verified'],
                'is_available' => $provider['is_available'],
                'is_available_now' => true,
                'latitude' => $provider['latitude'],
                'longitude' => $provider['longitude'],
                'distance' => round($distance, 2),
                'distance_formatted' => $distance < 1
                    ? round($distance * 1000) . ' m'
                    : round($distance, 1) . ' km',
                'is_within_free_radius' => $distance <= $freeRadius,
                'intervention_radius_km' => $freeRadius,
                'calculated_price' => $customService['price'] + $distanceFee,
                'price_breakdown' => [
                    'base_price' => $customService['price'],
                    'formula_modifier' => 0,
                    'distance_fee' => $distanceFee,
                    'night_fee' => 0,
                    'subtotal' => $customService['price'] + $distanceFee,
                    'commission_glamgo' => round(($customService['price'] + $distanceFee) * 0.20, 2),
                    'total' => $customService['price'] + $distanceFee
                ]
            ];

            $this->success([
                'success' => true,
                'service' => [
                    'id' => $customService['id'],
                    'name' => $customService['name'],
                    'base_price' => $customService['price'],
                    'is_custom' => true,
                    'provider_id' => $customService['provider_id'],
                    'provider_name' => $customService['provider_name']
                ],
                'search_params' => [
                    'client_location' => ['lat' => $lat, 'lng' => $lng],
                    'formula' => 'standard'
                ],
                'nearest' => $providerData,
                'alternatives' => [], // Pas d'alternatives pour un service personnalisé
                'total_found' => 1,
                'has_providers_nearby' => true,
                'is_custom_service' => true,
                'custom_service_notice' => 'Ce service est proposé exclusivement par ' . $customService['provider_name']
            ]);

        } catch (\Exception $e) {
            error_log("Erreur getNearbyProvidersForCustomService: " . $e->getMessage());
            $this->error('Erreur lors de la recherche du prestataire', 500);
        }
    }
}
