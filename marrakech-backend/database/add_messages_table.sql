-- =====================================================
-- Table des messages de chat
-- Permet la communication entre utilisateurs et prestataires
-- avec traduction automatique
-- =====================================================

CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL COMMENT 'Commande liée à cette conversation',
    sender_type ENUM('user', 'provider') NOT NULL COMMENT 'Type d\'expéditeur',
    sender_id INT NOT NULL COMMENT 'ID de l\'expéditeur (user_id ou provider_id)',
    content TEXT NOT NULL COMMENT 'Message original',
    translated_content TEXT NULL COMMENT 'Message traduit automatiquement',
    target_lang VARCHAR(5) DEFAULT 'fr' COMMENT 'Langue cible (fr, en, ar, etc.)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_sender (sender_type, sender_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT = 'Messages de chat entre utilisateurs et prestataires avec traduction';
