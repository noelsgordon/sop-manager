-- =====================================================
-- SAFE RLS POLICIES FOR user_profiles TABLE
-- This version ensures the application login flow works
-- =====================================================

-- Enable RLS on user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Only superadmins can delete profiles" ON user_profiles;
DROP POLICY IF EXISTS "Superadmins have full access" ON user_profiles;

-- =====================================================
-- SAFE POLICIES (More permissive for testing)
-- =====================================================

-- 1. SELECT POLICY: All authenticated users can view all profiles
-- This ensures the login flow works (app needs to read profiles)
CREATE POLICY "Users can view all profiles"
ON user_profiles FOR SELECT
TO authenticated
USING (true);

-- 2. INSERT POLICY: Users can insert their own profile
-- This allows profile creation during signup
CREATE POLICY "Users can insert own profile"
ON user_profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 3. UPDATE POLICY: Users can update their own profile
-- This allows profile updates
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 4. DELETE POLICY: Only superadmins can delete profiles
-- This prevents accidental deletions
CREATE POLICY "Only superadmins can delete profiles"
ON user_profiles FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_superadmin = true
  )
);

-- 5. SUPERADMIN OVERRIDE: Superadmins have full access
-- This gives superadmins complete control
CREATE POLICY "Superadmins have full access"
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
-- VERIFICATION
-- =====================================================

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- Check all policies on user_profiles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- =====================================================
-- TESTING NOTES
-- =====================================================

/*
SAFE TESTING APPROACH:

1. Apply these policies
2. Test login with different users
3. Test profile updates
4. Test superadmin functions
5. If everything works, we can make policies stricter

EXPECTED BEHAVIOR:
- All authenticated users can view all profiles (for UI display)
- Users can only update their own profiles
- Only superadmins can delete profiles
- Superadmins have full access to all profiles

IF LOGIN FAILS:
- The SELECT policy might be too restrictive
- We may need to adjust the policy conditions
- Check browser console for specific error messages
*/ 