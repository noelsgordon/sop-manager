-- =====================================================
-- COMPREHENSIVE RLS POLICY FIX
-- This script drops all existing policies and creates clean ones
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_definitions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DROP ALL EXISTING POLICIES
-- =====================================================

-- Drop all departments policies
DROP POLICY IF EXISTS "Users can view departments they belong to" ON departments;
DROP POLICY IF EXISTS "Super users can create departments" ON departments;
DROP POLICY IF EXISTS "departments_select_policy" ON departments;
DROP POLICY IF EXISTS "departments_insert_policy" ON departments;
DROP POLICY IF EXISTS "departments_update_policy" ON departments;
DROP POLICY IF EXISTS "departments_delete_policy" ON departments;

-- Drop all user_profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Public can view user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Superadmins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Superadmins can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "View profiles policy" ON user_profiles;
DROP POLICY IF EXISTS "Update own profile policy" ON user_profiles;
DROP POLICY IF EXISTS "Insert own profile policy" ON user_profiles;
DROP POLICY IF EXISTS "Allow Insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow select own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow users to read their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "Read own profile" ON user_profiles;
DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON user_profiles;

-- Drop all user_departments policies
DROP POLICY IF EXISTS "Users can view their own department assignments" ON user_departments;
DROP POLICY IF EXISTS "Superadmins can manage all department assignments" ON user_departments;
DROP POLICY IF EXISTS "Users can manage their own department assignments" ON user_departments;
DROP POLICY IF EXISTS "Users can delete their own department assignments" ON user_departments;
DROP POLICY IF EXISTS "Super users can manage department assignments" ON user_departments;
DROP POLICY IF EXISTS "Users can join departments with invite codes" ON user_departments;
DROP POLICY IF EXISTS "user_departments_select_policy" ON user_departments;
DROP POLICY IF EXISTS "user_departments_insert_policy" ON user_departments;
DROP POLICY IF EXISTS "user_departments_update_policy" ON user_departments;
DROP POLICY IF EXISTS "user_departments_delete_policy" ON user_departments;
DROP POLICY IF EXISTS "insert_own_user_company" ON user_departments;
DROP POLICY IF EXISTS "select_own_user_companies" ON user_departments;

-- Drop all invite_codes policies
DROP POLICY IF EXISTS "Users can view invite codes for their departments" ON invite_codes;
DROP POLICY IF EXISTS "Users can view invite codes meant for them" ON invite_codes;
DROP POLICY IF EXISTS "Users can view relevant invite codes" ON invite_codes;
DROP POLICY IF EXISTS "Users can create invite codes for their departments" ON invite_codes;
DROP POLICY IF EXISTS "Users can delete invite codes for their departments" ON invite_codes;
DROP POLICY IF EXISTS "Users can update invite codes for their departments" ON invite_codes;
DROP POLICY IF EXISTS "invite_codes_select_policy" ON invite_codes;
DROP POLICY IF EXISTS "invite_codes_insert_policy" ON invite_codes;
DROP POLICY IF EXISTS "invite_codes_delete_policy" ON invite_codes;

-- Drop all sops policies
DROP POLICY IF EXISTS "Users can view SOPs in their departments" ON sops;
DROP POLICY IF EXISTS "Users can create SOPs in their departments" ON sops;
DROP POLICY IF EXISTS "Users can update SOPs in their departments" ON sops;
DROP POLICY IF EXISTS "Users can delete SOPs in their departments" ON sops;
DROP POLICY IF EXISTS "sops_select_policy" ON sops;
DROP POLICY IF EXISTS "sops_insert_policy" ON sops;
DROP POLICY IF EXISTS "sops_update_policy" ON sops;
DROP POLICY IF EXISTS "sops_delete_policy" ON sops;
DROP POLICY IF EXISTS "sops_restore_policy" ON sops;
DROP POLICY IF EXISTS "sops_view_deleted_policy" ON sops;

-- Drop all sop_steps policies
DROP POLICY IF EXISTS "Allow authenticated delete" ON sop_steps;
DROP POLICY IF EXISTS "Allow insert" ON sop_steps;
DROP POLICY IF EXISTS "Allow select" ON sop_steps;

-- =====================================================
-- CREATE CLEAN POLICIES
-- =====================================================

-- =====================================================
-- DEPARTMENTS POLICIES
-- =====================================================

-- Users can view departments they belong to
CREATE POLICY "departments_select_policy"
ON departments FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT department_id 
    FROM user_departments 
    WHERE user_id = auth.uid()
  )
  OR
  -- Allow viewing Default Department
  name = 'Default Department'
  OR
  -- Superadmins can view all departments
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_superadmin = true
  )
);

-- Users can create departments (with restrictions)
CREATE POLICY "departments_insert_policy"
ON departments FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow new users to create their first department
  NOT EXISTS (
    SELECT 1 
    FROM user_departments 
    WHERE user_id = auth.uid()
  )
  OR
  -- Allow super users to create departments
  EXISTS (
    SELECT 1 
    FROM user_departments 
    WHERE user_id = auth.uid() 
    AND role = 'super'
  )
  OR
  -- Allow superadmins to create departments
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_superadmin = true
  )
);

-- Users can update departments they manage
CREATE POLICY "departments_update_policy"
ON departments FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM user_departments 
    WHERE department_id = departments.id
    AND user_id = auth.uid()
    AND role IN ('manage', 'super')
  )
  OR
  -- Allow superadmins to update any department
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_superadmin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM user_departments 
    WHERE department_id = departments.id
    AND user_id = auth.uid()
    AND role IN ('manage', 'super')
  )
  OR
  -- Allow superadmins to update any department
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_superadmin = true
  )
);

-- Users can delete departments they manage
CREATE POLICY "departments_delete_policy"
ON departments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM user_departments 
    WHERE department_id = departments.id
    AND user_id = auth.uid()
    AND role = 'super'
  )
  OR
  -- Allow superadmins to delete any department
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_superadmin = true
  )
);

-- =====================================================
-- USER_PROFILES POLICIES
-- =====================================================

-- All authenticated users can view profiles
CREATE POLICY "user_profiles_select_policy"
ON user_profiles FOR SELECT
TO authenticated
USING (true);

-- Users can update their own profile
CREATE POLICY "user_profiles_update_policy"
ON user_profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "user_profiles_insert_policy"
ON user_profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Superadmins can manage all profiles
CREATE POLICY "user_profiles_superadmin_policy"
ON user_profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_superadmin = true
  )
);

-- =====================================================
-- USER_DEPARTMENTS POLICIES
-- =====================================================

-- Users can view their own department assignments
CREATE POLICY "user_departments_select_policy"
ON user_departments FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR
  -- Department managers can view assignments in their departments
  EXISTS (
    SELECT 1 
    FROM user_departments ud
    WHERE ud.department_id = user_departments.department_id
    AND ud.user_id = auth.uid()
    AND ud.role IN ('manage', 'super')
  )
  OR
  -- Superadmins can view all assignments
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_superadmin = true
  )
);

-- Users can join departments with invite codes
CREATE POLICY "user_departments_insert_policy"
ON user_departments FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow joining with invite code
  EXISTS (
    SELECT 1 
    FROM invite_codes 
    WHERE department_id = NEW.department_id 
    AND email = (
      SELECT email 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  )
  OR
  -- Allow new users to create and join their first department
  (
    NOT EXISTS (
      SELECT 1 
      FROM user_departments 
      WHERE user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 
      FROM departments 
      WHERE id = NEW.department_id
      AND created_by = auth.uid()
    )
  )
  OR
  -- Allow department managers to add users
  EXISTS (
    SELECT 1 
    FROM user_departments ud
    WHERE ud.department_id = NEW.department_id
    AND ud.user_id = auth.uid()
    AND ud.role IN ('manage', 'super')
  )
  OR
  -- Allow superadmins to add users
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_superadmin = true
  )
);

-- Users can update their own department assignments
CREATE POLICY "user_departments_update_policy"
ON user_departments FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR
  -- Department managers can update assignments in their departments
  EXISTS (
    SELECT 1 
    FROM user_departments ud
    WHERE ud.department_id = user_departments.department_id
    AND ud.user_id = auth.uid()
    AND ud.role IN ('manage', 'super')
  )
  OR
  -- Superadmins can update any assignment
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_superadmin = true
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR
  -- Department managers can update assignments in their departments
  EXISTS (
    SELECT 1 
    FROM user_departments ud
    WHERE ud.department_id = user_departments.department_id
    AND ud.user_id = auth.uid()
    AND ud.role IN ('manage', 'super')
  )
  OR
  -- Superadmins can update any assignment
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_superadmin = true
  )
);

-- Users can delete their own department assignments
CREATE POLICY "user_departments_delete_policy"
ON user_departments FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR
  -- Department managers can remove users from their departments
  EXISTS (
    SELECT 1 
    FROM user_departments ud
    WHERE ud.department_id = user_departments.department_id
    AND ud.user_id = auth.uid()
    AND ud.role IN ('manage', 'super')
  )
  OR
  -- Superadmins can delete any assignment
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_superadmin = true
  )
);

-- =====================================================
-- INVITE_CODES POLICIES
-- =====================================================

-- Users can view relevant invite codes
CREATE POLICY "invite_codes_select_policy"
ON invite_codes FOR SELECT
TO authenticated
USING (
  -- Can view if the invite code is meant for their email
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR
  -- Can view if they are a manager/super in the department
  department_id IN (
    SELECT department_id 
    FROM user_departments 
    WHERE user_id = auth.uid()
    AND role IN ('manage', 'super')
  )
  OR
  -- Superadmins can view all invite codes
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_superadmin = true
  )
);

-- Users can create invite codes for their departments
CREATE POLICY "invite_codes_insert_policy"
ON invite_codes FOR INSERT
TO authenticated
WITH CHECK (
  department_id IN (
    SELECT department_id 
    FROM user_departments 
    WHERE user_id = auth.uid()
    AND role IN ('manage', 'super')
  )
  OR
  -- Superadmins can create invite codes for any department
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_superadmin = true
  )
);

-- Users can delete invite codes for their departments
CREATE POLICY "invite_codes_delete_policy"
ON invite_codes FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  OR
  department_id IN (
    SELECT department_id 
    FROM user_departments 
    WHERE user_id = auth.uid()
    AND role IN ('manage', 'super')
  )
  OR
  -- Superadmins can delete any invite code
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_superadmin = true
  )
);

-- Users can update invite codes for their departments
CREATE POLICY "invite_codes_update_policy"
ON invite_codes FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR
  department_id IN (
    SELECT department_id 
    FROM user_departments 
    WHERE user_id = auth.uid()
    AND role IN ('manage', 'super')
  )
  OR
  -- Superadmins can update any invite code
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_superadmin = true
  )
)
WITH CHECK (
  created_by = auth.uid()
  OR
  department_id IN (
    SELECT department_id 
    FROM user_departments 
    WHERE user_id = auth.uid()
    AND role IN ('manage', 'super')
  )
  OR
  -- Superadmins can update any invite code
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_superadmin = true
  )
);

-- =====================================================
-- SOPS POLICIES
-- =====================================================

-- Users can view SOPs in their departments
CREATE POLICY "sops_select_policy"
ON sops FOR SELECT
TO authenticated
USING (
  department_id IN (
    SELECT department_id 
    FROM user_departments 
    WHERE user_id = auth.uid()
  )
  AND deleted_at IS NULL  -- Only show non-deleted SOPs
);

-- Users can create SOPs in their departments
CREATE POLICY "sops_insert_policy"
ON sops FOR INSERT
TO authenticated
WITH CHECK (
  department_id IN (
    SELECT department_id 
    FROM user_departments 
    WHERE user_id = auth.uid()
    AND role IN ('build', 'manage', 'super')
  )
);

-- Users can update SOPs in their departments
CREATE POLICY "sops_update_policy"
ON sops FOR UPDATE
TO authenticated
USING (
  department_id IN (
    SELECT department_id 
    FROM user_departments 
    WHERE user_id = auth.uid()
    AND role IN ('tweak', 'build', 'manage', 'super')
  )
  AND deleted_at IS NULL  -- Can't update deleted SOPs
)
WITH CHECK (
  department_id IN (
    SELECT department_id 
    FROM user_departments 
    WHERE user_id = auth.uid()
    AND role IN ('tweak', 'build', 'manage', 'super')
  )
  AND deleted_at IS NULL  -- Can't update deleted SOPs
);

-- Users can delete SOPs in their departments
CREATE POLICY "sops_delete_policy"
ON sops FOR DELETE
TO authenticated
USING (
  department_id IN (
    SELECT department_id 
    FROM user_departments 
    WHERE user_id = auth.uid()
    AND role IN ('build', 'manage', 'super')
  )
  AND deleted_at IS NULL  -- Can't delete already deleted SOPs
);

-- Users can view deleted SOPs (for restoration)
CREATE POLICY "sops_view_deleted_policy"
ON sops FOR SELECT
TO authenticated
USING (
  department_id IN (
    SELECT department_id 
    FROM user_departments 
    WHERE user_id = auth.uid()
    AND role IN ('manage', 'super')
  )
  AND deleted_at IS NOT NULL
);

-- Users can restore deleted SOPs
CREATE POLICY "sops_restore_policy"
ON sops FOR UPDATE
TO authenticated
USING (
  department_id IN (
    SELECT department_id 
    FROM user_departments 
    WHERE user_id = auth.uid()
    AND role IN ('manage', 'super')
  )
  AND deleted_at IS NOT NULL  -- Only allow restoring deleted SOPs
)
WITH CHECK (
  department_id IN (
    SELECT department_id 
    FROM user_departments 
    WHERE user_id = auth.uid()
    AND role IN ('manage', 'super')
  )
  AND deleted_at IS NOT NULL  -- Only allow restoring deleted SOPs
);

-- =====================================================
-- SOP_STEPS POLICIES
-- =====================================================

-- Users can view SOP steps for SOPs they have access to
CREATE POLICY "sop_steps_select_policy"
ON sop_steps FOR SELECT
TO authenticated
USING (
  sop_id IN (
    SELECT id 
    FROM sops 
    WHERE department_id IN (
      SELECT department_id 
      FROM user_departments 
      WHERE user_id = auth.uid()
    )
  )
  AND deleted_at IS NULL  -- Only show non-deleted steps
);

-- Users can create SOP steps for SOPs they can edit
CREATE POLICY "sop_steps_insert_policy"
ON sop_steps FOR INSERT
TO authenticated
WITH CHECK (
  sop_id IN (
    SELECT id 
    FROM sops 
    WHERE department_id IN (
      SELECT department_id 
      FROM user_departments 
      WHERE user_id = auth.uid()
      AND role IN ('build', 'manage', 'super')
    )
  )
);

-- Users can update SOP steps for SOPs they can edit
CREATE POLICY "sop_steps_update_policy"
ON sop_steps FOR UPDATE
TO authenticated
USING (
  sop_id IN (
    SELECT id 
    FROM sops 
    WHERE department_id IN (
      SELECT department_id 
      FROM user_departments 
      WHERE user_id = auth.uid()
      AND role IN ('tweak', 'build', 'manage', 'super')
    )
  )
  AND deleted_at IS NULL  -- Can't update deleted steps
)
WITH CHECK (
  sop_id IN (
    SELECT id 
    FROM sops 
    WHERE department_id IN (
      SELECT department_id 
      FROM user_departments 
      WHERE user_id = auth.uid()
      AND role IN ('tweak', 'build', 'manage', 'super')
    )
  )
  AND deleted_at IS NULL  -- Can't update deleted steps
);

-- Users can delete SOP steps for SOPs they can edit
CREATE POLICY "sop_steps_delete_policy"
ON sop_steps FOR DELETE
TO authenticated
USING (
  sop_id IN (
    SELECT id 
    FROM sops 
    WHERE department_id IN (
      SELECT department_id 
      FROM user_departments 
      WHERE user_id = auth.uid()
      AND role IN ('build', 'manage', 'super')
    )
  )
  AND deleted_at IS NULL  -- Can't delete already deleted steps
);

-- =====================================================
-- ROLE_DEFINITIONS POLICIES
-- =====================================================

-- All authenticated users can view role definitions
CREATE POLICY "role_definitions_select_policy"
ON role_definitions FOR SELECT
TO authenticated
USING (true);

-- Only superadmins can manage role definitions
CREATE POLICY "role_definitions_manage_policy"
ON role_definitions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_superadmin = true
  )
);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Log the policy creation
DO $$
BEGIN
  RAISE NOTICE 'RLS policies have been reset and recreated successfully';
  RAISE NOTICE 'All tables now have clean, consistent policies';
END $$; 