<?php

namespace App\Models;

use App\Core\Model;

class User extends Model
{
    protected string $table = 'users';

    /**
     * Récupère un utilisateur par email
     */
    public function findByEmail(string $email): ?array
    {
        return $this->findBy('email', $email);
    }

    /**
     * Récupère un utilisateur par code de parrainage
     */
    public function findByReferralCode(string $code): ?array
    {
        return $this->findBy('referral_code', $code);
    }

    /**
     * Récupère les adresses d'un utilisateur
     */
    public function getAddresses(int $userId): array
    {
        return $this->query(
            "SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC",
            [$userId]
        );
    }

    /**
     * Ajoute une adresse
     */
    public function addAddress(int $userId, array $data): int
    {
        // Si c'est l'adresse par défaut, on retire le flag des autres
        if ($data['is_default'] ?? false) {
            $this->execute("UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?", [$userId]);
        }

        $addressData = [
            'user_id' => $userId,
            'label' => $data['label'],
            'address_line' => $data['address_line'],
            'city' => $data['city'] ?? 'Marrakech',
            'postal_code' => $data['postal_code'] ?? null,
            'latitude' => $data['latitude'] ?? null,
            'longitude' => $data['longitude'] ?? null,
            'is_default' => $data['is_default'] ?? false
        ];

        $columns = implode(', ', array_keys($addressData));
        $placeholders = implode(', ', array_fill(0, count($addressData), '?'));

        $sql = "INSERT INTO user_addresses ({$columns}) VALUES ({$placeholders})";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(array_values($addressData));

        return (int)$this->db->lastInsertId();
    }

    /**
     * Met à jour une adresse
     */
    public function updateAddress(int $addressId, int $userId, array $data): bool
    {
        // Si c'est l'adresse par défaut, on retire le flag des autres
        if ($data['is_default'] ?? false) {
            $this->execute("UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?", [$userId]);
        }

        $setParts = [];
        $values = [];
        foreach ($data as $key => $value) {
            $setParts[] = "{$key} = ?";
            $values[] = $value;
        }
        $setClause = implode(', ', $setParts);
        $values[] = $addressId;
        $values[] = $userId;

        $sql = "UPDATE user_addresses SET {$setClause} WHERE id = ? AND user_id = ?";
        return $this->execute($sql, $values);
    }

    /**
     * Supprime une adresse
     */
    public function deleteAddress(int $addressId, int $userId): bool
    {
        return $this->execute(
            "DELETE FROM user_addresses WHERE id = ? AND user_id = ?",
            [$addressId, $userId]
        );
    }

    /**
     * Définit une adresse comme adresse par défaut
     */
    public function setDefaultAddress(int $addressId, int $userId): bool
    {
        // Vérifier que l'adresse appartient à l'utilisateur
        $address = $this->queryOne(
            "SELECT id FROM user_addresses WHERE id = ? AND user_id = ?",
            [$addressId, $userId]
        );

        if (!$address) {
            return false;
        }

        // Retirer le flag is_default de toutes les adresses de l'utilisateur
        $this->execute("UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?", [$userId]);

        // Définir cette adresse comme par défaut
        return $this->execute(
            "UPDATE user_addresses SET is_default = TRUE WHERE id = ? AND user_id = ?",
            [$addressId, $userId]
        );
    }

    /**
     * Compte les parrainages d'un utilisateur
     */
    public function countReferrals(int $userId): int
    {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM users WHERE referred_by = ?");
        $stmt->execute([$userId]);
        return (int)$stmt->fetchColumn();
    }
}
