-- Fix RLS Policies - Remove Infinite Recursion
-- Run this in Supabase SQL Editor to fix the policies

-- Step 1: Drop all existing policies on test tables
DROP POLICY IF EXISTS "Test users can view all profiles" ON test_user_profiles;
DROP POLICY IF EXISTS "Test users can insert own profile" ON test_user_profiles;
DROP POLICY IF EXISTS "Test users can update own profile" ON test_user_profiles;
DROP POLICY IF EXISTS "Test only superadmins can delete profiles" ON test_user_profiles;
DROP POLICY IF EXISTS "Test superadmins have full access" ON test_user_profiles;

DROP POLICY IF EXISTS "Test users can view departments" ON test_departments;
DROP POLICY IF EXISTS "Test only superadmins can manage departments" ON test_departments;

DROP POLICY IF EXISTS "Test users can view own departments" ON test_user_departments;
DROP POLICY IF EXISTS "Test only superadmins can manage user departments" ON test_user_departments;

DROP POLICY IF EXISTS "Test users can view invite codes" ON test_invite_codes;
DROP POLICY IF EXISTS "Test only superadmins can manage invite codes" ON test_invite_codes;

DROP POLICY IF EXISTS "Test users can view sops in their departments" ON test_sops;
DROP POLICY IF EXISTS "Test users can create sops in their departments" ON test_sops;
DROP POLICY IF EXISTS "Test users can update sops in their departments" ON test_sops;
DROP POLICY IF EXISTS "Test users can delete sops in their departments" ON test_sops;

DROP POLICY IF EXISTS "Test users can view steps for sops in their departments" ON test_sop_steps;
DROP POLICY IF EXISTS "Test users can manage steps for sops in their departments" ON test_sop_steps;

-- Step 2: Create simplified policies without recursion

-- Test user_profiles policies (simplified)
CREATE POLICY "Test users can view all profiles" ON test_user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Test users can insert own profile" ON test_user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Test users can update own profile" ON test_user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- For now, allow all operations for testing (we'll restrict later)
CREATE POLICY "Test allow all operations" ON test_user_profiles
  FOR ALL USING (true);

-- Test departments policies (simplified)
CREATE POLICY "Test users can view departments" ON test_departments
  FOR SELECT USING (true);

-- For now, allow all operations for testing
CREATE POLICY "Test allow all operations" ON test_departments
  FOR ALL USING (true);

-- Test user_departments policies (simplified)
CREATE POLICY "Test users can view own departments" ON test_user_departments
  FOR SELECT USING (auth.uid() = user_id);

-- For now, allow all operations for testing
CREATE POLICY "Test allow all operations" ON test_user_departments
  FOR ALL USING (true);

-- Test invite_codes policies (simplified)
CREATE POLICY "Test users can view invite codes" ON test_invite_codes
  FOR SELECT USING (true);

-- For now, allow all operations for testing
CREATE POLICY "Test allow all operations" ON test_invite_codes
  FOR ALL USING (true);

-- Test sops policies (simplified)
CREATE POLICY "Test users can view sops" ON test_sops
  FOR SELECT USING (true);

CREATE POLICY "Test users can create sops" ON test_sops
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Test users can update sops" ON test_sops
  FOR UPDATE USING (true);

CREATE POLICY "Test users can delete sops" ON test_sops
  FOR DELETE USING (true);

-- Test sop_steps policies (simplified)
CREATE POLICY "Test users can view steps" ON test_sop_steps
  FOR SELECT USING (true);

CREATE POLICY "Test users can manage steps" ON test_sop_steps
  FOR ALL USING (true);

-- Step 3: Verify the policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename LIKE 'test_%'
ORDER BY tablename, policyname; 