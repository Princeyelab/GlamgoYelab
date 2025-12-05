<?php

/**
 * Fichier de définition des routes
 * Marrakech Services API
 */

// ============================================
// Routes de Test & Health Check
// ============================================

// Route de test de l'API
$router->get('/', 'HomeController', 'index');
$router->get('/health', 'HomeController', 'health');

// ============================================
// Routes API - Authentification
// ============================================

// Authentification (routes publiques)
$router->post('/api/register', 'AuthController', 'register');
$router->post('/api/login', 'AuthController', 'login');
$router->post('/api/verify-token', 'AuthController', 'verifyToken');
$router->post('/api/logout', 'AuthController', 'logout');

// Profil utilisateur (nécessite authentification)
$router->get('/api/profile', 'AuthController', 'profile', ['AuthMiddleware']);

// ============================================
// Routes publiques - Catégories et Services
// ============================================

// Lister toutes les catégories (avec nombre de services)
$router->get('/api/categories', 'ServiceController', 'getCategories');

// Lister les services d'une catégorie spécifique
$router->get('/api/categories/{id}/services', 'ServiceController', 'getServices');

// Lister tous les services (toutes catégories)
$router->get('/api/services', 'ServiceController', 'getAllServices');

// Récupérer les détails d'un service spécifique
$router->get('/api/services/{id}', 'ServiceController', 'getService');

// Rechercher des services par mot-clé (GET /api/services/search?q=plomberie)
$router->get('/api/services/search', 'ServiceController', 'searchServices');

// ============================================
// Routes protégées - Commandes (nécessite authentification)
// ============================================

// Créer une nouvelle commande
$router->post('/api/orders', 'OrderController', 'createOrder', ['AuthMiddleware']);

// Lister toutes les commandes de l'utilisateur
$router->get('/api/orders', 'OrderController', 'getMyOrders', ['AuthMiddleware']);

// Récupérer les détails d'une commande
$router->get('/api/orders/{id}', 'OrderController', 'getOrder', ['AuthMiddleware']);

// Récupérer le statut d'une commande avec tracking (localisation en temps réel si en_route)
$router->get('/api/orders/{id}/status', 'OrderController', 'getOrderStatus', ['AuthMiddleware']);

// Annuler une commande
$router->put('/api/orders/{id}/cancel', 'OrderController', 'cancelOrder', ['AuthMiddleware']);

// ============================================
// Routes Chat - Communication utilisateur/prestataire
// ============================================
// Note: Ces routes vérifient l'authentification dans le contrôleur
// pour permettre l'accès aux utilisateurs ET aux prestataires

// Récupérer tous les messages d'une conversation
$router->get('/api/orders/{id}/chat', 'ChatController', 'getMessages');

// Envoyer un nouveau message dans une conversation
$router->post('/api/orders/{id}/chat', 'ChatController', 'postMessage');

// ============================================
// Routes API - Authentification Prestataires
// ============================================

// Inscription et connexion des prestataires (routes publiques)
$router->post('/api/provider/register', 'ProviderAuthController', 'register');
$router->post('/api/provider/login', 'ProviderAuthController', 'login');
$router->post('/api/provider/logout', 'ProviderAuthController', 'logout');

// Profil et gestion du prestataire (nécessite authentification ProviderMiddleware)
$router->get('/api/provider/profile', 'ProviderAuthController', 'profile', ['ProviderMiddleware']);
$router->put('/api/provider/status', 'ProviderAuthController', 'updateStatus', ['ProviderMiddleware']);
$router->put('/api/provider/location', 'ProviderAuthController', 'updateLocation', ['ProviderMiddleware']);

// ============================================
// Routes Prestataires - Gestion des Commandes (nécessite authentification)
// ============================================

// Lister les commandes en attente (pending)
$router->get('/api/provider/pending-orders', 'ProviderController', 'getPendingOrders', ['ProviderMiddleware']);

// Accepter une commande
$router->post('/api/provider/orders/{id}/accept', 'ProviderController', 'acceptOrder', ['ProviderMiddleware']);

// Lister les commandes du prestataire
$router->get('/api/provider/my-orders', 'ProviderController', 'getMyOrders', ['ProviderMiddleware']);

// Mettre à jour le statut d'une commande
$router->put('/api/provider/orders/{id}/status', 'ProviderController', 'updateOrderStatus', ['ProviderMiddleware']);

// Mettre à jour la localisation (suivi en temps réel)
$router->post('/api/provider/location', 'ProviderController', 'updateLocation', ['ProviderMiddleware']);

// ============================================
// Routes à implémenter plus tard
// ============================================

// Utilisateurs
// $router->get('/api/users', 'UserController', 'index');
// $router->get('/api/users/{id}', 'UserController', 'show');

// Prestataires publics
// $router->get('/api/providers', 'ProviderController', 'index');
// $router->get('/api/providers/{id}', 'ProviderController', 'show');

// Évaluations
// $router->post('/api/reviews', 'ReviewController', 'create');
// $router->get('/api/reviews/{id}', 'ReviewController', 'show');
