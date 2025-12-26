<?php

/**
 * Routes API pour GlamGo
 */

use App\Middlewares\AuthMiddleware;

// =====================================================
// Routes publiques (pas d'authentification requise)
// =====================================================

// Santé de l'API
$router->get('/api/health', 'HealthController', 'check');

// Migration (à supprimer après utilisation)
$router->get('/api/migrate', 'MigrationController', 'run');
$router->get('/api/debug', 'MigrationController', 'debug');
$router->get('/api/activate-providers', 'MigrationController', 'activateProviders');

// Authentification
$router->post('/api/auth/register', 'AuthController', 'register');
$router->post('/api/auth/login', 'AuthController', 'login');
$router->post('/api/auth/logout', 'AuthController', 'logout');
$router->post('/api/auth/forgot-password', 'AuthController', 'forgotPassword');
$router->post('/api/auth/reset-password', 'AuthController', 'resetPassword');

// OAuth (routes à implémenter)
$router->get('/api/auth/google', 'OAuthController', 'redirectToGoogle');
$router->get('/api/auth/google/callback', 'OAuthController', 'handleGoogleCallback');
$router->get('/api/auth/facebook', 'OAuthController', 'redirectToFacebook');
$router->get('/api/auth/facebook/callback', 'OAuthController', 'handleFacebookCallback');

// Catégories et Services (consultation publique)
$router->get('/api/categories', 'CategoryController', 'index');
$router->get('/api/categories/{id}', 'CategoryController', 'show');
$router->get('/api/categories/{id}/services', 'CategoryController', 'services');
$router->get('/api/services', 'ServiceController', 'index');
$router->get('/api/services/{id}', 'ServiceController', 'show');

// =====================================================
// Routes protégées (authentification requise)
// =====================================================

// Profil utilisateur
$router->get('/api/user/profile', 'UserController', 'profile')
    ->middleware([AuthMiddleware::class]);
$router->put('/api/user/profile', 'UserController', 'updateProfile')
    ->middleware([AuthMiddleware::class]);
$router->post('/api/user/avatar', 'UserController', 'uploadAvatar')
    ->middleware([AuthMiddleware::class]);
$router->post('/api/user/profile/image', 'UserController', 'uploadProfileImage')
    ->middleware([AuthMiddleware::class]);

// Adresses
$router->get('/api/user/addresses', 'AddressController', 'index')
    ->middleware([AuthMiddleware::class]);
$router->post('/api/user/addresses', 'AddressController', 'create')
    ->middleware([AuthMiddleware::class]);
$router->put('/api/user/addresses/{id}', 'AddressController', 'update')
    ->middleware([AuthMiddleware::class]);
$router->delete('/api/user/addresses/{id}', 'AddressController', 'delete')
    ->middleware([AuthMiddleware::class]);
$router->patch('/api/user/addresses/{id}/default', 'AddressController', 'setDefault')
    ->middleware([AuthMiddleware::class]);

// Parrainage
$router->get('/api/user/referral-code', 'ReferralController', 'getCode')
    ->middleware([AuthMiddleware::class]);
$router->post('/api/user/apply-referral', 'ReferralController', 'applyCode')
    ->middleware([AuthMiddleware::class]);

// Commandes
$router->post('/api/orders', 'OrderController', 'create')
    ->middleware([AuthMiddleware::class]);
$router->get('/api/orders', 'OrderController', 'index')
    ->middleware([AuthMiddleware::class]);
$router->get('/api/orders/{id}', 'OrderController', 'show')
    ->middleware([AuthMiddleware::class]);
$router->get('/api/orders/{id}/cancellation-info', 'OrderController', 'getCancellationInfo')
    ->middleware([AuthMiddleware::class]);
$router->patch('/api/orders/{id}/cancel', 'OrderController', 'cancel')
    ->middleware([AuthMiddleware::class]);
$router->patch('/api/orders/{id}', 'OrderController', 'update')
    ->middleware([AuthMiddleware::class]);
$router->patch('/api/orders/{id}/confirm-arrival', 'OrderController', 'confirmArrival')
    ->middleware([AuthMiddleware::class]);
$router->patch('/api/orders/{id}/confirm-complete', 'OrderController', 'confirmComplete')
    ->middleware([AuthMiddleware::class]);

// Évaluations
$router->post('/api/orders/{id}/review', 'ReviewController', 'create')
    ->middleware([AuthMiddleware::class]);
$router->get('/api/orders/{id}/review', 'ReviewController', 'getOrderReview')
    ->middleware([AuthMiddleware::class]);
$router->get('/api/orders/{id}/can-review', 'ReviewController', 'canReview')
    ->middleware([AuthMiddleware::class]);

// Litiges (Disputes)
$router->post('/api/disputes', 'DisputeController', 'create')
    ->middleware([AuthMiddleware::class]);
$router->get('/api/disputes', 'DisputeController', 'index')
    ->middleware([AuthMiddleware::class]);
$router->get('/api/disputes/{id}', 'DisputeController', 'show')
    ->middleware([AuthMiddleware::class]);
$router->post('/api/disputes/{id}/message', 'DisputeController', 'addMessage')
    ->middleware([AuthMiddleware::class]);
$router->patch('/api/disputes/{id}/close', 'DisputeController', 'close')
    ->middleware([AuthMiddleware::class]);

// Avis prestataires (public)
$router->get('/api/providers/{id}/reviews', 'ReviewController', 'getProviderReviews');
$router->get('/api/providers/{id}/stats', 'ReviewController', 'getProviderStats');

// Démonstration paiement (public - mode test uniquement)
$router->post('/api/payment/demo/validate-card', 'PaymentController', 'validateCardDemo');

// Géolocalisation (suivi en temps réel)
$router->get('/api/orders/{id}/location', 'LocationController', 'getProviderLocation')
    ->middleware([AuthMiddleware::class]);

// =====================================================
// ROUTES CHAT INTERNE RENFORCE
// =====================================================
// Ajoute le 2025-11-30 - Suppression WhatsApp
// Communication securisee via chat interne uniquement

// Messages d'une commande
$router->get('/api/orders/{id}/messages', 'ChatController', 'getMessages')
    ->middleware([AuthMiddleware::class]);
$router->post('/api/orders/{id}/messages', 'ChatController', 'sendMessage')
    ->middleware([AuthMiddleware::class]);

// Upload d'images dans le chat
$router->post('/api/orders/{id}/messages/upload', 'ChatController', 'uploadImage')
    ->middleware([AuthMiddleware::class]);

// Statut du chat (actif, desactive, raison)
$router->get('/api/orders/{id}/chat-status', 'ChatController', 'getChatStatus')
    ->middleware([AuthMiddleware::class]);

// Nombre de messages non lus (global)
$router->get('/api/chat/unread-count', 'ChatController', 'getUnreadCount')
    ->middleware([AuthMiddleware::class]);

// Mise a jour presence (en ligne)
$router->post('/api/presence/update', 'ChatController', 'updatePresence')
    ->middleware([AuthMiddleware::class]);
// Notifications utilisateur
$router->get('/api/notifications', 'NotificationController', 'index')
    ->middleware([AuthMiddleware::class]);
$router->patch('/api/notifications/{id}/read', 'NotificationController', 'markAsRead')
    ->middleware([AuthMiddleware::class]);
$router->patch('/api/notifications/read-all', 'NotificationController', 'markAllAsRead')
    ->middleware([AuthMiddleware::class]);
$router->get('/api/notifications/unread-count', 'NotificationController', 'unreadCount')
    ->middleware([AuthMiddleware::class]);

// =====================================================
// Routes Prestataires (à implémenter)
// =====================================================

// Profil prestataire
$router->post('/api/provider/register', 'ProviderController', 'register');
$router->post('/api/provider/login', 'ProviderController', 'login');
$router->get('/api/provider/profile', 'ProviderController', 'profile')
    ->middleware([AuthMiddleware::class]);
$router->put('/api/provider/profile', 'ProviderController', 'updateProfile')
    ->middleware([AuthMiddleware::class]);
$router->post('/api/provider/profile/image', 'ProviderController', 'uploadProfileImage')
    ->middleware([AuthMiddleware::class]);
$router->post('/api/provider/documents', 'ProviderController', 'uploadDocuments')
    ->middleware([AuthMiddleware::class]);

// Services proposés par le prestataire
$router->get('/api/provider/services', 'ProviderServiceController', 'index')
    ->middleware([AuthMiddleware::class]);
$router->post('/api/provider/services', 'ProviderServiceController', 'add')
    ->middleware([AuthMiddleware::class]);
$router->delete('/api/provider/services/{id}', 'ProviderServiceController', 'remove')
    ->middleware([AuthMiddleware::class]);

// Commandes reçues par le prestataire
$router->get('/api/provider/orders', 'ProviderOrderController', 'index')
    ->middleware([AuthMiddleware::class]);
$router->get('/api/provider/orders/{id}', 'ProviderOrderController', 'show')
    ->middleware([AuthMiddleware::class]);
$router->patch('/api/provider/orders/{id}/accept', 'ProviderOrderController', 'accept')
    ->middleware([AuthMiddleware::class]);
$router->patch('/api/provider/orders/{id}/start', 'ProviderOrderController', 'start')
    ->middleware([AuthMiddleware::class]);
$router->patch('/api/provider/orders/{id}/complete', 'ProviderOrderController', 'complete')
    ->middleware([AuthMiddleware::class]);
$router->patch('/api/provider/orders/{id}/arrive', 'ProviderOrderController', 'arrive')
    ->middleware([AuthMiddleware::class]);
$router->post('/api/provider/orders/{id}/cancel', 'ProviderOrderController', 'cancel')
    ->middleware([AuthMiddleware::class]);
$router->get("/api/provider/orders/{id}/client-location", "LocationController", "getClientLocation")
    ->middleware([AuthMiddleware::class]);

// Mise à jour de localisation
$router->post('/api/provider/location', 'LocationController', 'updateLocation')
    ->middleware([AuthMiddleware::class]);

// Notifications prestataire
$router->get('/api/provider/notifications', 'ProviderNotificationController', 'index')
    ->middleware([AuthMiddleware::class]);
$router->patch('/api/provider/notifications/{id}/read', 'ProviderNotificationController', 'markAsRead')
    ->middleware([AuthMiddleware::class]);
$router->patch('/api/provider/notifications/read-all', 'ProviderNotificationController', 'markAllAsRead')
    ->middleware([AuthMiddleware::class]);
$router->get('/api/provider/notifications/unread-count', 'ProviderNotificationController', 'unreadCount')
    ->middleware([AuthMiddleware::class]);

// =====================================================
// ROUTES SYSTÈME D'ENCHÈRES (MODE BIDDING)
// =====================================================
// Ajouté le 2025-11-19 - Migration système InDrive-style
// ZÉRO impact sur les routes existantes (mode fixe conservé)

// Routes utilisateur - Créer et gérer commandes en mode enchères
$router->post('/api/orders/bidding', 'BiddingController', 'createBiddingOrder')
    ->middleware([AuthMiddleware::class]);

$router->get('/api/orders/{id}/bids', 'BiddingController', 'getOrderBids')
    ->middleware([AuthMiddleware::class]);

$router->put('/api/bids/{id}/accept', 'BiddingController', 'acceptBid')
    ->middleware([AuthMiddleware::class]);

// Routes prestataire - Créer offres et consulter commandes disponibles
$router->post('/api/bids', 'BiddingController', 'createBid')
    ->middleware([AuthMiddleware::class]);

$router->delete('/api/bids/{id}', 'BiddingController', 'withdrawBid')
    ->middleware([AuthMiddleware::class]);

$router->get('/api/provider/available-orders', 'BiddingController', 'getAvailableOrders')
    ->middleware([AuthMiddleware::class]);

$router->get('/api/provider/my-bids', 'BiddingController', 'getProviderBids')
    ->middleware([AuthMiddleware::class]);

// =====================================================
// ROUTES SYSTÈME DE PAIEMENT
// =====================================================
// Ajouté le 2025-11-24 - Phase 1 Fondations
// Commission GlamGo : 20% sur toutes les transactions

// Routes Client - Paiement
$router->post('/api/payment/validate-card', 'PaymentController', 'validateCard')
    ->middleware([AuthMiddleware::class]);

$router->post('/api/payment/process', 'PaymentController', 'processPayment')
    ->middleware([AuthMiddleware::class]);

$router->get('/api/payment/methods', 'PaymentController', 'getMethods')
    ->middleware([AuthMiddleware::class]);

$router->delete('/api/payment/methods/{id}', 'PaymentController', 'deleteMethod')
    ->middleware([AuthMiddleware::class]);

$router->get('/api/payment/transactions', 'PaymentController', 'getTransactions')
    ->middleware([AuthMiddleware::class]);

$router->get('/api/payment/transaction/{id}', 'PaymentController', 'getTransaction')
    ->middleware([AuthMiddleware::class]);

// Routes Prestataire - Paiement
$router->post('/api/provider/payment/bank-account', 'PaymentController', 'registerBankAccount')
    ->middleware([AuthMiddleware::class]);

$router->get('/api/provider/payment/earnings', 'PaymentController', 'getProviderEarnings')
    ->middleware([AuthMiddleware::class]);

// =====================================================
// ROUTES SYSTÈME D'ONBOARDING
// =====================================================
// Ajouté le 2025-11-25 - Phase 2 Questionnaires obligatoires
// Verrouillage et fiabilisation des engagements

// Statut onboarding (commun)
$router->get('/api/onboarding/status', 'OnboardingController', 'getOnboardingStatus')
    ->middleware([AuthMiddleware::class]);

// Routes Client - Onboarding
$router->get('/api/onboarding/client/data', 'OnboardingController', 'getClientData')
    ->middleware([AuthMiddleware::class]);

$router->post('/api/onboarding/client/submit', 'OnboardingController', 'submitClientOnboarding')
    ->middleware([AuthMiddleware::class]);

// Routes Prestataire - Onboarding
$router->get('/api/onboarding/provider/data', 'OnboardingController', 'getProviderData')
    ->middleware([AuthMiddleware::class]);

$router->post('/api/onboarding/provider/submit', 'OnboardingController', 'submitProviderOnboarding')
    ->middleware([AuthMiddleware::class]);

// =====================================================
// ROUTES SYSTÈME DE FORMULES DE SERVICES
// =====================================================
// Ajouté le 2025-11-27 - Tarification dynamique
// Formules: standard, recurring, premium, urgent, night

// Formules (routes publiques)
$router->get('/api/formulas', 'FormulaController', 'index');
$router->get('/api/services/{id}/formulas', 'FormulaController', 'getServiceFormulas');
$router->get('/api/services/{id}/price-preview', 'FormulaController', 'pricePreview');
$router->get('/api/formulas/rules/{id}', 'FormulaController', 'getSpecialRules');

// Calcul de prix (protégé)
$router->post('/api/pricing/calculate', 'FormulaController', 'calculatePrice')
    ->middleware([AuthMiddleware::class]);

// =====================================================
// ROUTES GÉOLOCALISATION PRESTATAIRES
// =====================================================
// Ajouté le 2025-11-27 - Recherche par proximité
// Algorithme Haversine avec optimisation bounding box

// Recherche prestataires à proximité (route publique)
$router->get('/api/services/{id}/nearby-providers', 'ServiceController', 'getNearbyProviders');

// Statistiques couverture (route publique)
$router->get('/api/services/{id}/coverage', 'ServiceController', 'getCoverage');

// =====================================================
// ROUTES SYSTÈME DE TARIFICATION NOCTURNE
// =====================================================
// Ajouté le 2025-11-28 - Commission interventions de nuit
// Définition nuit : 22h00 - 06h00
// Commission doublée si 2 nuits consécutives

// Routes publiques - Vérification frais de nuit
$router->post('/api/pricing/check-night', 'PricingController', 'checkNight');
$router->get('/api/pricing/check-night-quick', 'PricingController', 'checkNightQuick');
$router->get('/api/pricing/night-rates', 'PricingController', 'getNightRates');

// Routes admin - Gestion tarifs de nuit
$router->get('/api/admin/pricing/night-config', 'PricingController', 'getAdminNightConfig')
    ->middleware([AuthMiddleware::class]);
$router->put('/api/admin/pricing/night-rates', 'PricingController', 'updateNightRates')
    ->middleware([AuthMiddleware::class]);
$router->get('/api/admin/pricing/history', 'PricingController', 'getPricingHistory')
    ->middleware([AuthMiddleware::class]);

// =====================================================
// ROUTES SYSTÈME DE SATISFACTION POST-PRESTATION
// =====================================================
// Ajoute le 2025-11-28 - Workflow fin de prestation
// 1. Prestataire termine -> completed_pending_review
// 2. Client evalue (questionnaire obligatoire)
// 3. Validation = liberation paiement + commission GlamGo

// Routes Prestataire - Signaler fin de prestation
$router->post('/api/provider/orders/{id}/complete-service', 'SatisfactionController', 'markCompletedByProvider')
    ->middleware([AuthMiddleware::class]);

// Routes Client - Questionnaire satisfaction
$router->post('/api/orders/{id}/satisfaction', 'SatisfactionController', 'submitSatisfaction')
    ->middleware([AuthMiddleware::class]);

$router->get('/api/orders/{id}/satisfaction-status', 'SatisfactionController', 'getSatisfactionStatus')
    ->middleware([AuthMiddleware::class]);

$router->get('/api/user/pending-reviews', 'SatisfactionController', 'getPendingReviews')
    ->middleware([AuthMiddleware::class]);

// Routes Prestataire - Statistiques satisfaction
$router->get('/api/provider/satisfaction-stats', 'SatisfactionController', 'getProviderSatisfactionStats')
    ->middleware([AuthMiddleware::class]);

// Routes Publiques - Satisfaction prestataire
$router->get('/api/providers/{id}/satisfaction', 'SatisfactionController', 'getPublicProviderStats');

// Route Admin - Recalculer tous les ratings (temporaire)
$router->post('/api/admin/recalculate-ratings', 'SatisfactionController', 'recalculateAllRatings');

// =====================================================
// ROUTES SYSTEME D'URGENCE
// =====================================================
// Ajoute le 2025-12-02 - Signalement d'urgence client
// Permet aux clients de signaler un probleme pendant une prestation
// Option d'alerte police marocaine (19)

// Numeros d'urgence (public)
$router->get('/api/emergency/numbers', 'EmergencyController', 'getEmergencyNumbers');

// Signaler une urgence (client)
$router->post('/api/orders/{id}/emergency', 'EmergencyController', 'report')
    ->middleware([AuthMiddleware::class]);

// Historique des signalements (client)
$router->get('/api/user/emergency-reports', 'EmergencyController', 'getUserReports')
    ->middleware([AuthMiddleware::class]);

// Routes Admin - Gestion des signalements
$router->get('/api/admin/emergencies', 'EmergencyController', 'getAdminReports')
    ->middleware([AuthMiddleware::class]);
$router->patch('/api/admin/emergencies/{id}', 'EmergencyController', 'updateReport')
    ->middleware([AuthMiddleware::class]);


// =====================================================
// ROUTES SYSTEME DE PRIORITE ET BLOCAGE PRESTATAIRES
// =====================================================
// Ajoute le 2025-12-03 - Priorisation par notes
// Les prestataires bien notes recoivent les commandes en premier
// Blocage automatique si note < 2.5 ou avis consecutifs negatifs

// Routes Prestataire - Consulter sa priorite
$router->get('/api/provider/priority-status', 'ProviderPriorityController', 'getMyPriorityStatus')
    ->middleware([AuthMiddleware::class]);

$router->get('/api/provider/rating-history', 'ProviderPriorityController', 'getRatingHistoryEndpoint')
    ->middleware([AuthMiddleware::class]);

// Routes Admin - Gestion priorite et blocage
$router->get('/api/admin/providers/priority', 'ProviderPriorityController', 'getProvidersPriority')
    ->middleware([AuthMiddleware::class]);

$router->post('/api/admin/providers/{id}/block', 'ProviderPriorityController', 'blockProvider')
    ->middleware([AuthMiddleware::class]);

$router->post('/api/admin/providers/{id}/unblock', 'ProviderPriorityController', 'unblockProvider')
    ->middleware([AuthMiddleware::class]);

$router->get('/api/admin/providers/{id}/block-history', 'ProviderPriorityController', 'getBlockHistory')
    ->middleware([AuthMiddleware::class]);

$router->post('/api/admin/providers/check-ratings', 'ProviderPriorityController', 'checkAndBlockLowRated')
    ->middleware([AuthMiddleware::class]);

$router->get('/api/admin/providers/at-risk', 'ProviderPriorityController', 'getAtRiskProviders')
    ->middleware([AuthMiddleware::class]);

$router->post('/api/admin/providers/{id}/warning', 'ProviderPriorityController', 'sendWarning')
    ->middleware([AuthMiddleware::class]);

// Routes Systeme - Prestataires par priorite pour une commande
$router->get('/api/orders/{id}/providers-by-priority', 'ProviderPriorityController', 'getProvidersByPriorityForOrder')
    ->middleware([AuthMiddleware::class]);

