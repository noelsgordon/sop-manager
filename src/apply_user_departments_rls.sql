-- Apply RLS to user_departments table (Next in priority)
-- Run this in Supabase SQL Editor

-- Step 1: Enable RLS on user_departments
ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;

-- Step 2: Create RLS policies for user_departments
-- Users can view their own department memberships
CREATE POLICY "Users can view own departments" ON user_departments
  FOR SELECT USING (auth.uid() = user_id);

-- Only superadmins can manage user departments (create, update, delete)
CREATE POLICY "Only superadmins can manage user departments" ON user_departments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND is_superadmin = true
    )
  );

-- Step 3: Verify the policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_departments'
ORDER BY policyname;

-- Step 4: Test the policies
-- This should return the current user's department memberships
SELECT COUNT(*) as user_departments_count 
FROM user_departments 
WHERE user_id = auth.uid();

-- Step 5: Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_departments';

-- Step 6: Test superadmin access (should work for all operations)
-- This query should work if you're a superadmin
SELECT * FROM user_departments LIMIT 5;

-- Step 7: Test regular user access (should only see own memberships)
-- This simulates what a regular user would see
-- (The SELECT policy only allows users to see their own department memberships)
SELECT user_id, department_id, role FROM user_departments WHERE user_id = auth.uid(); 