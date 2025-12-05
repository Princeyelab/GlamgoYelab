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
}
