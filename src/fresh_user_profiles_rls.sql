-- Fresh RLS Implementation for user_profiles
-- CRITICAL TABLE - This affects login functionality
-- Must ensure SELECT policy allows login flow to work

-- =====================================================
-- STEP 1: Enable RLS on user_profiles
-- =====================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: Create simple, tested policies
-- =====================================================

-- Policy 1: CRITICAL - Allow all authenticated users to view profiles
-- This is essential for login flow to work
CREATE POLICY "user_profiles_select_policy" ON user_profiles
    FOR SELECT USING (true);

-- Policy 2: Users can only insert their own profile
CREATE POLICY "user_profiles_insert_policy" ON user_profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy 3: Users can only update their own profile
CREATE POLICY "user_profiles_update_policy" ON user_profiles
    FOR UPDATE USING (user_id = auth.uid());

-- Policy 4: Only superadmins can delete profiles
CREATE POLICY "user_profiles_delete_policy" ON user_profiles
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
WHERE tablename = 'user_profiles';

-- Check policies were created
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Test access (should work)
SELECT 'user_profiles' as table_name, COUNT(*) as record_count FROM user_profiles; 