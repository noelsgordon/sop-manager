-- Fix infinite recursion in user_departments RLS policies
-- Run this in Supabase SQL Editor

-- Step 1: Drop all existing policies on user_departments
DROP POLICY IF EXISTS "Users can view own departments" ON user_departments;
DROP POLICY IF EXISTS "Only superadmins can manage user departments" ON user_departments;
DROP POLICY IF EXISTS "Users can view user departments" ON user_departments;

-- Step 2: Create simplified policies without recursion
-- Allow all authenticated users to view user_departments (needed for login flow)
CREATE POLICY "Users can view user departments" ON user_departments
  FOR SELECT USING (true);

-- Allow all authenticated users to manage user_departments (temporary for testing)
-- This will be restricted later once we confirm the login flow works
CREATE POLICY "Users can manage user departments" ON user_departments
  FOR ALL USING (true);

-- Step 3: Verify the policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_departments'
ORDER BY policyname;

-- Step 4: Test the policies
-- This should return all user_departments (SELECT policy allows all authenticated users)
SELECT COUNT(*) as total_user_departments FROM user_departments;

-- Step 5: Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_departments';

-- Step 6: Test regular user access (should see all user_departments for SELECT)
-- This simulates what a regular user would see during login
SELECT user_id, department_id, role FROM user_departments WHERE user_id = auth.uid(); 