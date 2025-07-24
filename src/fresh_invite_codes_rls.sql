-- Fresh RLS Implementation for invite_codes
-- This is our first test - simple and safe

-- =====================================================
-- STEP 1: Enable RLS on invite_codes
-- =====================================================

ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: Create simple, tested policies
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
-- STEP 3: Verify implementation
-- =====================================================

-- Check RLS is enabled
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity = true THEN 'RLS ENABLED'
        ELSE 'RLS DISABLED'
    END as rls_status
FROM pg_tables 
WHERE tablename = 'invite_codes';

-- Check policies were created
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'invite_codes'
ORDER BY policyname;

-- Test access (should work)
SELECT 'invite_codes' as table_name, COUNT(*) as record_count FROM invite_codes; 