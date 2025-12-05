<?php

namespace App\Controllers;

use App\Core\Controller;

class HealthController extends Controller
{
    /**
     * Vérifie l'état de santé de l'API
     */
    public function check(): void
    {
        $this->success([
            'status' => 'ok',
            'timestamp' => time(),
            'service' => 'GlamGo API',
            'version' => '1.0.0'
        ], 'API is running');
    }
}
