-- Function to add metadata column to a table
CREATE OR REPLACE FUNCTION add_metadata_column(table_name text)
RETURNS void AS $$
BEGIN
    EXECUTE format('
        ALTER TABLE %I 
        ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT ''{}''::jsonb;
    ', table_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 