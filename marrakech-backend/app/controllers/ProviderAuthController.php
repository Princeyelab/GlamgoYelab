<?php

/**
 * ProviderAuthController - Gestion de l'authentification des prestataires
 *
 * Gère l'inscription, la connexion et la gestion des tokens JWT pour les prestataires
 */
class ProviderAuthController extends Controller
{
    /**
     * Inscription d'un nouveau prestataire
     *
     * POST /api/provider/register
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
            'last_name' => 'required|alpha',
            'phone' => 'required'
        ]);

        if (!empty($errors)) {
            $this->error('Erreurs de validation', 422, $errors);
        }

        // Vérifier si l'email existe déjà
        if (Provider::emailExists($data['email'])) {
            $this->error('Cet email est déjà utilisé', 409);
        }

        // Créer le prestataire
        try {
            $providerId = Provider::create([
                'email' => $data['email'],
                'password' => $data['password'], // Sera hashé automatiquement par Provider::create()
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'phone' => $data['phone'],
                'status' => 'offline', // Par défaut, le prestataire est offline
                'is_verified' => 0 // Nécessite une vérification
            ]);

            // Récupérer le prestataire créé
            $provider = Provider::findById($providerId);

            if (!$provider) {
                $this->error('Erreur lors de la création du prestataire', 500);
            }

            // Générer un token JWT
            $token = JWT::encode([
                'provider_id' => $provider['id'],
                'email' => $provider['email'],
                'type' => 'provider'
            ]);

            // Retourner les données publiques du prestataire (sans le password_hash)
            $providerData = Provider::getPublicData($provider);

            // Logger l'inscription
            error_log("✅ [PROVIDER REGISTERED] Prestataire #{$provider['id']} - {$provider['first_name']} {$provider['last_name']} ({$provider['email']})");

            // Réponse de succès
            $this->success([
                'token' => $token,
                'provider' => $providerData
            ], 'Inscription réussie', 201);

        } catch (Exception $e) {
            $this->error('Erreur lors de l\'inscription: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Connexion d'un prestataire
     *
     * POST /api/provider/login
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

        // Chercher le prestataire par email
        $provider = Provider::findByEmail($data['email']);

        if (!$provider) {
            $this->error('Email ou mot de passe incorrect', 401);
        }

        // Vérifier le mot de passe
        if (!password_verify($data['password'], $provider['password_hash'])) {
            $this->error('Email ou mot de passe incorrect', 401);
        }

        // Générer un token JWT
        $token = JWT::encode([
            'provider_id' => $provider['id'],
            'email' => $provider['email'],
            'type' => 'provider'
        ]);

        // Retourner les données publiques du prestataire
        $providerData = Provider::getPublicData($provider);

        // Logger la connexion
        error_log("🔑 [PROVIDER LOGIN] Prestataire #{$provider['id']} - {$provider['first_name']} {$provider['last_name']}");

        // Réponse de succès
        $this->success([
            'token' => $token,
            'provider' => $providerData
        ], 'Connexion réussie');
    }

    /**
     * Récupère le profil du prestataire connecté
     *
     * GET /api/provider/profile
     * Header: Authorization: Bearer {token}
     *
     * Note: Cette route est protégée par ProviderMiddleware
     * Le prestataire est déjà vérifié et disponible via ProviderMiddleware::provider()
     *
     * @return void
     */
    public function profile(): void
    {
        // Récupérer le prestataire authentifié depuis le middleware
        $provider = ProviderMiddleware::provider();

        // Retourner les données publiques
        $providerData = Provider::getPublicData($provider);

        $this->success($providerData, 'Profil récupéré');
    }

    /**
     * Met à jour le statut du prestataire (online/offline/busy)
     *
     * PUT /api/provider/status
     * Body: { status: "online" | "offline" | "busy" }
     *
     * @return void
     */
    public function updateStatus(): void
    {
        // Récupérer le prestataire authentifié
        $provider = ProviderMiddleware::provider();
        $providerId = (int) $provider['id'];

        // Récupérer les données JSON
        $data = $this->getJsonInput();

        // Validation
        $errors = $this->validate($data, [
            'status' => 'required'
        ]);

        if (!empty($errors)) {
            $this->error('Erreurs de validation', 422, $errors);
        }

        $newStatus = $data['status'];

        // Vérifier que le statut est valide
        $validStatuses = ['online', 'offline', 'busy'];
        if (!in_array($newStatus, $validStatuses)) {
            $this->error('Statut invalide. Valeurs acceptées: ' . implode(', ', $validStatuses), 400);
        }

        try {
            // Mettre à jour le statut
            $success = Provider::updateStatus($providerId, $newStatus);

            if (!$success) {
                $this->error('Erreur lors de la mise à jour du statut', 500);
            }

            error_log("📡 [PROVIDER STATUS] Prestataire #$providerId : statut changé en '$newStatus'");

            // Récupérer le prestataire mis à jour
            $updatedProvider = Provider::findById($providerId);

            $this->success([
                'provider' => Provider::getPublicData($updatedProvider)
            ], 'Statut mis à jour avec succès');

        } catch (Exception $e) {
            $this->error('Erreur lors de la mise à jour du statut: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Met à jour la position géographique du prestataire
     *
     * PUT /api/provider/location
     * Body: { lat: 31.6295, lon: -7.9811 }
     *
     * @return void
     */
    public function updateLocation(): void
    {
        // Récupérer le prestataire authentifié
        $provider = ProviderMiddleware::provider();
        $providerId = (int) $provider['id'];

        // Récupérer les données JSON
        $data = $this->getJsonInput();

        // Validation
        $errors = $this->validate($data, [
            'lat' => 'required|numeric',
            'lon' => 'required|numeric'
        ]);

        if (!empty($errors)) {
            $this->error('Erreurs de validation', 422, $errors);
        }

        $lat = (float) $data['lat'];
        $lon = (float) $data['lon'];

        // Validation des coordonnées (latitude: -90 à 90, longitude: -180 à 180)
        if ($lat < -90 || $lat > 90 || $lon < -180 || $lon > 180) {
            $this->error('Coordonnées géographiques invalides', 400);
        }

        try {
            // Mettre à jour la position
            $success = Provider::updateLocation($providerId, $lat, $lon);

            if (!$success) {
                $this->error('Erreur lors de la mise à jour de la position', 500);
            }

            error_log("📍 [PROVIDER LOCATION] Prestataire #$providerId : position mise à jour ($lat, $lon)");

            // Récupérer le prestataire mis à jour
            $updatedProvider = Provider::findById($providerId);

            $this->success([
                'provider' => Provider::getPublicData($updatedProvider)
            ], 'Position mise à jour avec succès');

        } catch (Exception $e) {
            $this->error('Erreur lors de la mise à jour de la position: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Déconnexion (côté client, invalidation du token)
     *
     * POST /api/provider/logout
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
