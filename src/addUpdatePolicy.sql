-- Add update policy for invite codes
CREATE POLICY "Users can update invite codes for their departments"
ON invite_codes FOR UPDATE
TO authenticated
USING (
  department_id IN (
    SELECT department_id 
    FROM user_departments 
    WHERE user_id = auth.uid()
    AND role IN ('manage', 'super')
  )
)
WITH CHECK (
  department_id IN (
    SELECT department_id 
    FROM user_departments 
    WHERE user_id = auth.uid()
    AND role IN ('manage', 'super')
  )
); 