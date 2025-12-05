<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Models\User;
use App\Helpers\JWT;
use App\Helpers\Password;
use App\Helpers\ReferralCode;
use App\Core\Database;

class AuthController extends Controller
{
    private User $userModel;

    public function __construct()
    {
        $this->userModel = new User();
    }

    /**
     * Inscription d'un nouvel utilisateur
     */
    public function register(): void
    {
        $data = $this->getJsonInput();

        // Validation
        $errors = $this->validate($data, [
            'email' => 'required|email',
            'password' => 'required|min:6',
            'first_name' => 'required|min:2',
            'last_name' => 'required|min:2'
        ]);

        if (!empty($errors)) {
            $this->error('Erreurs de validation', 422, $errors);
        }

        // Vérifier si l'email existe déjà
        if ($this->userModel->findByEmail($data['email'])) {
            $this->error('Cet email est déjà utilisé', 409);
        }

        // Générer un code de parrainage unique
        $referralCode = ReferralCode::generateUnique(Database::getInstance());

        // Vérifier le code de parrainage si fourni
        $referredBy = null;
        if (!empty($data['referral_code'])) {
            $referrer = $this->userModel->findByReferralCode($data['referral_code']);
            if ($referrer) {
                $referredBy = $referrer['id'];
            }
        }

        // Créer l'utilisateur
        $userId = $this->userModel->create([
            'email' => $data['email'],
            'password' => Password::hash($data['password']),
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'phone' => $data['phone'] ?? null,
            'referral_code' => $referralCode,
        ]);

        // Générer le token JWT
        $token = JWT::encode([
            'user_id' => $userId,
            'user_type' => 'user',
            'email' => $data['email']
        ]);

        // Récupérer l'utilisateur créé
        $user = $this->userModel->find($userId);
        unset($user['password']);

        $this->success([
            'token' => $token,
            'user' => $user
        ], 'Inscription réussie', 201);
    }

    /**
     * Connexion d'un utilisateur
     */
    public function login(): void
    {
        $data = $this->getJsonInput();

        // Validation
        $errors = $this->validate($data, [
            'email' => 'required|email',
            'password' => 'required'
        ]);

        if (!empty($errors)) {
            $this->error('Erreurs de validation', 422, $errors);
        }

        // Récupérer l'utilisateur
        $user = $this->userModel->findByEmail($data['email']);

        if (!$user || !Password::verify($data['password'], $user['password'])) {
            $this->error('Email ou mot de passe incorrect', 401);
        }

        // Générer le token JWT
        $token = JWT::encode([
            'user_id' => $user['id'],
            'user_type' => 'user',
            'email' => $user['email']
        ]);

        unset($user['password']);

        $this->success([
            'token' => $token,
            'user' => $user
        ], 'Connexion réussie');
    }

    /**
     * Demande de réinitialisation de mot de passe (placeholder)
     */
    /**
     * Déconnexion
     */
    public function logout(): void
    {
        // Le token JWT est automatiquement invalidé côté client
        // Si on veut une blacklist de tokens, on peut l'implémenter ici
        $this->success(null, 'Déconnexion réussie');
    }

    public function forgotPassword(): void
    {
        $data = $this->getJsonInput();

        $errors = $this->validate($data, [
            'email' => 'required|email'
        ]);

        if (!empty($errors)) {
            $this->error('Erreurs de validation', 422, $errors);
        }

        $user = $this->userModel->findByEmail($data['email']);

        if (!$user) {
            // Par sécurité, on retourne toujours un succès même si l'email n'existe pas
            $this->success(null, 'Si cet email existe, un lien de réinitialisation a été envoyé');
        }

        // TODO: Implémenter l'envoi d'email avec un token
        // Pour l'instant, on simule
        $this->success(null, 'Si cet email existe, un lien de réinitialisation a été envoyé');
    }

    /**
     * Réinitialisation du mot de passe (placeholder)
     */
    public function resetPassword(): void
    {
        $data = $this->getJsonInput();

        $errors = $this->validate($data, [
            'token' => 'required',
            'password' => 'required|min:6'
        ]);

        if (!empty($errors)) {
            $this->error('Erreurs de validation', 422, $errors);
        }

        // TODO: Vérifier le token et mettre à jour le mot de passe
        $this->success(null, 'Mot de passe réinitialisé avec succès');
    }
}
