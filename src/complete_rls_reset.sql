-- Complete RLS Reset and Fresh Implementation
-- This will clean everything and start fresh

-- =====================================================
-- STEP 1: Disable RLS on all tables
-- =====================================================

ALTER TABLE invite_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE sops DISABLE ROW LEVEL SECURITY;
ALTER TABLE sop_steps DISABLE ROW LEVEL SECURITY;
ALTER TABLE role_definitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: Drop ALL existing policies (clean slate)
-- =====================================================

-- Drop invite_codes policies
DROP POLICY IF EXISTS "Allow anyone to check invite code" ON invite_codes;
DROP POLICY IF EXISTS "Allow creators to delete their invites" ON invite_codes;
DROP POLICY IF EXISTS "Allow creators to insert invites" ON invite_codes;
DROP POLICY IF EXISTS "Allow creators to view their invites" ON invite_codes;
DROP POLICY IF EXISTS "Allow invite creator to manage their codes" ON invite_codes;
DROP POLICY IF EXISTS "Allow public lookup of invite codes" ON invite_codes;
DROP POLICY IF EXISTS "invite_codes_delete_policy" ON invite_codes;
DROP POLICY IF EXISTS "invite_codes_insert_policy" ON invite_codes;
DROP POLICY IF EXISTS "invite_codes_select_policy" ON invite_codes;
DROP POLICY IF EXISTS "invite_codes_update_policy" ON invite_codes;

-- Drop user_profiles policies
DROP POLICY IF EXISTS "user_profiles_delete_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_superadmin_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_policy" ON user_profiles;

-- Drop user_departments policies
DROP POLICY IF EXISTS "user_departments_delete_policy" ON user_departments;
DROP POLICY IF EXISTS "user_departments_insert_policy" ON user_departments;
DROP POLICY IF EXISTS "user_departments_select_policy" ON user_departments;
DROP POLICY IF EXISTS "user_departments_update_policy" ON user_departments;

-- Drop sops policies
DROP POLICY IF EXISTS "Allow select" ON sops;
DROP POLICY IF EXISTS "Delete" ON sops;
DROP POLICY IF EXISTS "Update" ON sops;
DROP POLICY IF EXISTS "Users can access their company's SOPs" ON sops;
DROP POLICY IF EXISTS "allow inserts for everyone" ON sops;
DROP POLICY IF EXISTS "sops_delete_policy" ON sops;
DROP POLICY IF EXISTS "sops_insert_policy" ON sops;
DROP POLICY IF EXISTS "sops_restore_policy" ON sops;
DROP POLICY IF EXISTS "sops_select_policy" ON sops;
DROP POLICY IF EXISTS "sops_update_policy" ON sops;
DROP POLICY IF EXISTS "sops_view_deleted_policy" ON sops;

-- Drop sop_steps policies
DROP POLICY IF EXISTS "sop_steps_delete_policy" ON sop_steps;
DROP POLICY IF EXISTS "sop_steps_insert_policy" ON sop_steps;
DROP POLICY IF EXISTS "sop_steps_select_policy" ON sop_steps;
DROP POLICY IF EXISTS "sop_steps_update_policy" ON sop_steps;

-- Drop departments policies
DROP POLICY IF EXISTS "Only superadmins can manage departments" ON departments;
DROP POLICY IF EXISTS "Users can view departments" ON departments;
DROP POLICY IF EXISTS "departments_delete_policy" ON departments;
DROP POLICY IF EXISTS "departments_insert_policy" ON departments;
DROP POLICY IF EXISTS "departments_select_policy" ON departments;
DROP POLICY IF EXISTS "departments_update_policy" ON departments;

-- Drop role_definitions policies
DROP POLICY IF EXISTS "role_definitions_manage_policy" ON role_definitions;
DROP POLICY IF EXISTS "role_definitions_select_policy" ON role_definitions;

-- =====================================================
-- STEP 3: Verify clean state
-- =====================================================

-- Check RLS status (should all be disabled)
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity = true THEN 'RLS ENABLED'
        ELSE 'RLS DISABLED'
    END as rls_status
FROM pg_tables 
WHERE tablename IN ('invite_codes', 'user_profiles', 'user_departments', 'sops', 'sop_steps', 'role_definitions', 'departments')
ORDER BY tablename;

-- Check policies (should be none)
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('invite_codes', 'user_profiles', 'user_departments', 'sops', 'sop_steps', 'role_definitions', 'departments')
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- STEP 4: Test access (should work without restrictions)
-- =====================================================

-- Test all tables access
SELECT 'invite_codes' as table_name, COUNT(*) as record_count FROM invite_codes
UNION ALL
SELECT 'user_profiles' as table_name, COUNT(*) as record_count FROM user_profiles
UNION ALL
SELECT 'user_departments' as table_name, COUNT(*) as record_count FROM user_departments
UNION ALL
SELECT 'sops' as table_name, COUNT(*) as record_count FROM sops
UNION ALL
SELECT 'sop_steps' as table_name, COUNT(*) as record_count FROM sop_steps
UNION ALL
SELECT 'departments' as table_name, COUNT(*) as record_count FROM departments; 