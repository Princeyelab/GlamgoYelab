<?php
/**
 * Script d'execution de la migration pour le systeme de priorite et blocage des prestataires
 * Version Docker - Connexion directe a MySQL
 */

echo "==============================================\n";
echo "Migration: Systeme de Priorite et Blocage\n";
echo "==============================================\n\n";

try {
    // Configuration directe pour Docker
    $host = getenv('DB_HOST') ?: 'mysql-db';
    $database = getenv('DB_DATABASE') ?: 'glamgo';
    $username = getenv('DB_USERNAME') ?: 'glamgo_user';
    $password = getenv('DB_PASSWORD') ?: 'glamgo_password';

    $dsn = "mysql:host={$host};dbname={$database};charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    echo "[OK] Connexion a la base de donnees etablie\n";
    echo "    Host: $host, Database: $database\n\n";

    // 7. Creer la vue provider_priority_stats (avec total_reviews au lieu de review_count)
    echo "7. Creation de la vue provider_priority_stats...\n";
    $sql = "CREATE OR REPLACE VIEW provider_priority_stats AS
    SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.email,
        COALESCE(p.rating, 0) as rating,
        COALESCE(p.total_reviews, 0) as review_count,
        COALESCE(p.is_blocked, 0) as is_blocked,
        p.blocked_until,
        CASE
            WHEN COALESCE(p.total_reviews, 0) < 3 THEN 'NEW'
            WHEN COALESCE(p.rating, 0) >= 4.5 THEN 'EXCELLENT'
            WHEN COALESCE(p.rating, 0) >= 4.0 THEN 'GOOD'
            WHEN COALESCE(p.rating, 0) >= 3.5 THEN 'AVERAGE'
            WHEN COALESCE(p.rating, 0) >= 3.0 THEN 'LOW'
            ELSE 'CRITICAL'
        END AS priority_level,
        CASE
            WHEN COALESCE(p.total_reviews, 0) < 3 THEN 60
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
            SELECT id, COALESCE(rating, 0), COALESCE(total_reviews, 0)
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
            WHEN COALESCE(total_reviews, 0) < 3 THEN 'NEW'
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
