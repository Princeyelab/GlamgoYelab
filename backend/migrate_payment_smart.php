<?php
/**
 * Migration intelligente du système de paiement
 * Vérifie ce qui existe et ajoute seulement ce qui manque
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "\n🚀 MIGRATION INTELLIGENTE - SYSTÈME DE PAIEMENT\n";
echo "================================================\n\n";

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
    echo "   ✅ Connecté\n\n";

    // Helper : vérifier si colonne existe
    function columnExists($pdo, $table, $column) {
        $stmt = $pdo->prepare("
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = ?
            AND COLUMN_NAME = ?
        ");
        $stmt->execute([$table, $column]);
        return $stmt->fetchColumn() > 0;
    }

    // Helper : vérifier si table existe
    function tableExists($pdo, $table) {
        $stmt = $pdo->prepare("
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = ?
        ");
        $stmt->execute([$table]);
        return $stmt->fetchColumn() > 0;
    }

    // Helper : ajouter colonne si n'existe pas
    function addColumnIfNotExists($pdo, $table, $column, $definition) {
        if (!columnExists($pdo, $table, $column)) {
            $sql = "ALTER TABLE $table ADD COLUMN $column $definition";
            $pdo->exec($sql);
            echo "   ✅ Colonne $table.$column ajoutée\n";
            return true;
        } else {
            echo "   ⏭️  Colonne $table.$column existe déjà\n";
            return false;
        }
    }

    echo "🔨 ÉTAPE 1 : Modifications table users\n";
    echo "--------------------------------------\n";
    addColumnIfNotExists($pdo, 'users', 'payment_method_validated', "BOOLEAN DEFAULT FALSE COMMENT 'Carte bancaire validée'");
    addColumnIfNotExists($pdo, 'users', 'card_last4', "VARCHAR(4) COMMENT 'Derniers 4 chiffres CB'");
    addColumnIfNotExists($pdo, 'users', 'card_brand', "VARCHAR(20) COMMENT 'Visa, Mastercard, etc.'");
    addColumnIfNotExists($pdo, 'users', 'card_token', "VARCHAR(255) COMMENT 'Token sécurisé passerelle'");
    addColumnIfNotExists($pdo, 'users', 'card_added_at', "TIMESTAMP NULL COMMENT 'Date ajout carte'");
    echo "\n";

    echo "🔨 ÉTAPE 2 : Modifications table providers\n";
    echo "------------------------------------------\n";
    addColumnIfNotExists($pdo, 'providers', 'payment_method_validated', "BOOLEAN DEFAULT FALSE COMMENT 'Méthode paiement validée'");
    addColumnIfNotExists($pdo, 'providers', 'bank_account_iban', "VARCHAR(34) COMMENT 'IBAN du prestataire'");
    addColumnIfNotExists($pdo, 'providers', 'bank_name', "VARCHAR(100) COMMENT 'Nom de la banque'");
    addColumnIfNotExists($pdo, 'providers', 'bank_account_validated', "BOOLEAN DEFAULT FALSE COMMENT 'IBAN vérifié'");
    addColumnIfNotExists($pdo, 'providers', 'bank_account_added_at', "TIMESTAMP NULL COMMENT 'Date ajout IBAN'");
    echo "\n";

    echo "🔨 ÉTAPE 3 : Modifications table orders\n";
    echo "---------------------------------------\n";
    addColumnIfNotExists($pdo, 'orders', 'payment_status', "ENUM('unpaid', 'paid', 'refunded', 'failed') DEFAULT 'unpaid' COMMENT 'Statut paiement'");
    addColumnIfNotExists($pdo, 'orders', 'transaction_id', "INT NULL COMMENT 'Référence transaction'");
    addColumnIfNotExists($pdo, 'orders', 'payment_completed_at', "TIMESTAMP NULL COMMENT 'Date paiement effectué'");

    // Ajouter index payment_status
    try {
        $pdo->exec("ALTER TABLE orders ADD INDEX idx_payment_status (payment_status)");
        echo "   ✅ Index idx_payment_status ajouté\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate key') !== false) {
            echo "   ⏭️  Index idx_payment_status existe déjà\n";
        } else {
            throw $e;
        }
    }
    echo "\n";

    echo "🔨 ÉTAPE 4 : Création tables payment\n";
    echo "------------------------------------\n";

    // Table transactions
    if (!tableExists($pdo, 'transactions')) {
        $pdo->exec("
            CREATE TABLE transactions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                order_id INT NOT NULL COMMENT 'ID commande',
                user_id INT NOT NULL COMMENT 'ID client',
                provider_id INT NOT NULL COMMENT 'ID prestataire',
                amount DECIMAL(10,2) NOT NULL COMMENT 'Montant total TTC',
                commission_glamgo DECIMAL(10,2) NOT NULL COMMENT 'Commission GlamGo (20%)',
                provider_amount DECIMAL(10,2) NOT NULL COMMENT 'Montant net prestataire',
                payment_method ENUM('card', 'cash') NOT NULL COMMENT 'Carte ou espèces',
                status ENUM('pending', 'completed', 'failed', 'refunded', 'cancelled') DEFAULT 'pending',
                card_last4 VARCHAR(4) COMMENT 'Derniers 4 chiffres',
                card_brand VARCHAR(20) COMMENT 'Type de carte',
                payment_gateway_id VARCHAR(255) COMMENT 'ID transaction passerelle',
                payment_gateway_response JSON COMMENT 'Réponse complète passerelle',
                failure_reason TEXT COMMENT 'Raison échec paiement',
                refund_reason TEXT COMMENT 'Raison remboursement',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP NULL COMMENT 'Date paiement réussi',
                failed_at TIMESTAMP NULL COMMENT 'Date échec',
                refunded_at TIMESTAMP NULL COMMENT 'Date remboursement',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_order_id (order_id),
                INDEX idx_user_id (user_id),
                INDEX idx_provider_id (provider_id),
                INDEX idx_status (status),
                INDEX idx_payment_method (payment_method),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        echo "   ✅ Table transactions créée\n";
    } else {
        echo "   ⏭️  Table transactions existe déjà\n";
    }

    // Table payment_methods
    if (!tableExists($pdo, 'payment_methods')) {
        $pdo->exec("
            CREATE TABLE payment_methods (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NULL COMMENT 'ID client',
                provider_id INT NULL COMMENT 'ID prestataire',
                card_last4 VARCHAR(4) NOT NULL COMMENT 'Derniers 4 chiffres',
                card_brand VARCHAR(20) NOT NULL COMMENT 'Visa, Mastercard, Amex',
                card_exp_month TINYINT NOT NULL COMMENT 'Mois expiration (1-12)',
                card_exp_year SMALLINT NOT NULL COMMENT 'Année expiration',
                card_token VARCHAR(255) NOT NULL COMMENT 'Token sécurisé passerelle',
                card_fingerprint VARCHAR(64) COMMENT 'Empreinte unique carte',
                is_default BOOLEAN DEFAULT TRUE COMMENT 'Carte par défaut',
                is_active BOOLEAN DEFAULT TRUE COMMENT 'Carte active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                last_used_at TIMESTAMP NULL COMMENT 'Dernière utilisation',
                INDEX idx_user_id (user_id),
                INDEX idx_provider_id (provider_id),
                INDEX idx_is_default (is_default),
                INDEX idx_is_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        echo "   ✅ Table payment_methods créée\n";
    } else {
        echo "   ⏭️  Table payment_methods existe déjà\n";
    }

    // Table payment_logs
    if (!tableExists($pdo, 'payment_logs')) {
        $pdo->exec("
            CREATE TABLE payment_logs (
                id INT PRIMARY KEY AUTO_INCREMENT,
                transaction_id INT NULL COMMENT 'ID transaction si existe',
                event_type ENUM(
                    'card_validation_attempt',
                    'card_validation_success',
                    'card_validation_failed',
                    'payment_initiated',
                    'payment_success',
                    'payment_failed',
                    'refund_initiated',
                    'refund_completed',
                    'gateway_error'
                ) NOT NULL,
                user_id INT NULL,
                provider_id INT NULL,
                order_id INT NULL,
                amount DECIMAL(10,2) NULL,
                payment_method VARCHAR(20),
                request_data JSON COMMENT 'Données requête (sans infos sensibles)',
                response_data JSON COMMENT 'Réponse passerelle',
                error_code VARCHAR(50),
                error_message TEXT,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_transaction_id (transaction_id),
                INDEX idx_event_type (event_type),
                INDEX idx_created_at (created_at),
                INDEX idx_user_id (user_id),
                INDEX idx_order_id (order_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        echo "   ✅ Table payment_logs créée\n";
    } else {
        echo "   ⏭️  Table payment_logs existe déjà\n";
    }

    // Table payment_config
    if (!tableExists($pdo, 'payment_config')) {
        $pdo->exec("
            CREATE TABLE payment_config (
                id INT PRIMARY KEY AUTO_INCREMENT,
                config_key VARCHAR(50) UNIQUE NOT NULL,
                config_value TEXT NOT NULL,
                description TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
        echo "   ✅ Table payment_config créée\n";

        // Insérer config initiale
        $pdo->exec("
            INSERT INTO payment_config (config_key, config_value, description) VALUES
            ('commission_rate', '0.20', 'Taux de commission GlamGo (20%)'),
            ('min_transaction_amount', '50.00', 'Montant minimum transaction (MAD)'),
            ('max_transaction_amount', '10000.00', 'Montant maximum transaction (MAD)'),
            ('payment_gateway_mode', 'mock', 'Mode passerelle: mock, sandbox, production'),
            ('auto_transfer_enabled', 'false', 'Transfert automatique aux prestataires'),
            ('refund_enabled', 'false', 'Remboursements activés (manuel pour l\\'instant)')
        ");
        echo "   ✅ Configuration initiale insérée\n";
    } else {
        echo "   ⏭️  Table payment_config existe déjà\n";
    }

    echo "\n";
    echo "🔨 ÉTAPE 5 : Vue dashboard\n";
    echo "--------------------------\n";
    $pdo->exec("
        CREATE OR REPLACE VIEW v_payment_dashboard AS
        SELECT
            DATE(t.created_at) as date,
            COUNT(*) as total_transactions,
            COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as transactions_reussies,
            COUNT(CASE WHEN t.status = 'failed' THEN 1 END) as transactions_echouees,
            COUNT(CASE WHEN t.payment_method = 'card' THEN 1 END) as paiements_cb,
            COUNT(CASE WHEN t.payment_method = 'cash' THEN 1 END) as paiements_cash,
            SUM(t.amount) as montant_total,
            SUM(t.commission_glamgo) as commission_totale,
            SUM(t.provider_amount) as montant_prestataires
        FROM transactions t
        GROUP BY DATE(t.created_at)
        ORDER BY date DESC
    ");
    echo "   ✅ Vue v_payment_dashboard créée\n";

    echo "\n";
    echo "================================================\n";
    echo "✅ MIGRATION TERMINÉE AVEC SUCCÈS !\n";
    echo "================================================\n\n";

    echo "📊 Résumé :\n";
    echo "   - Colonnes users : OK\n";
    echo "   - Colonnes providers : OK\n";
    echo "   - Colonnes orders : OK\n";
    echo "   - Table transactions : OK\n";
    echo "   - Table payment_methods : OK\n";
    echo "   - Table payment_logs : OK\n";
    echo "   - Table payment_config : OK\n";
    echo "   - Vue v_payment_dashboard : OK\n\n";

    echo "🎉 Le système de paiement est prêt !\n\n";

} catch (PDOException $e) {
    echo "\n❌ ERREUR :\n";
    echo $e->getMessage() . "\n\n";
    exit(1);
}
