<?php

/**
 * OrderController - Gestion des commandes
 *
 * Contrôleur pour gérer la création et le suivi des commandes de services
 */
class OrderController extends Controller
{
    /**
     * Crée une nouvelle commande
     *
     * POST /api/orders
     * Body: { service_id, address_id, scheduled_time (optionnel) }
     *
     * Note: Cette route est protégée par AuthMiddleware
     * L'utilisateur est authentifié et disponible via AuthMiddleware::user()
     *
     * @return void
     */
    public function createOrder(): void
    {
        // Récupérer l'utilisateur authentifié depuis le middleware
        $user = AuthMiddleware::user();
        $userId = (int) $user['id'];

        // Récupérer les données JSON
        $data = $this->getJsonInput();

        // Validation des données
        $errors = $this->validate($data, [
            'service_id' => 'required|numeric',
            'address_id' => 'required|numeric'
        ]);

        if (!empty($errors)) {
            $this->error('Erreurs de validation', 422, $errors);
        }

        $serviceId = (int) $data['service_id'];
        $addressId = (int) $data['address_id'];
        $scheduledTime = $data['scheduled_time'] ?? null;

        try {
            // 1. Vérifier que le service existe
            $service = Service::findById($serviceId);

            if (!$service) {
                $this->error('Service non trouvé', 404);
            }

            // 2. Vérifier que l'adresse existe
            $address = Address::findById($addressId);

            if (!$address) {
                $this->error('Adresse non trouvée', 404);
            }

            // 3. Vérifier que l'adresse appartient à l'utilisateur
            if (!Address::belongsToUser($addressId, $userId)) {
                $this->error('Cette adresse ne vous appartient pas', 403);
            }

            // 4. Valider le format de scheduled_time si fourni
            if ($scheduledTime !== null) {
                // Vérifier que c'est une date valide
                $scheduledDateTime = DateTime::createFromFormat('Y-m-d H:i:s', $scheduledTime);
                if (!$scheduledDateTime) {
                    // Essayer un autre format (ISO 8601)
                    $scheduledDateTime = DateTime::createFromFormat('Y-m-d\TH:i:s', $scheduledTime);
                    if ($scheduledDateTime) {
                        $scheduledTime = $scheduledDateTime->format('Y-m-d H:i:s');
                    } else {
                        $this->error('Format de date invalide pour scheduled_time (utilisez Y-m-d H:i:s)', 400);
                    }
                }

                // Vérifier que la date n'est pas dans le passé
                $now = new DateTime();
                if ($scheduledDateTime < $now) {
                    $this->error('La date programmée ne peut pas être dans le passé', 400);
                }
            }

            // 5. Récupérer le prix du service
            $finalPrice = (float) $service['price'];

            // 6. Créer la commande
            $orderData = [
                'user_id' => $userId,
                'service_id' => $serviceId,
                'address_id' => $addressId,
                'status' => 'pending',
                'order_time' => date('Y-m-d H:i:s'),
                'scheduled_time' => $scheduledTime,
                'final_price' => $finalPrice,
                'provider_id' => null, // Pas encore de prestataire
                'tip_amount' => 0.00
            ];

            $orderId = Order::create($orderData);

            // 7. Simulation de Broadcasting - Logger la recherche de prestataires
            error_log("🔍 [BROADCAST] Recherche de prestataires pour la commande #$orderId");
            error_log("   Service: {$service['name']} ({$service['category_name']})");
            error_log("   Adresse: {$address['full_address']}");
            error_log("   Prix: {$finalPrice} MAD");
            if ($scheduledTime) {
                error_log("   Programmée pour: $scheduledTime");
            } else {
                error_log("   Demande immédiate");
            }

            // 8. Récupérer la commande complète avec toutes les relations
            $order = Order::findById($orderId);

            // 9. Retourner la réponse de succès
            $this->success([
                'order' => $order,
                'order_id' => $orderId,
                'message' => 'Commande créée avec succès. Recherche de prestataires en cours...'
            ], 'Commande créée avec succès', 201);

        } catch (Exception $e) {
            error_log("Erreur lors de la création de la commande: " . $e->getMessage());
            $this->error('Erreur lors de la création de la commande: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Liste toutes les commandes de l'utilisateur authentifié
     *
     * GET /api/orders
     *
     * Note: Cette route est protégée par AuthMiddleware
     *
     * @return void
     */
    public function getMyOrders(): void
    {
        // Récupérer l'utilisateur authentifié
        $userId = AuthMiddleware::id();

        try {
            // Récupérer toutes les commandes de l'utilisateur
            $orders = Order::findByUserId($userId);

            $this->success([
                'orders' => $orders,
                'total' => count($orders)
            ], 'Commandes récupérées avec succès');

        } catch (Exception $e) {
            $this->error('Erreur lors de la récupération des commandes: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Récupère les détails d'une commande spécifique
     *
     * GET /api/orders/{id}
     *
     * Note: Cette route est protégée par AuthMiddleware
     *
     * @param array $params Paramètres de la route
     * @return void
     */
    public function getOrder(array $params = []): void
    {
        // Vérifier que l'ID est fourni
        if (!isset($params['id']) || !is_numeric($params['id'])) {
            $this->error('ID de commande invalide', 400);
        }

        $orderId = (int) $params['id'];
        $userId = AuthMiddleware::id();

        try {
            // Récupérer la commande
            $order = Order::findById($orderId);

            if (!$order) {
                $this->error('Commande non trouvée', 404);
            }

            // Vérifier que la commande appartient à l'utilisateur
            if ((int)$order['user_id'] !== $userId) {
                $this->error('Vous n\'avez pas accès à cette commande', 403);
            }

            $this->success($order, 'Commande récupérée avec succès');

        } catch (Exception $e) {
            $this->error('Erreur lors de la récupération de la commande: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Annule une commande
     *
     * PUT /api/orders/{id}/cancel
     * Body: { cancellation_reason (optionnel) }
     *
     * Note: Cette route est protégée par AuthMiddleware
     *
     * @param array $params Paramètres de la route
     * @return void
     */
    public function cancelOrder(array $params = []): void
    {
        // Vérifier que l'ID est fourni
        if (!isset($params['id']) || !is_numeric($params['id'])) {
            $this->error('ID de commande invalide', 400);
        }

        $orderId = (int) $params['id'];
        $userId = AuthMiddleware::id();

        try {
            // Récupérer la commande
            $order = Order::findById($orderId);

            if (!$order) {
                $this->error('Commande non trouvée', 404);
            }

            // Vérifier que la commande appartient à l'utilisateur
            if ((int)$order['user_id'] !== $userId) {
                $this->error('Vous n\'avez pas accès à cette commande', 403);
            }

            // Vérifier que la commande peut être annulée
            if (in_array($order['status'], ['completed', 'cancelled'])) {
                $this->error('Cette commande ne peut plus être annulée', 400);
            }

            // Annuler la commande
            Order::updateStatus($orderId, 'cancelled');

            error_log("❌ [ORDER] Commande #$orderId annulée par l'utilisateur #$userId");

            $this->success([
                'order_id' => $orderId,
                'status' => 'cancelled'
            ], 'Commande annulée avec succès');

        } catch (Exception $e) {
            $this->error('Erreur lors de l\'annulation de la commande: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Récupère le statut d'une commande avec tracking
     *
     * GET /api/orders/{id}/status
     *
     * Retourne le statut de la commande ET la localisation du prestataire
     * si le statut est "en_route" (suivi en temps réel)
     *
     * Note: Cette route est protégée par AuthMiddleware
     *
     * @param array $params Paramètres de la route
     * @return void
     */
    public function getOrderStatus(array $params = []): void
    {
        // Vérifier que l'ID est fourni
        if (!isset($params['id']) || !is_numeric($params['id'])) {
            $this->error('ID de commande invalide', 400);
        }

        $orderId = (int) $params['id'];
        $userId = AuthMiddleware::id();

        try {
            // Récupérer la commande
            $order = Order::findById($orderId);

            if (!$order) {
                $this->error('Commande non trouvée', 404);
            }

            // Vérifier que la commande appartient à l'utilisateur
            if ((int)$order['user_id'] !== $userId) {
                $this->error('Vous n\'avez pas accès à cette commande', 403);
            }

            // Préparer les données de base
            $response = [
                'order_id' => $orderId,
                'status' => $order['status'],
                'service_name' => $order['service_name'],
                'scheduled_time' => $order['scheduled_time'],
                'final_price' => $order['final_price'],
                'created_at' => $order['created_at'],
                'updated_at' => $order['updated_at']
            ];

            // Si la commande est assignée à un prestataire, ajouter les infos du prestataire
            if (!empty($order['provider_id'])) {
                $provider = Provider::findById($order['provider_id']);

                if ($provider) {
                    $response['provider'] = [
                        'id' => $provider['id'],
                        'first_name' => $provider['first_name'],
                        'last_name' => $provider['last_name'],
                        'phone' => $provider['phone'],
                        'rating' => $provider['rating']
                    ];

                    // Si le statut est "en_route", inclure la localisation en temps réel
                    if ($order['status'] === 'en_route') {
                        $response['provider']['location'] = [
                            'lat' => $provider['current_lat'],
                            'lon' => $provider['current_lon'],
                            'last_update' => $provider['updated_at']
                        ];

                        // Calculer la distance si on a les coordonnées du prestataire et de l'adresse
                        if (!empty($provider['current_lat']) && !empty($provider['current_lon'])
                            && !empty($order['lat']) && !empty($order['lon'])) {

                            $distance = $this->calculateDistance(
                                (float)$provider['current_lat'],
                                (float)$provider['current_lon'],
                                (float)$order['lat'],
                                (float)$order['lon']
                            );

                            $response['provider']['location']['distance_km'] = round($distance, 2);
                            $response['provider']['location']['estimated_arrival_minutes'] = ceil($distance / 0.5); // Estimation: 30km/h
                        }

                        $response['tracking_enabled'] = true;
                    } else {
                        $response['tracking_enabled'] = false;
                    }
                }
            }

            $this->success($response, 'Statut de la commande récupéré avec succès');

        } catch (Exception $e) {
            $this->error('Erreur lors de la récupération du statut: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Calcule la distance entre deux points GPS (formule de Haversine)
     *
     * @param float $lat1 Latitude du point 1
     * @param float $lon1 Longitude du point 1
     * @param float $lat2 Latitude du point 2
     * @param float $lon2 Longitude du point 2
     * @return float Distance en kilomètres
     */
    private function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371; // Rayon de la Terre en kilomètres

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
