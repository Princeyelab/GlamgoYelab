<?php

namespace App\Core;

class Controller
{
    /**
     * Retourne une réponse JSON
     */
    protected function json(mixed $data, int $statusCode = 200): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * Retourne une réponse de succès
     */
    protected function success(mixed $data = null, string $message = 'Success', int $statusCode = 200): void
    {
        $response = [
            'success' => true,
            'message' => $message,
        ];

        if ($data !== null) {
            $response['data'] = $data;
        }

        $this->json($response, $statusCode);
    }

    /**
     * Retourne une réponse d'erreur
     */
    protected function error(string $message, int $statusCode = 400, mixed $errors = null): void
    {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        $this->json($response, $statusCode);
    }

    /**
     * Récupère les données JSON de la requête
     */
    protected function getJsonInput(): array
    {
        $input = file_get_contents('php://input');
        return json_decode($input, true) ?? [];
    }

    /**
     * Récupère les données du formulaire
     */
    protected function getFormData(): array
    {
        return $_POST;
    }

    /**
     * Récupère les paramètres de l'URL (query string)
     */
    protected function getQueryParams(): array
    {
        return $_GET;
    }

    /**
     * Valide les données selon les règles
     */
    protected function validate(array $data, array $rules): array
    {
        $errors = [];

        foreach ($rules as $field => $ruleString) {
            $ruleArray = explode('|', $ruleString);

            foreach ($ruleArray as $rule) {
                // Règle required
                if ($rule === 'required' && empty($data[$field])) {
                    $errors[$field][] = "Le champ $field est requis";
                }

                // Règle email
                if ($rule === 'email' && !empty($data[$field]) && !filter_var($data[$field], FILTER_VALIDATE_EMAIL)) {
                    $errors[$field][] = "Le champ $field doit être un email valide";
                }

                // Règle min:n
                if (str_starts_with($rule, 'min:')) {
                    $min = (int)substr($rule, 4);
                    if (!empty($data[$field]) && strlen($data[$field]) < $min) {
                        $errors[$field][] = "Le champ $field doit contenir au moins $min caractères";
                    }
                }

                // Règle max:n
                if (str_starts_with($rule, 'max:')) {
                    $max = (int)substr($rule, 4);
                    if (!empty($data[$field]) && strlen($data[$field]) > $max) {
                        $errors[$field][] = "Le champ $field ne doit pas dépasser $max caractères";
                    }
                }

                // Règle numeric
                if ($rule === 'numeric' && !empty($data[$field]) && !is_numeric($data[$field])) {
                    $errors[$field][] = "Le champ $field doit être numérique";
                }
            }
        }

        return $errors;
    }
}
