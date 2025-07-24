-- Debug sops and sop_steps RLS issues (FIXED VERSION)
-- Let's find out why they're only passing 1/3 tests

-- =====================================================
-- STEP 1: Check current RLS status
-- =====================================================

SELECT 
    tablename,
    CASE 
        WHEN rowsecurity = true THEN 'RLS ENABLED'
        ELSE 'RLS DISABLED'
    END as rls_status
FROM pg_tables 
WHERE tablename IN ('sops', 'sop_steps')
ORDER BY tablename;

-- =====================================================
-- STEP 2: Check existing policies
-- =====================================================

SELECT 
    tablename,
    policyname,
    cmd as operation,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies 
WHERE tablename IN ('sops', 'sop_steps')
ORDER BY tablename, policyname;

-- =====================================================
-- STEP 3: Check table structure (ACTUAL COLUMNS)
-- =====================================================

-- Check sops table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sops' 
ORDER BY ordinal_position;

-- Check sop_steps table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sop_steps' 
ORDER BY ordinal_position;

-- =====================================================
-- STEP 4: Check current data (USING ACTUAL COLUMNS)
-- =====================================================

-- Check sops data (using actual columns)
SELECT 
    id,
    name,
    department_id,
    created_by,
    created_at
FROM sops 
ORDER BY created_at DESC 
LIMIT 5;

-- Check sop_steps data (using actual columns)
SELECT 
    id,
    sop_id,
    step_number,
    instruction,
    created_at
FROM sop_steps 
ORDER BY created_at DESC 
LIMIT 5;

-- =====================================================
-- STEP 5: Test current access
-- =====================================================

-- Test sops access
SELECT 'sops' as table_name, COUNT(*) as record_count FROM sops;

-- Test sop_steps access
SELECT 'sop_steps' as table_name, COUNT(*) as record_count FROM sop_steps; 