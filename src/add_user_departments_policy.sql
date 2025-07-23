-- Enable RLS on user_departments table
ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own department assignments" ON user_departments;
DROP POLICY IF EXISTS "Superadmins can manage all department assignments" ON user_departments;
DROP POLICY IF EXISTS "Users can manage their own department assignments" ON user_departments;

-- Create policy for users to view their own department assignments
CREATE POLICY "Users can view their own department assignments"
ON user_departments FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_superadmin = true
  )
);

-- Create policy for superadmins to manage all department assignments
CREATE POLICY "Superadmins can manage all department assignments"
ON user_departments 
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_superadmin = true
  )
);

-- Create policy for users to manage their own department assignments
CREATE POLICY "Users can manage their own department assignments"
ON user_departments
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Create policy for users to delete their own department assignments
CREATE POLICY "Users can delete their own department assignments"
ON user_departments
FOR DELETE
TO authenticated
USING (user_id = auth.uid()); 