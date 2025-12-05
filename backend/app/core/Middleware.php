<?php

namespace App\Core;

abstract class Middleware
{
    abstract public function handle(): void;

    /**
     * Retourne une réponse JSON et arrête l'exécution
     */
    protected function json(mixed $data, int $statusCode = 200): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * Retourne une erreur et arrête l'exécution
     */
    protected function error(string $message, int $statusCode = 401): void
    {
        $this->json([
            'success' => false,
            'message' => $message
        ], $statusCode);
    }
}
