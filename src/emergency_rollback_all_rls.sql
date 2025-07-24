-- EMERGENCY: Disable RLS on all tables to restore functionality
-- Run this immediately if the coordinated RLS implementation breaks the application

-- =====================================================
-- STEP 1: Disable RLS on all tables
-- =====================================================

ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE sops DISABLE ROW LEVEL SECURITY;
ALTER TABLE sop_steps DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: Drop ALL policies to ensure clean state
-- =====================================================

-- Drop user_profiles policies
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Only superadmins can delete profiles" ON user_profiles;
DROP POLICY IF EXISTS "Superadmins have full access" ON user_profiles;

-- Drop user_departments policies
DROP POLICY IF EXISTS "Users can view own departments" ON user_departments;
DROP POLICY IF EXISTS "Only superadmins can manage user departments" ON user_departments;
DROP POLICY IF EXISTS "Users can view user departments" ON user_departments;
DROP POLICY IF EXISTS "Users can manage user departments" ON user_departments;

-- Drop sops policies
DROP POLICY IF EXISTS "Users can view sops in their departments" ON sops;
DROP POLICY IF EXISTS "Users can create sops in their departments" ON sops;
DROP POLICY IF EXISTS "Users can update sops in their departments" ON sops;
DROP POLICY IF EXISTS "Users can delete sops in their departments" ON sops;

-- Drop sop_steps policies
DROP POLICY IF EXISTS "Users can view steps in their departments" ON sop_steps;
DROP POLICY IF EXISTS "Users can create steps in their departments" ON sop_steps;
DROP POLICY IF EXISTS "Users can update steps in their departments" ON sop_steps;
DROP POLICY IF EXISTS "Users can delete steps in their departments" ON sop_steps;

-- =====================================================
-- STEP 3: Verify RLS is disabled on all tables
-- =====================================================

SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('user_profiles', 'user_departments', 'sops', 'sop_steps')
ORDER BY tablename;

-- =====================================================
-- STEP 4: Test access (should work now)
-- =====================================================

-- Test user_profiles access
SELECT COUNT(*) as user_profiles_count FROM user_profiles;

-- Test user_departments access  
SELECT COUNT(*) as user_departments_count FROM user_departments;

-- Test sops access
SELECT COUNT(*) as sops_count FROM sops;

-- Test sop_steps access
SELECT COUNT(*) as sop_steps_count FROM sop_steps;

-- This will restore full access to all tables
-- Users should be able to log in and use the application immediately 