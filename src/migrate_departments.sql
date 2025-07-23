-- Begin transaction
BEGIN;

-- Create new departments table
CREATE TABLE departments_new (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    company_id uuid REFERENCES companies(id),
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Copy data from old table if it exists
DO $$
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
END $$;

-- Drop the old table
DROP TABLE IF EXISTS departments;

-- Rename the new table
ALTER TABLE departments_new RENAME TO departments;

-- Add indexes
CREATE INDEX idx_departments_company_id ON departments(company_id);
CREATE INDEX idx_departments_name ON departments(name);

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

-- Commit transaction
COMMIT; 