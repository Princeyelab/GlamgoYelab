<?php

/**
 * ServiceController - Gestion des services et catégories
 *
 * Contrôleur pour la partie publique de l'API permettant de lister
 * les catégories et services disponibles
 */
class ServiceController extends Controller
{
    /**
     * Liste toutes les catégories de services
     *
     * GET /api/categories
     *
     * Retourne la liste des catégories actives ordonnées par display_order
     *
     * @return void
     */
    public function getCategories(): void
    {
        try {
            // Récupérer toutes les catégories actives
            $categories = Category::getAll();

            // Ajouter le nombre de services pour chaque catégorie
            foreach ($categories as &$category) {
                $category['services_count'] = Service::countByCategory($category['id']);
            }

            $this->success([
                'categories' => $categories,
                'total' => count($categories)
            ], 'Catégories récupérées avec succès');

        } catch (Exception $e) {
            $this->error('Erreur lors de la récupération des catégories: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Liste les services d'une catégorie spécifique
     *
     * GET /api/categories/{id}/services
     *
     * @param array $params Paramètres de la route (contient 'id')
     * @return void
     */
    public function getServices(array $params = []): void
    {
        // Vérifier que l'ID est fourni
        if (!isset($params['id']) || !is_numeric($params['id'])) {
            $this->error('ID de catégorie invalide', 400);
        }

        $categoryId = (int) $params['id'];

        try {
            // Vérifier que la catégorie existe
            if (!Category::exists($categoryId)) {
                $this->error('Catégorie non trouvée', 404);
            }

            // Récupérer les informations de la catégorie
            $category = Category::findById($categoryId);

            // Récupérer les services de cette catégorie
            $services = Service::findByCategory($categoryId);

            $this->success([
                'category' => $category,
                'services' => $services,
                'total' => count($services)
            ], 'Services récupérés avec succès');

        } catch (Exception $e) {
            $this->error('Erreur lors de la récupération des services: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Liste tous les services (toutes catégories confondues)
     *
     * GET /api/services
     *
     * @return void
     */
    public function getAllServices(): void
    {
        try {
            // Récupérer tous les services
            $services = Service::getAll();

            $this->success([
                'services' => $services,
                'total' => count($services)
            ], 'Services récupérés avec succès');

        } catch (Exception $e) {
            $this->error('Erreur lors de la récupération des services: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Récupère les détails d'un service spécifique
     *
     * GET /api/services/{id}
     *
     * @param array $params Paramètres de la route (contient 'id')
     * @return void
     */
    public function getService(array $params = []): void
    {
        // Vérifier que l'ID est fourni
        if (!isset($params['id']) || !is_numeric($params['id'])) {
            $this->error('ID de service invalide', 400);
        }

        $serviceId = (int) $params['id'];

        try {
            // Récupérer le service
            $service = Service::findById($serviceId);

            if (!$service) {
                $this->error('Service non trouvé', 404);
            }

            $this->success($service, 'Service récupéré avec succès');

        } catch (Exception $e) {
            $this->error('Erreur lors de la récupération du service: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Recherche des services par mot-clé
     *
     * GET /api/services/search?q={keyword}
     *
     * @return void
     */
    public function searchServices(): void
    {
        // Récupérer le mot-clé de recherche
        $queryParams = $this->getQueryParams();
        $keyword = $queryParams['q'] ?? '';

        // Valider le mot-clé
        if (empty($keyword) || strlen($keyword) < 2) {
            $this->error('Le mot-clé de recherche doit contenir au moins 2 caractères', 400);
        }

        try {
            // Rechercher les services
            $services = Service::search($keyword);

            $this->success([
                'services' => $services,
                'total' => count($services),
                'keyword' => $keyword
            ], 'Recherche effectuée avec succès');

        } catch (Exception $e) {
            $this->error('Erreur lors de la recherche: ' . $e->getMessage(), 500);
        }
    }
}
