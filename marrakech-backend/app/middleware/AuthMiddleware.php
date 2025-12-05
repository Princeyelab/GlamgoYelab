<?php

/**
 * AuthMiddleware - Middleware d'authentification JWT
 *
 * Vérifie la présence et la validité du token JWT dans les headers
 * et charge les informations de l'utilisateur authentifié
 */
class AuthMiddleware
{
    /**
     * Gère la requête et vérifie l'authentification
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

        // Vérifier que l'utilisateur existe toujours
        $user = User::findById($payload['user_id']);

        if (!$user) {
            $this->unauthorized('Utilisateur non trouvé');
            return false;
        }

        // Stocker les informations de l'utilisateur authentifié
        // dans une variable globale accessible aux contrôleurs
        $GLOBALS['auth_user'] = $user;
        $GLOBALS['auth_payload'] = $payload;

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
     * Récupère l'utilisateur authentifié depuis les globals
     *
     * @return array|null Les données de l'utilisateur ou null
     */
    public static function user(): ?array
    {
        return $GLOBALS['auth_user'] ?? null;
    }

    /**
     * Récupère le payload JWT depuis les globals
     *
     * @return array|null Le payload ou null
     */
    public static function payload(): ?array
    {
        return $GLOBALS['auth_payload'] ?? null;
    }

    /**
     * Vérifie si l'utilisateur est authentifié
     *
     * @return bool True si authentifié
     */
    public static function check(): bool
    {
        return isset($GLOBALS['auth_user']);
    }

    /**
     * Récupère l'ID de l'utilisateur authentifié
     *
     * @return int|null L'ID de l'utilisateur ou null
     */
    public static function id(): ?int
    {
        $user = self::user();
        return $user ? (int)$user['id'] : null;
    }
}
