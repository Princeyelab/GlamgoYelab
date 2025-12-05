-- MIGRATION 005 : Système d'enchères (version simplifiée)
START TRANSACTION;

-- Table des offres
CREATE TABLE IF NOT EXISTS bids (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    provider_id INT NOT NULL,
    proposed_price DECIMAL(10, 2) NOT NULL,
    estimated_arrival_minutes INT NULL,
    message TEXT NULL,
    status ENUM('pending', 'accepted', 'rejected', 'withdrawn', 'expired') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    INDEX idx_order_status (order_id, status),
    INDEX idx_provider_status (provider_id, status),
    UNIQUE KEY unique_provider_order (provider_id, order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des négociations
CREATE TABLE IF NOT EXISTS negotiations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bid_id INT NOT NULL,
    order_id INT NOT NULL,
    actor_type ENUM('user', 'provider') NOT NULL,
    actor_id INT NOT NULL,
    action_type ENUM('counter_offer', 'message', 'price_adjustment') NOT NULL,
    previous_price DECIMAL(10, 2) NULL,
    new_price DECIMAL(10, 2) NULL,
    message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bid_id) REFERENCES bids(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_bid_id (bid_id),
    INDEX idx_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des statistiques prestataires
CREATE TABLE IF NOT EXISTS provider_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL UNIQUE,
    total_bids INT DEFAULT 0,
    accepted_bids INT DEFAULT 0,
    rejected_bids INT DEFAULT 0,
    acceptance_rate DECIMAL(5, 2) DEFAULT 0.00,
    avg_bid_price DECIMAL(10, 2) DEFAULT 0.00,
    last_bid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Modification table orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pricing_mode ENUM('fixed', 'bidding') DEFAULT 'fixed' AFTER status;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_proposed_price DECIMAL(10, 2) NULL AFTER pricing_mode;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS accepted_bid_id INT NULL AFTER user_proposed_price;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bid_expiry_time TIMESTAMP NULL AFTER accepted_bid_id;

-- Modification table services
ALTER TABLE services ADD COLUMN IF NOT EXISTS allow_bidding BOOLEAN DEFAULT TRUE AFTER is_active;
ALTER TABLE services ADD COLUMN IF NOT EXISTS min_suggested_price DECIMAL(10, 2) NULL AFTER allow_bidding;
ALTER TABLE services ADD COLUMN IF NOT EXISTS max_suggested_price DECIMAL(10, 2) NULL AFTER min_suggested_price;

-- Initialiser fourchettes de prix
UPDATE services
SET min_suggested_price = ROUND(price * 0.80, 2),
    max_suggested_price = ROUND(price * 1.20, 2)
WHERE min_suggested_price IS NULL AND max_suggested_price IS NULL;

-- Initialiser provider_stats pour prestataires existants
INSERT IGNORE INTO provider_stats (provider_id, created_at)
SELECT id, NOW() FROM providers;

COMMIT;

SELECT 'Migration 005 terminée avec succès!' AS message;
