<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Models\User;

class ReferralController extends Controller
{
    private User $userModel;

    public function __construct()
    {
        $this->userModel = new User();
    }

    /**
     * Récupère le code de parrainage de l'utilisateur
     */
    public function getCode(): void
    {
        $userId = $_SERVER['USER_ID'];
        $user = $this->userModel->find($userId);

        $this->success([
            'referral_code' => $user['referral_code'],
            'referrals_count' => $this->userModel->countReferrals($userId)
        ]);
    }

    /**
     * Applique un code de parrainage (placeholder - normalement fait à l'inscription)
     */
    public function applyCode(): void
    {
        $userId = $_SERVER['USER_ID'];
        $data = $this->getJsonInput();

        $errors = $this->validate($data, [
            'referral_code' => 'required'
        ]);

        if (!empty($errors)) {
            $this->error('Erreurs de validation', 422, $errors);
        }

        // Vérifier que l'utilisateur n'a pas déjà un parrain
        $user = $this->userModel->find($userId);
        if ($user['referred_by']) {
            $this->error('Vous avez déjà un parrain', 400);
        }

        // Vérifier que le code existe
        $referrer = $this->userModel->findByReferralCode($data['referral_code']);
        if (!$referrer) {
            $this->error('Code de parrainage invalide', 404);
        }

        // Vérifier qu'on ne se parraine pas soi-même
        if ($referrer['id'] == $userId) {
            $this->error('Vous ne pouvez pas vous parrainer vous-même', 400);
        }

        // Appliquer le parrainage
        $this->userModel->update($userId, ['referred_by' => $referrer['id']]);

        $this->success(null, 'Code de parrainage appliqué');
    }
}
