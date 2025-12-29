-- Migration: Create emergency_reports table
-- Permet aux clients et prestataires de signaler des urgences

CREATE TABLE IF NOT EXISTS emergency_reports (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    reporter_type VARCHAR(20) DEFAULT 'client',
    reason VARCHAR(50) NOT NULL,
    reason_label VARCHAR(255),
    additional_info TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    client_latitude DECIMAL(10, 8),
    client_longitude DECIMAL(11, 8),
    provider_latitude DECIMAL(10, 8),
    provider_longitude DECIMAL(11, 8),
    police_notified BOOLEAN DEFAULT FALSE,
    police_notified_at TIMESTAMP,
    resolution_notes TEXT,
    assigned_to VARCHAR(100),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_emergency_reports_order ON emergency_reports(order_id);
CREATE INDEX IF NOT EXISTS idx_emergency_reports_user ON emergency_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_reports_status ON emergency_reports(status);
CREATE INDEX IF NOT EXISTS idx_emergency_reports_priority ON emergency_reports(priority);

COMMENT ON TABLE emergency_reports IS 'Signalements d urgence pendant les prestations';
COMMENT ON COLUMN emergency_reports.reporter_type IS 'Qui a signale: client ou provider';
