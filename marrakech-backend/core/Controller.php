<?php

/**
 * Classe Controller - Classe de base pour tous les contrôleurs
 *
 * Fournit des méthodes utilitaires pour les contrôleurs
 * (gestion JSON, validation, etc.)
 */
class Controller
{
    /**
     * Retourne une réponse JSON
     *
     * @param mixed $data Données à retourner
     * @param int $statusCode Code HTTP
     * @return void
     */
    protected function json($data, int $statusCode = 200): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    /**
     * Retourne une réponse de succès
     *
     * @param mixed $data Données à retourner
     * @param string $message Message de succès
     * @param int $statusCode Code HTTP
     * @return void
     */
    protected function success($data = null, string $message = 'Success', int $statusCode = 200): void
    {
        $response = [
            'success' => true,
            'message' => $message
        ];

        if ($data !== null) {
            $response['data'] = $data;
        }

        $this->json($response, $statusCode);
    }

    /**
     * Retourne une réponse d'erreur
     *
     * @param string $message Message d'erreur
     * @param int $statusCode Code HTTP
     * @param mixed $errors Détails des erreurs
     * @return void
     */
    protected function error(string $message, int $statusCode = 400, $errors = null): void
    {
        $response = [
            'success' => false,
            'error' => $message
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        $this->json($response, $statusCode);
    }

    /**
     * Récupère les données JSON de la requête
     *
     * @return array
     */
    protected function getJsonInput(): array
    {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        return is_array($data) ? $data : [];
    }

    /**
     * Récupère les données POST de la requête
     *
     * @return array
     */
    protected function getPostData(): array
    {
        return $_POST;
    }

    /**
     * Récupère les données GET de la requête
     *
     * @return array
     */
    protected function getQueryParams(): array
    {
        return $_GET;
    }

    /**
     * Valide les données selon des règles simples
     *
     * @param array $data Données à valider
     * @param array $rules Règles de validation
     * @return array Erreurs de validation (vide si valide)
     */
    protected function validate(array $data, array $rules): array
    {
        $errors = [];

        foreach ($rules as $field => $ruleString) {
            $ruleArray = explode('|', $ruleString);

            foreach ($ruleArray as $rule) {
                // Règle: required
                if ($rule === 'required' && empty($data[$field])) {
                    $errors[$field][] = "Le champ {$field} est requis";
                }

                // Règle: email
                if ($rule === 'email' && !empty($data[$field])) {
                    if (!filter_var($data[$field], FILTER_VALIDATE_EMAIL)) {
                        $errors[$field][] = "Le champ {$field} doit être un email valide";
                    }
                }

                // Règle: min:n
                if (str_starts_with($rule, 'min:')) {
                    $min = (int)substr($rule, 4);
                    if (!empty($data[$field]) && strlen($data[$field]) < $min) {
                        $errors[$field][] = "Le champ {$field} doit contenir au moins {$min} caractères";
                    }
                }

                // Règle: max:n
                if (str_starts_with($rule, 'max:')) {
                    $max = (int)substr($rule, 4);
                    if (!empty($data[$field]) && strlen($data[$field]) > $max) {
                        $errors[$field][] = "Le champ {$field} ne doit pas dépasser {$max} caractères";
                    }
                }

                // Règle: numeric
                if ($rule === 'numeric' && !empty($data[$field])) {
                    if (!is_numeric($data[$field])) {
                        $errors[$field][] = "Le champ {$field} doit être numérique";
                    }
                }

                // Règle: alpha
                if ($rule === 'alpha' && !empty($data[$field])) {
                    if (!preg_match('/^[a-zA-ZÀ-ÿ\s]+$/', $data[$field])) {
                        $errors[$field][] = "Le champ {$field} ne doit contenir que des lettres";
                    }
                }
            }
        }

        return $errors;
    }

    /**
     * Charge une vue (rarement utilisé dans une API REST)
     *
     * @param string $view Nom de la vue
     * @param array $data Données à passer à la vue
     * @return void
     */
    protected function view(string $view, array $data = []): void
    {
        extract($data);
        $viewPath = __DIR__ . '/../app/views/' . $view . '.php';

        if (file_exists($viewPath)) {
            require $viewPath;
        } else {
            $this->error("View '{$view}' not found", 500);
        }
    }

    /**
     * Redirige vers une URL
     *
     * @param string $url URL de destination
     * @return void
     */
    protected function redirect(string $url): void
    {
        header("Location: {$url}");
        exit;
    }
}
