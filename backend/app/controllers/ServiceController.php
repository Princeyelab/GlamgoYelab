<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Service;
use App\Helpers\GeoCalculator;
use App\Helpers\PriceCalculator;

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
     * Récupère un service par ID
     */
    public function show(string $id): void
    {
        $service = $this->serviceModel->find((int)$id);

        if (!$service) {
            $this->error('Service non trouvé', 404);
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
        $serviceId = (int) $id;

        // Vérifier que le service existe
        $service = $this->serviceModel->find($serviceId);
        if (!$service) {
            $this->error('Service non trouvé', 404);
            return;
        }

        // Récupérer les paramètres
        $queryParams = $this->getQueryParams();

        // Validation des coordonnées (requises)
        if (!isset($queryParams['lat']) || !isset($queryParams['lng'])) {
            $this->error('Les coordonnées lat et lng sont requises', 400);
            return;
        }

        $lat = (float) $queryParams['lat'];
        $lng = (float) $queryParams['lng'];

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

        // Limiter le rayon maximum à 50km
        $radius = min($radius, 50);

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
}
