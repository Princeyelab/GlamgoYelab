<?php

namespace App\Helpers;

use Exception;

/**
 * ServiceRules - Validation des regles metier specifiques par service
 *
 * Ce helper centralise toutes les regles metier specifiques a chaque
 * categorie de service GlamGo :
 *
 * - Auto : uniquement nettoyage (pas de mecanique)
 * - Danse : uniquement orientale
 * - Animaux : gardiennage avec GPS, pas de toilettage
 * - Menage : toutes formules disponibles
 * - Beaute : standards hygiene stricts
 */
class ServiceRules
{
    /**
     * Categories de services avec leurs regles
     */
    private const CATEGORY_RULES = [
        'auto' => [
            'allowed_services' => ['nettoyage_interne', 'nettoyage_externe', 'polish', 'lavage'],
            'excluded_services' => ['mecanique', 'reparation', 'revision', 'vidange'],
            'requires_vehicle_info' => true,
            'min_duration_hours' => 0.5,
            'max_duration_hours' => 4
        ],
        'danse' => [
            'allowed_types' => ['orientale'],
            'excluded_types' => ['classique', 'moderne', 'hip-hop', 'salsa'],
            'session_types' => ['cours_prive', 'animation', 'spectacle'],
            'min_duration_hours' => 1,
            'max_participants' => 10
        ],
        'animaux' => [
            'allowed_services' => ['gardiennage', 'promenade', 'pet-sitting'],
            'excluded_services' => ['toilettage', 'veterinaire', 'dressage'],
            'tracking_required' => true,
            'photo_frequency_hours' => 2,
            'accepted_animals' => ['chien', 'chat'],
            'max_animals_per_booking' => 3
        ],
        'menage' => [
            'all_formulas_allowed' => true,
            'min_surface_m2' => 20,
            'max_surface_m2' => 500,
            'equipment_options' => ['provided', 'client']
        ],
        'beaute' => [
            'hygiene_standards' => 'strict',
            'equipment_provided' => true,
            'requires_consultation' => false,
            'max_duration_hours' => 4
        ]
    ];

    /**
     * Formules disponibles par categorie
     */
    private const CATEGORY_FORMULAS = [
        'auto' => ['standard', 'recurring', 'premium', 'urgent'],
        'danse' => ['standard', 'recurring', 'premium'],
        'animaux' => ['standard', 'recurring', 'night'],
        'menage' => ['standard', 'recurring', 'premium', 'urgent', 'night'],
        'beaute' => ['standard', 'recurring', 'premium', 'urgent']
    ];

    /**
     * Valide une reservation selon les regles metier
     *
     * @param array $service Service avec ses donnees
     * @param string $formulaType Type de formule selectionnee
     * @param array $details Details de la reservation
     * @return array Resultat de validation avec warnings
     * @throws Exception Si regle metier violee
     */
    public static function validateBooking(array $service, string $formulaType, array $details): array
    {
        $warnings = [];
        $requirements = [];
        $categorySlug = self::getCategorySlug($service);

        // === Regles Auto ===
        if (self::isAutoCategory($categorySlug, $service)) {
            $result = self::validateAutoService($service, $details);
            $warnings = array_merge($warnings, $result['warnings']);
            $requirements = array_merge($requirements, $result['requirements']);
        }

        // === Regles Danse ===
        if (self::isDanceService($service)) {
            $result = self::validateDanceService($service, $details);
            $warnings = array_merge($warnings, $result['warnings']);
            $requirements = array_merge($requirements, $result['requirements']);
        }

        // === Regles Animaux ===
        if (self::isAnimalCategory($categorySlug, $service)) {
            $result = self::validateAnimalService($service, $details);
            $warnings = array_merge($warnings, $result['warnings']);
            $requirements = array_merge($requirements, $result['requirements']);
        }

        // === Validation de la formule ===
        self::validateFormula($service, $formulaType, $categorySlug);

        // === Validation des horaires ===
        if (isset($details['scheduled_time'])) {
            $result = self::validateSchedule($formulaType, $details['scheduled_time']);
            $warnings = array_merge($warnings, $result['warnings']);
        }

        // === Validation de la duree ===
        if (isset($details['duration_hours'])) {
            self::validateDuration($service, $details['duration_hours'], $categorySlug);
        }

        return [
            'valid' => true,
            'warnings' => $warnings,
            'requirements' => $requirements,
            'category_rules' => self::CATEGORY_RULES[$categorySlug] ?? []
        ];
    }

    /**
     * Valide un service Auto
     */
    private static function validateAutoService(array $service, array $details): array
    {
        $warnings = [];
        $requirements = [];
        $rules = self::CATEGORY_RULES['auto'];

        // Verifier le type de service
        $serviceType = $details['service_type'] ?? null;
        if ($serviceType && in_array($serviceType, $rules['excluded_services'])) {
            throw new Exception(
                "Service non disponible pour la categorie Auto. " .
                "Seuls les services de nettoyage sont proposes (pas de mecanique)."
            );
        }

        // Exiger les informations du vehicule
        if ($rules['requires_vehicle_info']) {
            $requirements[] = [
                'field' => 'vehicle_info',
                'message' => 'Informations du vehicule requises (marque, modele, immatriculation)',
                'required' => true
            ];

            if (empty($details['vehicle_info'])) {
                $warnings[] = [
                    'type' => 'info',
                    'message' => 'Veuillez fournir les informations de votre vehicule pour le service'
                ];
            }
        }

        return ['warnings' => $warnings, 'requirements' => $requirements];
    }

    /**
     * Valide un service Danse
     */
    private static function validateDanceService(array $service, array $details): array
    {
        $warnings = [];
        $requirements = [];
        $rules = self::CATEGORY_RULES['danse'];

        // Verifier le type de danse
        $danceType = $details['dance_type'] ?? 'orientale';
        if (!in_array($danceType, $rules['allowed_types'])) {
            throw new Exception(
                "Seule la danse orientale est proposee actuellement. " .
                "Type demande non disponible."
            );
        }

        // Verifier le type de session
        $sessionType = $details['session_type'] ?? 'cours_prive';
        if (!in_array($sessionType, $rules['session_types'])) {
            $warnings[] = [
                'type' => 'warning',
                'message' => "Type de session non standard. Sessions disponibles: " .
                    implode(', ', $rules['session_types'])
            ];
        }

        // Verifier le nombre de participants
        $participants = $details['participants'] ?? 1;
        if ($participants > $rules['max_participants']) {
            throw new Exception(
                "Maximum {$rules['max_participants']} participants par cours. " .
                "Pour un groupe plus grand, veuillez reserver plusieurs sessions."
            );
        }

        $warnings[] = [
            'type' => 'info',
            'message' => 'Cours de danse orientale - Prevoir une tenue confortable'
        ];

        return ['warnings' => $warnings, 'requirements' => $requirements];
    }

    /**
     * Valide un service Animaux
     */
    private static function validateAnimalService(array $service, array $details): array
    {
        $warnings = [];
        $requirements = [];
        $rules = self::CATEGORY_RULES['animaux'];

        // Verifier le type de service
        $serviceType = $details['service_type'] ?? 'gardiennage';
        if (in_array($serviceType, $rules['excluded_services'])) {
            throw new Exception(
                "Service non disponible. " .
                "Nous proposons uniquement: " . implode(', ', $rules['allowed_services'])
            );
        }

        // Verifier le type d animal
        $animalType = $details['animal_type'] ?? null;
        if ($animalType && !in_array(strtolower($animalType), $rules['accepted_animals'])) {
            throw new Exception(
                "Type d animal non pris en charge. " .
                "Animaux acceptes: " . implode(', ', $rules['accepted_animals'])
            );
        }

        // Verifier le nombre d animaux
        $animalCount = $details['animal_count'] ?? 1;
        if ($animalCount > $rules['max_animals_per_booking']) {
            throw new Exception(
                "Maximum {$rules['max_animals_per_booking']} animaux par reservation."
            );
        }

        // Exigences GPS et photos
        if ($rules['tracking_required']) {
            $requirements[] = [
                'field' => 'gps_consent',
                'message' => 'Suivi GPS en temps reel obligatoire pour ce service',
                'required' => true
            ];
            $requirements[] = [
                'field' => 'photo_updates',
                'message' => "Photos de votre animal toutes les {$rules['photo_frequency_hours']} heures",
                'required' => true
            ];

            $warnings[] = [
                'type' => 'success',
                'message' => "Service avec suivi GPS et photos toutes les {$rules['photo_frequency_hours']}h inclus"
            ];
        }

        return ['warnings' => $warnings, 'requirements' => $requirements];
    }

    /**
     * Valide que la formule est autorisee pour ce service
     */
    private static function validateFormula(array $service, string $formulaType, string $categorySlug): void
    {
        // Recuperer les formules autorisees depuis le service ou la categorie
        $allowedFormulas = [];

        if (!empty($service['allowed_formulas'])) {
            $allowedFormulas = is_string($service['allowed_formulas'])
                ? json_decode($service['allowed_formulas'], true)
                : $service['allowed_formulas'];
        }

        if (empty($allowedFormulas)) {
            $allowedFormulas = self::CATEGORY_FORMULAS[$categorySlug] ?? ['standard', 'recurring'];
        }

        if (!in_array($formulaType, $allowedFormulas)) {
            throw new Exception(
                "Formule non disponible pour ce service. " .
                "Formules disponibles: " . implode(', ', $allowedFormulas)
            );
        }
    }

    /**
     * Valide les horaires de reservation
     */
    private static function validateSchedule(string $formulaType, string $scheduledTime): array
    {
        $warnings = [];
        $scheduled = new \DateTime($scheduledTime);
        $hour = (int) $scheduled->format('H');
        $dayOfWeek = (int) $scheduled->format('N');

        // Verifier si horaire de nuit
        $isNight = $hour >= 22 || $hour < 6;

        if ($isNight && $formulaType !== 'night') {
            $warnings[] = [
                'type' => 'warning',
                'message' => 'Horaire de nuit (22h-6h) : un supplement de 30 MAD sera applique'
            ];
        }

        // Formule urgente : verifier disponibilite
        if ($formulaType === 'urgent') {
            $now = new \DateTime();
            $diff = $scheduled->getTimestamp() - $now->getTimestamp();
            $hoursUntil = $diff / 3600;

            if ($hoursUntil > 2) {
                $warnings[] = [
                    'type' => 'info',
                    'message' => 'Formule urgente : intervention garantie sous 2h. ' .
                        'Pour une reservation planifiee, la formule Standard peut etre plus economique.'
                ];
            }
        }

        // Week-end
        if ($dayOfWeek >= 6) {
            $warnings[] = [
                'type' => 'info',
                'message' => 'Reservation le week-end - Disponibilite selon les prestataires'
            ];
        }

        return ['warnings' => $warnings];
    }

    /**
     * Valide la duree de reservation
     */
    private static function validateDuration(array $service, float $durationHours, string $categorySlug): void
    {
        $minHours = $service['min_booking_hours'] ?? 1;
        $maxHours = $service['max_booking_hours'] ?? 8;

        $rules = self::CATEGORY_RULES[$categorySlug] ?? [];
        if (isset($rules['min_duration_hours'])) {
            $minHours = max($minHours, $rules['min_duration_hours']);
        }
        if (isset($rules['max_duration_hours'])) {
            $maxHours = min($maxHours, $rules['max_duration_hours']);
        }

        if ($durationHours < $minHours) {
            throw new Exception("Duree minimum pour ce service : {$minHours} heure(s)");
        }

        if ($durationHours > $maxHours) {
            throw new Exception(
                "Duree maximum pour ce service : {$maxHours} heures. " .
                "Pour une duree plus longue, veuillez creer plusieurs reservations."
            );
        }
    }

    /**
     * Retourne les regles pour une categorie
     */
    public static function getCategoryRules(string $categorySlug): array
    {
        return self::CATEGORY_RULES[strtolower($categorySlug)] ?? [];
    }

    /**
     * Retourne les formules autorisees pour une categorie
     */
    public static function getAllowedFormulas(string $categorySlug): array
    {
        return self::CATEGORY_FORMULAS[strtolower($categorySlug)] ?? ['standard', 'recurring'];
    }

    /**
     * Configure les options de suivi pour les animaux
     */
    public static function getAnimalTrackingConfig(): array
    {
        return [
            'gps_enabled' => true,
            'photo_interval_hours' => self::CATEGORY_RULES['animaux']['photo_frequency_hours'],
            'live_location' => true,
            'notifications' => [
                'on_start' => true,
                'on_photo' => true,
                'on_complete' => true
            ]
        ];
    }

    // === Methodes utilitaires privees ===

    private static function getCategorySlug(array $service): string
    {
        $categoryName = $service['category_name'] ?? $service['category'] ?? '';
        $slug = strtolower(trim($categoryName));
        $slug = preg_replace('/[^a-z0-9]/', '', $slug);

        $mapping = [
            'auto' => 'auto',
            'automobile' => 'auto',
            'voiture' => 'auto',
            'danse' => 'danse',
            'danceorientale' => 'danse',
            'animaux' => 'animaux',
            'animal' => 'animaux',
            'petsitting' => 'animaux',
            'menage' => 'menage',
            'nettoyage' => 'menage',
            'beaute' => 'beaute',
            'coiffure' => 'beaute',
            'soinscorps' => 'beaute'
        ];

        return $mapping[$slug] ?? 'default';
    }

    private static function isAutoCategory(string $slug, array $service): bool
    {
        if ($slug === 'auto') return true;
        $name = strtolower($service['name'] ?? '');
        return strpos($name, 'auto') !== false ||
            strpos($name, 'voiture') !== false ||
            strpos($name, 'lavage') !== false;
    }

    private static function isDanceService(array $service): bool
    {
        $name = strtolower($service['name'] ?? '');
        return strpos($name, 'danse') !== false;
    }

    private static function isAnimalCategory(string $slug, array $service): bool
    {
        if ($slug === 'animaux') return true;
        $name = strtolower($service['name'] ?? '');
        return strpos($name, 'animaux') !== false ||
            strpos($name, 'animal') !== false ||
            strpos($name, 'pet') !== false ||
            strpos($name, 'chien') !== false ||
            strpos($name, 'chat') !== false;
    }
}
