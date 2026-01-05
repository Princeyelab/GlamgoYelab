-- =====================================================
-- Migration 015: Optimization des requetes frequentes
-- GlamGo - Index pour ameliorer les performances
-- =====================================================

-- Description:
-- Cette migration ajoute des index composites pour optimiser
-- les requetes les plus frequentes identifiees dans les modeles.

-- =====================================================
-- 1. INDEX ORDERS
-- =====================================================

-- Index composite pour recherche commandes prestataire par statut
-- Utilise par: getProviderOrders(), hasActiveOrder()
CREATE INDEX IF NOT EXISTS idx_orders_provider_status ON orders(provider_id, status);

-- Index composite pour commandes en attente (sans prestataire)
-- Utilise par: getProviderOrders() pour commandes disponibles
CREATE INDEX IF NOT EXISTS idx_orders_pending_available ON orders(status, provider_id) WHERE status = 'pending';

-- Index sur service_id pour jointures
-- Utilise par: getPendingOrdersForService()
CREATE INDEX IF NOT EXISTS idx_orders_service_id ON orders(service_id);

-- Index sur custom_service_id pour services personnalises
CREATE INDEX IF NOT EXISTS idx_orders_custom_service_id ON orders(custom_service_id);

-- Index sur address_id pour jointures rapides
CREATE INDEX IF NOT EXISTS idx_orders_address_id ON orders(address_id);

-- Index composite pour statuts actifs (requetes frequentes)
-- Utilise par: hasActiveOrder() pour verifier si prestataire occupe
CREATE INDEX IF NOT EXISTS idx_orders_active_status ON orders(provider_id, status)
WHERE status IN ('accepted', 'on_way', 'arrived', 'in_progress');

-- Index pour mode enchere
CREATE INDEX IF NOT EXISTS idx_orders_pricing_mode ON orders(pricing_mode) WHERE pricing_mode = 'bidding';

-- =====================================================
-- 2. INDEX REVIEWS
-- =====================================================

-- Index sur provider_id pour calcul note moyenne
-- Utilise par: updateRating()
CREATE INDEX IF NOT EXISTS idx_reviews_provider_id ON reviews(provider_id);

-- Index sur user_id pour historique avis utilisateur
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- Index composite pour note moyenne
CREATE INDEX IF NOT EXISTS idx_reviews_provider_rating ON reviews(provider_id, rating);

-- =====================================================
-- 3. INDEX NOTIFICATIONS
-- =====================================================

-- Index composite pour notifications non lues utilisateur
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Index composite pour notifications non lues prestataire
CREATE INDEX IF NOT EXISTS idx_notifications_provider_unread ON notifications(provider_id, is_read) WHERE is_read = FALSE;

-- Index sur type pour filtrage
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- =====================================================
-- 4. INDEX MESSAGES
-- =====================================================

-- Index pour messages non lus par commande
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(order_id, is_read) WHERE is_read = FALSE;

-- Index composite pour recherche de messages
CREATE INDEX IF NOT EXISTS idx_messages_order_sender ON messages(order_id, sender_type, sender_id);

-- =====================================================
-- 5. INDEX PROVIDER_SERVICES
-- =====================================================

-- Index deja existant mais s'assurer qu'il est optimal
CREATE INDEX IF NOT EXISTS idx_provider_services_composite ON provider_services(provider_id, service_id);

-- =====================================================
-- 6. INDEX PROVIDER_CUSTOM_SERVICES
-- =====================================================

-- Index sur provider_id pour services personnalises
CREATE INDEX IF NOT EXISTS idx_provider_custom_services_provider ON provider_custom_services(provider_id);

-- Index sur category_id
CREATE INDEX IF NOT EXISTS idx_provider_custom_services_category ON provider_custom_services(category_id);

-- =====================================================
-- 7. INDEX BIDS (systeme encheres)
-- =====================================================

-- Index composite pour statut des encheres
CREATE INDEX IF NOT EXISTS idx_bids_status ON bids(status) WHERE status = 'pending';

-- Index composite pour recherche par commande et statut
CREATE INDEX IF NOT EXISTS idx_bids_order_status ON bids(order_id, status);

-- =====================================================
-- 8. INDEX LOCATION_TRACKING
-- =====================================================

-- Index sur provider_id pour historique
CREATE INDEX IF NOT EXISTS idx_location_tracking_provider ON location_tracking(provider_id);

-- Index composite pour derniere position
CREATE INDEX IF NOT EXISTS idx_location_tracking_recent ON location_tracking(order_id, created_at DESC);

-- =====================================================
-- 9. ANALYSE TABLES (PostgreSQL)
-- =====================================================

-- Mettre a jour les statistiques pour l'optimiseur de requetes
ANALYZE orders;
ANALYZE providers;
ANALYZE reviews;
ANALYZE notifications;
ANALYZE messages;
ANALYZE provider_services;
ANALYZE bids;
ANALYZE location_tracking;
