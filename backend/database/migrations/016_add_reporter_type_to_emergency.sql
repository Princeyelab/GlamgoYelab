-- Migration: Ajouter reporter_type à emergency_reports
-- Permet de savoir qui (client ou prestataire) a fait le signalement

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'emergency_reports'
        AND column_name = 'reporter_type'
    ) THEN
        ALTER TABLE emergency_reports
        ADD COLUMN reporter_type VARCHAR(20) DEFAULT 'client';

        COMMENT ON COLUMN emergency_reports.reporter_type IS 'Qui a fait le signalement: client ou provider';
    END IF;
END $$;
