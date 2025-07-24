-- Fresh RLS Implementation for user_departments
-- This is our third table - building on previous successes

-- =====================================================
-- STEP 1: Enable RLS on user_departments
-- =====================================================

ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: Create simple, tested policies
-- =====================================================

-- Policy 1: Users can view their own department memberships
CREATE POLICY "user_departments_select_policy" ON user_departments
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND is_superadmin = true
        )
    );

-- Policy 2: Only authenticated users can create department memberships
CREATE POLICY "user_departments_insert_policy" ON user_departments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 3: Only superadmins can update department memberships
CREATE POLICY "user_departments_update_policy" ON user_departments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND is_superadmin = true
        )
    );

-- Policy 4: Only superadmins can delete department memberships
CREATE POLICY "user_departments_delete_policy" ON user_departments
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
WHERE tablename = 'user_departments';

-- Check policies were created
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_departments'
ORDER BY policyname;

-- Test access (should work)
SELECT 'user_departments' as table_name, COUNT(*) as record_count FROM user_departments; 