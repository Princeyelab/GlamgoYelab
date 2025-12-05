<?php

/**
 * HomeController - Contrôleur de test et santé de l'API
 */
class HomeController extends Controller
{
    /**
     * Page d'accueil de l'API
     *
     * @return void
     */
    public function index(): void
    {
        $this->success([
            'app_name' => 'Marrakech Services API',
            'version' => '1.0.0',
            'status' => 'running',
            'timestamp' => time(),
            'message' => 'Bienvenue sur l\'API Marrakech Services'
        ]);
    }

    /**
     * Endpoint de health check
     * Vérifie que l'API et la base de données fonctionnent
     *
     * @return void
     */
    public function health(): void
    {
        // Tester la connexion à la base de données
        $dbStatus = Database::testConnection();

        // Informations système
        $health = [
            'status' => $dbStatus ? 'healthy' : 'unhealthy',
            'timestamp' => time(),
            'checks' => [
                'database' => $dbStatus ? 'connected' : 'disconnected',
                'php_version' => phpversion(),
                'server_time' => date('Y-m-d H:i:s')
            ]
        ];

        // Si la DB n'est pas connectée, retourner 503
        if (!$dbStatus) {
            $this->json($health, 503);
        }

        $this->success($health);
    }
}
