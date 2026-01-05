-- =====================================================
-- Migration 015: Provider Diplomas Table
-- GlamGo - Table pour stocker les diplômes par catégorie
-- =====================================================

-- Table des diplômes des prestataires
CREATE TABLE IF NOT EXISTS provider_diplomas (
    id SERIAL PRIMARY KEY,
    provider_id INT NOT NULL,
    category_slug VARCHAR(50) NOT NULL DEFAULT 'general',
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP DEFAULT NULL,
    verified_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(provider_id, category_slug),
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_provider_diplomas_provider ON provider_diplomas(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_diplomas_category ON provider_diplomas(category_slug);
CREATE INDEX IF NOT EXISTS idx_provider_diplomas_verified ON provider_diplomas(is_verified);
