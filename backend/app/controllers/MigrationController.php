<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Database;

class MigrationController extends Controller
{
    /**
     * Exécute les migrations en attente
     */
    public function run(): void
    {
        try {
            $db = Database::getInstance();
            $results = [];

            // Migration 002: Notifications
            $migrationFile = __DIR__ . '/../../database/migrations/002_add_notifications.sql';
            if (file_exists($migrationFile)) {
                $sql = file_get_contents($migrationFile);
                $db->exec($sql);
                $stmt = $db->query("SHOW TABLES LIKE 'notifications'");
                $results['notifications'] = $stmt->rowCount() > 0;
            }

            // Migration 003: Location tracking
            $migrationFile = __DIR__ . '/../../database/migrations/003_add_location_tracking.sql';
            if (file_exists($migrationFile)) {
                $sql = file_get_contents($migrationFile);
                $db->exec($sql);
                $stmt = $db->query("SHOW TABLES LIKE 'location_tracking'");
                $results['location_tracking'] = $stmt->rowCount() > 0;
            }

            // Migration 004: Reviews
            $migrationFile = __DIR__ . '/../../database/migrations/004_add_reviews.sql';
            if (file_exists($migrationFile)) {
                $sql = file_get_contents($migrationFile);
                $db->exec($sql);
                $stmt = $db->query("SHOW TABLES LIKE 'reviews'");
                $results['reviews'] = $stmt->rowCount() > 0;

                // Ajouter les colonnes manquantes à reviews si elles n'existent pas
                $stmt = $db->query("SHOW COLUMNS FROM reviews LIKE 'service_quality'");
                if ($stmt->rowCount() === 0) {
                    $db->exec("ALTER TABLE reviews ADD COLUMN service_quality TINYINT NULL");
                    $results['service_quality_column'] = true;
                }

                $stmt = $db->query("SHOW COLUMNS FROM reviews LIKE 'punctuality'");
                if ($stmt->rowCount() === 0) {
                    $db->exec("ALTER TABLE reviews ADD COLUMN punctuality TINYINT NULL");
                    $results['punctuality_column'] = true;
                }

                $stmt = $db->query("SHOW COLUMNS FROM reviews LIKE 'professionalism'");
                if ($stmt->rowCount() === 0) {
                    $db->exec("ALTER TABLE reviews ADD COLUMN professionalism TINYINT NULL");
                    $results['professionalism_column'] = true;
                }

                // Ajouter la colonne has_review à orders si elle n'existe pas
                $stmt = $db->query("SHOW COLUMNS FROM orders LIKE 'has_review'");
                if ($stmt->rowCount() === 0) {
                    $db->exec("ALTER TABLE orders ADD COLUMN has_review BOOLEAN DEFAULT FALSE");
                    $results['has_review_column'] = true;
                } else {
                    $results['has_review_column'] = 'already_exists';
                }
            }

            // Migration 010: Service Formulas (Tarification dynamique)
            $migrationFile = __DIR__ . '/../../database/migrations/010_add_service_formulas.sql';
            if (file_exists($migrationFile)) {
                $sql = file_get_contents($migrationFile);
                $statements = array_filter(array_map('trim', explode(';', $sql)));
                foreach ($statements as $statement) {
                    if (!empty($statement) && stripos($statement, '--') !== 0) {
                        try {
                            $db->exec($statement);
                        } catch (\PDOException $e) {
                            if (strpos($e->getMessage(), 'already exists') === false &&
                                strpos($e->getMessage(), 'Duplicate') === false) {
                                error_log("Migration 010 warning: " . $e->getMessage());
                            }
                        }
                    }
                }
                $stmt = $db->query("SHOW TABLES LIKE 'service_formulas'");
                $results['service_formulas'] = $stmt->rowCount() > 0;
            }

            $this->success([
                'tables_created' => $results
            ], 'Migrations exécutées avec succès');

        } catch (\Exception $e) {
            $this->error('Erreur lors de la migration: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Debug: Affiche les statistiques
     */
    public function debug(): void
    {
        try {
            $db = Database::getInstance();

            // Compter les notifications
            $stmt = $db->query("SELECT COUNT(*) as count FROM notifications");
            $notifCount = $stmt->fetch()['count'];

            // Compter les prestataires
            $stmt = $db->query("SELECT COUNT(*) as count FROM providers");
            $providerCount = $stmt->fetch()['count'];

            // Compter les prestataires vérifiés et disponibles
            $stmt = $db->query("SELECT COUNT(*) as count FROM providers WHERE is_verified = 1 AND is_available = 1");
            $availableProviders = $stmt->fetch()['count'];

            // Dernières notifications
            $stmt = $db->query("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10");
            $lastNotifs = $stmt->fetchAll();

            // Dernières commandes
            $stmt = $db->query("SELECT id, status, service_id, created_at FROM orders ORDER BY created_at DESC LIMIT 5");
            $lastOrders = $stmt->fetchAll();

            $this->success([
                'notifications_count' => $notifCount,
                'providers_count' => $providerCount,
                'available_providers' => $availableProviders,
                'last_notifications' => $lastNotifs,
                'last_orders' => $lastOrders
            ]);

        } catch (\Exception $e) {
            $this->error('Erreur: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Active tous les prestataires (vérifiés et disponibles)
     */
    public function activateProviders(): void
    {
        try {
            $db = Database::getInstance();

            // Activer tous les prestataires
            $stmt = $db->prepare("UPDATE providers SET is_verified = 1, is_available = 1");
            $stmt->execute();

            $rowCount = $stmt->rowCount();

            $this->success([
                'providers_activated' => $rowCount
            ], "Tous les prestataires ont été activés");

        } catch (\Exception $e) {
            $this->error('Erreur: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Migration pour le système d'annulation
     * Ajoute les colonnes nécessaires à la table orders
     */
    public function migrateCancellation(): void
    {
        try {
            $db = Database::getInstance();
            $results = [];

            // Colonnes à ajouter à la table orders (syntaxe PostgreSQL compatible)
            $columns = [
                'cancelled_at' => 'TIMESTAMP NULL',
                'cancelled_by' => "VARCHAR(20) NULL",
                'cancellation_reason' => 'TEXT NULL',
                'cancellation_fee' => 'DECIMAL(10, 2) DEFAULT 0.00',
                'cancellation_fee_percentage' => 'INT DEFAULT 0',
                'cancellation_provider_lat' => 'DECIMAL(10, 8) NULL',
                'cancellation_provider_lng' => 'DECIMAL(11, 8) NULL',
                'cancellation_distance_traveled' => 'DECIMAL(10, 2) NULL'
            ];

            foreach ($columns as $columnName => $columnDef) {
                // Vérifier si la colonne existe (syntaxe PostgreSQL)
                $stmt = $db->prepare("SELECT column_name FROM information_schema.columns WHERE table_name = 'orders' AND column_name = ?");
                $stmt->execute([$columnName]);

                if ($stmt->fetch()) {
                    $results[] = "✓ Colonne '{$columnName}' existe deja";
                } else {
                    try {
                        $db->exec("ALTER TABLE orders ADD COLUMN {$columnName} {$columnDef}");
                        $results[] = "✅ Colonne '{$columnName}' ajoutee";
                    } catch (\PDOException $e) {
                        $results[] = "❌ Erreur '{$columnName}': " . $e->getMessage();
                    }
                }
            }

            // Créer la table cancellation_rules (syntaxe PostgreSQL)
            try {
                $db->exec("
                    CREATE TABLE IF NOT EXISTS cancellation_rules (
                        id SERIAL PRIMARY KEY,
                        status VARCHAR(20) NOT NULL,
                        cancelled_by VARCHAR(20) NOT NULL,
                        hours_before_appointment INT NULL,
                        min_fee_percentage INT DEFAULT 0,
                        max_fee_percentage INT DEFAULT 0,
                        provider_penalty_points INT DEFAULT 0,
                        description TEXT NULL,
                        is_active BOOLEAN DEFAULT TRUE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ");
                $results[] = "✅ Table 'cancellation_rules' creee/verifiee";
            } catch (\PDOException $e) {
                $results[] = "❌ Erreur cancellation_rules: " . $e->getMessage();
            }

            // Insérer les règles par défaut
            $stmt = $db->query("SELECT COUNT(*) as cnt FROM cancellation_rules");
            $count = $stmt->fetch()['cnt'];

            if ($count == 0) {
                $rules = [
                    ['pending', 'client', null, 0, 0, 0, 'Client annule commande en attente - Gratuit'],
                    ['accepted', 'client', 2, 0, 0, 0, 'Client annule > 2h avant RDV - Gratuit'],
                    ['accepted', 'client', 0, 50, 50, 0, 'Client annule < 2h avant RDV - 50% frais'],
                    ['on_way', 'client', null, 50, 100, 0, 'Client annule prestataire en route - 50-100%'],
                    ['pending', 'provider', null, 0, 0, 1, 'Prestataire refuse commande - 1 point'],
                    ['accepted', 'provider', 2, 0, 0, 2, 'Prestataire annule > 2h avant - 2 points'],
                    ['accepted', 'provider', 0, 0, 0, 5, 'Prestataire annule < 2h avant - 5 points'],
                    ['on_way', 'provider', null, 0, 0, 10, 'Prestataire annule en route - 10 points'],
                ];

                $insertStmt = $db->prepare("
                    INSERT INTO cancellation_rules
                    (status, cancelled_by, hours_before_appointment, min_fee_percentage, max_fee_percentage, provider_penalty_points, description)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ");

                foreach ($rules as $rule) {
                    try {
                        $insertStmt->execute($rule);
                    } catch (\PDOException $e) {
                        // Ignorer doublons
                    }
                }
                $results[] = "✅ Regles d'annulation inserees";
            } else {
                $results[] = "✓ Regles existent deja ({$count} regles)";
            }

            $this->success([
                'results' => $results
            ], 'Migration annulation terminee');

        } catch (\Exception $e) {
            $this->error('Erreur migration: ' . $e->getMessage(), 500);
        }
    }
}
