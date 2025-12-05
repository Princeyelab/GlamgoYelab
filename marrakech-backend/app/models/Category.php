<?php

/**
 * Category - Modèle pour les catégories de services
 *
 * Gère les opérations liées aux catégories de services
 */
class Category
{
    /**
     * Récupère toutes les catégories actives
     *
     * @return array Liste des catégories ordonnées par display_order
     */
    public static function getAll(): array
    {
        $db = Database::getInstance();

        $sql = "SELECT
                    id,
                    name,
                    description,
                    image_url,
                    display_order,
                    created_at,
                    updated_at
                FROM categories
                WHERE is_active = 1
                ORDER BY display_order ASC, name ASC";

        $stmt = $db->query($sql);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Récupère une catégorie par son ID
     *
     * @param int $id ID de la catégorie
     * @return array|null Données de la catégorie ou null si non trouvée
     */
    public static function findById(int $id): ?array
    {
        $db = Database::getInstance();

        $sql = "SELECT
                    id,
                    name,
                    description,
                    image_url,
                    display_order,
                    created_at,
                    updated_at
                FROM categories
                WHERE id = :id AND is_active = 1";

        $stmt = $db->prepare($sql);
        $stmt->execute(['id' => $id]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result ?: null;
    }

    /**
     * Vérifie si une catégorie existe
     *
     * @param int $id ID de la catégorie
     * @return bool True si la catégorie existe et est active
     */
    public static function exists(int $id): bool
    {
        $db = Database::getInstance();

        $sql = "SELECT COUNT(*) FROM categories WHERE id = :id AND is_active = 1";

        $stmt = $db->prepare($sql);
        $stmt->execute(['id' => $id]);

        return $stmt->fetchColumn() > 0;
    }

    /**
     * Compte le nombre total de catégories actives
     *
     * @return int Nombre de catégories
     */
    public static function count(): int
    {
        $db = Database::getInstance();

        $sql = "SELECT COUNT(*) FROM categories WHERE is_active = 1";

        $stmt = $db->query($sql);

        return (int) $stmt->fetchColumn();
    }
}
