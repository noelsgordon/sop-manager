-- Enable RLS on all tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;

-- Add unique constraint to invite_codes
ALTER TABLE invite_codes ADD CONSTRAINT invite_codes_code_key UNIQUE (code);

-- Departments policies
CREATE POLICY "Users can view departments they belong to"
ON departments FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT department_id 
    FROM user_departments 
    WHERE user_id = auth.uid()
  )
  OR
  -- Allow viewing Default Department
  name = 'Default Department'
);

CREATE POLICY "Super users can create departments"
ON departments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM user_departments 
    WHERE user_id = auth.uid() 
    AND role = 'super'
  )
  OR
  -- Allow new users to create their first department
  NOT EXISTS (
    SELECT 1 
    FROM user_departments 
    WHERE user_id = auth.uid()
  )
);

-- User_departments policies
CREATE POLICY "Users can view their own department assignments"
ON user_departments FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Super users can manage department assignments"
ON user_departments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM user_departments 
    WHERE user_id = auth.uid() 
    AND role = 'super'
  )
);

-- Allow new users to join departments
CREATE POLICY "Users can join departments with invite codes"
ON user_departments FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow joining with invite code
  EXISTS (
    SELECT 1 
    FROM invite_codes 
    WHERE department_id = NEW.department_id 
    AND email = (
      SELECT email 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  )
  OR
  -- Allow new users to create and join their first department
  (
    NOT EXISTS (
      SELECT 1 
      FROM user_departments 
      WHERE user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 
      FROM departments 
      WHERE department_id = NEW.department_id
      AND created_by = auth.uid()
    )
  )
);

-- Invite_codes policies
-- Remove the old policies first
DROP POLICY IF EXISTS "Users can view invite codes for their departments" ON invite_codes;
DROP POLICY IF EXISTS "Users can view invite codes meant for them" ON invite_codes;

CREATE POLICY "Users can view relevant invite codes"
ON invite_codes FOR SELECT
TO authenticated
USING (
  -- Can view if the invite code is meant for their email
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR
  -- Can view if they are a manager/super in the department
  department_id IN (
    SELECT department_id 
    FROM user_departments 
    WHERE user_id = auth.uid()
    AND role IN ('manage', 'super')
  )
);

CREATE POLICY "Users can create invite codes for their departments"
ON invite_codes FOR INSERT
TO authenticated
WITH CHECK (
  department_id IN (
    SELECT department_id 
    FROM user_departments 
    WHERE user_id = auth.uid()
    AND role IN ('manage', 'super')
  )
);

CREATE POLICY "Users can delete invite codes for their departments"
ON invite_codes FOR DELETE
TO authenticated
USING (
  department_id IN (
    SELECT department_id 
    FROM user_departments 
    WHERE user_id = auth.uid()
    AND role IN ('manage', 'super')
  )
);

-- SOPs policies
CREATE POLICY "Users can view SOPs in their departments"
ON sops FOR SELECT
TO authenticated
USING (
  department_id IN (
    SELECT department_id 
    FROM user_departments 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create SOPs in their departments"
ON sops FOR INSERT
TO authenticated
WITH CHECK (
  department_id IN (
    SELECT department_id 
    FROM user_departments 
    WHERE user_id = auth.uid()
    AND role IN ('build', 'manage', 'super')
  )
);

CREATE POLICY "Users can update SOPs in their departments"
ON sops FOR UPDATE
TO authenticated
USING (
  department_id IN (
    SELECT department_id 
    FROM user_departments 
    WHERE user_id = auth.uid()
    AND role IN ('build', 'manage', 'super')
  )
);

CREATE POLICY "Users can delete SOPs in their departments"
ON sops FOR DELETE
TO authenticated
USING (
  department_id IN (
    SELECT department_id 
    FROM user_departments 
    WHERE user_id = auth.uid()
    AND role IN ('build', 'manage', 'super')
  )
); 