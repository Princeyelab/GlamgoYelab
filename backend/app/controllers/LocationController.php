<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Order;
use App\Models\Provider;
use App\Core\Database;

class LocationController extends Controller
{
    private Order $orderModel;
    private Provider $providerModel;

    public function __construct()
    {
        $this->orderModel = new Order();
        $this->providerModel = new Provider();
    }

    /**
     * Récupère la position du prestataire pour une commande
     */
    public function getProviderLocation(string $orderId): void
    {
        $userId = $_SERVER['USER_ID'];

        $order = $this->orderModel->find((int)$orderId);

        if (!$order) {
            $this->error('Commande non trouvée', 404);
        }

        if ($order['user_id'] != $userId) {
            $this->error('Accès refusé', 403);
        }

        if (!$order['provider_id']) {
            $this->error('Aucun prestataire assigné', 400);
        }

        $provider = $this->providerModel->find($order['provider_id']);

        $this->success([
            'latitude' => $provider['current_latitude'] ?? null,
            'longitude' => $provider['current_longitude'] ?? null,
            'updated_at' => $provider['updated_at'] ?? null
        ]);
    }

    /**
     * Met à jour la position du prestataire
     */
    public function updateLocation(): void
    {
        $providerId = $_SERVER['USER_ID'];
        $userType = $_SERVER['USER_TYPE'];

        if ($userType !== 'provider') {
            $this->error('Accès refusé', 403);
        }

        $data = $this->getJsonInput();

        $errors = $this->validate($data, [
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric'
        ]);

        if (!empty($errors)) {
            $this->error('Erreurs de validation', 422, $errors);
        }

        $this->providerModel->updateLocation(
            $providerId,
            (float)$data['latitude'],
            (float)$data['longitude']
        );

        // Enregistrer dans le tracking si une commande active est fournie
        if (isset($data['order_id'])) {
            $db = Database::getInstance();
            $stmt = $db->prepare(
                "INSERT INTO location_tracking (order_id, provider_id, latitude, longitude) VALUES (?, ?, ?, ?)"
            );
            $stmt->execute([
                $data['order_id'],
                $providerId,
                $data['latitude'],
                $data['longitude']
            ]);
        }

        $this->success(null, 'Position mise à jour');
    }
    /**
     * Récupère la position du client pour une commande (pour le prestataire)
     */
    public function getClientLocation(string $orderId): void
    {
        $providerId = $_SERVER['USER_ID'];
        $userType = $_SERVER['USER_TYPE'];

        if ($userType !== 'provider') {
            $this->error('Accès refusé', 403);
        }

        $order = $this->orderModel->find((int)$orderId);

        if (!$order) {
            $this->error('Commande non trouvée', 404);
        }

        if ($order['provider_id'] != $providerId) {
            $this->error('Accès refusé', 403);
        }

        $this->success([
            'client_live_latitude' => $order['client_live_latitude'] ?? null,
            'client_live_longitude' => $order['client_live_longitude'] ?? null,
            'location_sharing_enabled' => !empty($order['client_live_latitude'] ?? null) && !empty($order['client_live_longitude'] ?? null)
        ]);
    }
}
