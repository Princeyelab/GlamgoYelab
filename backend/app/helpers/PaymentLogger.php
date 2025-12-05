<?php

namespace App\Helpers;

use App\Core\Database;
use PDO;

/**
 * PaymentLogger - Système de logs pour paiements
 *
 * Enregistre tous les événements de paiement dans :
 * 1. Base de données (table payment_logs)
 * 2. Fichiers logs (backend/logs/payments_YYYY-MM-DD.log)
 *
 * SÉCURITÉ : Ne jamais logger les données sensibles (numéros CB complets, CVV, etc.)
 *
 * @package GlamGo
 * @author Claude Code
 */
class PaymentLogger
{
    private static $instance = null;
    private $log_dir;
    private $db;

    private function __construct()
    {
        $this->log_dir = __DIR__ . '/../../logs';
        $this->db = Database::getInstance();

        // Créer dossier logs si inexistant
        if (!is_dir($this->log_dir)) {
            mkdir($this->log_dir, 0755, true);
        }
    }

    /**
     * Singleton
     */
    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Logger un événement de paiement
     *
     * @param string $event_type
     * @param array $data
     * @param int|null $transaction_id
     * @return void
     */
    public function log($event_type, $data = [], $transaction_id = null)
    {
        // 1. Log dans fichier
        $this->logToFile($event_type, $data);

        // 2. Log dans base de données
        $this->logToDatabase($event_type, $data, $transaction_id);
    }

    /**
     * Logger dans fichier
     */
    private function logToFile($event_type, $data)
    {
        $log_file = $this->log_dir . '/payments_' . date('Y-m-d') . '.log';

        $log_entry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'event' => $event_type,
            'data' => $this->sanitizeForLog($data),
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ];

        $log_line = json_encode($log_entry, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . PHP_EOL;

        file_put_contents($log_file, $log_line, FILE_APPEND | LOCK_EX);
    }

    /**
     * Logger dans base de données
     */
    private function logToDatabase($event_type, $data, $transaction_id = null)
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO payment_logs (
                    transaction_id,
                    event_type,
                    user_id,
                    provider_id,
                    order_id,
                    amount,
                    payment_method,
                    request_data,
                    response_data,
                    error_code,
                    error_message,
                    ip_address,
                    user_agent
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $request_data = $this->sanitizeForLog($data);
            $response_data = isset($data['response']) ? $this->sanitizeForLog($data['response']) : null;

            $stmt->execute([
                $transaction_id,
                $event_type,
                $data['user_id'] ?? null,
                $data['provider_id'] ?? null,
                $data['order_id'] ?? null,
                $data['amount'] ?? null,
                $data['payment_method'] ?? null,
                json_encode($request_data),
                json_encode($response_data),
                $data['error_code'] ?? null,
                $data['error'] ?? $data['error_message'] ?? null,
                $_SERVER['REMOTE_ADDR'] ?? null,
                $_SERVER['HTTP_USER_AGENT'] ?? null
            ]);
        } catch (\Exception $e) {
            // Si log DB échoue, au moins on a le fichier
            error_log("PaymentLogger DB error: " . $e->getMessage());
        }
    }

    /**
     * Sanitize data : Supprimer données sensibles
     */
    private function sanitizeForLog($data)
    {
        if (!is_array($data)) {
            return $data;
        }

        $sanitized = $data;

        // Supprimer données sensibles
        $sensitive_keys = [
            'card_number',
            'cvv',
            'card_cvv',
            'password',
            'api_key',
            'api_secret',
            'card_token' // On garde juste la référence, pas le token complet
        ];

        foreach ($sensitive_keys as $key) {
            if (isset($sanitized[$key])) {
                // Garder derniers 4 chiffres si c'est un numéro de carte
                if ($key === 'card_number' && strlen($sanitized[$key]) >= 4) {
                    $sanitized[$key] = '****' . substr($sanitized[$key], -4);
                } else {
                    $sanitized[$key] = '***REDACTED***';
                }
            }
        }

        // Récursif pour tableaux imbriqués
        foreach ($sanitized as $key => $value) {
            if (is_array($value)) {
                $sanitized[$key] = $this->sanitizeForLog($value);
            }
        }

        return $sanitized;
    }

    /**
     * Récupérer logs pour une transaction
     */
    public function getTransactionLogs($transaction_id)
    {
        $stmt = $this->db->prepare("
            SELECT *
            FROM payment_logs
            WHERE transaction_id = ?
            ORDER BY created_at ASC
        ");
        $stmt->execute([$transaction_id]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Récupérer logs pour un utilisateur
     */
    public function getUserLogs($user_id, $limit = 50)
    {
        $stmt = $this->db->prepare("
            SELECT *
            FROM payment_logs
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        ");
        $stmt->execute([$user_id, $limit]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Récupérer logs par type d'événement
     */
    public function getLogsByEventType($event_type, $limit = 100)
    {
        $stmt = $this->db->prepare("
            SELECT *
            FROM payment_logs
            WHERE event_type = ?
            ORDER BY created_at DESC
            LIMIT ?
        ");
        $stmt->execute([$event_type, $limit]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Récupérer logs avec erreurs
     */
    public function getErrorLogs($hours = 24, $limit = 100)
    {
        $stmt = $this->db->prepare("
            SELECT *
            FROM payment_logs
            WHERE error_message IS NOT NULL
            AND created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
            ORDER BY created_at DESC
            LIMIT ?
        ");
        $stmt->execute([$hours, $limit]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Statistiques logs (pour dashboard admin)
     */
    public function getStats($period = 'today')
    {
        $where_clause = match ($period) {
            'today' => "DATE(created_at) = CURDATE()",
            'yesterday' => "DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)",
            'week' => "created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
            'month' => "created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)",
            default => "1=1"
        };

        $stmt = $this->db->query("
            SELECT
                event_type,
                COUNT(*) as count,
                COUNT(CASE WHEN error_message IS NOT NULL THEN 1 END) as errors_count
            FROM payment_logs
            WHERE $where_clause
            GROUP BY event_type
        ");

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Nettoyer vieux logs (à exécuter en cron)
     */
    public function cleanOldLogs($days = 90)
    {
        // Nettoyer DB
        $stmt = $this->db->prepare("
            DELETE FROM payment_logs
            WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
        ");
        $deleted = $stmt->execute([$days]);

        // Nettoyer fichiers
        $files = glob($this->log_dir . '/payments_*.log');
        $cutoff_date = strtotime("-$days days");
        $deleted_files = 0;

        foreach ($files as $file) {
            if (filemtime($file) < $cutoff_date) {
                unlink($file);
                $deleted_files++;
            }
        }

        return [
            'db_rows_deleted' => $stmt->rowCount(),
            'files_deleted' => $deleted_files
        ];
    }

    /**
     * Envoyer alerte email admin en cas d'erreur critique
     */
    public function alertAdmin($event_type, $error_message, $data = [])
    {
        // TODO: Implémenter envoi email
        // Pour l'instant, log dans fichier spécial
        $alert_file = $this->log_dir . '/alerts_' . date('Y-m-d') . '.log';

        $alert = [
            'timestamp' => date('Y-m-d H:i:s'),
            'event' => $event_type,
            'error' => $error_message,
            'data' => $this->sanitizeForLog($data)
        ];

        file_put_contents(
            $alert_file,
            json_encode($alert, JSON_UNESCAPED_UNICODE) . PHP_EOL,
            FILE_APPEND | LOCK_EX
        );

        // Log aussi en DB
        $this->log('admin_alert', array_merge($data, [
            'error_message' => $error_message,
            'alert_type' => $event_type
        ]));
    }
}
