-- Function to add metadata column to departments table
CREATE OR REPLACE FUNCTION alter_departments_add_metadata()
RETURNS void AS $$
BEGIN
    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'departments' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE departments ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
    END IF;
END;
$$ LANGUAGE plpgsql; 