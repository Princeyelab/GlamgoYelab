<?php

/**
 * ProviderMiddleware - Middleware d'authentification JWT pour les prestataires
 *
 * Vérifie la présence et la validité du token JWT dans les headers
 * et charge les informations du prestataire authentifié
 */
class ProviderMiddleware
{
    /**
     * Gère la requête et vérifie l'authentification du prestataire
     *
     * @return bool True si authentifié, False sinon
     */
    public function handle(): bool
    {
        // Extraire le token depuis les headers
        $token = JWT::getTokenFromHeaders();

        if (!$token) {
            $this->unauthorized('Token manquant');
            return false;
        }

        // Décoder et valider le token
        $payload = JWT::decode($token);

        if (!$payload) {
            $this->unauthorized('Token invalide ou expiré');
            return false;
        }

        // Vérifier que le token contient un provider_id (et non un user_id)
        if (!isset($payload['provider_id'])) {
            $this->unauthorized('Token invalide - non destiné aux prestataires');
            return false;
        }

        // Vérifier que le prestataire existe toujours
        $provider = Provider::findById($payload['provider_id']);

        if (!$provider) {
            $this->unauthorized('Prestataire non trouvé');
            return false;
        }

        // Stocker les informations du prestataire authentifié
        // dans une variable globale accessible aux contrôleurs
        $GLOBALS['auth_provider'] = $provider;
        $GLOBALS['auth_provider_payload'] = $payload;

        return true;
    }

    /**
     * Retourne une réponse 401 Unauthorized
     *
     * @param string $message Message d'erreur
     * @return void
     */
    private function unauthorized(string $message = 'Non autorisé'): void
    {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error' => $message
        ]);
        exit;
    }

    /**
     * Récupère le prestataire authentifié depuis les globals
     *
     * @return array|null Les données du prestataire ou null
     */
    public static function provider(): ?array
    {
        return $GLOBALS['auth_provider'] ?? null;
    }

    /**
     * Récupère le payload JWT depuis les globals
     *
     * @return array|null Le payload ou null
     */
    public static function payload(): ?array
    {
        return $GLOBALS['auth_provider_payload'] ?? null;
    }

    /**
     * Vérifie si le prestataire est authentifié
     *
     * @return bool True si authentifié
     */
    public static function check(): bool
    {
        return isset($GLOBALS['auth_provider']);
    }

    /**
     * Récupère l'ID du prestataire authentifié
     *
     * @return int|null L'ID du prestataire ou null
     */
    public static function id(): ?int
    {
        $provider = self::provider();
        return $provider ? (int)$provider['id'] : null;
    }
}
