-- Fix user_profiles RLS policies to prevent infinite recursion
-- Drop existing policies first
DROP POLICY IF EXISTS "Allow Insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow select own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow users to read their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Insert own profile policy" ON user_profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "Read own profile" ON user_profiles;
DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON user_profiles;
DROP POLICY IF EXISTS "View profiles policy" ON user_profiles;
DROP POLICY IF EXISTS "Update own profile policy" ON user_profiles;

-- Create simple, non-recursive policies
-- SELECT policy - users can read their own profile
CREATE POLICY "user_profiles_select_policy" ON user_profiles
FOR SELECT USING (auth.uid() = user_id);

-- INSERT policy - users can create their own profile
CREATE POLICY "user_profiles_insert_policy" ON user_profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE policy - users can update their own profile
CREATE POLICY "user_profiles_update_policy" ON user_profiles
FOR UPDATE USING (auth.uid() = user_id);

-- DELETE policy - users can delete their own profile (if needed)
CREATE POLICY "user_profiles_delete_policy" ON user_profiles
FOR DELETE USING (auth.uid() = user_id); 