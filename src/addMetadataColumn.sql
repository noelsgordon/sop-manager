-- Add metadata column to departments table
ALTER TABLE departments ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Update existing rows to have default metadata
UPDATE departments SET metadata = '{}' WHERE metadata IS NULL; 