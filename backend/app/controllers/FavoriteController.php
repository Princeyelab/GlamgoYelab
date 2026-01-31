<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Database;

/**
 * FavoriteController
 * Gère les favoris des utilisateurs (prestataires, services)
 * NOTE: Fonctionnalité à implémenter complètement avec table favorites
 */
class FavoriteController extends Controller
{
    /**
     * Liste les favoris de l'utilisateur
     * GET /api/favorites
     */
    public function index(): void
    {
        $userId = $this->getUserId();

        if (!$userId) {
            $this->error('Non authentifié', 401);
            return;
        }

        // TODO: Implémenter avec table favorites
        // Pour l'instant, retourner un tableau vide
        $this->success([
            'favorites' => [],
            'total' => 0,
            'message' => 'Fonctionnalité favoris bientôt disponible'
        ]);
    }

    /**
     * Ajoute un favori
     * POST /api/favorites
     * Body: { type: 'provider'|'service', id: number }
     */
    public function add(): void
    {
        $userId = $this->getUserId();

        if (!$userId) {
            $this->error('Non authentifié', 401);
            return;
        }

        $data = $this->getJsonInput();

        if (empty($data['type']) || empty($data['id'])) {
            $this->error('Type et ID requis', 400);
            return;
        }

        // TODO: Implémenter l'ajout en base
        $this->success([
            'added' => true,
            'type' => $data['type'],
            'id' => $data['id'],
            'message' => 'Fonctionnalité favoris bientôt disponible'
        ], 'Favori ajouté', 201);
    }

    /**
     * Supprime un favori
     * DELETE /api/favorites/{id}
     */
    public function remove(int $id): void
    {
        $userId = $this->getUserId();

        if (!$userId) {
            $this->error('Non authentifié', 401);
            return;
        }

        // TODO: Implémenter la suppression en base
        $this->success([
            'removed' => true,
            'id' => $id,
            'message' => 'Fonctionnalité favoris bientôt disponible'
        ], 'Favori supprimé');
    }

    /**
     * Toggle un favori (ajoute ou supprime)
     * POST /api/favorites/toggle
     * Body: { type: 'provider'|'service', id: number }
     */
    public function toggle(): void
    {
        $userId = $this->getUserId();

        if (!$userId) {
            $this->error('Non authentifié', 401);
            return;
        }

        $data = $this->getJsonInput();

        if (empty($data['type']) || empty($data['id'])) {
            $this->error('Type et ID requis', 400);
            return;
        }

        // TODO: Implémenter le toggle en base
        $this->success([
            'toggled' => true,
            'is_favorite' => false,
            'type' => $data['type'],
            'id' => $data['id'],
            'message' => 'Fonctionnalité favoris bientôt disponible'
        ], 'Favori mis à jour');
    }
}
