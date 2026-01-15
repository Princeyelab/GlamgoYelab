<?php

namespace App\Models;

use App\Core\Model;

class Service extends Model
{
    protected string $table = 'services';

    public function getAllWithCategory(): array
    {
        // Services standards
        $standardServices = $this->query(
            "SELECT s.*, c.name as category_name, c.id as category_id_ref,
                    FALSE as is_custom, NULL as provider_id, NULL as provider_name
             FROM services s
             INNER JOIN categories c ON s.category_id = c.id
             WHERE s.is_active = TRUE
             ORDER BY c.display_order, s.name"
        );

        // Services personnalisés actifs
        $customServices = $this->query(
            "SELECT
                CONCAT('custom_', pcs.id) as id,
                pcs.name,
                pcs.description,
                pcs.price,
                pcs.price as base_price,
                pcs.duration_minutes,
                pcs.category_id,
                c.name as category_name,
                pcs.category_id as category_id_ref,
                pcs.images,
                pcs.is_active,
                pcs.created_at,
                pcs.updated_at,
                c.slug as category_slug,
                TRUE as is_custom,
                pcs.provider_id,
                CONCAT(p.first_name, ' ', p.last_name) as provider_name
             FROM provider_custom_services pcs
             INNER JOIN categories c ON pcs.category_id = c.id
             INNER JOIN providers p ON pcs.provider_id = p.id
             WHERE pcs.is_active = TRUE
               AND p.is_available = TRUE
               AND p.account_status = 'active'
             ORDER BY c.display_order, pcs.name"
        );

        // Combiner et retourner
        return array_merge($standardServices, $customServices);
    }

    public function findBySlug(string $slug): ?array
    {
        return $this->findBy('slug', $slug);
    }

    public function getByCategory(int $categoryId): array
    {
        // Services standards de la catégorie
        $standardServices = $this->query(
            "SELECT s.*, c.name as category_name,
                    FALSE as is_custom, NULL as provider_id, NULL as provider_name
             FROM services s
             INNER JOIN categories c ON s.category_id = c.id
             WHERE s.category_id = ? AND s.is_active = TRUE
             ORDER BY s.name",
            [$categoryId]
        );

        // Services personnalisés de la catégorie
        $customServices = $this->query(
            "SELECT
                CONCAT('custom_', pcs.id) as id,
                pcs.name,
                pcs.description,
                pcs.price,
                pcs.price as base_price,
                pcs.duration_minutes,
                pcs.category_id,
                c.name as category_name,
                pcs.images,
                pcs.is_active,
                pcs.created_at,
                pcs.updated_at,
                TRUE as is_custom,
                pcs.provider_id,
                CONCAT(p.first_name, ' ', p.last_name) as provider_name
             FROM provider_custom_services pcs
             INNER JOIN categories c ON pcs.category_id = c.id
             INNER JOIN providers p ON pcs.provider_id = p.id
             WHERE pcs.category_id = ?
               AND pcs.is_active = TRUE
               AND p.is_available = TRUE
               AND p.account_status = 'active'
             ORDER BY pcs.name",
            [$categoryId]
        );

        return array_merge($standardServices, $customServices);
    }

    public function search(string $query): array
    {
        $searchTerm = "%{$query}%";

        // Services standards
        $standardServices = $this->query(
            "SELECT s.*, c.name as category_name,
                    FALSE as is_custom, NULL as provider_id, NULL as provider_name
             FROM services s
             INNER JOIN categories c ON s.category_id = c.id
             WHERE s.is_active = TRUE
             AND (s.name ILIKE ? OR s.description ILIKE ? OR c.name ILIKE ?)
             ORDER BY s.name
             LIMIT 15",
            [$searchTerm, $searchTerm, $searchTerm]
        );

        // Services personnalisés
        $customServices = $this->query(
            "SELECT
                CONCAT('custom_', pcs.id) as id,
                pcs.name,
                pcs.description,
                pcs.price,
                pcs.price as base_price,
                pcs.duration_minutes,
                pcs.category_id,
                c.name as category_name,
                pcs.images,
                pcs.is_active,
                pcs.created_at,
                pcs.updated_at,
                TRUE as is_custom,
                pcs.provider_id,
                CONCAT(p.first_name, ' ', p.last_name) as provider_name
             FROM provider_custom_services pcs
             INNER JOIN categories c ON pcs.category_id = c.id
             INNER JOIN providers p ON pcs.provider_id = p.id
             WHERE pcs.is_active = TRUE
               AND p.is_available = TRUE
               AND p.account_status = 'active'
               AND (pcs.name ILIKE ? OR pcs.description ILIKE ? OR c.name ILIKE ?)
             ORDER BY pcs.name
             LIMIT 10",
            [$searchTerm, $searchTerm, $searchTerm]
        );

        return array_merge($standardServices, $customServices);
    }

    public function getWithFormulas(int $id): ?array
    {
        $service = $this->query(
            "SELECT s.*, c.name as category_name
             FROM services s
             LEFT JOIN categories c ON s.category_id = c.id
             WHERE s.id = ?",
            [$id]
        );

        if (empty($service)) {
            return null;
        }

        $service = $service[0];
        $service['allowed_formulas'] = json_decode($service['allowed_formulas'] ?? '["standard"]', true);
        $service['special_rules'] = json_decode($service['special_rules'] ?? '{}', true);

        $formulas = $this->query(
            "SELECT sf.*,
                    CASE
                        WHEN sf.price_modifier_type = 'percentage'
                        THEN ? * (1 + sf.price_modifier_value / 100)
                        ELSE ? + sf.price_modifier_value
                    END as calculated_price
             FROM service_formulas sf
             WHERE sf.service_id = ? AND sf.is_active = TRUE
             ORDER BY FIELD(sf.formula_type, 'standard', 'recurring', 'premium', 'urgent', 'night')",
            [$service['price'], $service['price'], $id]
        );

        $service['formulas'] = $formulas;

        return $service;
    }

    public function getAllowedFormulas(int $id): array
    {
        $result = $this->query(
            "SELECT allowed_formulas FROM services WHERE id = ?",
            [$id]
        );

        if (empty($result)) {
            return ['standard'];
        }

        return json_decode($result[0]['allowed_formulas'] ?? '["standard"]', true) ?: ['standard'];
    }

    public function getSpecialRules(int $id): array
    {
        $result = $this->query(
            "SELECT special_rules FROM services WHERE id = ?",
            [$id]
        );

        if (empty($result)) {
            return [];
        }

        return json_decode($result[0]['special_rules'] ?? '{}', true) ?: [];
    }

    /**
     * Récupère un service personnalisé par son ID
     */
    public function findCustomService(int $customServiceId): ?array
    {
        $result = $this->query(
            "SELECT
                CONCAT('custom_', pcs.id) as id,
                pcs.id as custom_service_id,
                pcs.name,
                pcs.description,
                pcs.price,
                pcs.price as base_price,
                pcs.duration_minutes,
                pcs.category_id,
                c.name as category_name,
                c.slug as category_slug,
                pcs.images,
                pcs.is_active,
                pcs.created_at,
                pcs.updated_at,
                TRUE as is_custom,
                pcs.provider_id,
                CONCAT(p.first_name, ' ', p.last_name) as provider_name,
                p.first_name as provider_first_name,
                p.last_name as provider_last_name,
                p.avatar as provider_avatar,
                p.rating as provider_rating,
                p.total_reviews as provider_total_reviews
             FROM provider_custom_services pcs
             INNER JOIN categories c ON pcs.category_id = c.id
             INNER JOIN providers p ON pcs.provider_id = p.id
             WHERE pcs.id = ?
               AND pcs.is_active = TRUE
               AND p.is_available = TRUE
               AND p.account_status = 'active'",
            [$customServiceId]
        );

        if (empty($result)) {
            return null;
        }

        $service = $result[0];
        $service['images'] = json_decode($service['images'] ?? '[]', true);
        // Formules par défaut pour les services personnalisés
        $service['allowed_formulas'] = ['standard'];
        $service['special_rules'] = [];

        return $service;
    }
}
