<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Order;
use App\Models\Service;
use App\Models\Provider;
use App\Models\Notification;
use App\Helpers\PriceCalculator;
use App\Helpers\DistanceFeeCalculator;

class OrderController extends Controller
{
    private Order $orderModel;
    private Service $serviceModel;
    private Provider $providerModel;
    private Notification $notificationModel;

    public function __construct()
    {
        $this->orderModel = new Order();
        $this->serviceModel = new Service();
        $this->providerModel = new Provider();
        $this->notificationModel = new Notification();
    }

    /**
     * Crée une nouvelle commande
     *
     * Calcule automatiquement les frais de déplacement si un prestataire est sélectionné
     * et que les coordonnées GPS du client sont fournies.
     */
    public function create(): void
    {
        $userId = $_SERVER['USER_ID'];
        $data = $this->getJsonInput();

        // Valider les données
        if (empty($data['service_id'])) {
            $this->error('Le service est requis', 422);
        }

        // Vérifier que le service existe
        $service = $this->serviceModel->find($data['service_id']);
        if (!$service) {
            $this->error('Service non trouvé', 404);
        }

        // Gérer l'adresse
        $addressId = null;
        $db = \App\Core\Database::getInstance();

        if (!empty($data['address_id'])) {
            $addressId = $data['address_id'];
            // Récupérer les coordonnées de l'adresse existante
            $stmt = $db->prepare("SELECT latitude, longitude FROM user_addresses WHERE id = ?");
            $stmt->execute([$addressId]);
            $existingAddress = $stmt->fetch(\PDO::FETCH_ASSOC);
            if ($existingAddress) {
                $data['latitude'] = $data['latitude'] ?? $existingAddress['latitude'];
                $data['longitude'] = $data['longitude'] ?? $existingAddress['longitude'];
            }
        } elseif (!empty($data['address'])) {
            // Créer une nouvelle adresse temporaire avec coordonnées GPS optionnelles
            $stmt = $db->prepare(
                "INSERT INTO user_addresses (user_id, label, address_line, city, latitude, longitude)
                 VALUES (?, ?, ?, ?, ?, ?)"
            );
            $latitude = isset($data['latitude']) && is_numeric($data['latitude']) ? $data['latitude'] : null;
            $longitude = isset($data['longitude']) && is_numeric($data['longitude']) ? $data['longitude'] : null;

            $stmt->execute([$userId, 'Réservation', $data['address'], 'Marrakech', $latitude, $longitude]);
            $addressId = $db->lastInsertId();

            if ($latitude && $longitude) {
                error_log("🗺️ [ORDER] GPS coordinates saved: Lat {$latitude}, Lng {$longitude}");
            }
        } else {
            $this->error('L\'adresse est requise', 422);
        }

        // Initialiser les valeurs de prix
        $basePrice = floatval($service['price']);
        $formulaType = $data['formula'] ?? 'standard';
        $distanceKm = 0;
        $distanceFee = 0;
        $extraDistanceKm = 0;
        $interventionRadiusKm = null;
        $pricePerExtraKm = null;
        $formulaFee = 0;
        $nightFee = 0;
        $total = $basePrice;
        $commissionAmount = 0;
        $providerAmount = 0;

        // Si un prestataire est sélectionné et coordonnées GPS disponibles
        $providerId = $data['provider_id'] ?? null;
        $provider = null;

        if ($providerId) {
            $provider = $this->providerModel->find($providerId);

            // Calculer le prix complet si les coordonnées sont disponibles
            if ($provider && !empty($data['latitude']) && !empty($data['longitude'])) {
                $pricing = PriceCalculator::calculateWithProvider([
                    'service_base_price' => $basePrice,
                    'provider' => $provider,
                    'client_location' => [
                        'lat' => floatval($data['latitude']),
                        'lng' => floatval($data['longitude'])
                    ],
                    'formula' => $formulaType,
                    'scheduled_time' => $data['scheduled_at'] ?? date('Y-m-d H:i:s')
                ]);

                if ($pricing['success']) {
                    $breakdown = $pricing['breakdown'];
                    $distanceKm = $breakdown['distance_km'];
                    $distanceFee = $breakdown['distance_fee'];
                    $extraDistanceKm = $breakdown['extra_distance_km'];
                    $interventionRadiusKm = $breakdown['intervention_radius_km'];
                    $pricePerExtraKm = $breakdown['price_per_extra_km'];
                    $formulaFee = $breakdown['formula_fee'];
                    $nightFee = $breakdown['night_fee'];
                    $total = $breakdown['total'];
                    $commissionAmount = $breakdown['commission_glamgo'];
                    $providerAmount = $breakdown['provider_amount'];

                    error_log("💰 [ORDER] Price breakdown: Base={$basePrice}, Formula={$formulaFee}, Distance={$distanceFee}, Night={$nightFee}, Total={$total}");
                }
            }
        }

        // Créer la commande avec tous les champs de prix
        $orderData = [
            'user_id' => $userId,
            'service_id' => $data['service_id'],
            'provider_id' => $providerId,
            'address_id' => $addressId,
            'status' => $providerId ? 'accepted' : 'pending',
            'scheduled_at' => $data['scheduled_at'] ?? null,
            'latitude' => $data['latitude'] ?? null,
            'longitude' => $data['longitude'] ?? null,
            'formula_type' => $formulaType,
            // Prix détaillé
            'price' => $basePrice,
            'base_price' => $basePrice,
            'formula_fee' => $formulaFee,
            'distance_km' => $distanceKm > 0 ? $distanceKm : null,
            'distance_fee' => $distanceFee,
            'intervention_radius_km' => $interventionRadiusKm,
            'extra_distance_km' => $extraDistanceKm,
            'price_per_extra_km' => $pricePerExtraKm,
            'night_fee' => $nightFee,
            'commission_amount' => $commissionAmount,
            'provider_amount' => $providerAmount,
            'total' => $total,
            // Autres infos
            'notes' => $data['notes'] ?? null,
            'payment_method' => $data['payment_method'] ?? 'cash',
            'payment_status' => 'pending'
        ];

        $orderId = $this->orderModel->create($orderData);

        // Récupérer les détails de la commande
        $order = $this->orderModel->getDetailedOrder($orderId);

        // Ajouter le breakdown dans la réponse
        $order['price_breakdown'] = [
            'base_price' => $basePrice,
            'formula_type' => $formulaType,
            'formula_fee' => $formulaFee,
            'distance_km' => $distanceKm,
            'distance_fee' => $distanceFee,
            'intervention_radius_km' => $interventionRadiusKm,
            'extra_distance_km' => $extraDistanceKm,
            'price_per_extra_km' => $pricePerExtraKm,
            'night_fee' => $nightFee,
            'subtotal' => $total,
            'commission_glamgo' => $commissionAmount,
            'total' => $total,
            'provider_amount' => $providerAmount,
            'currency' => 'MAD'
        ];

        // Notifier les prestataires disponibles (si pas de prestataire sélectionné)
        if (!$providerId) {
            $this->notificationModel->notifyProvidersForNewOrder($order);
        } else {
            // Notifier le prestataire sélectionné
            $this->notificationModel->createNotification([
                'recipient_type' => 'provider',
                'recipient_id' => $providerId,
                'order_id' => $orderId,
                'notification_type' => 'new_order',
                'title' => 'Nouvelle réservation',
                'message' => "Vous avez une nouvelle réservation pour {$service['name']}"
            ]);
        }

        $this->success($order, 'Commande créée', 201);
    }

    /**
     * Liste les commandes de l'utilisateur
     */
    public function index(): void
    {
        $userId = $_SERVER['USER_ID'];
        $queryParams = $this->getQueryParams();

        $status = $queryParams['status'] ?? null;
        $orders = $this->orderModel->getUserOrders($userId, $status);

        $this->success($orders);
    }

    /**
     * Récupère une commande détaillée
     */
    public function show(string $id): void
    {
        $userId = $_SERVER['USER_ID'];
        $order = $this->orderModel->getDetailedOrder((int)$id);

        if (!$order) {
            $this->error('Commande non trouvée', 404);
        }

        // Vérifier que la commande appartient à l'utilisateur
        if ($order['user_id'] != $userId) {
            $this->error('Accès refusé', 403);
        }

        $this->success($order);
    }

    /**
     * Met à jour une commande (position client en temps réel)
     */
    public function update(string $id): void
    {
        $userId = $_SERVER['USER_ID'];
        $data = $this->getJsonInput();

        $order = $this->orderModel->find((int)$id);

        if (!$order) {
            $this->error('Commande non trouvée', 404);
        }

        if ($order['user_id'] != $userId) {
            $this->error('Accès refusé', 403);
        }

        // Champs autorisés pour mise à jour par le client
        $allowedFields = ['client_live_latitude', 'client_live_longitude'];
        $updateData = [];

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateData[$field] = $data[$field];
            }
        }

        if (empty($updateData)) {
            $this->error('Aucune donnée à mettre à jour', 400);
        }

        $this->orderModel->update((int)$id, $updateData);

        $this->success(null, 'Position mise à jour');
    }

    /**
     * Annule une commande
     */
    public function cancel(string $id): void
    {
        $userId = $_SERVER['USER_ID'];
        $data = $this->getJsonInput();

        $order = $this->orderModel->find((int)$id);

        if (!$order) {
            $this->error('Commande non trouvée', 404);
        }

        if ($order['user_id'] != $userId) {
            $this->error('Accès refusé', 403);
        }

        // On ne peut annuler que si la commande est en attente ou acceptée
        if (!in_array($order['status'], ['pending', 'accepted'])) {
            $this->error('Cette commande ne peut plus être annulée', 400);
        }

        $this->orderModel->updateStatus((int)$id, 'cancelled', [
            'cancellation_reason' => $data['reason'] ?? null
        ]);

        $this->success(null, 'Commande annulée');
    }
    /**
     * Client confirme l'arrivée du prestataire (on_way -> in_progress)
     */
    public function confirmArrival(string $id): void
    {
        $userId = $_SERVER['USER_ID'];
        $order = $this->orderModel->find((int)$id);

        if (!$order) {
            $this->error('Commande non trouvée', 404);
        }

        if ($order['user_id'] != $userId) {
            $this->error('Accès refusé', 403);
        }

        if ($order['status'] !== 'on_way') {
            $this->error('Le prestataire n\'est pas encore en route', 400);
        }

        $this->orderModel->updateStatus((int)$id, 'in_progress');

        if ($order['provider_id']) {
            $this->notificationModel->createNotification([
                "recipient_type" => "provider",
                "recipient_id" => $order["provider_id"],
                "order_id" => (int)$id,
                "notification_type" => "service_started",
                "title" => "Prestation confirmee",
                "message" => "Le client a confirme votre arrivee."
            ]);
        }

        $this->success(null, 'Arrivée confirmée, prestation en cours');
    }

    /**
     * Client confirme la fin de la prestation (in_progress -> completed)
     */
    public function confirmComplete(string $id): void
    {
        $userId = $_SERVER['USER_ID'];
        $order = $this->orderModel->find((int)$id);

        if (!$order) {
            $this->error('Commande non trouvée', 404);
        }

        if ($order['user_id'] != $userId) {
            $this->error('Accès refusé', 403);
        }

        if ($order['status'] !== 'in_progress') {
            $this->error('La prestation n\'est pas en cours', 400);
        }

        $this->orderModel->updateStatus((int)$id, 'completed', [
            'completed_at' => date('Y-m-d H:i:s')
        ]);

        if ($order['provider_id']) {
            $this->notificationModel->createNotification([
                "recipient_type" => "provider",
                "recipient_id" => $order["provider_id"],
                "order_id" => (int)$id,
                "notification_type" => "service_completed",
                "title" => "Prestation terminee",
                "message" => "Le client a confirme la fin de la prestation."
            ]);
        }

        $this->success(null, 'Prestation terminée');
    }
}
