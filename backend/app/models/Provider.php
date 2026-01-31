<?php

namespace App\Models;

use App\Core\Model;

class Provider extends Model
{
    protected string $table = 'providers';

    /**
     * Récupère un prestataire par email
     */
    public function findByEmail(string $email): ?array
    {
        return $this->findBy('email', $email);
    }

    /**
     * Récupère les services proposés par un prestataire
     */
    public function getServices(int $providerId): array
    {
        return $this->query(
            "SELECT s.*, ps.id as provider_service_id
             FROM services s
             INNER JOIN provider_services ps ON s.id = ps.service_id
             WHERE ps.provider_id = ?",
            [$providerId]
        );
    }

    /**
     * Ajoute un service au catalogue du prestataire
     */
    public function addService(int $providerId, int $serviceId): bool
    {
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO provider_services (provider_id, service_id) VALUES (?, ?)"
            );
            return $stmt->execute([$providerId, $serviceId]);
        } catch (\PDOException $e) {
            // Le service existe déjà pour ce prestataire
            return false;
        }
    }

    /**
     * Retire un service du catalogue du prestataire
     */
    public function removeService(int $providerId, int $serviceId): bool
    {
        return $this->execute(
            "DELETE FROM provider_services WHERE provider_id = ? AND service_id = ?",
            [$providerId, $serviceId]
        );
    }

    /**
     * Met à jour la position du prestataire
     */
    public function updateLocation(int $providerId, float $latitude, float $longitude): bool
    {
        return $this->execute(
            "UPDATE providers SET current_latitude = ?, current_longitude = ?, updated_at = NOW() WHERE id = ?",
            [$latitude, $longitude, $providerId]
        );
    }

    /**
     * Trouve les prestataires disponibles pour un service dans un rayon donné
     */
    public function findAvailableForService(int $serviceId, float $latitude, float $longitude, float $radiusKm = 20): array
    {
        // Formule de Haversine pour calculer la distance
        $sql = "SELECT p.*,
                (6371 * acos(cos(radians(?)) * cos(radians(p.current_latitude)) *
                cos(radians(p.current_longitude) - radians(?)) +
                sin(radians(?)) * sin(radians(p.current_latitude)))) AS distance
                FROM providers p
                INNER JOIN provider_services ps ON p.id = ps.provider_id
                WHERE ps.service_id = ?
                AND p.is_available = TRUE
                AND p.is_verified = TRUE
                AND p.current_latitude IS NOT NULL
                AND p.current_longitude IS NOT NULL
                HAVING distance <= ?
                ORDER BY distance ASC";

        return $this->query($sql, [$latitude, $longitude, $latitude, $serviceId, $radiusKm]);
    }

    /**
     * Met à jour la note moyenne du prestataire
     */
    public function updateRating(int $providerId): bool
    {
        $sql = "UPDATE providers p
                SET p.rating = (SELECT AVG(r.rating) FROM reviews r WHERE r.provider_id = p.id),
                    p.total_reviews = (SELECT COUNT(*) FROM reviews r WHERE r.provider_id = p.id)
                WHERE p.id = ?";

        return $this->execute($sql, [$providerId]);
    }

    /**
     * Met à jour le timestamp de dernière activité du prestataire
     */
    public function updateLastSeen(int $providerId): bool
    {
        return $this->execute(
            "UPDATE providers SET last_seen_at = NOW() WHERE id = ?",
            [$providerId]
        );
    }

    /**
     * Met à jour le statut de disponibilité du prestataire
     */
    public function setAvailability(int $providerId, bool $isAvailable): bool
    {
        return $this->execute(
            "UPDATE providers SET is_available = ?, updated_at = NOW() WHERE id = ?",
            [$isAvailable, $providerId]
        );
    }

    /**
     * Récupère tous les prestataires actifs avec pagination
     */
    public function getAllActive(int $limit = 20, int $offset = 0, ?int $categoryId = null): array
    {
        $sql = "SELECT p.id, p.first_name, p.last_name, p.photo_url, p.bio, p.rating,
                       p.total_reviews, p.is_available, p.is_verified, p.current_latitude,
                       p.current_longitude, p.intervention_radius
                FROM providers p
                WHERE p.status = 'active' AND p.is_verified = TRUE";

        $params = [];

        if ($categoryId) {
            $sql .= " AND EXISTS (
                SELECT 1 FROM provider_services ps
                JOIN services s ON ps.service_id = s.id
                WHERE ps.provider_id = p.id AND s.category_id = ?
            )";
            $params[] = $categoryId;
        }

        $sql .= " ORDER BY p.rating DESC, p.total_reviews DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;

        return $this->query($sql, $params);
    }

    /**
     * Trouve les prestataires à proximité d'une position
     */
    public function findNearby(float $latitude, float $longitude, float $radiusKm = 20, int $limit = 50): array
    {
        $sql = "SELECT p.id, p.first_name, p.last_name, p.photo_url, p.bio, p.rating,
                       p.total_reviews, p.is_available, p.is_verified,
                       p.current_latitude, p.current_longitude,
                       (6371 * acos(cos(radians(?)) * cos(radians(p.current_latitude)) *
                       cos(radians(p.current_longitude) - radians(?)) +
                       sin(radians(?)) * sin(radians(p.current_latitude)))) AS distance
                FROM providers p
                WHERE p.status = 'active'
                AND p.is_verified = TRUE
                AND p.is_available = TRUE
                AND p.current_latitude IS NOT NULL
                AND p.current_longitude IS NOT NULL
                HAVING distance <= ?
                ORDER BY distance ASC
                LIMIT ?";

        return $this->query($sql, [$latitude, $longitude, $latitude, $radiusKm, $limit]);
    }

    /**
     * Connexion: met le prestataire en ligne
     */
    public function setOnline(int $providerId): bool
    {
        return $this->execute(
            "UPDATE providers SET is_available = TRUE, last_seen_at = NOW(), updated_at = NOW() WHERE id = ?",
            [$providerId]
        );
    }

    /**
     * Déconnexion: met le prestataire hors ligne
     */
    public function setOffline(int $providerId): bool
    {
        return $this->execute(
            "UPDATE providers SET is_available = FALSE, updated_at = NOW() WHERE id = ?",
            [$providerId]
        );
    }
}
