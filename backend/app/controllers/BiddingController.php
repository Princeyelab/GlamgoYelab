<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Database;
use App\Models\Bid;
use App\Models\Order;
use App\Models\Service;

/**
 * Contrôleur pour gérer le système d'enchères (bidding)
 * Gère toutes les opérations liées aux offres des prestataires
 */
class BiddingController extends Controller
{
    /**
     * Crée une nouvelle commande en mode enchères
     * POST /api/orders/bidding
     */
    public function createBiddingOrder(): void
    {
        try {
            $userId = $this->getUserIdFromToken();
            $data = $this->getJsonInput();

            // Validation des données requises
            if (empty($data['service_id'])) {
                $this->error('Le service est requis', 422);
            }

            if (empty($data['user_proposed_price'])) {
                $this->error('Le prix proposé est requis', 422);
            }

            // Gérer l'adresse (soit address_id, soit création inline)
            $addressId = null;
            if (!empty($data['address_id'])) {
                $addressId = $data['address_id'];
            } elseif (!empty($data['address'])) {
                // Créer une adresse temporaire avec coordonnées GPS optionnelles
                $db = Database::getInstance();
                $stmt = $db->prepare(
                    "INSERT INTO user_addresses (user_id, label, address_line, city, latitude, longitude)
                     VALUES (?, ?, ?, ?, ?, ?)"
                );
                $latitude = isset($data['latitude']) && is_numeric($data['latitude']) ? $data['latitude'] : null;
                $longitude = isset($data['longitude']) && is_numeric($data['longitude']) ? $data['longitude'] : null;

                $stmt->execute([
                    $userId,
                    'Commande enchères',
                    $data['address'],
                    'Marrakech',
                    $latitude,
                    $longitude
                ]);
                $addressId = $db->lastInsertId();

                if ($latitude && $longitude) {
                    error_log("🗺️ [BIDDING] GPS coordinates saved: Lat {$latitude}, Lng {$longitude}");
                }
            } else {
                $this->error('L\'adresse est requise (address_id ou address)', 422);
            }

            // Vérifier que le service existe
            $serviceModel = new Service();
            $service = $serviceModel->find($data['service_id']);

            if (!$service) {
                $this->error('Service non trouvé', 404);
            }

            // Vérifier que le service autorise les enchères
            if (!$service['allow_bidding']) {
                $this->error('Ce service n\'autorise pas le mode enchères', 400);
            }

            // Vérifier que le prix proposé est au minimum égal au prix du service
            $proposedPrice = (float) $data['user_proposed_price'];
            $minimumPrice = (float) $service['price'];

            if ($proposedPrice < $minimumPrice) {
                $this->error(
                    "Le prix proposé doit être au minimum de {$minimumPrice} MAD (prix du service)",
                    400
                );
            }

            // Pas de limite maximale - le client peut proposer n'importe quel prix supérieur

            // Calculer le temps d'expiration (par défaut 24h)
            $expiryHours = $data['bid_expiry_hours'] ?? 24;
            $bidExpiryTime = date('Y-m-d H:i:s', strtotime("+{$expiryHours} hours"));

            // Créer la commande en mode enchères
            $orderModel = new Order();
            $orderData = [
                'user_id' => $userId,
                'service_id' => $data['service_id'],
                'address_id' => $addressId,
                'status' => 'pending',
                'pricing_mode' => 'bidding',
                'user_proposed_price' => $proposedPrice,
                'bid_expiry_time' => $bidExpiryTime,
                'scheduled_at' => $data['scheduled_at'] ?? null,
                'notes' => $data['notes'] ?? null,
                'price' => 0, // Sera défini lors de l'acceptation d'une offre
                'total' => 0
            ];

            $orderId = $orderModel->create($orderData);

            // Récupérer les détails de la commande
            $order = $orderModel->getDetailedOrder($orderId);

            // Notifier les prestataires disponibles
            $this->notifyAvailableProviders($orderId, $data['service_id'], $proposedPrice);

            $this->success($order, 'Commande créée en mode enchères', 201);

        } catch (\Exception $e) {
            $this->error('Erreur lors de la création de la commande: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Crée une nouvelle offre (bid) pour une commande
     * POST /api/bids
     */
    public function createBid(): void
    {
        try {
            $providerId = $this->getProviderIdFromToken();
            $data = $this->getJsonInput();

            // Validation
            if (empty($data['order_id'])) {
                $this->error('L\'ID de la commande est requis', 422);
            }

            if (empty($data['proposed_price']) || $data['proposed_price'] <= 0) {
                $this->error('Le prix proposé est requis et doit être positif', 422);
            }

            $orderId = (int) $data['order_id'];
            $proposedPrice = (float) $data['proposed_price'];

            // Vérifier que la commande existe
            $orderModel = new Order();
            $order = $orderModel->find($orderId);

            if (!$order) {
                $this->error('Commande non trouvée', 404);
            }

            // Vérifier que la commande est en mode enchères
            if ($order['pricing_mode'] !== 'bidding') {
                $this->error('Cette commande n\'est pas en mode enchères', 400);
            }

            // Vérifier que la commande est toujours en attente
            if ($order['status'] !== 'pending') {
                $this->error('Cette commande n\'accepte plus d\'offres', 400);
            }

            // Vérifier que l'offre n'a pas expiré
            if ($order['bid_expiry_time'] && strtotime($order['bid_expiry_time']) < time()) {
                $this->error('La période d\'enchères pour cette commande est terminée', 400);
            }

            // Vérifier que le prestataire n'a pas déjà fait d'offre
            if ($this->checkExistingBid($orderId, $providerId)) {
                $this->error('Vous avez déjà fait une offre pour cette commande', 409);
            }

            // Vérifier que le prestataire propose ce service
            if (!$this->providerOffersService($providerId, $order['service_id'])) {
                $this->error('Vous ne proposez pas ce service', 403);
            }

            // Créer l'offre
            $bidData = [
                'order_id' => $orderId,
                'provider_id' => $providerId,
                'proposed_price' => $proposedPrice,
                'estimated_arrival_minutes' => $data['estimated_arrival_minutes'] ?? null,
                'message' => $data['message'] ?? null
            ];

            $bidId = Bid::createBid($bidData);

            // Récupérer l'offre créée avec les détails
            $bid = Bid::findById($bidId);

            $this->success($bid, 'Offre créée avec succès', 201);

        } catch (\Exception $e) {
            $this->error('Erreur lors de la création de l\'offre: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Récupère toutes les offres pour une commande
     * GET /api/orders/{id}/bids
     */
    public function getOrderBids(string $id): void
    {
        try {
            $userId = $this->getUserIdFromToken();
            $orderId = (int) $id;

            // Vérifier que la commande existe
            $orderModel = new Order();
            $order = $orderModel->find($orderId);

            if (!$order) {
                $this->error('Commande non trouvée', 404);
            }

            // Vérifier que l'utilisateur est propriétaire de la commande
            if ($order['user_id'] != $userId) {
                $this->error('Accès refusé', 403);
            }

            // Récupérer toutes les offres
            $bids = Bid::getByOrderId($orderId);

            $this->success([
                'order' => $order,
                'bids' => $bids,
                'total_bids' => count($bids)
            ]);

        } catch (\Exception $e) {
            $this->error('Erreur lors de la récupération des offres: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Accepte une offre pour une commande
     * PUT /api/bids/{id}/accept
     */
    public function acceptBid(string $id): void
    {
        try {
            $userId = $this->getUserIdFromToken();
            $bidId = (int) $id;

            // Vérifier que l'offre existe
            $bid = Bid::findById($bidId);

            if (!$bid) {
                $this->error('Offre non trouvée', 404);
            }

            // Accepter l'offre (la méthode vérifie la propriété et fait toutes les MAJ)
            $success = Bid::acceptBid($bidId, $userId);

            if ($success) {
                // Récupérer l'offre mise à jour
                $updatedBid = Bid::findById($bidId);
                $this->success($updatedBid, 'Offre acceptée avec succès');
            } else {
                $this->error('Erreur lors de l\'acceptation de l\'offre', 500);
            }

        } catch (\Exception $e) {
            // Les exceptions de Bid::acceptBid() contiennent des messages explicites
            $this->error($e->getMessage(), 400);
        }
    }

    /**
     * Retire une offre (prestataire)
     * DELETE /api/bids/{id}
     */
    public function withdrawBid(string $id): void
    {
        try {
            $providerId = $this->getProviderIdFromToken();
            $bidId = (int) $id;

            // Vérifier que l'offre existe
            $bid = Bid::findById($bidId);

            if (!$bid) {
                $this->error('Offre non trouvée', 404);
            }

            // Retirer l'offre
            $success = Bid::withdrawBid($bidId, $providerId);

            if ($success) {
                $this->success(null, 'Offre retirée avec succès');
            } else {
                $this->error('Impossible de retirer cette offre', 400);
            }

        } catch (\Exception $e) {
            $this->error('Erreur lors du retrait de l\'offre: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Récupère les commandes disponibles pour un prestataire
     * GET /api/provider/available-orders
     */
    public function getAvailableOrders(): void
    {
        try {
            $providerId = $this->getProviderIdFromToken();

            error_log("🔍 [BIDDING] Getting available orders for provider #{$providerId}");

            // Récupérer les services proposés par le prestataire
            $db = Database::getInstance();
            $stmt = $db->prepare(
                "SELECT service_id FROM provider_services WHERE provider_id = ?"
            );
            $stmt->execute([$providerId]);
            $services = $stmt->fetchAll(\PDO::FETCH_COLUMN);

            error_log("🔍 [BIDDING] Provider has " . count($services) . " services configured");

            // MODIFICATION: Si le prestataire n'a pas de services, retourner quand même TOUTES les commandes
            // Il pourra faire des offres sur n'importe quel service (logique InDriver)
            if (empty($services)) {
                error_log("🔍 [BIDDING] Provider has no configured services, showing ALL available orders");
                $services = null; // Indique de récupérer TOUTES les commandes
            }

            // Récupérer les commandes disponibles (exclut celles où il a déjà bid)
            $availableOrders = Order::getAvailableBiddingOrders($services, $providerId);

            error_log("🔍 [BIDDING] Found " . count($availableOrders) . " available orders");

            $this->success([
                'orders' => $availableOrders,
                'total' => count($availableOrders)
            ]);

        } catch (\Exception $e) {
            error_log("❌ [BIDDING] Error getting available orders: " . $e->getMessage());
            $this->error('Erreur lors de la récupération des commandes: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Récupère les offres actives du prestataire
     * GET /api/provider/my-bids
     */
    public function getProviderBids(): void
    {
        try {
            $providerId = $this->getProviderIdFromToken();

            // Récupérer les offres actives du prestataire
            $bids = Bid::getActiveByProviderId($providerId);

            $this->success([
                'bids' => $bids,
                'total' => count($bids)
            ]);

        } catch (\Exception $e) {
            $this->error('Erreur lors de la récupération des offres: ' . $e->getMessage(), 500);
        }
    }

    // =========================================
    // MÉTHODES PRIVÉES (UTILITAIRES)
    // =========================================

    /**
     * Extrait l'ID utilisateur du token JWT
     * @return int
     * @throws \Exception
     */
    private function getUserIdFromToken(): int
    {
        if (!isset($_SERVER['USER_ID'])) {
            throw new \Exception('Authentification requise');
        }

        return (int) $_SERVER['USER_ID'];
    }

    /**
     * Extrait l'ID prestataire du token JWT
     * @return int
     * @throws \Exception
     */
    private function getProviderIdFromToken(): int
    {
        if (!isset($_SERVER['USER_ID'])) {
            throw new \Exception('Authentification requise');
        }

        if (!isset($_SERVER['USER_TYPE']) || $_SERVER['USER_TYPE'] !== 'provider') {
            throw new \Exception('Authentification prestataire requise');
        }

        return (int) $_SERVER['USER_ID'];
    }

    /**
     * Récupère le token Bearer du header Authorization
     * @return string|null
     */
    private function getBearerToken(): ?string
    {
        $headers = getallheaders();

        if (isset($headers['Authorization'])) {
            if (preg_match('/Bearer\s+(.*)$/i', $headers['Authorization'], $matches)) {
                return $matches[1];
            }
        }

        return null;
    }

    /**
     * Vérifie si le prestataire a déjà fait une offre pour cette commande
     * @param int $orderId
     * @param int $providerId
     * @return bool
     */
    private function checkExistingBid(int $orderId, int $providerId): bool
    {
        $db = Database::getInstance();
        $stmt = $db->prepare(
            "SELECT COUNT(*) as count FROM bids WHERE order_id = ? AND provider_id = ?"
        );
        $stmt->execute([$orderId, $providerId]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);

        return $result['count'] > 0;
    }

    /**
     * Vérifie si le prestataire propose ce service
     * @param int $providerId
     * @param int $serviceId
     * @return bool
     */
    private function providerOffersService(int $providerId, int $serviceId): bool
    {
        $db = Database::getInstance();
        $stmt = $db->prepare(
            "SELECT COUNT(*) as count FROM provider_services
             WHERE provider_id = ? AND service_id = ?"
        );
        $stmt->execute([$providerId, $serviceId]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);

        return $result['count'] > 0;
    }

    /**
     * Notifie les prestataires disponibles d'une nouvelle commande en mode enchères
     * @param int $orderId
     * @param int $serviceId
     * @param float $proposedPrice
     * @return void
     */
    private function notifyAvailableProviders(int $orderId, int $serviceId, float $proposedPrice): void
    {
        try {
            $db = Database::getInstance();

            error_log("🔔 [BIDDING] Creating notifications for order #{$orderId}, service #{$serviceId}");

            // Récupérer les prestataires qui proposent ce service
            $stmt = $db->prepare(
                "SELECT DISTINCT p.id as provider_id
                 FROM providers p
                 INNER JOIN provider_services ps ON p.id = ps.provider_id
                 WHERE ps.service_id = ?
                   AND p.is_available = TRUE
                   AND p.is_verified = TRUE"
            );
            $stmt->execute([$serviceId]);
            $providers = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            error_log("🔔 [BIDDING] Found " . count($providers) . " providers with this service");

            // FALLBACK: Si aucun prestataire ne propose ce service, notifier tous les prestataires disponibles
            if (empty($providers)) {
                error_log("🔔 [BIDDING] No providers found for this service, notifying all available providers");
                $stmt = $db->prepare(
                    "SELECT id as provider_id
                     FROM providers
                     WHERE is_available = TRUE AND is_verified = TRUE"
                );
                $stmt->execute();
                $providers = $stmt->fetchAll(\PDO::FETCH_ASSOC);
                error_log("🔔 [BIDDING] Found " . count($providers) . " available providers");
            }

            // Créer une notification pour chaque prestataire
            foreach ($providers as $provider) {
                error_log("🔔 [BIDDING] Creating notification for provider #{$provider['provider_id']}");

                $stmtNotif = $db->prepare(
                    "INSERT INTO notifications
                     (recipient_type, recipient_id, order_id, notification_type, title, message, data, created_at)
                     VALUES ('provider', ?, ?, 'new_bidding_order', 'Nouvelle commande disponible',
                             'Une nouvelle commande en mode enchères est disponible pour un de vos services', ?, NOW())"
                );

                $data = json_encode([
                    'order_id' => $orderId,
                    'service_id' => $serviceId,
                    'proposed_price' => $proposedPrice
                ]);

                $stmtNotif->execute([$provider['provider_id'], $orderId, $data]);
                error_log("🔔 [BIDDING] ✅ Notification created for provider #{$provider['provider_id']}");
            }

            error_log("🔔 [BIDDING] Notification process completed for order #{$orderId}");

        } catch (\Exception $e) {
            // Log l'erreur mais ne bloque pas la création de la commande
            error_log("❌ [BIDDING] Erreur notification prestataires: " . $e->getMessage());
        }
    }
}
