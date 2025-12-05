<?php

namespace App\Controllers;

use App\Core\Controller;

class OAuthController extends Controller
{
    /**
     * Redirige vers Google OAuth (placeholder)
     */
    public function redirectToGoogle(): void
    {
        $config = require __DIR__ . '/../../config/config.php';
        $googleConfig = $config['oauth']['google'];

        // TODO: Implémenter le flux OAuth Google complet
        $this->success([
            'message' => 'OAuth Google - À implémenter',
            'redirect_url' => 'https://accounts.google.com/o/oauth2/v2/auth'
        ]);
    }

    /**
     * Gère le callback Google (placeholder)
     */
    public function handleGoogleCallback(): void
    {
        // TODO: Récupérer le code, échanger contre un token, récupérer les infos utilisateur
        $this->success([
            'message' => 'Google OAuth callback - À implémenter'
        ]);
    }

    /**
     * Redirige vers Facebook OAuth (placeholder)
     */
    public function redirectToFacebook(): void
    {
        $config = require __DIR__ . '/../../config/config.php';
        $facebookConfig = $config['oauth']['facebook'];

        // TODO: Implémenter le flux OAuth Facebook complet
        $this->success([
            'message' => 'OAuth Facebook - À implémenter',
            'redirect_url' => 'https://www.facebook.com/v12.0/dialog/oauth'
        ]);
    }

    /**
     * Gère le callback Facebook (placeholder)
     */
    public function handleFacebookCallback(): void
    {
        // TODO: Récupérer le code, échanger contre un token, récupérer les infos utilisateur
        $this->success([
            'message' => 'Facebook OAuth callback - À implémenter'
        ]);
    }
}
