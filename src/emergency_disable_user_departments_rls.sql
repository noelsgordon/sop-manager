-- EMERGENCY: Disable RLS on user_departments to restore access
-- Run this immediately in Supabase SQL Editor

-- Step 1: Disable RLS on user_departments table
ALTER TABLE user_departments DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL policies to ensure clean state
DROP POLICY IF EXISTS "Users can view own departments" ON user_departments;
DROP POLICY IF EXISTS "Only superadmins can manage user departments" ON user_departments;
DROP POLICY IF EXISTS "Users can view user departments" ON user_departments;
DROP POLICY IF EXISTS "Users can manage user departments" ON user_departments;

-- Step 3: Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_departments';

-- Step 4: Test access (should work now)
SELECT COUNT(*) as total_user_departments FROM user_departments;

-- This will restore full access to user_departments table
-- Users should be able to log in again immediately 