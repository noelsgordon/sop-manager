-- Apply RLS to departments table (Next in priority)
-- Run this in Supabase SQL Editor

-- Step 1: Enable RLS on departments
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Step 2: Create RLS policies for departments
-- All users can view departments (needed for UI and user management)
CREATE POLICY "Users can view departments" ON departments
  FOR SELECT USING (true);

-- Only superadmins can manage departments (create, update, delete)
CREATE POLICY "Only superadmins can manage departments" ON departments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND is_superadmin = true
    )
  );

-- Step 3: Verify the policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'departments'
ORDER BY policyname;

-- Step 4: Test the policies
-- This should return all departments (SELECT policy allows all authenticated users)
SELECT COUNT(*) as total_departments FROM departments;

-- Step 5: Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'departments';

-- Step 6: Test superadmin access (should work)
-- This query should work if you're a superadmin
SELECT * FROM departments LIMIT 5;

-- Step 7: Test regular user access (should only allow SELECT)
-- This simulates what a regular user would see
-- (The SELECT policy allows all users to view departments) 