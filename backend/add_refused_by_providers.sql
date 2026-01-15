-- Add refused_by_providers column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refused_by_providers JSONB DEFAULT '[]';

-- Add comment for documentation
COMMENT ON COLUMN orders.refused_by_providers IS 'JSON array of provider IDs who refused this order';
