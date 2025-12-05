<?php

/**
 * Classe Router - Gestion du routage de l'application
 *
 * Permet de d�finir des routes et de dispatcher les requ�tes
 * vers les contr�leurs appropri�s
 */
class Router
{
    /**
     * Collection de toutes les routes enregistr�es
     * @var array
     */
    private array $routes = [];

    /**
     * M�thode HTTP de la requ�te courante
     * @var string
     */
    private string $requestMethod;

    /**
     * URI de la requ�te courante
     * @var string
     */
    private string $requestUri;

    /**
     * Constructeur du Router
     * Initialise la m�thode HTTP et l'URI de la requ�te
     */
    public function __construct()
    {
        $this->requestMethod = $_SERVER['REQUEST_METHOD'];
        $this->requestUri = $this->parseUri();
    }

    /**
     * Parse l'URI de la requ�te
     * Retire les param�tres GET et nettoie l'URI
     *
     * @return string URI nettoy�e
     */
    private function parseUri(): string
    {
        $uri = $_SERVER['REQUEST_URI'] ?? '/';

        // Retirer les param�tres GET (?param=value)
        $uri = parse_url($uri, PHP_URL_PATH);

        // Retirer les slashes en d�but et fin
        $uri = trim($uri, '/');

        // Si vide, retourner '/' pour la page d'accueil
        return $uri === '' ? '/' : '/' . $uri;
    }

    /**
     * Ajoute une route au router
     *
     * @param string $method M�thode HTTP (GET, POST, PUT, DELETE, etc.)
     * @param string $uri URI de la route (ex: /users/{id})
     * @param string $controller Nom de la classe du contr�leur
     * @param string $action Nom de la m�thode du contr�leur � appeler
     * @param array $middleware Tableau de middleware � ex�cuter avant le contr�leur
     */
    public function add(string $method, string $uri, string $controller, string $action = 'index', array $middleware = []): void
    {
        // Normaliser l'URI
        $uri = '/' . trim($uri, '/');
        if ($uri === '//') {
            $uri = '/';
        }

        $this->routes[] = [
            'method' => strtoupper($method),
            'uri' => $uri,
            'controller' => $controller,
            'action' => $action,
            'middleware' => $middleware
        ];
    }

    /**
     * Shortcut pour ajouter une route GET
     *
     * @param string $uri URI de la route
     * @param string $controller Nom du contr�leur
     * @param string $action Nom de la m�thode
     * @param array $middleware Middleware � ex�cuter
     */
    public function get(string $uri, string $controller, string $action = 'index', array $middleware = []): void
    {
        $this->add('GET', $uri, $controller, $action, $middleware);
    }

    /**
     * Shortcut pour ajouter une route POST
     *
     * @param string $uri URI de la route
     * @param string $controller Nom du contr�leur
     * @param string $action Nom de la m�thode
     * @param array $middleware Middleware � ex�cuter
     */
    public function post(string $uri, string $controller, string $action = 'index', array $middleware = []): void
    {
        $this->add('POST', $uri, $controller, $action, $middleware);
    }

    /**
     * Shortcut pour ajouter une route PUT
     *
     * @param string $uri URI de la route
     * @param string $controller Nom du contr�leur
     * @param string $action Nom de la m�thode
     * @param array $middleware Middleware � ex�cuter
     */
    public function put(string $uri, string $controller, string $action = 'index', array $middleware = []): void
    {
        $this->add('PUT', $uri, $controller, $action, $middleware);
    }

    /**
     * Shortcut pour ajouter une route DELETE
     *
     * @param string $uri URI de la route
     * @param string $controller Nom du contr�leur
     * @param string $action Nom de la m�thode
     * @param array $middleware Middleware � ex�cuter
     */
    public function delete(string $uri, string $controller, string $action = 'index', array $middleware = []): void
    {
        $this->add('DELETE', $uri, $controller, $action, $middleware);
    }

    /**
     * Ex�cute le router
     * Cherche une route correspondante et ex�cute le contr�leur
     *
     * @return void
     */
    public function run(): void
    {
        foreach ($this->routes as $route) {
            // V�rifier la m�thode HTTP
            if ($route['method'] !== $this->requestMethod) {
                continue;
            }

            // V�rifier si l'URI correspond
            $params = $this->matchUri($route['uri'], $this->requestUri);

            if ($params !== false) {
                // Route trouv�e ! Appeler le contr�leur
                $this->dispatch($route['controller'], $route['action'], $params, $route['middleware'] ?? []);
                return;
            }
        }

        // Aucune route trouv�e - Erreur 404
        $this->notFound();
    }

    /**
     * V�rifie si l'URI de la route correspond � l'URI de la requ�te
     * G�re les param�tres dynamiques {id}, {slug}, etc.
     *
     * @param string $routeUri URI d�finie dans la route
     * @param string $requestUri URI de la requ�te
     * @return array|false Param�tres extraits ou false si pas de correspondance
     */
    private function matchUri(string $routeUri, string $requestUri)
    {
        // Si l'URI est exacte, pas besoin de regex
        if ($routeUri === $requestUri) {
            return [];
        }

        // Convertir l'URI de la route en regex
        // Exemple: /users/{id} devient /users/([^/]+)
        $pattern = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '([^/]+)', $routeUri);
        $pattern = '#^' . $pattern . '$#';

        // Tester la correspondance
        if (preg_match($pattern, $requestUri, $matches)) {
            // Retirer le premier match (l'URI compl�te)
            array_shift($matches);

            // Extraire les noms des param�tres
            preg_match_all('/\{([a-zA-Z0-9_]+)\}/', $routeUri, $paramNames);
            $paramNames = $paramNames[1];

            // Cr�er un tableau associatif param�tre => valeur
            $params = [];
            foreach ($paramNames as $index => $name) {
                $params[$name] = $matches[$index] ?? null;
            }

            return $params;
        }

        return false;
    }

    /**
     * Dispatche la requ�te vers le contr�leur appropri�
     *
     * @param string $controllerName Nom de la classe du contr�leur
     * @param string $action Nom de la m�thode � appeler
     * @param array $params Param�tres � passer � la m�thode
     * @param array $middleware Middleware � ex�cuter avant le contr�leur
     * @return void
     */
    private function dispatch(string $controllerName, string $action, array $params = [], array $middleware = []): void
    {
        // Ex�cuter les middleware avant le contr�leur
        foreach ($middleware as $middlewareClass) {
            // V�rifier si la classe de middleware existe
            if (!class_exists($middlewareClass)) {
                $this->error("Middleware '{$middlewareClass}' not found", 500);
                return;
            }

            // Instancier le middleware
            $middlewareInstance = new $middlewareClass();

            // V�rifier si la m�thode handle() existe
            if (!method_exists($middlewareInstance, 'handle')) {
                $this->error("Method 'handle' not found in middleware '{$middlewareClass}'", 500);
                return;
            }

            // Ex�cuter le middleware
            try {
                $result = $middlewareInstance->handle();

                // Si le middleware retourne false, arr�ter l'ex�cution
                if ($result === false) {
                    return;
                }
            } catch (Exception $e) {
                $this->error("Error executing middleware: " . $e->getMessage(), 500);
                return;
            }
        }

        // Construire le nom complet de la classe
        $controllerClass = $controllerName;

        // V�rifier si la classe existe
        if (!class_exists($controllerClass)) {
            $this->error("Controller '{$controllerClass}' not found", 500);
            return;
        }

        // Instancier le contr�leur
        $controller = new $controllerClass();

        // V�rifier si la m�thode existe
        if (!method_exists($controller, $action)) {
            $this->error("Method '{$action}' not found in controller '{$controllerClass}'", 500);
            return;
        }

        // Appeler la m�thode avec les param�tres
        try {
            // Si des param�tres existent, les passer comme un seul argument (tableau associatif)
            // Sinon, appeler sans arguments
            if (!empty($params)) {
                $controller->$action($params);
            } else {
                $controller->$action();
            }
        } catch (Exception $e) {
            $this->error("Error executing controller: " . $e->getMessage(), 500);
        }
    }

    /**
     * Affiche une page 404
     *
     * @return void
     */
    private function notFound(): void
    {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error' => 'Route not found',
            'requested_uri' => $this->requestUri,
            'method' => $this->requestMethod
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * Affiche une erreur
     *
     * @param string $message Message d'erreur
     * @param int $code Code HTTP
     * @return void
     */
    private function error(string $message, int $code = 500): void
    {
        http_response_code($code);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error' => $message
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * Retourne toutes les routes enregistr�es
     * Utile pour le debugging
     *
     * @return array
     */
    public function getRoutes(): array
    {
        return $this->routes;
    }
}
