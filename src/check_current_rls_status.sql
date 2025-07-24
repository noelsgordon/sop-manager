-- Check Current RLS Status and Active Policies
-- Run this to see what's currently active in your database

-- =====================================================
-- STEP 1: Check which tables have RLS enabled
-- =====================================================

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN 'RLS ENABLED'
        ELSE 'RLS DISABLED'
    END as status
FROM pg_tables 
WHERE tablename IN ('user_profiles', 'user_departments', 'departments', 'invite_codes', 'sops', 'sop_steps')
ORDER BY tablename;

-- =====================================================
-- STEP 2: Check all active RLS policies
-- =====================================================

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'user_departments', 'departments', 'invite_codes', 'sops', 'sop_steps')
ORDER BY tablename, policyname;

-- =====================================================
-- STEP 3: Count policies per table
-- =====================================================

SELECT 
    tablename,
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ') as policy_names
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'user_departments', 'departments', 'invite_codes', 'sops', 'sop_steps')
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- STEP 4: Test basic access to each table
-- =====================================================

-- Test invite_codes access
SELECT 'invite_codes' as table_name, COUNT(*) as record_count FROM invite_codes;

-- Test departments access
SELECT 'departments' as table_name, COUNT(*) as record_count FROM departments;

-- Test user_profiles access
SELECT 'user_profiles' as table_name, COUNT(*) as record_count FROM user_profiles;

-- Test user_departments access
SELECT 'user_departments' as table_name, COUNT(*) as record_count FROM user_departments;

-- Test sops access
SELECT 'sops' as table_name, COUNT(*) as record_count FROM sops;

-- Test sop_steps access
SELECT 'sop_steps' as table_name, COUNT(*) as record_count FROM sop_steps; 