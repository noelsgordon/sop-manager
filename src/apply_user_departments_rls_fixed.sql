-- Apply RLS to user_departments table with fixed policies
-- Run this in Supabase SQL Editor

-- Step 1: Enable RLS on user_departments
ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing policies
DROP POLICY IF EXISTS "Users can view own departments" ON user_departments;
DROP POLICY IF EXISTS "Only superadmins can manage user departments" ON user_departments;
DROP POLICY IF EXISTS "Users can view user departments" ON user_departments;

-- Step 3: Create fixed RLS policies for user_departments
-- Allow all authenticated users to view user_departments (needed for login flow)
CREATE POLICY "Users can view user departments" ON user_departments
  FOR SELECT USING (true);

-- Only superadmins can manage user departments (create, update, delete)
CREATE POLICY "Only superadmins can manage user departments" ON user_departments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND is_superadmin = true
    )
  );

-- Step 4: Verify the policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_departments'
ORDER BY policyname;

-- Step 5: Test the policies
-- This should return all user_departments (SELECT policy allows all authenticated users)
SELECT COUNT(*) as total_user_departments FROM user_departments;

-- Step 6: Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_departments';

-- Step 7: Test superadmin access (should work for all operations)
-- This query should work if you're a superadmin
SELECT * FROM user_departments LIMIT 5;

-- Step 8: Test regular user access (should see all user_departments for SELECT)
-- This simulates what a regular user would see during login
SELECT user_id, department_id, role FROM user_departments WHERE user_id = auth.uid(); 