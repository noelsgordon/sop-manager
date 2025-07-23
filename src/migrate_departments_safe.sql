-- Safe migration script for departments restructuring
BEGIN;

-- 1. Create temporary table for existing departments
CREATE TABLE departments_backup AS 
SELECT * FROM departments;

-- 2. Create temporary table for companies data
CREATE TABLE companies_temp AS 
SELECT 
    id,
    name,
    created_at,
    metadata
FROM companies;

-- 3. Drop existing departments table and its dependencies
ALTER TABLE sops
    DROP CONSTRAINT IF EXISTS sops_department_id_fkey;
ALTER TABLE user_departments
    DROP CONSTRAINT IF EXISTS user_departments_department_id_fkey;
ALTER TABLE invite_codes
    DROP CONSTRAINT IF EXISTS invite_codes_department_id_fkey;
DROP TABLE departments;

-- 4. Create new departments table with updated structure
CREATE TABLE departments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    company_id uuid REFERENCES companies(id),
    metadata jsonb DEFAULT '{}'::jsonb
);

-- 5. Migrate data from backup
INSERT INTO departments (id, name, created_at, metadata)
SELECT 
    id,
    name,
    created_at,
    COALESCE(metadata, '{}'::jsonb)
FROM departments_backup;

-- 6. Migrate companies data to departments
INSERT INTO departments (name, created_at, company_id, metadata)
SELECT 
    name,
    created_at,
    id as company_id,
    metadata
FROM companies_temp;

-- 7. Restore foreign key constraints
ALTER TABLE sops
    ADD CONSTRAINT sops_department_id_fkey 
    FOREIGN KEY (department_id) REFERENCES departments(id)
    ON DELETE CASCADE;

ALTER TABLE user_departments
    ADD CONSTRAINT user_departments_department_id_fkey 
    FOREIGN KEY (department_id) REFERENCES departments(id)
    ON DELETE CASCADE;

ALTER TABLE invite_codes
    ADD CONSTRAINT invite_codes_department_id_fkey 
    FOREIGN KEY (department_id) REFERENCES departments(id)
    ON DELETE CASCADE;

-- 8. Create indexes
CREATE INDEX idx_departments_company_id ON departments(company_id);
CREATE INDEX idx_departments_name ON departments(name);

-- 9. Clean up temporary tables
DROP TABLE departments_backup;
DROP TABLE companies_temp;

-- 10. Verify data integrity
DO $$
DECLARE
    dept_count int;
    sop_orphans int;
    user_dept_orphans int;
    invite_orphans int;
BEGIN
    -- Check department count
    SELECT COUNT(*) INTO dept_count FROM departments;
    RAISE NOTICE 'Total departments after migration: %', dept_count;
    
    -- Check for orphaned records
    SELECT COUNT(*) INTO sop_orphans 
    FROM sops s 
    LEFT JOIN departments d ON s.department_id = d.id 
    WHERE d.id IS NULL;
    RAISE NOTICE 'Orphaned SOPs: %', sop_orphans;
    
    SELECT COUNT(*) INTO user_dept_orphans 
    FROM user_departments ud 
    LEFT JOIN departments d ON ud.department_id = d.id 
    WHERE d.id IS NULL;
    RAISE NOTICE 'Orphaned user_departments: %', user_dept_orphans;
    
    SELECT COUNT(*) INTO invite_orphans 
    FROM invite_codes ic 
    LEFT JOIN departments d ON ic.department_id = d.id 
    WHERE d.id IS NULL;
    RAISE NOTICE 'Orphaned invite_codes: %', invite_orphans;
    
    -- Raise exception if any orphans found
    IF (sop_orphans + user_dept_orphans + invite_orphans) > 0 THEN
        RAISE EXCEPTION 'Data integrity check failed: Found orphaned records';
    END IF;
END $$;

COMMIT; 