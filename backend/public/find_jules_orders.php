<?php
require_once __DIR__ . '/../app/bootstrap.php';

header('Content-Type: application/json');

try {
    $db = \App\Core\Database::getInstance();
    
    // Trouver les commandes de Jules
    $stmt = $db->query("
        SELECT 
            o.id,
            o.booking_code,
            o.status,
            o.total_price,
            o.scheduled_at,
            o.created_at,
            u.first_name as client_first_name,
            u.last_name as client_last_name,
            u.email as client_email,
            s.name as service_name,
            pcs.name as custom_service_name,
            p.first_name as provider_first_name,
            p.last_name as provider_last_name
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN services s ON o.service_id = s.id
        LEFT JOIN provider_custom_services pcs ON o.custom_service_id = pcs.id
        LEFT JOIN providers p ON o.provider_id = p.id
        WHERE LOWER(u.first_name) LIKE '%jules%' 
           OR LOWER(u.last_name) LIKE '%jules%'
        ORDER BY o.created_at DESC
    ");
    
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'count' => count($orders),
        'orders' => $orders
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
