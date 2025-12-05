INSERT INTO notifications (recipient_type, recipient_id, notification_type, title, message, is_read) 
SELECT 
    'provider',
    p.id,
    'new_order',
    'Nouvelle commande disponible',
    'Une nouvelle commande pour Coiffure homme est disponible.',
    FALSE
FROM providers p 
WHERE p.is_verified = TRUE 
LIMIT 1;

INSERT INTO notifications (recipient_type, recipient_id, notification_type, title, message, is_read) 
SELECT 
    'provider',
    p.id,
    'new_message',
    'Nouveau message',
    'Vous avez reçu un nouveau message d un client.',
    FALSE
FROM providers p 
WHERE p.is_verified = TRUE 
LIMIT 1;

INSERT INTO notifications (recipient_type, recipient_id, notification_type, title, message, is_read) 
SELECT 
    'provider',
    p.id,
    'order_completed',
    'Service terminé',
    'Félicitations ! Votre service a été marqué comme terminé.',
    FALSE
FROM providers p 
WHERE p.is_verified = TRUE 
LIMIT 1;
