<?php

namespace App\Middlewares;

use App\Core\Middleware;
use App\Helpers\JWT;

class AuthMiddleware extends Middleware
{
    public function handle(): void
    {
        $payload = JWT::getPayloadFromHeaders();

        if (!$payload) {
            $this->error('Non authentifié. Token manquant ou invalide.', 401);
        }

        // Le payload est valide, on peut continuer
        // On pourrait stocker l'utilisateur dans une variable globale si besoin
        $_SERVER['USER_ID'] = $payload['user_id'] ?? null;
        $_SERVER['USER_TYPE'] = $payload['user_type'] ?? 'user'; // 'user' ou 'provider'
    }
}
