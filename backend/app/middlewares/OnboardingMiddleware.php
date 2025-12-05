<?php

namespace App\Middlewares;

use App\Core\Middleware;
use App\Core\Database;
use PDO;

/**
 * OnboardingMiddleware - Vérification onboarding complété
 *
 * Bloque l'accès aux fonctionnalités si l'utilisateur
 * n'a pas complété son questionnaire d'onboarding
 *
 * @package GlamGo\Middlewares
 * @author Claude Code
 */
class OnboardingMiddleware extends Middleware
{
    public function handle(): void
    {
        $user_type = $_SERVER['USER_TYPE'] ?? null;
        $user_id = $_SERVER['USER_ID'] ?? null;

        if (!$user_id) {
            $this->error('Non authentifié', 401);
        }

        $db = Database::getInstance();

        try {
            if ($user_type === 'user') {
                // Vérifier client
                $stmt = $db->prepare("
                    SELECT onboarding_completed FROM users WHERE id = ?
                ");
                $stmt->execute([$user_id]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$user || !$user['onboarding_completed']) {
                    $this->json([
                        'success' => false,
                        'error' => 'Onboarding non complété',
                        'message' => 'Veuillez compléter votre questionnaire d\'inscription',
                        'redirect' => '/onboarding/client',
                        'onboarding_required' => true
                    ], 403);
                }
            }

            if ($user_type === 'provider') {
                // Vérifier prestataire
                $stmt = $db->prepare("
                    SELECT onboarding_completed, account_status FROM providers WHERE id = ?
                ");
                $stmt->execute([$user_id]);
                $provider = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$provider || !$provider['onboarding_completed']) {
                    $this->json([
                        'success' => false,
                        'error' => 'Onboarding non complété',
                        'message' => 'Veuillez compléter votre questionnaire prestataire',
                        'redirect' => '/provider/onboarding',
                        'onboarding_required' => true
                    ], 403);
                }

                if ($provider['account_status'] !== 'active') {
                    $this->json([
                        'success' => false,
                        'error' => 'Compte en attente',
                        'message' => 'Votre compte est en cours de validation par notre équipe',
                        'account_status' => $provider['account_status'],
                        'pending_validation' => true
                    ], 403);
                }
            }

        } catch (\Exception $e) {
            error_log("OnboardingMiddleware Error: " . $e->getMessage());
            $this->error('Erreur lors de la vérification de l\'onboarding', 500);
        }
    }
}
