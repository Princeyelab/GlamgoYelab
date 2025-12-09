<?php

namespace App\Helpers;

class JWT
{
    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }

    /**
     * Génère un token JWT
     */
    public static function encode(array $payload): string
    {
        $config = require __DIR__ . '/../../config/config.php';
        $secret = $config['jwt']['secret'];
        $expiration = $config['jwt']['expiration'];

        // Header
        $header = [
            'typ' => 'JWT',
            'alg' => 'HS256'
        ];

        // Payload avec expiration
        $payload['iat'] = time();
        $payload['exp'] = time() + $expiration;

        // Encode header et payload
        $base64UrlHeader = self::base64UrlEncode(json_encode($header));
        $base64UrlPayload = self::base64UrlEncode(json_encode($payload));

        // Signature
        $signature = hash_hmac('sha256', $base64UrlHeader . '.' . $base64UrlPayload, $secret, true);
        $base64UrlSignature = self::base64UrlEncode($signature);

        // Token final
        return $base64UrlHeader . '.' . $base64UrlPayload . '.' . $base64UrlSignature;
    }

    /**
     * Décode et vérifie un token JWT
     */
    public static function decode(string $token): ?array
    {
        $config = require __DIR__ . '/../../config/config.php';
        $secret = $config['jwt']['secret'];

        // Divise le token
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$base64UrlHeader, $base64UrlPayload, $base64UrlSignature] = $parts;

        // Vérifie la signature
        $signature = self::base64UrlDecode($base64UrlSignature);
        $expectedSignature = hash_hmac('sha256', $base64UrlHeader . '.' . $base64UrlPayload, $secret, true);

        if (!hash_equals($signature, $expectedSignature)) {
            return null;
        }

        // Décode le payload
        $payload = json_decode(self::base64UrlDecode($base64UrlPayload), true);

        // Vérifie l'expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return null;
        }

        return $payload;
    }

    /**
     * Récupère le token depuis les headers
     */
    public static function getTokenFromHeaders(): ?string
    {
        $authHeader = null;

        // Méthode 1: getallheaders() avec case-insensitive
        $headers = getallheaders();
        if ($headers) {
            $headersLower = array_change_key_case($headers, CASE_LOWER);
            if (isset($headersLower['authorization'])) {
                $authHeader = $headersLower['authorization'];
            }
        }

        // Méthode 2: $_SERVER avec HTTP_AUTHORIZATION
        if (!$authHeader && isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        }

        // Méthode 3: $_SERVER avec REDIRECT_HTTP_AUTHORIZATION (Apache)
        if (!$authHeader && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }

        if ($authHeader && preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Récupère le payload du token depuis les headers
     */
    public static function getPayloadFromHeaders(): ?array
    {
        $token = self::getTokenFromHeaders();
        if (!$token) {
            return null;
        }

        return self::decode($token);
    }
}
