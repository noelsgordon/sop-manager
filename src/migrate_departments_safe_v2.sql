-- Safe migration script for departments restructuring V2
BEGIN;

-- 1. Create backup of current data
CREATE TABLE departments_backup AS 
SELECT * FROM departments;

-- 2. Add metadata column to departments if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'departments' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE departments ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 3. Create temporary table for companies data
CREATE TABLE companies_temp AS 
SELECT 
    id,
    name,
    created_at,
    metadata
FROM companies;

-- 4. Insert companies as top-level departments
INSERT INTO departments (name, created_at, company_id, metadata)
SELECT 
    name,
    created_at,
    id as company_id,
    metadata
FROM companies_temp
WHERE id NOT IN (
    SELECT DISTINCT company_id 
    FROM departments 
    WHERE company_id IS NOT NULL
);

-- 5. Create indexes if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'departments'
        AND indexname = 'idx_departments_company_id'
    ) THEN
        CREATE INDEX idx_departments_company_id ON departments(company_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'departments'
        AND indexname = 'idx_departments_name'
    ) THEN
        CREATE INDEX idx_departments_name ON departments(name);
    END IF;
END $$;

-- 6. Verify data integrity
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

-- 7. Clean up temporary tables
DROP TABLE companies_temp;

COMMIT; 