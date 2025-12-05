-- Migration: Système de notations et avis
-- Date: 2024

CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL UNIQUE,
    user_id INT NOT NULL,
    provider_id INT NOT NULL,
    rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NULL,
    service_quality TINYINT NULL CHECK (service_quality >= 1 AND service_quality <= 5),
    punctuality TINYINT NULL CHECK (punctuality >= 1 AND punctuality <= 5),
    professionalism TINYINT NULL CHECK (professionalism >= 1 AND professionalism <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    INDEX idx_provider_rating (provider_id, rating),
    INDEX idx_user_reviews (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ajouter colonne has_review dans orders pour savoir si une commande a été évaluée
-- Note: MySQL ne supporte pas IF NOT EXISTS pour ADD COLUMN, donc on ignore l'erreur si la colonne existe déjà
-- ALTER TABLE orders ADD COLUMN has_review BOOLEAN DEFAULT FALSE;

-- Mettre à jour la note moyenne du prestataire automatiquement
-- (sera géré par le code PHP pour plus de flexibilité)
