-- =====================================================
-- Migration 009 : Système d'onboarding
-- Questionnaires obligatoires clients et prestataires
-- =====================================================

-- Table données onboarding clients
CREATE TABLE IF NOT EXISTS user_onboarding_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,

    -- Adresse
    main_address TEXT NOT NULL,
    address_latitude DECIMAL(10, 8),
    address_longitude DECIMAL(11, 8),

    -- Préférences
    intervention_radius INT DEFAULT 10 COMMENT 'Rayon en km',
    preferred_services JSON COMMENT 'IDs des services préférés',
    availability_schedule JSON COMMENT 'Planning disponibilités',
    preferred_payment_method ENUM('card', 'cash') DEFAULT 'card',

    -- Validation
    terms_accepted BOOLEAN DEFAULT FALSE,
    privacy_accepted BOOLEAN DEFAULT FALSE,

    -- Métadonnées
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_user_id (user_id),
    INDEX idx_completed (completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table données onboarding prestataires
CREATE TABLE IF NOT EXISTS provider_onboarding_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    provider_id INT NOT NULL UNIQUE,

    -- Zone intervention
    intervention_zone_radius INT NOT NULL COMMENT 'Rayon intervention en km',
    intervention_center_lat DECIMAL(10, 8),
    intervention_center_lng DECIMAL(11, 8),

    -- Services et tarifs
    services_offered JSON NOT NULL COMMENT 'IDs services + tarifs personnalisés',
    availability_schedule JSON NOT NULL COMMENT 'Planning hebdomadaire',
    accepted_formulas JSON COMMENT 'Formules acceptées: standard, recurring, premium, urgent, night',

    -- Documents
    documents_uploaded JSON COMMENT 'URLs des documents uploadés',
    cin_number VARCHAR(20),
    cin_front_url VARCHAR(255),
    cin_back_url VARCHAR(255),
    justificatif_domicile_url VARCHAR(255),
    other_documents JSON,

    -- Validation
    charter_accepted BOOLEAN DEFAULT FALSE,
    admin_validated BOOLEAN DEFAULT FALSE COMMENT 'Validation manuelle admin',
    admin_validation_date TIMESTAMP NULL,
    admin_notes TEXT,

    -- Métadonnées
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,

    INDEX idx_provider_id (provider_id),
    INDEX idx_completed (completed_at),
    INDEX idx_admin_validated (admin_validated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ajouter colonnes dans users (si elles n'existent pas déjà)
ALTER TABLE users
ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE
COMMENT 'Questionnaire onboarding complété';

ALTER TABLE users
ADD COLUMN onboarding_completed_at TIMESTAMP NULL;

-- Ajouter colonnes dans providers (si elles n'existent pas déjà)
ALTER TABLE providers
ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;

ALTER TABLE providers
ADD COLUMN onboarding_completed_at TIMESTAMP NULL;

ALTER TABLE providers
ADD COLUMN account_status ENUM('pending', 'active', 'suspended', 'rejected') DEFAULT 'pending'
COMMENT 'Statut du compte prestataire';

-- Index pour performances
CREATE INDEX idx_user_onboarding ON users(onboarding_completed);
CREATE INDEX idx_provider_onboarding ON providers(onboarding_completed, account_status);
