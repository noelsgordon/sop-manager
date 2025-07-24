-- Enable RLS on tables that have policies but RLS is disabled
-- Run this to activate the existing policies

-- =====================================================
-- STEP 1: Enable RLS on all tables that have policies
-- =====================================================

ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_definitions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: Verify RLS is now enabled
-- =====================================================

SELECT 
    tablename,
    CASE 
        WHEN rowsecurity = true THEN 'RLS ENABLED'
        ELSE 'RLS DISABLED'
    END as rls_status
FROM pg_tables 
WHERE tablename IN ('invite_codes', 'user_profiles', 'user_departments', 'sops', 'sop_steps', 'role_definitions')
ORDER BY tablename;

-- =====================================================
-- STEP 3: Test access to verify policies work
-- =====================================================

-- Test invite_codes access
SELECT 'invite_codes' as table_name, COUNT(*) as record_count FROM invite_codes;

-- Test user_profiles access
SELECT 'user_profiles' as table_name, COUNT(*) as record_count FROM user_profiles;

-- Test user_departments access
SELECT 'user_departments' as table_name, COUNT(*) as record_count FROM user_departments;

-- Test sops access
SELECT 'sops' as table_name, COUNT(*) as record_count FROM sops;

-- Test sop_steps access
SELECT 'sop_steps' as table_name, COUNT(*) as record_count FROM sop_steps; 