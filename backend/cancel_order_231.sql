-- Annulation forcée de la commande #231 bloquée
-- Exécuter ce script dans phpMyAdmin ou votre client MySQL

-- 1. Annuler la commande
UPDATE orders
SET status = 'cancelled',
    cancelled_at = NOW(),
    cancelled_by = 'admin',
    cancellation_reason = 'Commande bloquée en statut arrived - annulation forcée par admin'
WHERE id = 231;

-- 2. Créer notification pour le client
INSERT INTO notifications (user_id, type, title, message, created_at)
SELECT
    user_id,
    'order_cancelled',
    'Commande annulée',
    'Votre commande #231 a été annulée par l\'équipe GlamGo en raison d\'un problème technique. Vous pouvez créer une nouvelle réservation.',
    NOW()
FROM orders
WHERE id = 231 AND user_id IS NOT NULL;

-- 3. Créer notification pour le prestataire
INSERT INTO notifications (user_id, type, title, message, created_at)
SELECT
    provider_id,
    'order_cancelled',
    'Commande annulée',
    'La commande #231 a été annulée par l\'équipe GlamGo. Vous êtes maintenant disponible pour accepter d\'autres commandes.',
    NOW()
FROM orders
WHERE id = 231 AND provider_id IS NOT NULL;

-- 4. Vérification
SELECT
    id,
    status,
    cancelled_at,
    cancelled_by,
    cancellation_reason
FROM orders
WHERE id = 231;
