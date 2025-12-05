<?php

/**
 * Service - Modèle pour les services disponibles
 *
 * Gère les opérations liées aux services proposés
 */
class Service
{
    /**
     * Récupère tous les services actifs
     *
     * @return array Liste de tous les services actifs
     */
    public static function getAll(): array
    {
        $db = Database::getInstance();

        $sql = "SELECT
                    s.id,
                    s.category_id,
                    s.name,
                    s.description,
                    s.duration_minutes,
                    s.price,
                    s.image_url,
                    s.created_at,
                    s.updated_at,
                    c.name as category_name
                FROM services s
                INNER JOIN categories c ON s.category_id = c.id
                WHERE s.is_active = 1 AND c.is_active = 1
                ORDER BY c.display_order ASC, s.price ASC";

        $stmt = $db->query($sql);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Récupère les services d'une catégorie spécifique
     *
     * @param int $categoryId ID de la catégorie
     * @return array Liste des services de cette catégorie
     */
    public static function findByCategory(int $categoryId): array
    {
        $db = Database::getInstance();

        $sql = "SELECT
                    s.id,
                    s.category_id,
                    s.name,
                    s.description,
                    s.duration_minutes,
                    s.price,
                    s.image_url,
                    s.created_at,
                    s.updated_at,
                    c.name as category_name
                FROM services s
                INNER JOIN categories c ON s.category_id = c.id
                WHERE s.category_id = :category_id
                  AND s.is_active = 1
                  AND c.is_active = 1
                ORDER BY s.price ASC, s.name ASC";

        $stmt = $db->prepare($sql);
        $stmt->execute(['category_id' => $categoryId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Récupère un service par son ID
     *
     * @param int $id ID du service
     * @return array|null Données du service ou null si non trouvé
     */
    public static function findById(int $id): ?array
    {
        $db = Database::getInstance();

        $sql = "SELECT
                    s.id,
                    s.category_id,
                    s.name,
                    s.description,
                    s.duration_minutes,
                    s.price,
                    s.image_url,
                    s.created_at,
                    s.updated_at,
                    c.name as category_name,
                    c.description as category_description
                FROM services s
                INNER JOIN categories c ON s.category_id = c.id
                WHERE s.id = :id
                  AND s.is_active = 1
                  AND c.is_active = 1";

        $stmt = $db->prepare($sql);
        $stmt->execute(['id' => $id]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result ?: null;
    }

    /**
     * Vérifie si un service existe
     *
     * @param int $id ID du service
     * @return bool True si le service existe et est actif
     */
    public static function exists(int $id): bool
    {
        $db = Database::getInstance();

        $sql = "SELECT COUNT(*) FROM services WHERE id = :id AND is_active = 1";

        $stmt = $db->prepare($sql);
        $stmt->execute(['id' => $id]);

        return $stmt->fetchColumn() > 0;
    }

    /**
     * Compte le nombre de services dans une catégorie
     *
     * @param int $categoryId ID de la catégorie
     * @return int Nombre de services
     */
    public static function countByCategory(int $categoryId): int
    {
        $db = Database::getInstance();

        $sql = "SELECT COUNT(*)
                FROM services s
                INNER JOIN categories c ON s.category_id = c.id
                WHERE s.category_id = :category_id
                  AND s.is_active = 1
                  AND c.is_active = 1";

        $stmt = $db->prepare($sql);
        $stmt->execute(['category_id' => $categoryId]);

        return (int) $stmt->fetchColumn();
    }

    /**
     * Recherche des services par mot-clé
     *
     * @param string $keyword Mot-clé à rechercher
     * @return array Liste des services correspondants
     */
    public static function search(string $keyword): array
    {
        $db = Database::getInstance();

        $sql = "SELECT
                    s.id,
                    s.category_id,
                    s.name,
                    s.description,
                    s.duration_minutes,
                    s.price,
                    s.image_url,
                    s.created_at,
                    s.updated_at,
                    c.name as category_name
                FROM services s
                INNER JOIN categories c ON s.category_id = c.id
                WHERE (s.name LIKE :keyword OR s.description LIKE :keyword)
                  AND s.is_active = 1
                  AND c.is_active = 1
                ORDER BY s.price ASC";

        $stmt = $db->prepare($sql);
        $stmt->execute(['keyword' => '%' . $keyword . '%']);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
