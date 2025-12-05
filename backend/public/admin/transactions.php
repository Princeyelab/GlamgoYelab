<?php
/**
 * Page Admin - Gestion des transactions
 * GlamGo - Système de paiement
 *
 * Vue complète de toutes les transactions avec filtres
 */

require_once __DIR__ . '/../../config/config.php';

// Connexion DB
$config = require __DIR__ . '/../../config/config.php';
$db_config = $config['database'];

try {
    $pdo = new PDO(
        "mysql:host={$db_config['host']};dbname={$db_config['name']};charset={$db_config['charset']}",
        $db_config['user'],
        $db_config['password']
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Erreur connexion DB: " . $e->getMessage());
}

// Filtres
$status_filter = $_GET['status'] ?? 'all';
$payment_method_filter = $_GET['payment_method'] ?? 'all';
$date_filter = $_GET['date'] ?? 'all';
$limit = intval($_GET['limit'] ?? 50);

// Query de base
$where_clauses = [];
$params = [];

if ($status_filter !== 'all') {
    $where_clauses[] = "t.status = ?";
    $params[] = $status_filter;
}

if ($payment_method_filter !== 'all') {
    $where_clauses[] = "t.payment_method = ?";
    $params[] = $payment_method_filter;
}

if ($date_filter === 'today') {
    $where_clauses[] = "DATE(t.created_at) = CURDATE()";
} elseif ($date_filter === 'week') {
    $where_clauses[] = "t.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
} elseif ($date_filter === 'month') {
    $where_clauses[] = "t.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
}

$where_sql = !empty($where_clauses) ? "WHERE " . implode(" AND ", $where_clauses) : "";

// Récupérer transactions
$stmt = $pdo->prepare("
    SELECT
        t.*,
        CONCAT(u.first_name, ' ', u.last_name) as client_name,
        u.email as client_email,
        CONCAT(p.first_name, ' ', p.last_name) as provider_name,
        p.email as provider_email,
        s.name as service_name
    FROM transactions t
    JOIN users u ON t.user_id = u.id
    JOIN providers p ON t.provider_id = p.id
    JOIN orders o ON t.order_id = o.id
    JOIN services s ON o.service_id = s.id
    $where_sql
    ORDER BY t.created_at DESC
    LIMIT $limit
");

$stmt->execute($params);
$transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Statistiques globales
$stats_stmt = $pdo->query("
    SELECT
        COUNT(*) as total_transactions,
        SUM(amount) as total_amount,
        SUM(commission_glamgo) as total_commission,
        SUM(provider_amount) as total_provider_amount,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
        COUNT(CASE WHEN payment_method = 'card' THEN 1 END) as card_count,
        COUNT(CASE WHEN payment_method = 'cash' THEN 1 END) as cash_count
    FROM transactions
");
$stats = $stats_stmt->fetch(PDO::FETCH_ASSOC);

?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - Transactions GlamGo</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #f5f7fa;
            color: #333;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 40px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .header h1 {
            font-size: 28px;
            margin-bottom: 8px;
        }

        .header p {
            opacity: 0.9;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 30px 40px;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }

        .stat-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            border-left: 4px solid #667eea;
        }

        .stat-card .stat-label {
            font-size: 13px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }

        .stat-card .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: #1a1a1a;
        }

        .stat-card .stat-subtitle {
            font-size: 12px;
            color: #999;
            margin-top: 5px;
        }

        .filters {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            margin-bottom: 30px;
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
            align-items: end;
        }

        .filter-group {
            flex: 1;
            min-width: 150px;
        }

        .filter-group label {
            display: block;
            font-weight: 600;
            margin-bottom: 8px;
            font-size: 14px;
        }

        .filter-group select {
            width: 100%;
            padding: 10px 14px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
            transition: border-color 0.3s;
        }

        .filter-group select:focus {
            outline: none;
            border-color: #667eea;
        }

        .btn-filter {
            padding: 11px 24px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.3s;
        }

        .btn-filter:hover {
            background: #5568d3;
        }

        .transactions-table {
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            overflow: hidden;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        thead {
            background: #f8f9fa;
        }

        th {
            padding: 16px;
            text-align: left;
            font-weight: 600;
            font-size: 13px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #e0e0e0;
        }

        td {
            padding: 16px;
            border-bottom: 1px solid #f0f0f0;
            font-size: 14px;
        }

        tr:hover {
            background: #f8f9fa;
        }

        .badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .badge-completed {
            background: #d4edda;
            color: #155724;
        }

        .badge-pending {
            background: #fff3cd;
            color: #856404;
        }

        .badge-failed {
            background: #f8d7da;
            color: #721c24;
        }

        .badge-card {
            background: #d1ecf1;
            color: #0c5460;
        }

        .badge-cash {
            background: #f3d5f0;
            color: #6e2c63;
        }

        .amount {
            font-weight: 700;
            color: #1a1a1a;
        }

        .commission {
            color: #667eea;
            font-weight: 600;
        }

        .date {
            color: #999;
            font-size: 13px;
        }

        .no-data {
            text-align: center;
            padding: 60px 20px;
            color: #999;
            font-size: 16px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>💰 Gestion des Transactions</h1>
        <p>Dashboard administrateur - GlamGo Payment System</p>
    </div>

    <div class="container">
        <!-- Statistiques -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Total Transactions</div>
                <div class="stat-value"><?= number_format($stats['total_transactions']) ?></div>
                <div class="stat-subtitle">
                    ✅ <?= $stats['completed_count'] ?> complétées
                    ⏳ <?= $stats['pending_count'] ?> en attente
                    ❌ <?= $stats['failed_count'] ?> échouées
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-label">Volume Total</div>
                <div class="stat-value"><?= number_format($stats['total_amount'], 2) ?> MAD</div>
                <div class="stat-subtitle">
                    💳 <?= $stats['card_count'] ?> CB | 💵 <?= $stats['cash_count'] ?> Cash
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-label">Commission GlamGo</div>
                <div class="stat-value"><?= number_format($stats['total_commission'], 2) ?> MAD</div>
                <div class="stat-subtitle">20% du volume total</div>
            </div>

            <div class="stat-card">
                <div class="stat-label">Montant Prestataires</div>
                <div class="stat-value"><?= number_format($stats['total_provider_amount'], 2) ?> MAD</div>
                <div class="stat-subtitle">80% du volume total</div>
            </div>
        </div>

        <!-- Filtres -->
        <form method="GET" class="filters">
            <div class="filter-group">
                <label>Statut</label>
                <select name="status">
                    <option value="all" <?= $status_filter === 'all' ? 'selected' : '' ?>>Tous</option>
                    <option value="completed" <?= $status_filter === 'completed' ? 'selected' : '' ?>>Complétées</option>
                    <option value="pending" <?= $status_filter === 'pending' ? 'selected' : '' ?>>En attente</option>
                    <option value="failed" <?= $status_filter === 'failed' ? 'selected' : '' ?>>Échouées</option>
                </select>
            </div>

            <div class="filter-group">
                <label>Méthode</label>
                <select name="payment_method">
                    <option value="all" <?= $payment_method_filter === 'all' ? 'selected' : '' ?>>Toutes</option>
                    <option value="card" <?= $payment_method_filter === 'card' ? 'selected' : '' ?>>Carte bancaire</option>
                    <option value="cash" <?= $payment_method_filter === 'cash' ? 'selected' : '' ?>>Espèces</option>
                </select>
            </div>

            <div class="filter-group">
                <label>Période</label>
                <select name="date">
                    <option value="all" <?= $date_filter === 'all' ? 'selected' : '' ?>>Toutes</option>
                    <option value="today" <?= $date_filter === 'today' ? 'selected' : '' ?>>Aujourd'hui</option>
                    <option value="week" <?= $date_filter === 'week' ? 'selected' : '' ?>>7 derniers jours</option>
                    <option value="month" <?= $date_filter === 'month' ? 'selected' : '' ?>>30 derniers jours</option>
                </select>
            </div>

            <div class="filter-group">
                <label>Limite</label>
                <select name="limit">
                    <option value="50" <?= $limit === 50 ? 'selected' : '' ?>>50</option>
                    <option value="100" <?= $limit === 100 ? 'selected' : '' ?>>100</option>
                    <option value="200" <?= $limit === 200 ? 'selected' : '' ?>>200</option>
                    <option value="500" <?= $limit === 500 ? 'selected' : '' ?>>500</option>
                </select>
            </div>

            <button type="submit" class="btn-filter">🔍 Filtrer</button>
        </form>

        <!-- Tableau transactions -->
        <div class="transactions-table">
            <?php if (empty($transactions)): ?>
                <div class="no-data">
                    Aucune transaction trouvée avec ces filtres
                </div>
            <?php else: ?>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Date</th>
                            <th>Client</th>
                            <th>Prestataire</th>
                            <th>Service</th>
                            <th>Montant</th>
                            <th>Commission</th>
                            <th>Méthode</th>
                            <th>Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($transactions as $t): ?>
                            <tr>
                                <td>#<?= $t['id'] ?></td>
                                <td class="date">
                                    <?= date('d/m/Y H:i', strtotime($t['created_at'])) ?>
                                </td>
                                <td>
                                    <strong><?= htmlspecialchars($t['client_name']) ?></strong><br>
                                    <small><?= htmlspecialchars($t['client_email']) ?></small>
                                </td>
                                <td>
                                    <strong><?= htmlspecialchars($t['provider_name']) ?></strong><br>
                                    <small><?= htmlspecialchars($t['provider_email']) ?></small>
                                </td>
                                <td><?= htmlspecialchars($t['service_name']) ?></td>
                                <td class="amount"><?= number_format($t['amount'], 2) ?> MAD</td>
                                <td class="commission"><?= number_format($t['commission_glamgo'], 2) ?> MAD</td>
                                <td>
                                    <span class="badge badge-<?= $t['payment_method'] ?>">
                                        <?= $t['payment_method'] === 'card' ? '💳 CB' : '💵 Cash' ?>
                                    </span>
                                </td>
                                <td>
                                    <span class="badge badge-<?= $t['status'] ?>">
                                        <?= $t['status'] ?>
                                    </span>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>
