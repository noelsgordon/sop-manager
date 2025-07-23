-- First create a security definer function to check superadmin status
CREATE OR REPLACE FUNCTION auth.is_superadmin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
BEGIN
  SELECT is_superadmin INTO is_admin
  FROM user_profiles
  WHERE user_id = $1;
  RETURN COALESCE(is_admin, false);
END;
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Public can view user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Superadmins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Superadmins can manage all profiles" ON user_profiles;

-- Enable RLS on user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create a single policy for viewing profiles
CREATE POLICY "View profiles policy"
ON user_profiles FOR SELECT
TO authenticated
USING (true);  -- Allow all authenticated users to view profiles

-- Create policy for users to update their own profile
CREATE POLICY "Update own profile policy"
ON user_profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create policy for users to insert their own profile
CREATE POLICY "Insert own profile policy"
ON user_profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Create policy for superadmins to view all profiles
CREATE POLICY "Superadmins can view all profiles"
ON user_profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_superadmin = true
  )
);

-- Create policy for superadmins to manage all profiles
CREATE POLICY "Superadmins can manage all profiles"
ON user_profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_superadmin = true
  )
); 