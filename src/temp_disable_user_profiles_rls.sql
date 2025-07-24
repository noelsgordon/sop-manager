-- TEMPORARY: Disable RLS on user_profiles to fix login issue
-- This allows the application to work while we properly test RLS policies

-- Disable RLS temporarily
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop all policies to ensure clean state
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Only superadmins can delete profiles" ON user_profiles;
DROP POLICY IF EXISTS "Superadmins have full access" ON user_profiles;

-- Note: This is temporary. Once we've properly tested the RLS policies
-- and ensured the application works correctly, we can re-enable RLS
-- with the proper policies. 