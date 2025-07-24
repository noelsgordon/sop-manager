-- Clean up existing invite_codes policies and start fresh
-- Run this to remove all existing policies first

-- =====================================================
-- STEP 1: Drop all existing invite_codes policies
-- =====================================================

DROP POLICY IF EXISTS "invite_codes_select_policy" ON invite_codes;
DROP POLICY IF EXISTS "invite_codes_insert_policy" ON invite_codes;
DROP POLICY IF EXISTS "invite_codes_update_policy" ON invite_codes;
DROP POLICY IF EXISTS "invite_codes_delete_policy" ON invite_codes;

-- Also drop any other invite_codes policies that might exist
DROP POLICY IF EXISTS "Allow anyone to check invite code" ON invite_codes;
DROP POLICY IF EXISTS "Allow creators to delete their invites" ON invite_codes;
DROP POLICY IF EXISTS "Allow creators to insert invites" ON invite_codes;
DROP POLICY IF EXISTS "Allow creators to view their invites" ON invite_codes;
DROP POLICY IF EXISTS "Allow invite creator to manage their codes" ON invite_codes;
DROP POLICY IF EXISTS "Allow public lookup of invite codes" ON invite_codes;

-- =====================================================
-- STEP 2: Verify all policies are dropped
-- =====================================================

SELECT 
    policyname,
    cmd as operation
FROM pg_policies 
WHERE tablename = 'invite_codes'
ORDER BY policyname;

-- =====================================================
-- STEP 3: Now create fresh policies
-- =====================================================

-- Policy 1: Anyone can view invite codes (for checking validity)
CREATE POLICY "invite_codes_select_policy" ON invite_codes
    FOR SELECT USING (true);

-- Policy 2: Only authenticated users can create invite codes
CREATE POLICY "invite_codes_insert_policy" ON invite_codes
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 3: Only superadmins can update invite codes
CREATE POLICY "invite_codes_update_policy" ON invite_codes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND is_superadmin = true
        )
    );

-- Policy 4: Only superadmins can delete invite codes
CREATE POLICY "invite_codes_delete_policy" ON invite_codes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND is_superadmin = true
        )
    );

-- =====================================================
-- STEP 4: Verify fresh policies are created
-- =====================================================

SELECT 
    policyname,
    cmd as operation,
    qual as using_clause
FROM pg_policies 
WHERE tablename = 'invite_codes'
ORDER BY policyname;

-- =====================================================
-- STEP 5: Test access
-- =====================================================

SELECT 'invite_codes' as table_name, COUNT(*) as record_count FROM invite_codes; 