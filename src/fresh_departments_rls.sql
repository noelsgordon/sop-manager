-- Fresh RLS Implementation for departments
-- This is our second table - building on invite_codes success

-- =====================================================
-- STEP 1: Enable RLS on departments
-- =====================================================

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: Create simple, tested policies
-- =====================================================

-- Policy 1: Anyone can view departments (for browsing)
CREATE POLICY "departments_select_policy" ON departments
    FOR SELECT USING (true);

-- Policy 2: Only authenticated users can create departments
CREATE POLICY "departments_insert_policy" ON departments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 3: Only superadmins can update departments
CREATE POLICY "departments_update_policy" ON departments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND is_superadmin = true
        )
    );

-- Policy 4: Only superadmins can delete departments
CREATE POLICY "departments_delete_policy" ON departments
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
WHERE tablename = 'departments';

-- Check policies were created
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'departments'
ORDER BY policyname;

-- Test access (should work)
SELECT 'departments' as table_name, COUNT(*) as record_count FROM departments; 