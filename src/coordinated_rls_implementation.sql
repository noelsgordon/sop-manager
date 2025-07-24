-- Coordinated RLS Implementation for All Remaining Tables
-- Run this in Supabase SQL Editor to implement RLS on all tables at once

-- =====================================================
-- STEP 1: Enable RLS on all remaining tables
-- =====================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_steps ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: Drop any existing policies to start clean
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
-- STEP 3: Create Coordinated Policies (No Circular Dependencies)
-- =====================================================

-- =====================================================
-- USER_PROFILES POLICIES (Simplified - No Cross-Table References)
-- =====================================================

-- Allow all authenticated users to view all profiles (needed for login)
CREATE POLICY "Users can view all profiles" ON user_profiles
  FOR SELECT USING (true);

-- Users can only insert their own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Only users with is_superadmin = true can delete profiles
CREATE POLICY "Only superadmins can delete profiles" ON user_profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND is_superadmin = true
    )
  );

-- =====================================================
-- USER_DEPARTMENTS POLICIES (Simplified - No Cross-Table References)
-- =====================================================

-- Allow all authenticated users to view user_departments (needed for login)
CREATE POLICY "Users can view user departments" ON user_departments
  FOR SELECT USING (true);

-- Allow all authenticated users to manage user_departments (temporary - will restrict later)
CREATE POLICY "Users can manage user departments" ON user_departments
  FOR ALL USING (true);

-- =====================================================
-- SOPS POLICIES (Department-Based Access)
-- =====================================================

-- Users can view SOPs in their departments
CREATE POLICY "Users can view sops in their departments" ON sops
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_departments 
      WHERE user_id = auth.uid() AND department_id = sops.department_id
    )
  );

-- Users can create SOPs in their departments
CREATE POLICY "Users can create sops in their departments" ON sops
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_departments 
      WHERE user_id = auth.uid() AND department_id = sops.department_id
    )
  );

-- Users can update SOPs in their departments
CREATE POLICY "Users can update sops in their departments" ON sops
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_departments 
      WHERE user_id = auth.uid() AND department_id = sops.department_id
    )
  );

-- Users can delete SOPs in their departments
CREATE POLICY "Users can delete sops in their departments" ON sops
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_departments 
      WHERE user_id = auth.uid() AND department_id = sops.department_id
    )
  );

-- =====================================================
-- SOP_STEPS POLICIES (Inherit from Parent SOP)
-- =====================================================

-- Users can view steps in SOPs they have access to
CREATE POLICY "Users can view steps in their departments" ON sop_steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sops 
      WHERE sops.id = sop_steps.sop_id
      AND EXISTS (
        SELECT 1 FROM user_departments 
        WHERE user_id = auth.uid() AND department_id = sops.department_id
      )
    )
  );

-- Users can create steps in SOPs they have access to
CREATE POLICY "Users can create steps in their departments" ON sop_steps
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sops 
      WHERE sops.id = sop_steps.sop_id
      AND EXISTS (
        SELECT 1 FROM user_departments 
        WHERE user_id = auth.uid() AND department_id = sops.department_id
      )
    )
  );

-- Users can update steps in SOPs they have access to
CREATE POLICY "Users can update steps in their departments" ON sop_steps
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM sops 
      WHERE sops.id = sop_steps.sop_id
      AND EXISTS (
        SELECT 1 FROM user_departments 
        WHERE user_id = auth.uid() AND department_id = sops.department_id
      )
    )
  );

-- Users can delete steps in SOPs they have access to
CREATE POLICY "Users can delete steps in their departments" ON sop_steps
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM sops 
      WHERE sops.id = sop_steps.sop_id
      AND EXISTS (
        SELECT 1 FROM user_departments 
        WHERE user_id = auth.uid() AND department_id = sops.department_id
      )
    )
  );

-- =====================================================
-- STEP 4: Verify All Policies Are Created
-- =====================================================

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'user_departments', 'sops', 'sop_steps')
ORDER BY tablename, policyname;

-- =====================================================
-- STEP 5: Verify RLS Status
-- =====================================================

SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('user_profiles', 'user_departments', 'sops', 'sop_steps')
ORDER BY tablename;

-- =====================================================
-- STEP 6: Test Basic Access (Should Work)
-- =====================================================

-- Test user_profiles access
SELECT COUNT(*) as user_profiles_count FROM user_profiles;

-- Test user_departments access  
SELECT COUNT(*) as user_departments_count FROM user_departments;

-- Test sops access
SELECT COUNT(*) as sops_count FROM sops;

-- Test sop_steps access
SELECT COUNT(*) as sop_steps_count FROM sop_steps; 