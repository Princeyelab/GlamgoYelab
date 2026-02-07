<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Models\User;
use App\Helpers\JWT;
use App\Helpers\Password;
use App\Helpers\ReferralCode;
use App\Helpers\Mailer;
use App\Core\Database;

class AuthController extends Controller
{
    private User $userModel;

    public function __construct()
    {
        $this->userModel = new User();
    }

    /**
     * Vérifier si un email est déjà utilisé
     */
    public function checkEmail(): void
    {
        $data = $this->getJsonInput();

        $errors = $this->validate($data, [
            'email' => 'required|email',
        ]);

        if (!empty($errors)) {
            $this->error('Email invalide', 422, $errors);
        }

        $exists = $this->userModel->findByEmail($data['email']) ? true : false;

        // Vérifier aussi dans la table providers
        if (!$exists) {
            $db = Database::getInstance();
            $stmt = $db->prepare("SELECT id FROM providers WHERE email = :email LIMIT 1");
            $stmt->execute(['email' => $data['email']]);
            $exists = $stmt->fetch() ? true : false;
        }

        $this->success(['exists' => $exists], $exists ? 'Email déjà utilisé' : 'Email disponible');
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

        // Envoyer l'email de bienvenue
        Mailer::sendWelcomeEmail($data['email'], $data['first_name']);

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
     * Récupérer l'utilisateur connecté
     * GET /api/auth/me
     */
    public function me(): void
    {
        $userId = $this->getUserId();

        if (!$userId) {
            $this->error('Non authentifié', 401);
        }

        $user = $this->userModel->find($userId);

        if (!$user) {
            $this->error('Utilisateur non trouvé', 404);
        }

        unset($user['password']);

        // Vérifier si l'utilisateur est aussi prestataire
        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT id, is_available FROM providers WHERE email = ?");
        $stmt->execute([$user['email']]);
        $provider = $stmt->fetch(\PDO::FETCH_ASSOC);

        $user['is_provider'] = !empty($provider);
        $user['account_type'] = !empty($provider) ? 'provider' : 'client';

        if ($provider) {
            $user['provider_id'] = $provider['id'];
        }

        $this->success(['user' => $user], 'Utilisateur récupéré');
    }

    /**
     * Déconnexion
     */
    public function logout(): void
    {
        $this->success(null, 'Déconnexion réussie');
    }

    /**
     * Mot de passe oublié - Envoie un email avec lien de reset
     */
    public function forgotPassword(): void
    {
        $data = $this->getJsonInput();

        $errors = $this->validate($data, [
            'email' => 'required|email'
        ]);

        if (!empty($errors)) {
            $this->error('Erreurs de validation', 422, $errors);
        }

        $email = strtolower(trim($data['email']));
        $user = $this->userModel->findByEmail($email);

        // Par securite, toujours retourner succes meme si l'email n'existe pas
        if (!$user) {
            $this->success(null, 'Si cet email existe, un lien de réinitialisation a été envoyé');
            return;
        }

        $db = Database::getInstance();

        // Creer la table password_resets si elle n'existe pas
        $this->ensurePasswordResetsTable($db);

        // Generer un token unique
        $token = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));

        // Supprimer les anciens tokens pour cet email
        $stmt = $db->prepare("DELETE FROM password_resets WHERE email = ?");
        $stmt->execute([$email]);

        // Inserer le nouveau token
        $stmt = $db->prepare("INSERT INTO password_resets (email, token, expires_at, created_at) VALUES (?, ?, ?, NOW())");
        $stmt->execute([$email, hash('sha256', $token), $expiresAt]);

        // Construire le lien de reset
        $appUrl = getenv('APP_URL') ?: 'https://glamgo-api.fly.dev';
        $resetLink = "{$appUrl}/reset-password.php?token={$token}&email=" . urlencode($email);

        // Envoyer l'email
        $firstName = $user['first_name'] ?? 'Utilisateur';
        Mailer::sendPasswordResetEmail($email, $firstName, $resetLink);

        $this->success(null, 'Si cet email existe, un lien de réinitialisation a été envoyé');
    }

    /**
     * Réinitialisation du mot de passe avec token
     */
    public function resetPassword(): void
    {
        $data = $this->getJsonInput();

        $errors = $this->validate($data, [
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|min:6'
        ]);

        if (!empty($errors)) {
            $this->error('Erreurs de validation', 422, $errors);
        }

        $db = Database::getInstance();
        $this->ensurePasswordResetsTable($db);

        $email = strtolower(trim($data['email']));
        $tokenHash = hash('sha256', $data['token']);

        // Verifier le token
        $stmt = $db->prepare("SELECT * FROM password_resets WHERE email = ? AND token = ? AND expires_at > NOW()");
        $stmt->execute([$email, $tokenHash]);
        $reset = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$reset) {
            $this->error('Lien invalide ou expiré. Veuillez refaire une demande.', 400);
        }

        // Trouver l'utilisateur
        $user = $this->userModel->findByEmail($email);
        if (!$user) {
            $this->error('Utilisateur non trouvé', 404);
        }

        // Mettre a jour le mot de passe
        $this->userModel->update($user['id'], [
            'password' => Password::hash($data['password'])
        ]);

        // Supprimer le token utilise
        $stmt = $db->prepare("DELETE FROM password_resets WHERE email = ?");
        $stmt->execute([$email]);

        $this->success(null, 'Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.');
    }

    /**
     * Changer le mot de passe (utilisateur connecte)
     */
    public function changePassword(): void
    {
        $userId = $this->getUserId();
        if (!$userId) {
            $this->error('Non authentifié', 401);
        }

        $data = $this->getJsonInput();

        $errors = $this->validate($data, [
            'current_password' => 'required',
            'password' => 'required|min:6',
            'password_confirmation' => 'required'
        ]);

        if (!empty($errors)) {
            $this->error('Erreurs de validation', 422, $errors);
        }

        if ($data['password'] !== $data['password_confirmation']) {
            $this->error('Les mots de passe ne correspondent pas', 422);
        }

        $user = $this->userModel->find($userId);
        if (!$user) {
            $this->error('Utilisateur non trouvé', 404);
        }

        if (!Password::verify($data['current_password'], $user['password'])) {
            $this->error('Le mot de passe actuel est incorrect', 400);
        }

        $this->userModel->update($userId, [
            'password' => Password::hash($data['password'])
        ]);

        $this->success(null, 'Mot de passe modifié avec succès');
    }

    /**
     * Creer la table password_resets si elle n'existe pas
     */
    private function ensurePasswordResetsTable(\PDO $db): void
    {
        try {
            $db->exec("SELECT 1 FROM password_resets LIMIT 1");
        } catch (\PDOException $e) {
            // Table n'existe pas, la creer
            $driver = $db->getAttribute(\PDO::ATTR_DRIVER_NAME);
            if ($driver === 'pgsql') {
                $db->exec("CREATE TABLE IF NOT EXISTS password_resets (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) NOT NULL,
                    token VARCHAR(255) NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )");
            } else {
                $db->exec("CREATE TABLE IF NOT EXISTS password_resets (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    email VARCHAR(255) NOT NULL,
                    token VARCHAR(255) NOT NULL,
                    expires_at DATETIME NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )");
            }
        }
    }
}
