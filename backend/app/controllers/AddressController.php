<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Models\User;

class AddressController extends Controller
{
    private User $userModel;

    public function __construct()
    {
        $this->userModel = new User();
    }

    /**
     * Liste les adresses de l'utilisateur
     */
    public function index(): void
    {
        $userId = $_SERVER['USER_ID'];
        $addresses = $this->userModel->getAddresses($userId);

        $this->success($addresses);
    }

    /**
     * Crée une nouvelle adresse
     */
    public function create(): void
    {
        $userId = $_SERVER['USER_ID'];
        $data = $this->getJsonInput();

        $errors = $this->validate($data, [
            'label' => 'required',
            'address_line' => 'required'
        ]);

        if (!empty($errors)) {
            $this->error('Erreurs de validation', 422, $errors);
        }

        $addressId = $this->userModel->addAddress($userId, $data);

        $this->success([
            'id' => $addressId
        ], 'Adresse créée', 201);
    }

    /**
     * Met à jour une adresse
     */
    public function update(string $id): void
    {
        $userId = $_SERVER['USER_ID'];
        $data = $this->getJsonInput();

        $this->userModel->updateAddress((int)$id, $userId, $data);

        $this->success(null, 'Adresse mise à jour');
    }

    /**
     * Supprime une adresse
     */
    public function delete(string $id): void
    {
        $userId = $_SERVER['USER_ID'];

        $deleted = $this->userModel->deleteAddress((int)$id, $userId);

        if (!$deleted) {
            $this->error('Adresse non trouvée', 404);
        }

        $this->success(null, 'Adresse supprimée');
    }

    /**
     * Définit une adresse comme adresse par défaut
     */
    public function setDefault(string $id): void
    {
        $userId = $_SERVER['USER_ID'];

        $updated = $this->userModel->setDefaultAddress((int)$id, $userId);

        if (!$updated) {
            $this->error('Adresse non trouvée', 404);
        }

        $this->success(null, 'Adresse par défaut mise à jour');
    }
}
