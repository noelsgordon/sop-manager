-- Function to create the new departments table
CREATE OR REPLACE FUNCTION create_departments_table(table_name text, with_metadata boolean)
RETURNS void AS $$
BEGIN
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            name text NOT NULL,
            created_at timestamp with time zone DEFAULT now(),
            company_id uuid,
            metadata jsonb DEFAULT ''{}''::jsonb
        )', table_name);
END;
$$ LANGUAGE plpgsql;

-- Function to copy data from old departments table
CREATE OR REPLACE FUNCTION copy_departments_data()
RETURNS void AS $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'departments') THEN
        INSERT INTO departments_new (id, name, created_at, company_id, metadata)
        SELECT 
            COALESCE(id, gen_random_uuid()) as id,
            COALESCE(name, 'Unnamed Department') as name,
            COALESCE(created_at, now()) as created_at,
            company_id,
            COALESCE(metadata, '{}'::jsonb) as metadata
        FROM departments;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to finalize the departments table migration
CREATE OR REPLACE FUNCTION finalize_departments_table()
RETURNS void AS $$
BEGIN
    -- Drop the old table
    DROP TABLE IF EXISTS departments;

    -- Rename the new table
    ALTER TABLE departments_new RENAME TO departments;

    -- Add indexes
    CREATE INDEX IF NOT EXISTS idx_departments_company_id ON departments(company_id);
    CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);

    -- Add foreign key constraints to related tables
    ALTER TABLE sops
        DROP CONSTRAINT IF EXISTS sops_department_id_fkey,
        ADD CONSTRAINT sops_department_id_fkey 
        FOREIGN KEY (department_id) REFERENCES departments(id)
        ON DELETE CASCADE;

    ALTER TABLE user_departments
        DROP CONSTRAINT IF EXISTS user_departments_department_id_fkey,
        ADD CONSTRAINT user_departments_department_id_fkey 
        FOREIGN KEY (department_id) REFERENCES departments(id)
        ON DELETE CASCADE;

    ALTER TABLE invite_codes
        DROP CONSTRAINT IF EXISTS invite_codes_department_id_fkey,
        ADD CONSTRAINT invite_codes_department_id_fkey 
        FOREIGN KEY (department_id) REFERENCES departments(id)
        ON DELETE CASCADE;
END;
$$ LANGUAGE plpgsql;

-- Function to add soft delete functionality
CREATE OR REPLACE FUNCTION setup_soft_deletes()
RETURNS void AS $$
BEGIN
    -- Add deleted_at column to sops table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sops' 
        AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE sops ADD COLUMN deleted_at timestamp with time zone;
    END IF;

    -- Add deleted_at column to sop_steps table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sop_steps' 
        AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE sop_steps ADD COLUMN deleted_at timestamp with time zone;
    END IF;

    -- Create trigger function for soft deletes
    CREATE OR REPLACE FUNCTION soft_delete_trigger()
    RETURNS trigger AS $$
    BEGIN
        -- Instead of deleting, update the deleted_at timestamp
        UPDATE sops 
        SET deleted_at = CURRENT_TIMESTAMP 
        WHERE id = OLD.id;
        
        -- For sops table, also soft delete all associated steps
        IF TG_TABLE_NAME = 'sops' THEN
            UPDATE sop_steps 
            SET deleted_at = CURRENT_TIMESTAMP 
            WHERE sop_id = OLD.id;
        END IF;
        
        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;

    -- Create triggers for both tables
    DROP TRIGGER IF EXISTS soft_delete_sops ON sops;
    CREATE TRIGGER soft_delete_sops
        BEFORE DELETE ON sops
        FOR EACH ROW
        EXECUTE FUNCTION soft_delete_trigger();

    DROP TRIGGER IF EXISTS soft_delete_sop_steps ON sop_steps;
    CREATE TRIGGER soft_delete_sop_steps
        BEFORE DELETE ON sop_steps
        FOR EACH ROW
        EXECUTE FUNCTION soft_delete_trigger();

    -- Create function to restore soft deleted items
    CREATE OR REPLACE FUNCTION restore_sop(sop_id_param uuid)
    RETURNS void AS $$
    BEGIN
        -- Restore the SOP
        UPDATE sops
        SET deleted_at = NULL
        WHERE sops.id = sop_id_param;

        -- Restore all associated steps
        UPDATE sop_steps
        SET deleted_at = NULL
        WHERE sop_steps.sop_id = sop_id_param;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Grant execute permission to authenticated users
    GRANT EXECUTE ON FUNCTION restore_sop(uuid) TO authenticated;
END;
$$ LANGUAGE plpgsql; 