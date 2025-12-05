<?php

/**
 * Classe Model - Classe de base pour tous les modèles
 *
 * Fournit des méthodes CRUD de base pour interagir avec la base de données
 */
abstract class Model
{
    /**
     * Instance PDO
     * @var PDO
     */
    protected PDO $db;

    /**
     * Nom de la table dans la base de données
     * Doit être défini dans les classes enfants
     * @var string
     */
    protected string $table;

    /**
     * Clé primaire de la table (par défaut 'id')
     * @var string
     */
    protected string $primaryKey = 'id';

    /**
     * Constructeur
     * Initialise la connexion à la base de données
     */
    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Récupère tous les enregistrements de la table
     *
     * @return array
     */
    public function all(): array
    {
        $stmt = $this->db->query("SELECT * FROM {$this->table}");
        return $stmt->fetchAll();
    }

    /**
     * Récupère un enregistrement par son ID
     *
     * @param int $id ID de l'enregistrement
     * @return array|null
     */
    public function find(int $id): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE {$this->primaryKey} = ?");
        $stmt->execute([$id]);
        $result = $stmt->fetch();

        return $result ?: null;
    }

    /**
     * Récupère un enregistrement selon une condition
     *
     * @param string $column Nom de la colonne
     * @param mixed $value Valeur recherchée
     * @return array|null
     */
    public function findBy(string $column, $value): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE {$column} = ?");
        $stmt->execute([$value]);
        $result = $stmt->fetch();

        return $result ?: null;
    }

    /**
     * Récupère plusieurs enregistrements selon une condition
     *
     * @param string $column Nom de la colonne
     * @param mixed $value Valeur recherchée
     * @return array
     */
    public function where(string $column, $value): array
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE {$column} = ?");
        $stmt->execute([$value]);
        return $stmt->fetchAll();
    }

    /**
     * Crée un nouvel enregistrement
     *
     * @param array $data Données à insérer (colonne => valeur)
     * @return int ID de l'enregistrement créé
     */
    public function create(array $data): int
    {
        $columns = implode(', ', array_keys($data));
        $placeholders = implode(', ', array_fill(0, count($data), '?'));

        $sql = "INSERT INTO {$this->table} ({$columns}) VALUES ({$placeholders})";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(array_values($data));

        return (int)$this->db->lastInsertId();
    }

    /**
     * Met à jour un enregistrement
     *
     * @param int $id ID de l'enregistrement
     * @param array $data Données à mettre à jour (colonne => valeur)
     * @return bool
     */
    public function update(int $id, array $data): bool
    {
        $setParts = [];
        foreach (array_keys($data) as $column) {
            $setParts[] = "{$column} = ?";
        }
        $setClause = implode(', ', $setParts);

        $sql = "UPDATE {$this->table} SET {$setClause} WHERE {$this->primaryKey} = ?";
        $stmt = $this->db->prepare($sql);

        $values = array_values($data);
        $values[] = $id;

        return $stmt->execute($values);
    }

    /**
     * Supprime un enregistrement
     *
     * @param int $id ID de l'enregistrement
     * @return bool
     */
    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM {$this->table} WHERE {$this->primaryKey} = ?");
        return $stmt->execute([$id]);
    }

    /**
     * Compte le nombre d'enregistrements
     *
     * @param string|null $column Colonne pour la condition WHERE (optionnel)
     * @param mixed $value Valeur pour la condition WHERE (optionnel)
     * @return int
     */
    public function count(?string $column = null, $value = null): int
    {
        if ($column && $value) {
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM {$this->table} WHERE {$column} = ?");
            $stmt->execute([$value]);
        } else {
            $stmt = $this->db->query("SELECT COUNT(*) FROM {$this->table}");
        }

        return (int)$stmt->fetchColumn();
    }

    /**
     * Exécute une requête SQL personnalisée et retourne les résultats
     *
     * @param string $sql Requête SQL
     * @param array $params Paramètres de la requête préparée
     * @return array
     */
    public function query(string $sql, array $params = []): array
    {
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * Exécute une requête SQL personnalisée sans retour
     *
     * @param string $sql Requête SQL
     * @param array $params Paramètres de la requête préparée
     * @return bool
     */
    public function execute(string $sql, array $params = []): bool
    {
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }

    /**
     * Pagine les résultats
     *
     * @param int $page Numéro de la page (commence à 1)
     * @param int $perPage Nombre d'éléments par page
     * @return array
     */
    public function paginate(int $page = 1, int $perPage = 10): array
    {
        $offset = ($page - 1) * $perPage;

        $stmt = $this->db->prepare("SELECT * FROM {$this->table} LIMIT ? OFFSET ?");
        $stmt->execute([$perPage, $offset]);

        return [
            'data' => $stmt->fetchAll(),
            'page' => $page,
            'per_page' => $perPage,
            'total' => $this->count()
        ];
    }
}
