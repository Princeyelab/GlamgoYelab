<?php

/**
 * AuthController - Gestion de l'authentification
 *
 * Gère l'inscription, la connexion et la gestion des tokens JWT
 */
class AuthController extends Controller
{
    /**
     * Inscription d'un nouvel utilisateur
     *
     * POST /api/register
     * Body: { email, password, first_name, last_name, phone }
     *
     * @return void
     */
    public function register(): void
    {
        // Récupérer les données JSON
        $data = $this->getJsonInput();

        // Validation des données
        $errors = $this->validate($data, [
            'email' => 'required|email',
            'password' => 'required|min:6',
            'first_name' => 'required|alpha',
            'last_name' => 'required|alpha'
        ]);

        if (!empty($errors)) {
            $this->error('Erreurs de validation', 422, $errors);
        }

        // Vérifier si l'email existe déjà
        if (User::emailExists($data['email'])) {
            $this->error('Cet email est déjà utilisé', 409);
        }

        // Créer l'utilisateur
        try {
            $userId = User::create([
                'email' => $data['email'],
                'password' => $data['password'], // Sera hashé automatiquement par User::create()
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'phone' => $data['phone'] ?? null
            ]);

            // Récupérer l'utilisateur créé
            $user = User::findById($userId);

            if (!$user) {
                $this->error('Erreur lors de la création de l\'utilisateur', 500);
            }

            // Générer un token JWT
            $token = JWT::encode([
                'user_id' => $user['id'],
                'email' => $user['email'],
                'type' => 'user'
            ]);

            // Retourner les données publiques de l'utilisateur (sans le password_hash)
            $userData = User::getPublicData($user);

            // Réponse de succès
            $this->success([
                'token' => $token,
                'user' => $userData
            ], 'Inscription réussie', 201);

        } catch (Exception $e) {
            $this->error('Erreur lors de l\'inscription: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Connexion d'un utilisateur
     *
     * POST /api/login
     * Body: { email, password }
     *
     * @return void
     */
    public function login(): void
    {
        // Récupérer les données JSON
        $data = $this->getJsonInput();

        // Validation
        $errors = $this->validate($data, [
            'email' => 'required|email',
            'password' => 'required'
        ]);

        if (!empty($errors)) {
            $this->error('Erreurs de validation', 422, $errors);
        }

        // Chercher l'utilisateur par email
        $user = User::findByEmail($data['email']);

        if (!$user) {
            $this->error('Email ou mot de passe incorrect', 401);
        }

        // Vérifier le mot de passe
        if (!password_verify($data['password'], $user['password_hash'])) {
            $this->error('Email ou mot de passe incorrect', 401);
        }

        // Générer un token JWT
        $token = JWT::encode([
            'user_id' => $user['id'],
            'email' => $user['email'],
            'type' => 'user'
        ]);

        // Retourner les données publiques de l'utilisateur
        $userData = User::getPublicData($user);

        // Réponse de succès
        $this->success([
            'token' => $token,
            'user' => $userData
        ], 'Connexion réussie');
    }

    /**
     * Récupère le profil de l'utilisateur connecté
     *
     * GET /api/profile
     * Header: Authorization: Bearer {token}
     *
     * Note: Cette route est protégée par AuthMiddleware
     * L'utilisateur est déjà vérifié et disponible via AuthMiddleware::user()
     *
     * @return void
     */
    public function profile(): void
    {
        // Récupérer l'utilisateur authentifié depuis le middleware
        $user = AuthMiddleware::user();

        // Retourner les données publiques
        $userData = User::getPublicData($user);

        $this->success($userData, 'Profil récupéré');
    }

    /**
     * Vérifie la validité d'un token
     *
     * POST /api/verify-token
     * Body: { token }
     *
     * @return void
     */
    public function verifyToken(): void
    {
        $data = $this->getJsonInput();

        if (!isset($data['token'])) {
            $this->error('Token manquant', 400);
        }

        $payload = JWT::decode($data['token']);

        if (!$payload) {
            $this->error('Token invalide ou expiré', 401);
        }

        $this->success([
            'valid' => true,
            'payload' => $payload
        ], 'Token valide');
    }

    /**
     * Déconnexion (côté client, invalidation du token)
     *
     * POST /api/logout
     *
     * Note: Avec JWT, la déconnexion est principalement gérée côté client
     * en supprimant le token. Pour une vraie invalidation, il faudrait
     * implémenter une blacklist de tokens.
     *
     * @return void
     */
    public function logout(): void
    {
        $this->success(null, 'Déconnexion réussie');
    }
}
