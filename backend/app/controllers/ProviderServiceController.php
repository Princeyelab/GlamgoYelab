<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Provider;

class ProviderServiceController extends Controller
{
    private Provider $providerModel;

    public function __construct()
    {
        $this->providerModel = new Provider();
    }

    /**
     * Liste les services du prestataire
     */
    public function index(): void
    {
        $providerId = $_SERVER['USER_ID'];
        $services = $this->providerModel->getServices($providerId);

        $this->success($services);
    }

    /**
     * Ajoute un service au catalogue du prestataire
     */
    public function add(): void
    {
        $providerId = $_SERVER['USER_ID'];
        $data = $this->getJsonInput();

        $errors = $this->validate($data, [
            'service_id' => 'required|numeric'
        ]);

        if (!empty($errors)) {
            $this->error('Erreurs de validation', 422, $errors);
        }

        $added = $this->providerModel->addService($providerId, (int)$data['service_id']);

        if (!$added) {
            $this->error('Service déjà dans votre catalogue', 400);
        }

        $this->success(null, 'Service ajouté', 201);
    }

    /**
     * Retire un service du catalogue
     */
    public function remove(string $serviceId): void
    {
        $providerId = $_SERVER['USER_ID'];

        $removed = $this->providerModel->removeService($providerId, (int)$serviceId);

        if (!$removed) {
            $this->error('Service non trouvé dans votre catalogue', 404);
        }

        $this->success(null, 'Service retiré');
    }
}
