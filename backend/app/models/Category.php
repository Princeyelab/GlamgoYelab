<?php

namespace App\Models;

use App\Core\Model;

class Category extends Model
{
    protected string $table = 'categories';

    /**
     * Récupère toutes les catégories principales (sans parent)
     */
    public function getMainCategories(): array
    {
        return $this->query(
            "SELECT * FROM categories WHERE is_active = TRUE AND parent_id IS NULL ORDER BY display_order, name"
        );
    }

    /**
     * Récupère les sous-catégories d'une catégorie
     */
    public function getSubCategories(int $parentId): array
    {
        return $this->query(
            "SELECT * FROM categories WHERE parent_id = ? AND is_active = TRUE ORDER BY display_order, name",
            [$parentId]
        );
    }

    /**
     * Récupère une catégorie par slug
     */
    public function findBySlug(string $slug): ?array
    {
        return $this->findBy('slug', $slug);
    }

    /**
     * Récupère les services d'une catégorie
     */
    public function getServices(int $categoryId): array
    {
        return $this->query(
            "SELECT * FROM services WHERE category_id = ? AND is_active = TRUE ORDER BY name",
            [$categoryId]
        );
    }

    /**
     * Récupère toutes les catégories avec leurs sous-catégories
     */
    public function getAllWithSubCategories(): array
    {
        $mainCategories = $this->getMainCategories();

        foreach ($mainCategories as &$category) {
            $category['sub_categories'] = $this->getSubCategories($category['id']);
        }

        return $mainCategories;
    }
}
