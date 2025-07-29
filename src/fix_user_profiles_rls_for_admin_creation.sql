-- Fix user_profiles RLS policies to allow superadmins to create profiles for other users
-- This addresses the "new row violates row level security" error when admins create users

-- Drop existing policies first
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

-- =====================================================
-- CREATE NEW POLICIES
-- =====================================================

-- 1. SELECT POLICY: All authenticated users can view all profiles
-- This is essential for login flow to work
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
-- VERIFICATION
-- =====================================================

-- Check if RLS is enabled
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity = true THEN 'RLS ENABLED'
        ELSE 'RLS DISABLED'
    END as rls_status
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- Check policies were created
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

-- =====================================================
-- TESTING NOTES
-- =====================================================

/*
EXPECTED BEHAVIOR:

1. Regular Users:
   - Can view all profiles (for UI display)
   - Can insert their own profile (during signup)
   - Can update their own profile
   - Cannot delete any profiles

2. SuperAdmins:
   - Can view all profiles
   - Can insert profiles for other users (admin user creation)
   - Can update any profile
   - Can delete any profile

3. Admin User Creation:
   - Superadmin creates user via CreateUserModal
   - Auth user is created with email/password
   - Profile is inserted for the new user (should work now)
   - User can login with their email/password after confirmation

4. Error Cases:
   - Non-superadmin users cannot create profiles for others
   - Non-superadmin users cannot update other profiles
   - Unauthenticated users get permission denied
*/ 