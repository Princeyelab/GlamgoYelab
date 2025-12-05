<?php

/**
 * ProviderController - Gestion des prestataires
 *
 * Contrôleur pour gérer les fonctionnalités côté prestataire
 */
class ProviderController extends Controller
{
    /**
     * Liste les commandes en attente (pending) que le prestataire peut accepter
     *
     * GET /api/provider/pending-orders
     *
     * Note: Cette route devrait être protégée par un ProviderMiddleware
     * Pour l'instant, on simule avec AuthMiddleware et on vérifie manuellement
     *
     * @return void
     */
    public function getPendingOrders(): void
    {
        // Récupérer l'utilisateur authentifié
        // NOTE: Dans une implémentation complète, il faudrait un ProviderMiddleware
        // qui charge le prestataire au lieu de l'utilisateur
        // Pour cette démo, on suppose que l'ID du prestataire est passé en paramètre ou en header

        try {
            // Récupérer toutes les commandes en attente
            $pendingOrders = Order::getPendingOrders();

            // Pour chaque commande, on peut ajouter des informations supplémentaires
            // comme la distance si on a les coordonnées du prestataire
            foreach ($pendingOrders as &$order) {
                // Formater les dates pour une meilleure lisibilité
                $order['time_ago'] = self::getTimeAgo($order['created_at']);

                // Déterminer si c'est urgent (commande sans scheduled_time = demande immédiate)
                $order['is_urgent'] = empty($order['scheduled_time']);

                // Calculer le temps avant le rendez-vous programmé si applicable
                if (!empty($order['scheduled_time'])) {
                    $scheduledTime = new DateTime($order['scheduled_time']);
                    $now = new DateTime();
                    $interval = $now->diff($scheduledTime);

                    if ($scheduledTime > $now) {
                        $order['time_until_scheduled'] = $interval->format('%h heures %i minutes');
                    }
                }
            }

            $this->success([
                'orders' => $pendingOrders,
                'total' => count($pendingOrders)
            ], 'Commandes en attente récupérées avec succès');

        } catch (Exception $e) {
            $this->error('Erreur lors de la récupération des commandes: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Permet à un prestataire d'accepter une commande
     *
     * POST /api/provider/orders/{id}/accept
     *
     * Note: Protégé par ProviderMiddleware
     *
     * @param array $params Paramètres de la route (contient 'id')
     * @return void
     */
    public function acceptOrder(array $params = []): void
    {
        // Vérifier que l'ID est fourni
        if (!isset($params['id']) || !is_numeric($params['id'])) {
            $this->error('ID de commande invalide', 400);
        }

        $orderId = (int) $params['id'];

        // Récupérer le prestataire authentifié depuis le middleware
        $provider = ProviderMiddleware::provider();
        $providerId = (int) $provider['id'];

        try {
            // 1. Vérifier que la commande existe
            $order = Order::findById($orderId);

            if (!$order) {
                $this->error('Commande non trouvée', 404);
            }

            // 2. Vérifier que la commande est bien en statut 'pending'
            if ($order['status'] !== 'pending') {
                $this->error('Cette commande a déjà été acceptée ou n\'est plus disponible', 400);
            }

            // 3. Vérifier que la commande n'a pas déjà un prestataire assigné
            if (!empty($order['provider_id'])) {
                $this->error('Cette commande a déjà été acceptée par un autre prestataire', 409);
            }

            // 4. Vérifier que le prestataire existe
            $provider = Provider::findById($providerId);

            if (!$provider) {
                $this->error('Prestataire non trouvé', 404);
            }

            // 5. Vérifier que le prestataire propose bien ce service
            if (!Provider::offersService($providerId, $order['service_id'])) {
                $this->error('Vous ne proposez pas ce service', 403);
            }

            // 6. Assigner le prestataire à la commande et changer le statut
            $success = Order::assignProvider($orderId, $providerId);

            if (!$success) {
                $this->error('Erreur lors de l\'acceptation de la commande', 500);
            }

            // 7. Logger l'acceptation
            error_log("✅ [ORDER ACCEPTED] Commande #$orderId acceptée par le prestataire #$providerId");
            error_log("   Service: {$order['service_name']}");
            error_log("   Client: {$order['user_first_name']} {$order['user_last_name']}");
            error_log("   Adresse: {$order['full_address']}");

            // 8. Récupérer la commande mise à jour
            $updatedOrder = Order::findById($orderId);

            // 9. Retourner la réponse de succès
            $this->success([
                'order' => $updatedOrder,
                'message' => 'Commande acceptée avec succès'
            ], 'Commande acceptée', 200);

        } catch (Exception $e) {
            error_log("Erreur lors de l'acceptation de la commande: " . $e->getMessage());
            $this->error('Erreur lors de l\'acceptation de la commande: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Liste les commandes du prestataire
     *
     * GET /api/provider/my-orders
     *
     * Note: Protégé par ProviderMiddleware
     *
     * @return void
     */
    public function getMyOrders(): void
    {
        // Récupérer le prestataire authentifié depuis le middleware
        $provider = ProviderMiddleware::provider();
        $providerId = (int) $provider['id'];

        try {
            // Récupérer toutes les commandes du prestataire
            $orders = Order::findByProviderId($providerId);

            $this->success([
                'orders' => $orders,
                'total' => count($orders)
            ], 'Commandes récupérées avec succès');

        } catch (Exception $e) {
            $this->error('Erreur lors de la récupération des commandes: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Met à jour le statut d'une commande
     *
     * PUT /api/provider/orders/{id}/status
     * Body: { status: "en_route" | "in_progress" | "completed" }
     *
     * Note: Protégé par ProviderMiddleware
     *
     * @param array $params Paramètres de la route
     * @return void
     */
    public function updateOrderStatus(array $params = []): void
    {
        // Vérifier que l'ID est fourni
        if (!isset($params['id']) || !is_numeric($params['id'])) {
            $this->error('ID de commande invalide', 400);
        }

        $orderId = (int) $params['id'];

        // Récupérer le prestataire authentifié depuis le middleware
        $provider = ProviderMiddleware::provider();
        $providerId = (int) $provider['id'];

        // Récupérer les données JSON
        $data = $this->getJsonInput();

        // Validation
        $errors = $this->validate($data, [
            'status' => 'required'
        ]);

        if (!empty($errors)) {
            $this->error('Erreurs de validation', 422, $errors);
        }

        $newStatus = $data['status'];

        // Vérifier que le statut est valide
        $validStatuses = ['en_route', 'in_progress', 'completed'];
        if (!in_array($newStatus, $validStatuses)) {
            $this->error('Statut invalide. Valeurs acceptées: ' . implode(', ', $validStatuses), 400);
        }

        try {
            // Vérifier que la commande existe
            $order = Order::findById($orderId);

            if (!$order) {
                $this->error('Commande non trouvée', 404);
            }

            // Vérifier que la commande appartient au prestataire
            if ((int)$order['provider_id'] !== $providerId) {
                $this->error('Cette commande ne vous appartient pas', 403);
            }

            // Mettre à jour le statut
            $success = Order::updateStatus($orderId, $newStatus);

            if (!$success) {
                $this->error('Erreur lors de la mise à jour du statut', 500);
            }

            error_log("📝 [ORDER STATUS] Commande #$orderId : statut changé en '$newStatus'");

            // Récupérer la commande mise à jour
            $updatedOrder = Order::findById($orderId);

            $this->success([
                'order' => $updatedOrder
            ], 'Statut mis à jour avec succès');

        } catch (Exception $e) {
            $this->error('Erreur lors de la mise à jour du statut: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Met à jour la localisation du prestataire
     *
     * POST /api/provider/location
     * Body: { lat: 31.6295, lon: -7.9811 }
     *
     * Note: Protégé par ProviderMiddleware
     * Cette méthode est utilisée pour le suivi en temps réel pendant les interventions
     *
     * @return void
     */
    public function updateLocation(): void
    {
        // Récupérer le prestataire authentifié depuis le middleware
        $provider = ProviderMiddleware::provider();
        $providerId = (int) $provider['id'];

        // Récupérer les données JSON
        $data = $this->getJsonInput();

        // Validation
        $errors = $this->validate($data, [
            'lat' => 'required|numeric',
            'lon' => 'required|numeric'
        ]);

        if (!empty($errors)) {
            $this->error('Erreurs de validation', 422, $errors);
        }

        $lat = (float) $data['lat'];
        $lon = (float) $data['lon'];

        // Validation des coordonnées (latitude: -90 à 90, longitude: -180 à 180)
        if ($lat < -90 || $lat > 90 || $lon < -180 || $lon > 180) {
            $this->error('Coordonnées géographiques invalides', 400);
        }

        try {
            // Mettre à jour la position
            $success = Provider::updateLocation($providerId, $lat, $lon);

            if (!$success) {
                $this->error('Erreur lors de la mise à jour de la position', 500);
            }

            error_log("📍 [PROVIDER LOCATION] Prestataire #$providerId : position mise à jour ($lat, $lon)");

            // Récupérer le prestataire mis à jour
            $updatedProvider = Provider::findById($providerId);

            $this->success([
                'provider' => Provider::getPublicData($updatedProvider),
                'lat' => $lat,
                'lon' => $lon
            ], 'Position mise à jour avec succès');

        } catch (Exception $e) {
            $this->error('Erreur lors de la mise à jour de la position: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Calcule le temps écoulé depuis une date
     *
     * @param string $datetime Date/heure
     * @return string Temps écoulé (ex: "il y a 5 minutes")
     */
    private static function getTimeAgo(string $datetime): string
    {
        $timestamp = strtotime($datetime);
        $diff = time() - $timestamp;

        if ($diff < 60) {
            return "il y a quelques secondes";
        } elseif ($diff < 3600) {
            $mins = floor($diff / 60);
            return "il y a $mins minute" . ($mins > 1 ? 's' : '');
        } elseif ($diff < 86400) {
            $hours = floor($diff / 3600);
            return "il y a $hours heure" . ($hours > 1 ? 's' : '');
        } else {
            $days = floor($diff / 86400);
            return "il y a $days jour" . ($days > 1 ? 's' : '');
        }
    }
}
