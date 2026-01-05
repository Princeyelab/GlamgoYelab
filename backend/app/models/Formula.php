<?php

namespace App\Models;

use App\Core\Model;

class Formula extends Model
{
    protected string $table = 'formulas';

    /**
     * Recuperer toutes les formules actives
     */
    public function getAllActive(): array
    {
        return $this->query("
            SELECT
                id,
                slug,
                name,
                description,
                icon,
                price_modifier,
                badge_text,
                badge_color,
                sort_order
            FROM formulas
            WHERE is_active = TRUE
            ORDER BY sort_order ASC
        ");
    }

    /**
     * Recuperer les formules d'un prestataire
     */
    public function getProviderFormulas(int $providerId): array
    {
        return $this->query("
            SELECT
                f.id,
                f.slug,
                f.name,
                f.description,
                f.icon,
                f.price_modifier,
                f.badge_text,
                f.badge_color,
                pf.is_active as provider_active,
                pf.created_at as added_at
            FROM provider_formulas pf
            JOIN formulas f ON pf.formula_id = f.id
            WHERE pf.provider_id = ? AND f.is_active = TRUE
            ORDER BY f.sort_order ASC
        ", [$providerId]);
    }

    /**
     * Ajouter une formule au prestataire
     */
    public function addToProvider(int $providerId, int $formulaId): bool
    {
        // Verifier si deja ajoutee
        $existing = $this->query("
            SELECT id FROM provider_formulas
            WHERE provider_id = ? AND formula_id = ?
        ", [$providerId, $formulaId]);

        if (!empty($existing)) {
            // Reactiver si desactivee
            return $this->execute("
                UPDATE provider_formulas
                SET is_active = TRUE, updated_at = NOW()
                WHERE provider_id = ? AND formula_id = ?
            ", [$providerId, $formulaId]);
        }

        // Ajouter nouvelle liaison
        return $this->execute("
            INSERT INTO provider_formulas (provider_id, formula_id, is_active)
            VALUES (?, ?, TRUE)
        ", [$providerId, $formulaId]);
    }

    /**
     * Retirer une formule du prestataire
     */
    public function removeFromProvider(int $providerId, int $formulaId): bool
    {
        return $this->execute("
            DELETE FROM provider_formulas
            WHERE provider_id = ? AND formula_id = ?
        ", [$providerId, $formulaId]);
    }

    /**
     * Verifier si une formule appartient a un prestataire
     */
    public function providerHasFormula(int $providerId, int $formulaId): bool
    {
        $result = $this->query("
            SELECT id FROM provider_formulas
            WHERE provider_id = ? AND formula_id = ?
        ", [$providerId, $formulaId]);

        return !empty($result);
    }

    /**
     * Supprimer toutes les formules d'un prestataire
     */
    public function removeAllFromProvider(int $providerId): bool
    {
        return $this->execute("
            DELETE FROM provider_formulas WHERE provider_id = ?
        ", [$providerId]);
    }

    /**
     * Trouver les prestataires ayant une formule specifique
     */
    public function getProvidersByFormulaSlug(string $formulaSlug): array
    {
        return $this->query("
            SELECT
                p.id,
                p.first_name,
                p.last_name,
                p.email,
                p.phone,
                p.avatar,
                p.average_rating,
                p.total_reviews,
                p.is_verified,
                p.latitude,
                p.longitude,
                f.name as formula_name,
                f.price_modifier
            FROM providers p
            JOIN provider_formulas pf ON p.id = pf.provider_id
            JOIN formulas f ON pf.formula_id = f.id
            WHERE f.slug = ?
                AND pf.is_active = TRUE
                AND p.is_available = TRUE
                AND p.status = 'active'
            ORDER BY p.average_rating DESC, p.total_reviews DESC
        ", [$formulaSlug]);
    }
}
