<?php
/**
 * Script d'exécution de la migration 008 - Système de paiement
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "\n";
echo "🚀 MIGRATION 008 - SYSTÈME DE PAIEMENT GLAMGO\n";
echo "==============================================\n\n";

// Charger config
$config = require __DIR__ . '/config/config.php';
$db_config = $config['database'];

try {
    // Connexion DB
    echo "📡 Connexion à la base de données...\n";
    $pdo = new PDO(
        "mysql:host={$db_config['host']};dbname={$db_config['name']};charset={$db_config['charset']}",
        $db_config['user'],
        $db_config['password']
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "   ✅ Connecté à {$db_config['name']}\n\n";

    // Lire fichier SQL
    $migration_file = __DIR__ . '/database/migrations/008_add_payment_system.sql';

    if (!file_exists($migration_file)) {
        throw new Exception("Fichier migration introuvable: $migration_file");
    }

    echo "📄 Lecture du fichier de migration...\n";
    $sql = file_get_contents($migration_file);
    echo "   ✅ Fichier chargé (" . strlen($sql) . " caractères)\n\n";

    // Séparer les requêtes
    echo "🔨 Exécution de la migration...\n";
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function($stmt) {
            return !empty($stmt) && !str_starts_with($stmt, '--');
        }
    );

    $executed = 0;
    $errors = 0;

    foreach ($statements as $statement) {
        // Ignorer commentaires et lignes vides
        if (empty(trim($statement)) || str_starts_with(trim($statement), '--')) {
            continue;
        }

        try {
            $pdo->exec($statement);
            $executed++;

            // Afficher progrès
            if (str_contains($statement, 'CREATE TABLE')) {
                preg_match('/CREATE TABLE.*?`?(\w+)`?/i', $statement, $matches);
                $table = $matches[1] ?? 'unknown';
                echo "   ✅ Table $table créée\n";
            } elseif (str_contains($statement, 'ALTER TABLE')) {
                preg_match('/ALTER TABLE\s+`?(\w+)`?/i', $statement, $matches);
                $table = $matches[1] ?? 'unknown';
                echo "   ✅ Table $table modifiée\n";
            } elseif (str_contains($statement, 'CREATE OR REPLACE VIEW')) {
                preg_match('/VIEW\s+`?(\w+)`?/i', $statement, $matches);
                $view = $matches[1] ?? 'unknown';
                echo "   ✅ Vue $view créée\n";
            } elseif (str_contains($statement, 'INSERT INTO')) {
                preg_match('/INSERT INTO\s+`?(\w+)`?/i', $statement, $matches);
                $table = $matches[1] ?? 'unknown';
                echo "   ✅ Données insérées dans $table\n";
            }

        } catch (PDOException $e) {
            // Ignorer erreur "table already exists" ou "duplicate column"
            if (
                str_contains($e->getMessage(), 'already exists') ||
                str_contains($e->getMessage(), 'Duplicate column') ||
                str_contains($e->getMessage(), 'Duplicate key')
            ) {
                echo "   ⚠️  Déjà existant (ignoré)\n";
            } else {
                $errors++;
                echo "   ❌ ERREUR: " . $e->getMessage() . "\n";
            }
        }
    }

    echo "\n";
    echo "==============================================\n";
    echo "📊 RÉSUMÉ\n";
    echo "==============================================\n";
    echo "Requêtes exécutées : $executed\n";
    echo "Erreurs : $errors\n\n";

    // Vérifier tables créées
    echo "🔍 Vérification des tables...\n";
    $tables_to_check = ['transactions', 'payment_methods', 'payment_logs', 'payment_config'];

    foreach ($tables_to_check as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            // Compter lignes
            $count_stmt = $pdo->query("SELECT COUNT(*) FROM $table");
            $count = $count_stmt->fetchColumn();
            echo "   ✅ $table ($count lignes)\n";
        } else {
            echo "   ❌ $table (manquante)\n";
            $errors++;
        }
    }

    echo "\n";

    // Vérifier colonnes users
    echo "🔍 Vérification colonnes users...\n";
    $user_columns = ['payment_method_validated', 'card_last4', 'card_brand', 'card_token'];
    $stmt = $pdo->query("DESCRIBE users");
    $existing_columns = $stmt->fetchAll(PDO::FETCH_COLUMN);

    foreach ($user_columns as $col) {
        if (in_array($col, $existing_columns)) {
            echo "   ✅ users.$col\n";
        } else {
            echo "   ❌ users.$col (manquante)\n";
            $errors++;
        }
    }

    echo "\n";

    // Vérifier colonnes providers
    echo "🔍 Vérification colonnes providers...\n";
    $provider_columns = ['payment_method_validated', 'bank_account_iban', 'bank_name', 'bank_account_validated'];
    $stmt = $pdo->query("DESCRIBE providers");
    $existing_columns = $stmt->fetchAll(PDO::FETCH_COLUMN);

    foreach ($provider_columns as $col) {
        if (in_array($col, $existing_columns)) {
            echo "   ✅ providers.$col\n";
        } else {
            echo "   ❌ providers.$col (manquante)\n";
            $errors++;
        }
    }

    echo "\n";
    echo "==============================================\n";

    if ($errors === 0) {
        echo "🎉 MIGRATION RÉUSSIE !\n";
        echo "\n📝 PROCHAINES ÉTAPES:\n";
        echo "1. Tester le système: php backend/test_payment_system.php\n";
        echo "2. Vérifier frontend: http://localhost:3000/payment-demo\n";
        echo "3. Dashboard admin: http://localhost:8080/admin/transactions.php\n";
    } else {
        echo "⚠️  MIGRATION AVEC ERREURS ($errors)\n";
        echo "Vérifiez les erreurs ci-dessus.\n";
    }

    echo "\n";

} catch (PDOException $e) {
    echo "\n❌ ERREUR DE CONNEXION:\n";
    echo $e->getMessage() . "\n\n";
    echo "Vérifiez votre configuration dans backend/config/config.php\n\n";
    exit(1);
} catch (Exception $e) {
    echo "\n❌ ERREUR:\n";
    echo $e->getMessage() . "\n\n";
    exit(1);
}
