<?php

namespace App\Models;

use App\Core\Model;

class Service extends Model
{
    protected string $table = 'services';

    public function getAllWithCategory(): array
    {
        return $this->query(
            "SELECT s.*, c.name as category_name, c.id as category_id_ref
             FROM services s
             INNER JOIN categories c ON s.category_id = c.id
             WHERE s.is_active = TRUE
             ORDER BY c.display_order, s.name"
        );
    }

    public function findBySlug(string $slug): ?array
    {
        return $this->findBy('slug', $slug);
    }

    public function getByCategory(int $categoryId): array
    {
        return $this->query(
            "SELECT * FROM services WHERE category_id = ? AND is_active = TRUE ORDER BY name",
            [$categoryId]
        );
    }

    public function search(string $query): array
    {
        $searchTerm = "%{$query}%";
        return $this->query(
            "SELECT s.*, c.name as category_name
             FROM services s
             INNER JOIN categories c ON s.category_id = c.id
             WHERE s.is_active = TRUE
             AND (s.name LIKE ? OR s.description LIKE ? OR c.name LIKE ?)
             ORDER BY s.name
             LIMIT 20",
            [$searchTerm, $searchTerm, $searchTerm]
        );
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
}
