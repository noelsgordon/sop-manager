-- Fix RLS policies for admin user creation
-- This addresses the "new row violates row level security" error when admins create users
-- Run this in Supabase SQL Editor

-- =====================================================
-- STEP 1: Fix user_profiles RLS policies
-- =====================================================

-- Drop existing user_profiles policies
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Only superadmins can delete profiles" ON user_profiles;
DROP POLICY IF EXISTS "Superadmins have full access" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_superadmin_policy" ON user_profiles;

-- Enable RLS on user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create new user_profiles policies
-- 1. SELECT POLICY: All authenticated users can view all profiles
CREATE POLICY "user_profiles_select_policy" ON user_profiles
    FOR SELECT USING (true);

-- 2. INSERT POLICY: Users can insert their own profile OR superadmins can insert any profile
CREATE POLICY "user_profiles_insert_policy" ON user_profiles
    FOR INSERT WITH CHECK (
        user_id = auth.uid()  -- Users can insert their own profile
        OR 
        EXISTS (  -- Superadmins can insert profiles for other users
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND is_superadmin = true
        )
    );

-- 3. UPDATE POLICY: Users can update their own profile OR superadmins can update any profile
CREATE POLICY "user_profiles_update_policy" ON user_profiles
    FOR UPDATE USING (
        user_id = auth.uid()  -- Users can update their own profile
        OR 
        EXISTS (  -- Superadmins can update any profile
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND is_superadmin = true
        )
    );

-- 4. DELETE POLICY: Only superadmins can delete profiles
CREATE POLICY "user_profiles_delete_policy" ON user_profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND is_superadmin = true
        )
    );

-- =====================================================
-- STEP 2: Fix user_departments RLS policies
-- =====================================================

-- Drop existing user_departments policies
DROP POLICY IF EXISTS "Users can view own departments" ON user_departments;
DROP POLICY IF EXISTS "Only superadmins can manage user departments" ON user_departments;
DROP POLICY IF EXISTS "Users can view user departments" ON user_departments;
DROP POLICY IF EXISTS "Users can manage user departments" ON user_departments;
DROP POLICY IF EXISTS "user_departments_select_policy" ON user_departments;
DROP POLICY IF EXISTS "user_departments_insert_policy" ON user_departments;
DROP POLICY IF EXISTS "user_departments_update_policy" ON user_departments;
DROP POLICY IF EXISTS "user_departments_delete_policy" ON user_departments;

-- Enable RLS on user_departments table
ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;

-- Create new user_departments policies
-- 1. SELECT POLICY: All authenticated users can view user_departments (needed for login)
CREATE POLICY "user_departments_select_policy" ON user_departments
    FOR SELECT USING (true);

-- 2. INSERT POLICY: Superadmins can insert any user_departments record
CREATE POLICY "user_departments_insert_policy" ON user_departments
    FOR INSERT WITH CHECK (
        EXISTS (  -- Superadmins can insert any user_departments record
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND is_superadmin = true
        )
    );

-- 3. UPDATE POLICY: Superadmins can update any user_departments record
CREATE POLICY "user_departments_update_policy" ON user_departments
    FOR UPDATE USING (
        EXISTS (  -- Superadmins can update any user_departments record
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND is_superadmin = true
        )
    );

-- 4. DELETE POLICY: Superadmins can delete any user_departments record
CREATE POLICY "user_departments_delete_policy" ON user_departments
    FOR DELETE USING (
        EXISTS (  -- Superadmins can delete any user_departments record
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND is_superadmin = true
        )
    );

-- =====================================================
-- STEP 3: Verification
-- =====================================================

-- Check if RLS is enabled on both tables
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity = true THEN 'RLS ENABLED'
        ELSE 'RLS DISABLED'
    END as rls_status
FROM pg_tables 
WHERE tablename IN ('user_profiles', 'user_departments')
ORDER BY tablename;

-- Check policies were created for user_profiles
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Check policies were created for user_departments
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_departments'
ORDER BY policyname;

-- =====================================================
-- STEP 4: Testing Notes
-- =====================================================

/*
EXPECTED BEHAVIOR AFTER THIS FIX:

1. Admin User Creation (CreateUserModal):
   - Superadmin creates user via CreateUserModal
   - Auth user is created with email/password ✅
   - Profile is inserted for the new user ✅ (should work now)
   - User_departments records are inserted ✅ (should work now)
   - User can login with their email/password after confirmation ✅

2. Regular Users:
   - Can view all profiles (for UI display)
   - Can insert their own profile (during signup)
   - Can update their own profile
   - Cannot delete any profiles
   - Cannot create profiles for others
   - Cannot manage user_departments

3. SuperAdmins:
   - Can view all profiles
   - Can insert profiles for other users (admin user creation)
   - Can update any profile
   - Can delete any profile
   - Can manage all user_departments records

4. Error Cases:
   - Non-superadmin users cannot create profiles for others
   - Non-superadmin users cannot update other profiles
   - Non-superadmin users cannot manage user_departments
   - Unauthenticated users get permission denied

TESTING STEPS:
1. Run this SQL in Supabase SQL Editor
2. Try creating a user via the Admin panel
3. Verify the user can login after email confirmation
4. Check that regular users cannot create profiles for others
*/ 