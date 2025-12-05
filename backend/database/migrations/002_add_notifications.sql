-- Migration: Create notifications table
-- Date: 2025-11-16

CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Destinataire
    recipient_type ENUM('user', 'provider') NOT NULL,
    recipient_id INT NOT NULL,

    -- Contexte
    order_id INT NULL,
    notification_type VARCHAR(50) NOT NULL,

    -- Contenu
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,

    -- Données supplémentaires (JSON)
    data JSON NULL,

    -- Statut
    is_read BOOLEAN DEFAULT FALSE,
    read_at DATETIME NULL,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Index pour performance
    INDEX idx_recipient (recipient_type, recipient_id),
    INDEX idx_order_id (order_id),
    INDEX idx_notification_type (notification_type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Types de notifications:
-- new_order: Nouvelle commande disponible (pour prestataires)
-- order_accepted: Commande acceptée (pour client)
-- order_on_way: Prestataire en route (pour client)
-- order_in_progress: Service en cours (pour client)
-- order_completed: Service terminé (pour les deux)
-- order_cancelled: Commande annulée (pour les deux)
-- new_message: Nouveau message (pour les deux)
