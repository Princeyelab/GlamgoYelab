<?php

/**
 * Helper JWT - Gestion des tokens d'authentification
 *
 * Implémentation simple de JWT (JSON Web Token) sans bibliothèque externe
 */
class JWT
{
    /**
     * Clé secrète pour signer les tokens
     * En production, cette clé doit être stockée dans une variable d'environnement
     */
    private static string $secret = 'marrakech-services-secret-key-change-in-production-2025';

    /**
     * Durée de validité du token en secondes (7 jours par défaut)
     */
    private static int $expiration = 604800;

    /**
     * Encode une chaîne en base64 URL-safe
     *
     * @param string $data Données à encoder
     * @return string Données encodées
     */
    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Décode une chaîne base64 URL-safe
     *
     * @param string $data Données à décoder
     * @return string Données décodées
     */
    private static function base64UrlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }

    /**
     * Génère un token JWT
     *
     * @param array $payload Données à inclure dans le token (user_id, email, etc.)
     * @param int|null $expiration Durée de validité personnalisée (optionnel)
     * @return string Token JWT
     */
    public static function encode(array $payload, ?int $expiration = null): string
    {
        // Header du JWT
        $header = [
            'typ' => 'JWT',
            'alg' => 'HS256'
        ];

        // Ajouter les timestamps au payload
        $now = time();
        $payload['iat'] = $now; // Issued At
        $payload['exp'] = $now + ($expiration ?? self::$expiration); // Expiration

        // Encoder le header et le payload
        $base64UrlHeader = self::base64UrlEncode(json_encode($header));
        $base64UrlPayload = self::base64UrlEncode(json_encode($payload));

        // Créer la signature
        $signature = hash_hmac('sha256', $base64UrlHeader . '.' . $base64UrlPayload, self::$secret, true);
        $base64UrlSignature = self::base64UrlEncode($signature);

        // Assembler le token
        return $base64UrlHeader . '.' . $base64UrlPayload . '.' . $base64UrlSignature;
    }

    /**
     * Décode et vérifie un token JWT
     *
     * @param string $token Token JWT à vérifier
     * @return array|null Payload du token si valide, null sinon
     */
    public static function decode(string $token): ?array
    {
        // Diviser le token en 3 parties
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            return null;
        }

        [$base64UrlHeader, $base64UrlPayload, $base64UrlSignature] = $parts;

        // Vérifier la signature
        $signature = self::base64UrlDecode($base64UrlSignature);
        $expectedSignature = hash_hmac('sha256', $base64UrlHeader . '.' . $base64UrlPayload, self::$secret, true);

        if (!hash_equals($signature, $expectedSignature)) {
            return null; // Signature invalide
        }

        // Décoder le payload
        $payload = json_decode(self::base64UrlDecode($base64UrlPayload), true);

        if (!$payload) {
            return null; // Payload invalide
        }

        // Vérifier l'expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return null; // Token expiré
        }

        return $payload;
    }

    /**
     * Récupère le token depuis les headers de la requête
     *
     * @return string|null Token JWT ou null
     */
    public static function getTokenFromHeaders(): ?string
    {
        // Vérifier le header Authorization
        $headers = getallheaders();

        if (isset($headers['Authorization'])) {
            // Format: "Bearer TOKEN"
            if (preg_match('/Bearer\s+(.*)$/i', $headers['Authorization'], $matches)) {
                return $matches[1];
            }
        }

        return null;
    }

    /**
     * Récupère et décode le payload du token depuis les headers
     *
     * @return array|null Payload décodé ou null
     */
    public static function getPayloadFromHeaders(): ?array
    {
        $token = self::getTokenFromHeaders();

        if (!$token) {
            return null;
        }

        return self::decode($token);
    }

    /**
     * Vérifie si un token est valide
     *
     * @param string $token Token à vérifier
     * @return bool True si le token est valide
     */
    public static function isValid(string $token): bool
    {
        return self::decode($token) !== null;
    }

    /**
     * Configure la clé secrète
     *
     * @param string $secret Clé secrète
     */
    public static function setSecret(string $secret): void
    {
        self::$secret = $secret;
    }

    /**
     * Configure la durée d'expiration par défaut
     *
     * @param int $seconds Durée en secondes
     */
    public static function setExpiration(int $seconds): void
    {
        self::$expiration = $seconds;
    }
}
