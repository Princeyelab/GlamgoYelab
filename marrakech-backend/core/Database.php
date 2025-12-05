<?php

/**
 * Classe Database - Singleton pour la connexion PDO
 *
 * Gère la connexion unique à la base de données MySQL
 * Utilise le pattern Singleton pour éviter les connexions multiples
 */
class Database
{
    /**
     * Instance unique de la connexion PDO
     * @var PDO|null
     */
    private static ?PDO $instance = null;

    /**
     * Configuration de la base de données
     * @var array
     */
    private static array $config = [
        'host' => null,
        'dbname' => null,
        'user' => null,
        'password' => null,
        'charset' => 'utf8mb4'
    ];

    /**
     * Constructeur privé (Singleton)
     * Empêche l'instanciation directe de la classe
     */
    private function __construct()
    {
        // Empêche l'instanciation
    }

    /**
     * Empêche le clonage de l'instance
     */
    private function __clone()
    {
        // Empêche le clonage
    }

    /**
     * Empêche la désérialisation de l'instance
     */
    public function __wakeup()
    {
        throw new Exception("Cannot unserialize singleton");
    }

    /**
     * Configure la connexion à la base de données
     *
     * @param array $config Configuration avec clés: host, dbname, user, password
     */
    public static function configure(array $config): void
    {
        self::$config = array_merge(self::$config, $config);
    }

    /**
     * Récupère l'instance PDO unique (Singleton)
     *
     * @return PDO Instance PDO connectée à la base de données
     * @throws PDOException Si la connexion échoue
     */
    public static function getInstance(): PDO
    {
        if (self::$instance === null) {
            self::connect();
        }

        return self::$instance;
    }

    /**
     * Crée la connexion PDO à la base de données
     *
     * @throws PDOException Si la connexion échoue
     */
    private static function connect(): void
    {
        // Récupération de la configuration depuis les variables d'environnement
        $host = self::$config['host'] ?? getenv('DB_HOST') ?? 'mysql-db';
        $dbname = self::$config['dbname'] ?? getenv('DB_NAME') ?? 'marrakech_services';
        $user = self::$config['user'] ?? getenv('DB_USER') ?? 'marrakech_user';
        $password = self::$config['password'] ?? getenv('DB_PASSWORD') ?? 'marrakech_password';
        $charset = self::$config['charset'];

        // Construction du DSN (Data Source Name)
        $dsn = "mysql:host={$host};dbname={$dbname};charset={$charset}";

        // Options PDO pour une meilleure sécurité et performance
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,        // Lance des exceptions en cas d'erreur
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,   // Retourne des tableaux associatifs
            PDO::ATTR_EMULATE_PREPARES => false,                // Utilise les vraies requêtes préparées
            PDO::ATTR_PERSISTENT => false,                      // Pas de connexion persistante
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$charset} COLLATE utf8mb4_unicode_ci"
        ];

        try {
            self::$instance = new PDO($dsn, $user, $password, $options);
        } catch (PDOException $e) {
            // En production, logger l'erreur sans exposer les détails
            error_log("Database connection failed: " . $e->getMessage());

            // En développement, afficher l'erreur
            if (getenv('APP_DEBUG') === 'true') {
                throw new PDOException("Database connection error: " . $e->getMessage());
            } else {
                throw new PDOException("Database connection error. Please check logs.");
            }
        }
    }

    /**
     * Teste la connexion à la base de données
     *
     * @return bool True si la connexion fonctionne
     */
    public static function testConnection(): bool
    {
        try {
            $pdo = self::getInstance();
            $pdo->query('SELECT 1');
            return true;
        } catch (PDOException $e) {
            error_log("Database connection test failed: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Ferme la connexion à la base de données
     * Utile pour les tests ou les scripts CLI
     */
    public static function closeConnection(): void
    {
        self::$instance = null;
    }

    /**
     * Exécute une requête SQL et retourne le statement
     * Méthode helper pour simplifier les requêtes
     *
     * @param string $sql Requête SQL
     * @param array $params Paramètres de la requête préparée
     * @return PDOStatement
     */
    public static function query(string $sql, array $params = []): PDOStatement
    {
        $pdo = self::getInstance();
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    /**
     * Commence une transaction
     *
     * @return bool
     */
    public static function beginTransaction(): bool
    {
        return self::getInstance()->beginTransaction();
    }

    /**
     * Valide une transaction
     *
     * @return bool
     */
    public static function commit(): bool
    {
        return self::getInstance()->commit();
    }

    /**
     * Annule une transaction
     *
     * @return bool
     */
    public static function rollBack(): bool
    {
        return self::getInstance()->rollBack();
    }

    /**
     * Retourne l'ID du dernier enregistrement inséré
     *
     * @return string
     */
    public static function lastInsertId(): string
    {
        return self::getInstance()->lastInsertId();
    }
}
