<?php
/**
 * Routes API pour le systeme de priorite et blocage des prestataires
 * Ajoute le 2025-12-03
 */

use App\Controllers\ProviderPriorityController;

// =====================================================
// ROUTES SYSTEME DE PRIORITE ET BLOCAGE PRESTATAIRES
// =====================================================

// Routes Prestataire - Consulter sa priorite
$router->get('/api/provider/priority-status', [ProviderPriorityController::class, 'getMyPriorityStatus']);
$router->get('/api/provider/rating-history', [ProviderPriorityController::class, 'getRatingHistoryEndpoint']);

// Routes Admin - Gestion priorite et blocage
$router->get('/api/admin/providers/priority', [ProviderPriorityController::class, 'getProvidersPriority']);
$router->post('/api/admin/providers/{id}/block', [ProviderPriorityController::class, 'blockProvider']);
$router->post('/api/admin/providers/{id}/unblock', [ProviderPriorityController::class, 'unblockProvider']);
$router->get('/api/admin/providers/{id}/block-history', [ProviderPriorityController::class, 'getBlockHistory']);
$router->post('/api/admin/providers/check-ratings', [ProviderPriorityController::class, 'checkAndBlockLowRated']);
$router->get('/api/admin/providers/at-risk', [ProviderPriorityController::class, 'getAtRiskProviders']);
$router->post('/api/admin/providers/{id}/warning', [ProviderPriorityController::class, 'sendWarning']);

// Routes Systeme - Prestataires par priorite pour une commande
$router->get('/api/orders/{id}/providers-by-priority', [ProviderPriorityController::class, 'getProvidersByPriorityForOrder']);
