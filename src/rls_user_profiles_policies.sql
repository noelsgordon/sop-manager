-- =====================================================
-- RLS POLICIES FOR user_profiles TABLE
-- This is the simplest table to start with
-- =====================================================

-- Enable RLS on user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DROP EXISTING POLICIES (if any)
-- =====================================================

DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Superadmins have full access" ON user_profiles;
DROP POLICY IF EXISTS "View profiles policy" ON user_profiles;
DROP POLICY IF EXISTS "Update own profile policy" ON user_profiles;
DROP POLICY IF EXISTS "Insert own profile policy" ON user_profiles;
DROP POLICY IF EXISTS "Superadmins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Superadmins can manage all profiles" ON user_profiles;

-- =====================================================
-- CREATE NEW POLICIES
-- =====================================================

-- 1. SELECT POLICY: All authenticated users can view all profiles
-- This allows the UI to display user names, emails, etc.
CREATE POLICY "Users can view all profiles"
ON user_profiles FOR SELECT
TO authenticated
USING (true);

-- 2. INSERT POLICY: Users can only insert their own profile
-- This prevents users from creating profiles for others
CREATE POLICY "Users can insert own profile"
ON user_profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 3. UPDATE POLICY: Users can only update their own profile
-- This allows users to update their display_name, email, etc.
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 4. DELETE POLICY: Only superadmins can delete profiles
-- This prevents accidental profile deletion
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
-- This allows superadmins to manage all profiles
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
-- VERIFICATION QUERIES
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
TESTING SCENARIOS:

1. Regular User Testing:
   - Should be able to view all profiles (for UI display)
   - Should be able to update their own profile
   - Should NOT be able to update other users' profiles
   - Should NOT be able to delete any profiles

2. SuperAdmin Testing:
   - Should be able to view all profiles
   - Should be able to update any profile
   - Should be able to delete any profile
   - Should be able to insert profiles for other users

3. Profile Creation:
   - Users should only be able to create their own profile
   - Superadmins should be able to create profiles for others

4. Error Cases:
   - Unauthenticated users should get permission denied
   - Invalid user_id references should be blocked
   - Cross-user updates should be blocked for regular users
*/

-- =====================================================
-- POLICY EXPLANATION
-- =====================================================

/*
POLICY RATIONALE:

1. SELECT (View All): 
   - All users can view all profiles
   - Needed for UI display (user names, emails in dropdowns)
   - No sensitive data exposed (passwords are in auth.users)

2. INSERT (Create Own):
   - Users can only create their own profile
   - Prevents impersonation
   - Allows self-registration flow

3. UPDATE (Edit Own):
   - Users can only update their own profile
   - Allows profile customization
   - Prevents unauthorized changes

4. DELETE (SuperAdmin Only):
   - Only superadmins can delete profiles
   - Prevents accidental data loss
   - Maintains data integrity

5. SUPERADMIN OVERRIDE:
   - Superadmins bypass all restrictions
   - Allows user management
   - Maintains administrative control

SECURITY CONSIDERATIONS:

- user_id is the primary key and references auth.users
- No sensitive data stored (passwords in auth.users)
- Superadmin status is checked via EXISTS query
- All policies use auth.uid() for current user context
- WITH CHECK clauses prevent unauthorized modifications
*/ 