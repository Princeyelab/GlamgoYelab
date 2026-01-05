-- Migration: Add number_of_guests and pack columns to orders
-- Date: 2026-01-03

-- Add number_of_guests column to orders table (for chef service)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS number_of_guests INTEGER DEFAULT NULL;

-- Add pack columns to orders table (for coach service)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pack_id VARCHAR(50) DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pack_name VARCHAR(100) DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pack_sessions INTEGER DEFAULT NULL;

-- Add service_type and price_per_person to services table for chef logic
ALTER TABLE services ADD COLUMN IF NOT EXISTS service_type VARCHAR(50) DEFAULT 'standard';
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_per_person DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS min_guests INTEGER DEFAULT NULL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS max_guests INTEGER DEFAULT NULL;

-- Add packs JSON column to services table for coach logic
ALTER TABLE services ADD COLUMN IF NOT EXISTS packs JSONB DEFAULT NULL;

-- Add comments
COMMENT ON COLUMN orders.number_of_guests IS 'Number of guests for chef service';
COMMENT ON COLUMN orders.pack_id IS 'Pack ID for coach service';
COMMENT ON COLUMN orders.pack_name IS 'Pack name for coach service';
COMMENT ON COLUMN orders.pack_sessions IS 'Number of sessions in pack';
COMMENT ON COLUMN services.service_type IS 'Type of service: standard, chef, coach';
COMMENT ON COLUMN services.price_per_person IS 'Price per person for chef services';
COMMENT ON COLUMN services.packs IS 'JSON array of packs for coach services';
