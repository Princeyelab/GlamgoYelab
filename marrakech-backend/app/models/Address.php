<?php

/**
 * Address - Modèle pour les adresses utilisateurs
 *
 * Gère les opérations liées aux adresses des utilisateurs
 */
class Address
{
    /**
     * Récupère une adresse par son ID
     *
     * @param int $id ID de l'adresse
     * @return array|null Données de l'adresse ou null si non trouvée
     */
    public static function findById(int $id): ?array
    {
        $db = Database::getInstance();

        $sql = "SELECT
                    id,
                    user_id,
                    full_address,
                    lat,
                    lon,
                    is_default,
                    created_at,
                    updated_at
                FROM addresses
                WHERE id = :id";

        $stmt = $db->prepare($sql);
        $stmt->execute(['id' => $id]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result ?: null;
    }

    /**
     * Récupère toutes les adresses d'un utilisateur
     *
     * @param int $userId ID de l'utilisateur
     * @return array Liste des adresses
     */
    public static function findByUserId(int $userId): array
    {
        $db = Database::getInstance();

        $sql = "SELECT
                    id,
                    user_id,
                    full_address,
                    lat,
                    lon,
                    is_default,
                    created_at,
                    updated_at
                FROM addresses
                WHERE user_id = :user_id
                ORDER BY is_default DESC, created_at DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute(['user_id' => $userId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Récupère l'adresse par défaut d'un utilisateur
     *
     * @param int $userId ID de l'utilisateur
     * @return array|null L'adresse par défaut ou null
     */
    public static function getDefaultAddress(int $userId): ?array
    {
        $db = Database::getInstance();

        $sql = "SELECT
                    id,
                    user_id,
                    full_address,
                    lat,
                    lon,
                    is_default,
                    created_at,
                    updated_at
                FROM addresses
                WHERE user_id = :user_id AND is_default = 1
                LIMIT 1";

        $stmt = $db->prepare($sql);
        $stmt->execute(['user_id' => $userId]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result ?: null;
    }

    /**
     * Vérifie si une adresse appartient à un utilisateur
     *
     * @param int $addressId ID de l'adresse
     * @param int $userId ID de l'utilisateur
     * @return bool True si l'adresse appartient à l'utilisateur
     */
    public static function belongsToUser(int $addressId, int $userId): bool
    {
        $db = Database::getInstance();

        $sql = "SELECT COUNT(*)
                FROM addresses
                WHERE id = :address_id AND user_id = :user_id";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            'address_id' => $addressId,
            'user_id' => $userId
        ]);

        return $stmt->fetchColumn() > 0;
    }

    /**
     * Crée une nouvelle adresse
     *
     * @param array $data Données de l'adresse
     * @return int ID de l'adresse créée
     */
    public static function create(array $data): int
    {
        $db = Database::getInstance();

        $sql = "INSERT INTO addresses (user_id, full_address, lat, lon, is_default)
                VALUES (:user_id, :full_address, :lat, :lon, :is_default)";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            'user_id' => $data['user_id'],
            'full_address' => $data['full_address'],
            'lat' => $data['lat'],
            'lon' => $data['lon'],
            'is_default' => $data['is_default'] ?? 0
        ]);

        return (int) $db->lastInsertId();
    }
}
