<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Category;

class CategoryController extends Controller
{
    private Category $categoryModel;

    public function __construct()
    {
        $this->categoryModel = new Category();
    }

    /**
     * Liste toutes les catégories avec sous-catégories
     */
    public function index(): void
    {
        $categories = $this->categoryModel->getAllWithSubCategories();
        $this->success($categories);
    }

    /**
     * Récupère une catégorie par ID
     */
    public function show(string $id): void
    {
        $category = $this->categoryModel->find((int)$id);

        if (!$category) {
            $this->error('Catégorie non trouvée', 404);
        }

        // Ajouter les sous-catégories si c'est une catégorie parente
        if (!$category['parent_id']) {
            $category['sub_categories'] = $this->categoryModel->getSubCategories($category['id']);
        }

        $this->success($category);
    }

    /**
     * Liste les services d'une catégorie
     */
    public function services(string $id): void
    {
        $services = $this->categoryModel->getServices((int)$id);
        $this->success($services);
    }
}
