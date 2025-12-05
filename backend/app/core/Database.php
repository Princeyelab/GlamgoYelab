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

            $dsn = "mysql:host={$db['host']};dbname={$db['name']};charset={$db['charset']}";

            try {
                self::$instance = new PDO($dsn, $db['user'], $db['password'], [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
                ]);
                // Forcer l'encodage UTF-8
                self::$instance->exec("SET CHARACTER SET utf8mb4");
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
