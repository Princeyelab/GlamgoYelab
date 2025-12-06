<?php

namespace App\Core;

use PDO;
use PDOException;

class Database
{
    private static ?PDO $instance = null;

    /**
     * Récupère l'instance PDO (Singleton)
     */
    public static function getInstance(): PDO
    {
        if (self::$instance === null) {
            $config = require __DIR__ . '/../../config/config.php';
            $db = $config['database'];

            // Support MySQL et PostgreSQL
            $driver = $db['driver'] ?? 'mysql';
            $port = $db['port'] ?? ($driver === 'pgsql' ? '5432' : '3306');

            if ($driver === 'pgsql') {
                $dsn = "pgsql:host={$db['host']};port={$port};dbname={$db['name']}";
            } else {
                $dsn = "mysql:host={$db['host']};port={$port};dbname={$db['name']};charset={$db['charset']}";
            }

            try {
                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ];

                // Options spécifiques à MySQL
                if ($driver === 'mysql') {
                    $options[PDO::MYSQL_ATTR_INIT_COMMAND] = "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci";
                }

                self::$instance = new PDO($dsn, $db['user'], $db['password'], $options);

                // Encodage UTF-8
                if ($driver === 'mysql') {
                    self::$instance->exec("SET CHARACTER SET utf8mb4");
                } else {
                    self::$instance->exec("SET NAMES 'UTF8'");
                }
            } catch (PDOException $e) {
                die(json_encode([
                    'success' => false,
                    'message' => 'Database connection failed',
                    'error' => $e->getMessage()
                ]));
            }
        }

        return self::$instance;
    }

    /**
     * Empêche le clonage de l'instance
     */
    private function __clone() {}

    /**
     * Empêche la désérialisation de l'instance
     */
    public function __wakeup()
    {
        throw new \Exception("Cannot unserialize singleton");
    }
}
