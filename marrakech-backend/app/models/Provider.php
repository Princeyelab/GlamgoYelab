<?php

/**
 * Provider - Modèle pour les prestataires de services
 *
 * Gère les opérations liées aux prestataires
 */
class Provider
{
    /**
     * Trouve un prestataire par son email
     *
     * @param string $email Email du prestataire
     * @return array|null Prestataire trouvé ou null
     */
    public static function findByEmail(string $email): ?array
    {
        $db = Database::getInstance();

        $sql = "SELECT * FROM providers WHERE email = :email LIMIT 1";
        $stmt = $db->prepare($sql);
        $stmt->execute(['email' => $email]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result ?: null;
    }

    /**
     * Trouve un prestataire par son ID
     *
     * @param int $id ID du prestataire
     * @return array|null Prestataire trouvé ou null
     */
    public static function findById(int $id): ?array
    {
        $db = Database::getInstance();

        $sql = "SELECT * FROM providers WHERE id = :id LIMIT 1";
        $stmt = $db->prepare($sql);
        $stmt->execute(['id' => $id]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result ?: null;
    }

    /**
     * Crée un nouveau prestataire
     *
     * @param array $data Données du prestataire
     * @return int ID du prestataire créé
     */
    public static function create(array $data): int
    {
        $db = Database::getInstance();

        // Hasher le mot de passe si présent
        if (isset($data['password'])) {
            $data['password_hash'] = password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => 12]);
            unset($data['password']);
        }

        $sql = "INSERT INTO providers (
                    email,
                    password_hash,
                    first_name,
                    last_name,
                    phone,
                    status,
                    is_verified
                ) VALUES (
                    :email,
                    :password_hash,
                    :first_name,
                    :last_name,
                    :phone,
                    :status,
                    :is_verified
                )";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            'email' => $data['email'],
            'password_hash' => $data['password_hash'],
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'phone' => $data['phone'],
            'status' => $data['status'] ?? 'offline',
            'is_verified' => $data['is_verified'] ?? 0
        ]);

        return (int) $db->lastInsertId();
    }

    /**
     * Vérifie si un email existe déjà
     *
     * @param string $email Email à vérifier
     * @return bool True si l'email existe
     */
    public static function emailExists(string $email): bool
    {
        $db = Database::getInstance();

        $sql = "SELECT COUNT(*) FROM providers WHERE email = :email";
        $stmt = $db->prepare($sql);
        $stmt->execute(['email' => $email]);

        return $stmt->fetchColumn() > 0;
    }

    /**
     * Retourne les données publiques d'un prestataire (sans le password_hash)
     *
     * @param array $provider Données du prestataire
     * @return array Données publiques
     */
    public static function getPublicData(array $provider): array
    {
        return [
            'id' => $provider['id'],
            'email' => $provider['email'],
            'first_name' => $provider['first_name'],
            'last_name' => $provider['last_name'],
            'phone' => $provider['phone'],
            'profile_picture_url' => $provider['profile_picture_url'] ?? null,
            'status' => $provider['status'],
            'current_lat' => $provider['current_lat'] ?? null,
            'current_lon' => $provider['current_lon'] ?? null,
            'rating' => $provider['rating'] ?? '0.00',
            'total_reviews' => $provider['total_reviews'] ?? 0,
            'is_verified' => (bool) ($provider['is_verified'] ?? false),
            'created_at' => $provider['created_at'],
            'updated_at' => $provider['updated_at']
        ];
    }

    /**
     * Met à jour le statut d'un prestataire
     *
     * @param int $providerId ID du prestataire
     * @param string $status Nouveau statut (online, offline, busy)
     * @return bool True si succès
     */
    public static function updateStatus(int $providerId, string $status): bool
    {
        $db = Database::getInstance();

        $sql = "UPDATE providers
                SET status = :status,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :provider_id";

        $stmt = $db->prepare($sql);

        return $stmt->execute([
            'provider_id' => $providerId,
            'status' => $status
        ]);
    }

    /**
     * Met à jour la position géographique d'un prestataire
     *
     * @param int $providerId ID du prestataire
     * @param float $lat Latitude
     * @param float $lon Longitude
     * @return bool True si succès
     */
    public static function updateLocation(int $providerId, float $lat, float $lon): bool
    {
        $db = Database::getInstance();

        $sql = "UPDATE providers
                SET current_lat = :lat,
                    current_lon = :lon,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :provider_id";

        $stmt = $db->prepare($sql);

        return $stmt->execute([
            'provider_id' => $providerId,
            'lat' => $lat,
            'lon' => $lon
        ]);
    }

    /**
     * Récupère les services proposés par un prestataire
     *
     * @param int $providerId ID du prestataire
     * @return array Liste des services
     */
    public static function getServices(int $providerId): array
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
                    c.name as category_name
                FROM provider_services ps
                INNER JOIN services s ON ps.service_id = s.id
                INNER JOIN categories c ON s.category_id = c.id
                WHERE ps.provider_id = :provider_id
                  AND s.is_active = 1
                ORDER BY c.display_order, s.name";

        $stmt = $db->prepare($sql);
        $stmt->execute(['provider_id' => $providerId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Vérifie si un prestataire propose un service
     *
     * @param int $providerId ID du prestataire
     * @param int $serviceId ID du service
     * @return bool True si le prestataire propose ce service
     */
    public static function offersService(int $providerId, int $serviceId): bool
    {
        $db = Database::getInstance();

        $sql = "SELECT COUNT(*)
                FROM provider_services
                WHERE provider_id = :provider_id AND service_id = :service_id";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            'provider_id' => $providerId,
            'service_id' => $serviceId
        ]);

        return $stmt->fetchColumn() > 0;
    }
}
