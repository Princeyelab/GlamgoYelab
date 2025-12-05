<?php
/**
 * Script d'execution de la migration pour le systeme de priorite et blocage des prestataires
 *
 * Usage: php run_priority_migration.php
 */

require_once __DIR__ . '/config/database.php';

echo "==============================================\n";
echo "Migration: Systeme de Priorite et Blocage\n";
echo "==============================================\n\n";

try {
    $config = require __DIR__ . '/config/database.php';

    $dsn = "mysql:host={$config['host']};dbname={$config['database']};charset=utf8mb4";
    $pdo = new PDO($dsn, $config['username'], $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    echo "[OK] Connexion a la base de donnees etablie\n\n";

    // 1. Ajouter les colonnes a la table providers
    echo "1. Ajout des colonnes a la table providers...\n";

    $columns = [
        ['name' => 'is_blocked', 'definition' => 'TINYINT(1) DEFAULT 0'],
        ['name' => 'blocked_until', 'definition' => 'DATETIME DEFAULT NULL'],
        ['name' => 'block_reason', 'definition' => 'TEXT DEFAULT NULL']
    ];

    foreach ($columns as $col) {
        $checkSql = "SHOW COLUMNS FROM providers LIKE '{$col['name']}'";
        $result = $pdo->query($checkSql)->fetch();

        if (!$result) {
            $sql = "ALTER TABLE providers ADD COLUMN {$col['name']} {$col['definition']}";
            $pdo->exec($sql);
            echo "   [+] Colonne {$col['name']} ajoutee\n";
        } else {
            echo "   [=] Colonne {$col['name']} existe deja\n";
        }
    }

    // 2. Ajouter la colonne cancelled_by a orders si elle n'existe pas
    echo "\n2. Verification colonne cancelled_by dans orders...\n";
    $checkSql = "SHOW COLUMNS FROM orders LIKE 'cancelled_by'";
    $result = $pdo->query($checkSql)->fetch();

    if (!$result) {
        $sql = "ALTER TABLE orders ADD COLUMN cancelled_by ENUM('client', 'provider', 'system', 'admin') DEFAULT NULL";
        $pdo->exec($sql);
        echo "   [+] Colonne cancelled_by ajoutee\n";
    } else {
        echo "   [=] Colonne cancelled_by existe deja\n";
    }

    // 3. Creer la table provider_block_history
    echo "\n3. Creation table provider_block_history...\n";
    $sql = "CREATE TABLE IF NOT EXISTS provider_block_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        provider_id INT NOT NULL,
        action ENUM('block', 'unblock', 'warning') NOT NULL,
        block_type ENUM('temporary', 'permanent') DEFAULT NULL,
        reason TEXT NOT NULL,
        duration_days INT DEFAULT NULL,
        blocked_until DATETIME DEFAULT NULL,
        admin_id INT DEFAULT NULL,
        is_automatic TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_block_history_provider (provider_id),
        INDEX idx_block_history_action (action),
        INDEX idx_block_history_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    $pdo->exec($sql);
    echo "   [OK] Table provider_block_history creee/verifiee\n";

    // 4. Creer la table provider_warnings
    echo "\n4. Creation table provider_warnings...\n";
    $sql = "CREATE TABLE IF NOT EXISTS provider_warnings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        provider_id INT NOT NULL,
        warning_type ENUM('rating_drop', 'bad_reviews', 'cancellation', 'other') NOT NULL,
        message TEXT NOT NULL,
        admin_id INT DEFAULT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_warnings_provider (provider_id),
        INDEX idx_warnings_type (warning_type),
        INDEX idx_warnings_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    $pdo->exec($sql);
    echo "   [OK] Table provider_warnings creee/verifiee\n";

    // 5. Creer la table provider_rating_history
    echo "\n5. Creation table provider_rating_history...\n";
    $sql = "CREATE TABLE IF NOT EXISTS provider_rating_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        provider_id INT NOT NULL,
        rating DECIMAL(3,2) NOT NULL,
        review_count INT NOT NULL DEFAULT 0,
        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_rating_history_provider (provider_id),
        INDEX idx_rating_history_date (recorded_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    $pdo->exec($sql);
    echo "   [OK] Table provider_rating_history creee/verifiee\n";

    // 6. Creer les index si ils n'existent pas
    echo "\n6. Creation des index...\n";

    $indexes = [
        ['table' => 'providers', 'name' => 'idx_providers_is_blocked', 'column' => 'is_blocked'],
        ['table' => 'providers', 'name' => 'idx_providers_blocked_until', 'column' => 'blocked_until'],
        ['table' => 'providers', 'name' => 'idx_providers_rating', 'column' => 'rating']
    ];

    foreach ($indexes as $idx) {
        $checkSql = "SHOW INDEX FROM {$idx['table']} WHERE Key_name = '{$idx['name']}'";
        $result = $pdo->query($checkSql)->fetch();

        if (!$result) {
            try {
                $sql = "CREATE INDEX {$idx['name']} ON {$idx['table']}({$idx['column']})";
                $pdo->exec($sql);
                echo "   [+] Index {$idx['name']} cree\n";
            } catch (Exception $e) {
                echo "   [!] Index {$idx['name']}: " . $e->getMessage() . "\n";
            }
        } else {
            echo "   [=] Index {$idx['name']} existe deja\n";
        }
    }

    // 7. Creer la vue provider_priority_stats
    echo "\n7. Creation de la vue provider_priority_stats...\n";
    $sql = "CREATE OR REPLACE VIEW provider_priority_stats AS
    SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.email,
        COALESCE(p.rating, 0) as rating,
        COALESCE(p.review_count, 0) as review_count,
        COALESCE(p.is_blocked, 0) as is_blocked,
        p.blocked_until,
        CASE
            WHEN COALESCE(p.review_count, 0) < 3 THEN 'NEW'
            WHEN COALESCE(p.rating, 0) >= 4.5 THEN 'EXCELLENT'
            WHEN COALESCE(p.rating, 0) >= 4.0 THEN 'GOOD'
            WHEN COALESCE(p.rating, 0) >= 3.5 THEN 'AVERAGE'
            WHEN COALESCE(p.rating, 0) >= 3.0 THEN 'LOW'
            ELSE 'CRITICAL'
        END AS priority_level,
        CASE
            WHEN COALESCE(p.review_count, 0) < 3 THEN 60
            WHEN COALESCE(p.rating, 0) >= 4.5 THEN 0
            WHEN COALESCE(p.rating, 0) >= 4.0 THEN 30
            WHEN COALESCE(p.rating, 0) >= 3.5 THEN 60
            WHEN COALESCE(p.rating, 0) >= 3.0 THEN 120
            ELSE 300
        END AS notification_delay_seconds
    FROM providers p";

    $pdo->exec($sql);
    echo "   [OK] Vue provider_priority_stats creee/mise a jour\n";

    // 8. Enregistrer l'historique initial des notes
    echo "\n8. Enregistrement de l'historique initial des notes...\n";
    $sql = "INSERT INTO provider_rating_history (provider_id, rating, review_count)
            SELECT id, COALESCE(rating, 0), COALESCE(review_count, 0)
            FROM providers
            WHERE id NOT IN (SELECT DISTINCT provider_id FROM provider_rating_history)";

    $count = $pdo->exec($sql);
    echo "   [OK] $count enregistrements ajoutes a l'historique\n";

    echo "\n==============================================\n";
    echo "Migration terminee avec succes!\n";
    echo "==============================================\n\n";

    // Afficher les statistiques
    echo "Statistiques:\n";

    $stats = $pdo->query("SELECT COUNT(*) as total FROM providers")->fetch();
    echo "- Total prestataires: {$stats['total']}\n";

    $stats = $pdo->query("SELECT COUNT(*) as total FROM providers WHERE is_blocked = 1")->fetch();
    echo "- Prestataires bloques: {$stats['total']}\n";

    $stats = $pdo->query("SELECT
        CASE
            WHEN COALESCE(review_count, 0) < 3 THEN 'NEW'
            WHEN COALESCE(rating, 0) >= 4.5 THEN 'EXCELLENT'
            WHEN COALESCE(rating, 0) >= 4.0 THEN 'GOOD'
            WHEN COALESCE(rating, 0) >= 3.5 THEN 'AVERAGE'
            WHEN COALESCE(rating, 0) >= 3.0 THEN 'LOW'
            ELSE 'CRITICAL'
        END AS priority_level,
        COUNT(*) as count
        FROM providers
        GROUP BY priority_level")->fetchAll();

    echo "\nRepartition par niveau de priorite:\n";
    foreach ($stats as $row) {
        echo "- {$row['priority_level']}: {$row['count']}\n";
    }

} catch (PDOException $e) {
    echo "[ERREUR] " . $e->getMessage() . "\n";
    exit(1);
}
