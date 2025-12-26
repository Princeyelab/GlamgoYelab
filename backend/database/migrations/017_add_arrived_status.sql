-- Migration: Ajouter le statut 'arrived' pour la confirmation d'arrivée du prestataire
-- Date: 2024-12-26

-- Modifier l'ENUM du statut pour inclure 'arrived'
ALTER TABLE orders MODIFY COLUMN status ENUM(
    'pending',
    'accepted',
    'on_way',
    'arrived',      -- Nouveau: prestataire arrivé, en attente de confirmation client
    'in_progress',
    'completed',
    'cancelled'
) DEFAULT 'pending';

-- Ajouter la colonne arrived_at pour tracer le moment d'arrivée (optionnel)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMP NULL DEFAULT NULL AFTER started_at;
