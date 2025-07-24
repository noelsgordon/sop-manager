-- Apply RLS to invite_codes table (Least Critical)
-- Run this in Supabase SQL Editor

-- Step 1: Enable RLS on invite_codes
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Step 2: Create RLS policies for invite_codes
-- All users can view invite codes (needed for signup process)
CREATE POLICY "Users can view invite codes" ON invite_codes
  FOR SELECT USING (true);

-- Only superadmins can manage invite codes
CREATE POLICY "Only superadmins can manage invite codes" ON invite_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND is_superadmin = true
    )
  );

-- Step 3: Verify the policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'invite_codes'
ORDER BY policyname;

-- Step 4: Test the policies
-- This should return all invite codes (SELECT policy allows all authenticated users)
SELECT COUNT(*) as total_invite_codes FROM invite_codes;

-- Step 5: Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'invite_codes'; 