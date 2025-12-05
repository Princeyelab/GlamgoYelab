<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Database;
use PDO;

/**
 * OnboardingController - Gestion des questionnaires d'onboarding
 *
 * Fonctionnalités :
 * - Questionnaire client (adresse, services, préférences)
 * - Questionnaire prestataire (zone, services, documents)
 * - Validation des données
 * - Vérification du statut d'onboarding
 *
 * @package GlamGo\Controllers
 * @author Claude Code
 */
class OnboardingController extends Controller
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * POST /api/onboarding/client/submit
     * Client soumet son questionnaire d'onboarding
     *
     * Body: {
     *   main_address: string,
     *   address_latitude: float,
     *   address_longitude: float,
     *   intervention_radius: int,
     *   preferred_services: array,
     *   availability_schedule: object,
     *   preferred_payment_method: string,
     *   terms_accepted: boolean,
     *   privacy_accepted: boolean
     * }
     */
    public function submitClientOnboarding()
    {
        $user_type = $_SERVER['USER_TYPE'] ?? null;
        $user_id = $_SERVER['USER_ID'] ?? null;

        if (!$user_id || $user_type !== 'user') {
            return $this->error('Non authentifié en tant que client', 401);
        }

        $data = $this->getJsonInput();

        // Validation des données
        $errors = $this->validate($data, [
            'main_address' => 'required',
            'address_latitude' => 'required|numeric',
            'address_longitude' => 'required|numeric',
            'intervention_radius' => 'required|numeric',
            'preferred_services' => 'required|array',
            'availability_schedule' => 'required',
            'preferred_payment_method' => 'required',
            'terms_accepted' => 'required',
            'privacy_accepted' => 'required'
        ]);

        if (!empty($errors)) {
            return $this->error('Données invalides', 400, $errors);
        }

        // Vérifier que les CGU sont acceptées
        if (!$data['terms_accepted'] || !$data['privacy_accepted']) {
            return $this->error('Vous devez accepter les conditions générales et la politique de confidentialité', 400);
        }

        // Vérifier rayon valide (5-50 km)
        if ($data['intervention_radius'] < 5 || $data['intervention_radius'] > 50) {
            return $this->error('Le rayon d\'intervention doit être entre 5 et 50 km', 400);
        }

        try {
            // Vérifier si déjà complété
            $stmt = $this->db->prepare("
                SELECT id FROM user_onboarding_data WHERE user_id = ?
            ");
            $stmt->execute([$user_id]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($existing) {
                // Mise à jour
                $stmt = $this->db->prepare("
                    UPDATE user_onboarding_data
                    SET
                        main_address = ?,
                        address_latitude = ?,
                        address_longitude = ?,
                        intervention_radius = ?,
                        preferred_services = ?,
                        availability_schedule = ?,
                        preferred_payment_method = ?,
                        terms_accepted = ?,
                        privacy_accepted = ?,
                        completed_at = NOW(),
                        updated_at = NOW()
                    WHERE user_id = ?
                ");

                $stmt->execute([
                    $data['main_address'],
                    $data['address_latitude'],
                    $data['address_longitude'],
                    $data['intervention_radius'],
                    json_encode($data['preferred_services']),
                    json_encode($data['availability_schedule']),
                    $data['preferred_payment_method'],
                    $data['terms_accepted'] ? 1 : 0,
                    $data['privacy_accepted'] ? 1 : 0,
                    $user_id
                ]);
            } else {
                // Insertion
                $stmt = $this->db->prepare("
                    INSERT INTO user_onboarding_data (
                        user_id, main_address, address_latitude, address_longitude,
                        intervention_radius, preferred_services, availability_schedule,
                        preferred_payment_method, terms_accepted, privacy_accepted,
                        completed_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ");

                $stmt->execute([
                    $user_id,
                    $data['main_address'],
                    $data['address_latitude'],
                    $data['address_longitude'],
                    $data['intervention_radius'],
                    json_encode($data['preferred_services']),
                    json_encode($data['availability_schedule']),
                    $data['preferred_payment_method'],
                    $data['terms_accepted'] ? 1 : 0,
                    $data['privacy_accepted'] ? 1 : 0
                ]);
            }

            // Mettre à jour statut user
            $stmt = $this->db->prepare("
                UPDATE users
                SET onboarding_completed = TRUE,
                    onboarding_completed_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$user_id]);

            return $this->success([
                'message' => 'Questionnaire complété avec succès !',
                'onboarding_completed' => true
            ], 'Bienvenue sur GlamGo !');

        } catch (\Exception $e) {
            error_log("OnboardingController::submitClientOnboarding Error: " . $e->getMessage());
            return $this->error('Erreur lors de l\'enregistrement du questionnaire', 500);
        }
    }

    /**
     * POST /api/onboarding/provider/submit
     * Prestataire soumet son questionnaire d'onboarding
     *
     * Body: {
     *   intervention_zone_radius: int,
     *   intervention_center_lat: float,
     *   intervention_center_lng: float,
     *   services_offered: array,
     *   availability_schedule: object,
     *   accepted_formulas: array,
     *   cin_number: string,
     *   cin_front_url: string,
     *   cin_back_url: string,
     *   justificatif_domicile_url: string,
     *   other_documents: array,
     *   charter_accepted: boolean
     * }
     */
    public function submitProviderOnboarding()
    {
        $user_type = $_SERVER['USER_TYPE'] ?? null;
        $provider_id = $_SERVER['USER_ID'] ?? null;

        if (!$provider_id || $user_type !== 'provider') {
            return $this->error('Non authentifié en tant que prestataire', 401);
        }

        $data = $this->getJsonInput();

        // Validation
        $errors = $this->validate($data, [
            'intervention_zone_radius' => 'required|numeric',
            'intervention_center_lat' => 'required|numeric',
            'intervention_center_lng' => 'required|numeric',
            'services_offered' => 'required|array',
            'availability_schedule' => 'required',
            'accepted_formulas' => 'required|array',
            'cin_number' => 'required',
            'charter_accepted' => 'required'
        ]);

        if (!empty($errors)) {
            return $this->error('Données invalides', 400, $errors);
        }

        // Vérifier que la charte est acceptée
        if (!$data['charter_accepted']) {
            return $this->error('Vous devez accepter la charte prestataire', 400);
        }

        // Vérifier rayon valide (5-100 km)
        if ($data['intervention_zone_radius'] < 5 || $data['intervention_zone_radius'] > 100) {
            return $this->error('Le rayon d\'intervention doit être entre 5 et 100 km', 400);
        }

        // Vérifier qu'au moins un service est proposé
        if (empty($data['services_offered'])) {
            return $this->error('Vous devez proposer au moins un service', 400);
        }

        try {
            // Valider que les services existent
            $service_ids = array_column($data['services_offered'], 'service_id');

            if (!empty($service_ids)) {
                $placeholders = implode(',', array_fill(0, count($service_ids), '?'));
                $stmt = $this->db->prepare("SELECT COUNT(*) as count FROM services WHERE id IN ($placeholders)");
                $stmt->execute($service_ids);
                $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

                if ($count != count($service_ids)) {
                    return $this->error('Certains services sélectionnés n\'existent pas', 400);
                }
            }

            // Vérifier si déjà complété
            $stmt = $this->db->prepare("
                SELECT id FROM provider_onboarding_data WHERE provider_id = ?
            ");
            $stmt->execute([$provider_id]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);

            // Gérer les documents uploadés
            $cin_front = $data['cin_front_url'] ?? null;
            $cin_back = $data['cin_back_url'] ?? null;
            $justificatif = $data['justificatif_domicile_url'] ?? null;
            $other_docs = $data['other_documents'] ?? [];

            if ($existing) {
                // Mise à jour
                $stmt = $this->db->prepare("
                    UPDATE provider_onboarding_data
                    SET
                        intervention_zone_radius = ?,
                        intervention_center_lat = ?,
                        intervention_center_lng = ?,
                        services_offered = ?,
                        availability_schedule = ?,
                        accepted_formulas = ?,
                        cin_number = ?,
                        cin_front_url = ?,
                        cin_back_url = ?,
                        justificatif_domicile_url = ?,
                        other_documents = ?,
                        charter_accepted = ?,
                        completed_at = NOW(),
                        updated_at = NOW()
                    WHERE provider_id = ?
                ");

                $stmt->execute([
                    $data['intervention_zone_radius'],
                    $data['intervention_center_lat'],
                    $data['intervention_center_lng'],
                    json_encode($data['services_offered']),
                    json_encode($data['availability_schedule']),
                    json_encode($data['accepted_formulas']),
                    $data['cin_number'],
                    $cin_front,
                    $cin_back,
                    $justificatif,
                    json_encode($other_docs),
                    $data['charter_accepted'] ? 1 : 0,
                    $provider_id
                ]);
            } else {
                // Insertion
                $stmt = $this->db->prepare("
                    INSERT INTO provider_onboarding_data (
                        provider_id, intervention_zone_radius, intervention_center_lat,
                        intervention_center_lng, services_offered, availability_schedule,
                        accepted_formulas, cin_number, cin_front_url, cin_back_url,
                        justificatif_domicile_url, other_documents, charter_accepted,
                        completed_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ");

                $stmt->execute([
                    $provider_id,
                    $data['intervention_zone_radius'],
                    $data['intervention_center_lat'],
                    $data['intervention_center_lng'],
                    json_encode($data['services_offered']),
                    json_encode($data['availability_schedule']),
                    json_encode($data['accepted_formulas']),
                    $data['cin_number'],
                    $cin_front,
                    $cin_back,
                    $justificatif,
                    json_encode($other_docs),
                    $data['charter_accepted'] ? 1 : 0
                ]);
            }

            // Mettre à jour statut provider
            $stmt = $this->db->prepare("
                UPDATE providers
                SET onboarding_completed = TRUE,
                    onboarding_completed_at = NOW(),
                    account_status = 'pending'
                WHERE id = ?
            ");
            $stmt->execute([$provider_id]);

            // Notification admin pour validation
            $this->notifyAdminForValidation($provider_id);

            return $this->success([
                'message' => 'Questionnaire soumis ! Votre compte sera activé après validation par notre équipe.',
                'onboarding_completed' => true,
                'account_status' => 'pending'
            ], 'Questionnaire envoyé avec succès');

        } catch (\Exception $e) {
            error_log("OnboardingController::submitProviderOnboarding Error: " . $e->getMessage());
            return $this->error('Erreur lors de l\'enregistrement du questionnaire', 500);
        }
    }

    /**
     * GET /api/onboarding/status
     * Vérifier le statut d'onboarding
     */
    public function getOnboardingStatus()
    {
        $user_type = $_SERVER['USER_TYPE'] ?? null;
        $user_id = $_SERVER['USER_ID'] ?? null;

        if (!$user_id) {
            return $this->error('Non authentifié', 401);
        }

        try {
            if ($user_type === 'user') {
                // Client
                $stmt = $this->db->prepare("
                    SELECT
                        u.onboarding_completed,
                        u.onboarding_completed_at,
                        uod.*
                    FROM users u
                    LEFT JOIN user_onboarding_data uod ON u.id = uod.user_id
                    WHERE u.id = ?
                ");
                $stmt->execute([$user_id]);
                $data = $stmt->fetch(PDO::FETCH_ASSOC);

                // Décoder JSON
                if ($data && $data['preferred_services']) {
                    $data['preferred_services'] = json_decode($data['preferred_services'], true);
                }
                if ($data && $data['availability_schedule']) {
                    $data['availability_schedule'] = json_decode($data['availability_schedule'], true);
                }

                return $this->success([
                    'user_type' => 'client',
                    'onboarding_completed' => (bool) ($data['onboarding_completed'] ?? false),
                    'data' => $data
                ]);
            }

            if ($user_type === 'provider') {
                // Prestataire
                $stmt = $this->db->prepare("
                    SELECT
                        p.onboarding_completed,
                        p.onboarding_completed_at,
                        p.account_status,
                        pod.*
                    FROM providers p
                    LEFT JOIN provider_onboarding_data pod ON p.id = pod.provider_id
                    WHERE p.id = ?
                ");
                $stmt->execute([$user_id]);
                $data = $stmt->fetch(PDO::FETCH_ASSOC);

                // Décoder JSON
                if ($data && $data['services_offered']) {
                    $data['services_offered'] = json_decode($data['services_offered'], true);
                }
                if ($data && $data['availability_schedule']) {
                    $data['availability_schedule'] = json_decode($data['availability_schedule'], true);
                }
                if ($data && $data['accepted_formulas']) {
                    $data['accepted_formulas'] = json_decode($data['accepted_formulas'], true);
                }
                if ($data && $data['other_documents']) {
                    $data['other_documents'] = json_decode($data['other_documents'], true);
                }

                return $this->success([
                    'user_type' => 'provider',
                    'onboarding_completed' => (bool) ($data['onboarding_completed'] ?? false),
                    'account_status' => $data['account_status'] ?? 'pending',
                    'admin_validated' => (bool) ($data['admin_validated'] ?? false),
                    'data' => $data
                ]);
            }

            return $this->error('Type d\'utilisateur invalide', 400);

        } catch (\Exception $e) {
            error_log("OnboardingController::getOnboardingStatus Error: " . $e->getMessage());
            return $this->error('Erreur lors de la récupération du statut', 500);
        }
    }

    /**
     * GET /api/onboarding/client/data
     * Récupérer les données onboarding client (pour pré-remplir formulaire)
     */
    public function getClientData()
    {
        $user_type = $_SERVER['USER_TYPE'] ?? null;
        $user_id = $_SERVER['USER_ID'] ?? null;

        if (!$user_id || $user_type !== 'user') {
            return $this->error('Non authentifié en tant que client', 401);
        }

        try {
            $stmt = $this->db->prepare("
                SELECT * FROM user_onboarding_data WHERE user_id = ?
            ");
            $stmt->execute([$user_id]);
            $data = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($data) {
                // Décoder les JSON
                $data['preferred_services'] = json_decode($data['preferred_services'], true);
                $data['availability_schedule'] = json_decode($data['availability_schedule'], true);
            }

            return $this->success(['data' => $data]);

        } catch (\Exception $e) {
            return $this->error('Erreur lors de la récupération des données', 500);
        }
    }

    /**
     * GET /api/onboarding/provider/data
     * Récupérer les données onboarding prestataire
     */
    public function getProviderData()
    {
        $user_type = $_SERVER['USER_TYPE'] ?? null;
        $provider_id = $_SERVER['USER_ID'] ?? null;

        if (!$provider_id || $user_type !== 'provider') {
            return $this->error('Non authentifié en tant que prestataire', 401);
        }

        try {
            $stmt = $this->db->prepare("
                SELECT * FROM provider_onboarding_data WHERE provider_id = ?
            ");
            $stmt->execute([$provider_id]);
            $data = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($data) {
                // Décoder les JSON
                $data['services_offered'] = json_decode($data['services_offered'], true);
                $data['availability_schedule'] = json_decode($data['availability_schedule'], true);
                $data['accepted_formulas'] = json_decode($data['accepted_formulas'], true);
                $data['other_documents'] = json_decode($data['other_documents'], true);
            }

            return $this->success(['data' => $data]);

        } catch (\Exception $e) {
            return $this->error('Erreur lors de la récupération des données', 500);
        }
    }

    // =====================================================
    // HELPER METHODS
    // =====================================================

    /**
     * Notifier admin pour validation prestataire
     */
    private function notifyAdminForValidation($provider_id)
    {
        try {
            $stmt = $this->db->prepare("SELECT name, email FROM providers WHERE id = ?");
            $stmt->execute([$provider_id]);
            $provider = $stmt->fetch(PDO::FETCH_ASSOC);

            // TODO: Envoyer email admin
            // TODO: Créer notification interne

            // Log pour l'instant
            error_log("ADMIN: Nouveau prestataire à valider - {$provider['name']} ({$provider['email']})");

        } catch (\Exception $e) {
            error_log("Error notifying admin: " . $e->getMessage());
        }
    }
}
