<?php

/**
 * Modèle User - Gestion des utilisateurs (clients)
 */
class User
{

    /**
     * Trouve un utilisateur par son email
     *
     * @param string $email Email de l'utilisateur
     * @return array|null Utilisateur trouvé ou null
     */
    public static function findByEmail(string $email): ?array
    {
        $db = Database::getInstance();

        $sql = "SELECT * FROM users WHERE email = :email LIMIT 1";
        $stmt = $db->prepare($sql);
        $stmt->execute(['email' => $email]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result ?: null;
    }

    /**
     * Trouve un utilisateur par son ID
     *
     * @param int $id ID de l'utilisateur
     * @return array|null Utilisateur trouvé ou null
     */
    public static function findById(int $id): ?array
    {
        $db = Database::getInstance();

        $sql = "SELECT * FROM users WHERE id = :id LIMIT 1";
        $stmt = $db->prepare($sql);
        $stmt->execute(['id' => $id]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result ?: null;
    }

    /**
     * Trouve un utilisateur par son code de parrainage
     *
     * @param string $code Code de parrainage
     * @return array|null Utilisateur trouvé ou null
     */
    public static function findByReferralCode(string $code): ?array
    {
        $db = Database::getInstance();

        $sql = "SELECT * FROM users WHERE referral_code = :code LIMIT 1";
        $stmt = $db->prepare($sql);
        $stmt->execute(['code' => $code]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result ?: null;
    }

    /**
     * Crée un nouvel utilisateur
     * Hash automatiquement le mot de passe et génère un code de parrainage
     *
     * @param array $data Données de l'utilisateur (email, password, first_name, last_name, phone)
     * @return int ID de l'utilisateur créé
     */
    public static function create(array $data): int
    {
        $db = Database::getInstance();

        // Hasher le mot de passe si présent
        if (isset($data['password'])) {
            $data['password_hash'] = password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => 12]);
            unset($data['password']); // Retirer le mot de passe en clair
        }

        // Générer un code de parrainage unique si non fourni
        if (!isset($data['referral_code'])) {
            $data['referral_code'] = self::generateUniqueReferralCode();
        }

        // Insérer l'utilisateur dans la base de données
        $sql = "INSERT INTO users (email, password_hash, first_name, last_name, phone, referral_code)
                VALUES (:email, :password_hash, :first_name, :last_name, :phone, :referral_code)";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            'email' => $data['email'],
            'password_hash' => $data['password_hash'],
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'phone' => $data['phone'] ?? null,
            'referral_code' => $data['referral_code']
        ]);

        return (int) $db->lastInsertId();
    }

    /**
     * Met à jour un utilisateur
     * Hash le mot de passe si modifié
     *
     * @param int $id ID de l'utilisateur
     * @param array $data Données à mettre à jour
     * @return bool
     */
    public function updateUser(int $id, array $data): bool
    {
        // Hasher le mot de passe si présent
        if (isset($data['password'])) {
            $data['password_hash'] = password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => 12]);
            unset($data['password']);
        }

        return $this->update($id, $data);
    }

    /**
     * Vérifie si un email existe déjà
     *
     * @param string $email Email à vérifier
     * @return bool True si l'email existe
     */
    public static function emailExists(string $email): bool
    {
        $user = self::findByEmail($email);
        return $user !== null;
    }

    /**
     * Génère un code de parrainage unique
     *
     * @return string Code de parrainage (8 caractères alphanumériques)
     */
    private static function generateUniqueReferralCode(): string
    {
        $db = Database::getInstance();
        $characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Pas de I, O, 0, 1 pour éviter confusion

        do {
            $code = '';
            for ($i = 0; $i < 8; $i++) {
                $code .= $characters[random_int(0, strlen($characters) - 1)];
            }

            // Vérifier que le code n'existe pas déjà
            $stmt = $db->prepare("SELECT COUNT(*) FROM users WHERE referral_code = :code");
            $stmt->execute(['code' => $code]);
            $exists = $stmt->fetchColumn() > 0;
        } while ($exists);

        return $code;
    }

    /**
     * Récupère les adresses d'un utilisateur
     *
     * @param int $userId ID de l'utilisateur
     * @return array Liste des adresses
     */
    public function getAddresses(int $userId): array
    {
        return $this->query(
            "SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC",
            [$userId]
        );
    }

    /**
     * Récupère les commandes d'un utilisateur
     *
     * @param int $userId ID de l'utilisateur
     * @param string|null $status Filtrer par statut (optionnel)
     * @return array Liste des commandes
     */
    public function getOrders(int $userId, ?string $status = null): array
    {
        if ($status) {
            return $this->query(
                "SELECT o.*, s.name as service_name, p.first_name as provider_first_name, p.last_name as provider_last_name
                 FROM orders o
                 LEFT JOIN services s ON o.service_id = s.id
                 LEFT JOIN providers p ON o.provider_id = p.id
                 WHERE o.user_id = ? AND o.status = ?
                 ORDER BY o.created_at DESC",
                [$userId, $status]
            );
        }

        return $this->query(
            "SELECT o.*, s.name as service_name, p.first_name as provider_first_name, p.last_name as provider_last_name
             FROM orders o
             LEFT JOIN services s ON o.service_id = s.id
             LEFT JOIN providers p ON o.provider_id = p.id
             WHERE o.user_id = ?
             ORDER BY o.created_at DESC",
            [$userId]
        );
    }

    /**
     * Retourne les données publiques de l'utilisateur (sans le password_hash)
     *
     * @param array $user Données de l'utilisateur
     * @return array Données publiques
     */
    public static function getPublicData(array $user): array
    {
        unset($user['password_hash']);
        return $user;
    }
}
