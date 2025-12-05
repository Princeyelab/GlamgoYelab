<?php

namespace App\Core;

class Router
{
    private array $routes = [];
    private array $middlewares = [];

    /**
     * Enregistre une route GET
     */
    public function get(string $path, string $controller, string $method): self
    {
        $this->addRoute('GET', $path, $controller, $method);
        return $this;
    }

    /**
     * Enregistre une route POST
     */
    public function post(string $path, string $controller, string $method): self
    {
        $this->addRoute('POST', $path, $controller, $method);
        return $this;
    }

    /**
     * Enregistre une route PUT
     */
    public function put(string $path, string $controller, string $method): self
    {
        $this->addRoute('PUT', $path, $controller, $method);
        return $this;
    }

    /**
     * Enregistre une route DELETE
     */
    public function delete(string $path, string $controller, string $method): self
    {
        $this->addRoute('DELETE', $path, $controller, $method);
        return $this;
    }

    /**
     * Enregistre une route PATCH
     */
    public function patch(string $path, string $controller, string $method): self
    {
        $this->addRoute('PATCH', $path, $controller, $method);
        return $this;
    }

    /**
     * Ajoute une route
     */
    private function addRoute(string $httpMethod, string $path, string $controller, string $method): void
    {
        $this->routes[] = [
            'http_method' => $httpMethod,
            'path' => $path,
            'controller' => $controller,
            'method' => $method,
            'middlewares' => []
        ];
    }

    /**
     * Ajoute un middleware à la dernière route enregistrée
     */
    public function middleware(array $middlewares): self
    {
        $lastIndex = count($this->routes) - 1;
        if ($lastIndex >= 0) {
            $this->routes[$lastIndex]['middlewares'] = $middlewares;
        }
        return $this;
    }

    /**
     * Dispatch la requête vers le bon contrôleur
     */
    public function dispatch(): void
    {
        $requestMethod = $_SERVER['REQUEST_METHOD'];
        $requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        // Gestion des requêtes OPTIONS (CORS preflight)
        if ($requestMethod === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        foreach ($this->routes as $route) {
            $pattern = $this->convertToRegex($route['path']);

            if ($route['http_method'] === $requestMethod && preg_match($pattern, $requestUri, $matches)) {
                array_shift($matches); // Enlève le match complet

                // Exécution des middlewares
                foreach ($route['middlewares'] as $middlewareClass) {
                    $middleware = new $middlewareClass();
                    $middleware->handle();
                }

                // Instanciation du contrôleur et appel de la méthode
                $controllerClass = "App\\Controllers\\" . $route['controller'];
                $controller = new $controllerClass();
                $method = $route['method'];

                call_user_func_array([$controller, $method], $matches);
                return;
            }
        }

        // Route non trouvée
        http_response_code(404);
        echo json_encode(['error' => 'Route not found']);
    }

    /**
     * Convertit un chemin de route en regex
     */
    private function convertToRegex(string $path): string
    {
        // Remplace {param} par un groupe de capture
        $pattern = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '([a-zA-Z0-9_-]+)', $path);
        return '#^' . $pattern . '$#';
    }
}
