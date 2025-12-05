-- =====================================================
-- Migration 016 : Creation table emergency_reports
-- Systeme de signalement d'urgence client
-- Date: 2025-12-02
-- =====================================================

-- Table des signalements d'urgence
CREATE TABLE IF NOT EXISTS emergency_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Lien avec la commande
    order_id INT NOT NULL,

    -- Utilisateur qui signale (client)
    user_id INT NOT NULL,

    -- Prestataire concerne
    provider_id INT NOT NULL,

    -- Raison du signalement
    reason ENUM('behavior', 'safety', 'service_issue', 'fraud', 'other') NOT NULL,
    reason_label VARCHAR(100) NOT NULL,

    -- Details supplementaires
    additional_info TEXT,

    -- Statut du signalement
    status ENUM('pending', 'in_review', 'resolved', 'dismissed') DEFAULT 'pending',

    -- Priorite
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'high',

    -- Agent support assigne
    assigned_to INT DEFAULT NULL,

    -- Resolution
    resolution_notes TEXT,
    resolved_at DATETIME DEFAULT NULL,

    -- Donnees de localisation au moment du signalement
    client_latitude DECIMAL(10, 8) DEFAULT NULL,
    client_longitude DECIMAL(11, 8) DEFAULT NULL,
    provider_latitude DECIMAL(10, 8) DEFAULT NULL,
    provider_longitude DECIMAL(11, 8) DEFAULT NULL,

    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Cles etrangeres
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,

    -- Index pour les recherches
    INDEX idx_emergency_order (order_id),
    INDEX idx_emergency_user (user_id),
    INDEX idx_emergency_provider (provider_id),
    INDEX idx_emergency_status (status),
    INDEX idx_emergency_priority (priority),
    INDEX idx_emergency_created (created_at)
);

-- Mapping des raisons pour l'affichage
-- behavior = Comportement inapproprie du prestataire
-- safety = Je ne me sens pas en securite
-- service_issue = Probleme grave avec le service
-- fraud = Tentative de fraude ou arnaque
-- other = Autre urgence

-- Verification
SELECT '=== TABLE EMERGENCY_REPORTS CREEE ===' as info;
DESCRIBE emergency_reports;
