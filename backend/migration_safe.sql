-- Tables payment
CREATE TABLE IF NOT EXISTS transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    user_id INT NOT NULL,
    provider_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    commission_glamgo DECIMAL(10,2) NOT NULL,
    provider_amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('card', 'cash') NOT NULL,
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    card_last4 VARCHAR(4),
    card_brand VARCHAR(20),
    payment_gateway_id VARCHAR(255),
    payment_gateway_response JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    INDEX idx_order_id (order_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payment_methods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    provider_id INT,
    card_last4 VARCHAR(4),
    card_brand VARCHAR(20),
    card_exp_month INT,
    card_exp_year INT,
    card_token VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payment_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_id INT,
    action VARCHAR(50),
    status VARCHAR(20),
    details JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payment_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) UNIQUE,
    config_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO payment_config (config_key, config_value, description) VALUES
('commission_percentage', '20', 'Commission GlamGo'),
('mock_mode', '1', 'Mode simulation'),
('gateway_provider', 'mock', 'Passerelle de paiement');

SELECT 'Migration terminée !' AS status;
