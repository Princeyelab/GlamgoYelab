<?php
/**
 * NightFeeCalculator - Calcul des frais d'intervention nocturne
 *
 * Gère le calcul des commissions pour les prestations de nuit :
 * - Définition nuit : 22h00 - 06h00
 * - Commission simple pour 1 nuit
 * - Commission doublée pour 2 nuits consécutives
 *
 * Exemples de calculs :
 * =====================
 * 1. Intervention 23h00 - 01h00 (2h)
 *    → Entre dans 1 période nocturne = 30 MAD
 *
 * 2. Intervention 23h00 - 08h00 lendemain (9h)
 *    → Traverse 1 nuit complète (23h → 06h) = 30 MAD
 *
 * 3. Intervention 22h00 Jour 1 - 07h00 Jour 3 (33h)
 *    → Traverse 2 périodes nocturnes = 60 MAD
 *
 * 4. Intervention 14h00 - 16h00 (2h)
 *    → Aucune période nocturne = 0 MAD
 *
 * 5. Intervention 05h00 - 07h00 (2h)
 *    → Commence pendant la nuit = 30 MAD
 *
 * @package GlamGo\Helpers
 * @author GlamGo Team
 * @version 1.0.0
 */

namespace App\Helpers;

use App\Core\Database;
use PDO;
use DateTime;
use DateInterval;
use Exception;

class NightFeeCalculator
{
    /** @var int Heure de début de la période nocturne (22h00) */
    const NIGHT_START = 22;

    /** @var int Heure de fin de la période nocturne (06h00) */
    const NIGHT_END = 6;

    /** @var float Tarif par défaut pour 1 nuit (fallback si DB indisponible) */
    const DEFAULT_SINGLE_NIGHT_FEE = 30.00;

    /** @var float Tarif par défaut pour 2+ nuits (fallback si DB indisponible) */
    const DEFAULT_DOUBLE_NIGHT_FEE = 60.00;

    /** @var array|null Cache des tarifs depuis la DB */
    private static ?array $cachedRates = null;

    /**
     * Détermine si un horaire donné est dans la plage nocturne (22h-6h)
     *
     * @param string|DateTime $datetime Date/heure à vérifier
     * @return bool True si dans la plage nocturne
     *
     * @example
     * NightFeeCalculator::isNightTime('2024-01-15 23:30:00'); // true
     * NightFeeCalculator::isNightTime('2024-01-15 14:00:00'); // false
     * NightFeeCalculator::isNightTime('2024-01-15 05:30:00'); // true
     */
    public static function isNightTime($datetime): bool
    {
        if ($datetime instanceof DateTime) {
            $hour = (int) $datetime->format('G');
        } else {
            $hour = (int) date('G', strtotime($datetime));
        }

        return ($hour >= self::NIGHT_START || $hour < self::NIGHT_END);
    }

    /**
     * Calcule les frais de nuit pour une intervention
     *
     * @param string $scheduledTime Date/heure de début (format: Y-m-d H:i:s)
     * @param int $estimatedDurationHours Durée estimée en heures
     * @return array [
     *   'type' => 'none'|'single'|'double',
     *   'fee' => float,
     *   'nights_count' => int,
     *   'explanation' => string,
     *   'periods' => array (détails des périodes nocturnes)
     * ]
     *
     * @example
     * // Intervention de 23h à 01h (2h dans la nuit)
     * $result = NightFeeCalculator::calculate('2024-01-15 23:00:00', 2);
     * // Retourne: ['type' => 'single', 'fee' => 30.00, 'nights_count' => 1, ...]
     */
    public static function calculate(string $scheduledTime, int $estimatedDurationHours = 2): array
    {
        try {
            $start = new DateTime($scheduledTime);
        } catch (Exception $e) {
            return self::buildResult('none', 0, 0, 'Format de date invalide.');
        }

        // Calculer la fin de l'intervention
        $end = clone $start;
        $end->add(new DateInterval("PT{$estimatedDurationHours}H"));

        // Compter les périodes nocturnes traversées
        $nightPeriods = self::findNightPeriods($start, $end);
        $nightsCount = count($nightPeriods);

        // Aucune période nocturne
        if ($nightsCount === 0) {
            return self::buildResult(
                'none',
                0,
                0,
                'Intervention en journée (entre 6h et 22h), aucun frais de nuit.',
                $nightPeriods
            );
        }

        // Récupérer les tarifs depuis la DB
        $rates = self::getRates();

        // 1 nuit
        if ($nightsCount === 1) {
            return self::buildResult(
                'single',
                $rates['single'],
                1,
                sprintf(
                    'Intervention de nuit (22h-6h) : +%.2f MAD',
                    $rates['single']
                ),
                $nightPeriods
            );
        }

        // 2+ nuits
        return self::buildResult(
            'double',
            $rates['double'],
            $nightsCount,
            sprintf(
                'Intervention sur %d nuits consécutives (22h-6h) : +%.2f MAD',
                $nightsCount,
                $rates['double']
            ),
            $nightPeriods
        );
    }

    /**
     * Trouve toutes les périodes nocturnes dans une plage horaire
     *
     * @param DateTime $start Début de l'intervention
     * @param DateTime $end Fin de l'intervention
     * @return array Liste des périodes nocturnes [['start' => DateTime, 'end' => DateTime], ...]
     */
    private static function findNightPeriods(DateTime $start, DateTime $end): array
    {
        $periods = [];
        $current = clone $start;

        // Avancer heure par heure pour trouver les transitions
        $inNight = false;
        $nightStart = null;

        while ($current <= $end) {
            $hour = (int) $current->format('G');
            $isCurrentlyNight = ($hour >= self::NIGHT_START || $hour < self::NIGHT_END);

            if ($isCurrentlyNight && !$inNight) {
                // Entrée dans une période nocturne
                $inNight = true;
                $nightStart = clone $current;
            } elseif (!$isCurrentlyNight && $inNight) {
                // Sortie d'une période nocturne
                $inNight = false;
                $periods[] = [
                    'start' => $nightStart->format('Y-m-d H:i'),
                    'end' => $current->format('Y-m-d H:i'),
                    'date' => $nightStart->format('Y-m-d')
                ];
                $nightStart = null;
            }

            // Avancer de 1 heure
            $current->add(new DateInterval('PT1H'));
        }

        // Si on termine encore dans une période nocturne
        if ($inNight && $nightStart !== null) {
            $periods[] = [
                'start' => $nightStart->format('Y-m-d H:i'),
                'end' => $end->format('Y-m-d H:i'),
                'date' => $nightStart->format('Y-m-d')
            ];
        }

        return $periods;
    }

    /**
     * Compte le nombre de nuits distinctes (méthode alternative simplifiée)
     *
     * @param DateTime $start Début
     * @param DateTime $end Fin
     * @return int Nombre de nuits
     */
    public static function countNightsInRange(DateTime $start, DateTime $end): int
    {
        $nights = 0;
        $current = clone $start;
        $processedDates = [];

        while ($current < $end) {
            $hour = (int) $current->format('G');

            // Si on est dans une plage nocturne
            if ($hour >= self::NIGHT_START || $hour < self::NIGHT_END) {
                // Déterminer la "date de la nuit" (la nuit du 15 au 16 = date du 15)
                $nightDate = clone $current;
                if ($hour < self::NIGHT_END) {
                    // Si on est après minuit, la nuit appartient au jour précédent
                    $nightDate->sub(new DateInterval('P1D'));
                }
                $nightDateStr = $nightDate->format('Y-m-d');

                // Compter cette nuit si pas déjà comptée
                if (!in_array($nightDateStr, $processedDates)) {
                    $processedDates[] = $nightDateStr;
                    $nights++;
                }
            }

            // Avancer de 1 heure
            $current->add(new DateInterval('PT1H'));
        }

        return $nights;
    }

    /**
     * Récupère les tarifs depuis la base de données
     *
     * @return array ['single' => float, 'double' => float]
     */
    private static function getRates(): array
    {
        // Utiliser le cache si disponible
        if (self::$cachedRates !== null) {
            return self::$cachedRates;
        }

        try {
            $db = Database::getInstance();

            // Récupérer tarif nuit simple
            $stmt = $db->prepare("
                SELECT fee_amount FROM pricing_rules
                WHERE rule_type = 'night_single' AND active = TRUE
                LIMIT 1
            ");
            $stmt->execute();
            $singleResult = $stmt->fetch(PDO::FETCH_ASSOC);
            $singleFee = $singleResult ? (float) $singleResult['fee_amount'] : self::DEFAULT_SINGLE_NIGHT_FEE;

            // Récupérer tarif 2+ nuits
            $stmt = $db->prepare("
                SELECT fee_amount FROM pricing_rules
                WHERE rule_type = 'night_double' AND active = TRUE
                LIMIT 1
            ");
            $stmt->execute();
            $doubleResult = $stmt->fetch(PDO::FETCH_ASSOC);
            $doubleFee = $doubleResult ? (float) $doubleResult['fee_amount'] : self::DEFAULT_DOUBLE_NIGHT_FEE;

            self::$cachedRates = [
                'single' => $singleFee,
                'double' => $doubleFee
            ];

            return self::$cachedRates;

        } catch (Exception $e) {
            // Fallback aux valeurs par défaut
            return [
                'single' => self::DEFAULT_SINGLE_NIGHT_FEE,
                'double' => self::DEFAULT_DOUBLE_NIGHT_FEE
            ];
        }
    }

    /**
     * Vide le cache des tarifs (utile après modification admin)
     */
    public static function clearCache(): void
    {
        self::$cachedRates = null;
    }

    /**
     * Construit le résultat formaté
     */
    private static function buildResult(
        string $type,
        float $fee,
        int $nightsCount,
        string $explanation,
        array $periods = []
    ): array {
        return [
            'type' => $type,
            'fee' => round($fee, 2),
            'nights_count' => $nightsCount,
            'explanation' => $explanation,
            'periods' => $periods,
            'is_night_shift' => $type !== 'none',
            'night_hours' => [
                'start' => self::NIGHT_START . 'h00',
                'end' => self::NIGHT_END . 'h00'
            ]
        ];
    }

    /**
     * Génère un avertissement pour le client avant réservation
     *
     * @param string $scheduledTime Date/heure prévue
     * @param int $duration Durée en heures
     * @return array|null Avertissement ou null si pas de nuit
     *
     * @example
     * $warning = NightFeeCalculator::generateWarning('2024-01-15 23:00:00', 3);
     * // Retourne: [
     * //   'title' => '🌙 Intervention de nuit détectée',
     * //   'message' => '...',
     * //   'type' => 'warning',
     * //   'fee' => 30.00
     * // ]
     */
    public static function generateWarning(string $scheduledTime, int $duration = 2): ?array
    {
        $calc = self::calculate($scheduledTime, $duration);

        if ($calc['type'] === 'none') {
            return null;
        }

        $rates = self::getRates();

        return [
            'title' => '🌙 Intervention de nuit détectée',
            'message' => sprintf(
                'Cette prestation se déroule pendant les horaires de nuit (%dh-%dh). ' .
                'Une commission spécifique de %.2f MAD sera appliquée.',
                self::NIGHT_START,
                self::NIGHT_END,
                $calc['fee']
            ),
            'type' => 'warning',
            'severity' => $calc['nights_count'] > 1 ? 'high' : 'medium',
            'fee' => $calc['fee'],
            'nights_count' => $calc['nights_count'],
            'night_type' => $calc['type'],
            'details' => [
                'single_night_rate' => $rates['single'],
                'double_night_rate' => $rates['double'],
                'periods' => $calc['periods']
            ]
        ];
    }

    /**
     * Vérifie rapidement si une heure nécessite un avertissement nuit
     * (sans calculer les frais - pour UI rapide)
     *
     * @param string $scheduledTime Date/heure à vérifier
     * @return bool True si avertissement nécessaire
     */
    public static function needsWarning(string $scheduledTime): bool
    {
        return self::isNightTime($scheduledTime);
    }

    /**
     * Obtient les informations de configuration pour l'admin
     *
     * @return array Configuration actuelle
     */
    public static function getConfiguration(): array
    {
        $rates = self::getRates();

        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("
                SELECT pr.*, prh.changed_at as last_changed
                FROM pricing_rules pr
                LEFT JOIN (
                    SELECT pricing_rule_id, MAX(changed_at) as changed_at
                    FROM pricing_rules_history
                    GROUP BY pricing_rule_id
                ) prh ON pr.id = prh.pricing_rule_id
                WHERE pr.rule_type IN ('night_single', 'night_double')
                ORDER BY pr.rule_type
            ");
            $stmt->execute();
            $rules = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                'success' => true,
                'rates' => $rates,
                'rules' => $rules,
                'night_hours' => [
                    'start' => self::NIGHT_START,
                    'end' => self::NIGHT_END
                ]
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'rates' => $rates,
                'rules' => [],
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Met à jour les tarifs de nuit (admin)
     *
     * @param float $singleNightFee Nouveau tarif 1 nuit
     * @param float $doubleNightFee Nouveau tarif 2+ nuits
     * @param int|null $changedBy ID de l'admin
     * @return array Résultat de la mise à jour
     */
    public static function updateRates(
        float $singleNightFee,
        float $doubleNightFee,
        ?int $changedBy = null
    ): array {
        try {
            $db = Database::getInstance();

            // Mettre à jour tarif simple
            $stmt = $db->prepare("
                UPDATE pricing_rules
                SET fee_amount = ?, created_by = ?, updated_at = NOW()
                WHERE rule_type = 'night_single'
            ");
            $stmt->execute([$singleNightFee, $changedBy]);

            // Mettre à jour tarif double
            $stmt = $db->prepare("
                UPDATE pricing_rules
                SET fee_amount = ?, created_by = ?, updated_at = NOW()
                WHERE rule_type = 'night_double'
            ");
            $stmt->execute([$doubleNightFee, $changedBy]);

            // Vider le cache
            self::clearCache();

            return [
                'success' => true,
                'message' => 'Tarifs de nuit mis à jour avec succès',
                'new_rates' => [
                    'single' => $singleNightFee,
                    'double' => $doubleNightFee
                ]
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => 'Erreur lors de la mise à jour: ' . $e->getMessage()
            ];
        }
    }
}
