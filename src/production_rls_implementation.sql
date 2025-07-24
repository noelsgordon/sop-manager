-- Production RLS Implementation
-- Based on successful testing, implement RLS on all tables

-- =====================================================
-- STEP 1: Enable RLS on all tables
-- =====================================================

ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_steps ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: Create production policies for invite_codes
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
-- STEP 3: Create production policies for departments
-- =====================================================

-- Policy 1: Anyone can view departments
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
-- STEP 4: Create production policies for user_profiles
-- =====================================================

-- Policy 1: CRITICAL - Allow all authenticated users to view profiles
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
-- STEP 5: Create production policies for user_departments
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
-- STEP 6: Create production policies for sops
-- =====================================================

-- Policy 1: Users can view SOPs from their departments
CREATE POLICY "sops_select_policy" ON sops
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_departments 
            WHERE user_id = auth.uid() AND department_id = sops.department_id
        ) OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND is_superadmin = true
        )
    );

-- Policy 2: Users can create SOPs in their departments
CREATE POLICY "sops_insert_policy" ON sops
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_departments 
            WHERE user_id = auth.uid() AND department_id = sops.department_id
        )
    );

-- Policy 3: Users can update SOPs in their departments
CREATE POLICY "sops_update_policy" ON sops
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_departments 
            WHERE user_id = auth.uid() AND department_id = sops.department_id
        ) OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND is_superadmin = true
        )
    );

-- Policy 4: Only superadmins can delete SOPs
CREATE POLICY "sops_delete_policy" ON sops
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND is_superadmin = true
        )
    );

-- =====================================================
-- STEP 7: Create production policies for sop_steps
-- =====================================================

-- Policy 1: Users can view SOP steps from their departments
CREATE POLICY "sop_steps_select_policy" ON sop_steps
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_departments ud
            JOIN sops s ON ud.department_id = s.department_id
            WHERE ud.user_id = auth.uid() AND s.id = sop_steps.sop_id
        ) OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND is_superadmin = true
        )
    );

-- Policy 2: Users can create SOP steps in their departments
CREATE POLICY "sop_steps_insert_policy" ON sop_steps
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_departments ud
            JOIN sops s ON ud.department_id = s.department_id
            WHERE ud.user_id = auth.uid() AND s.id = sop_steps.sop_id
        )
    );

-- Policy 3: Users can update SOP steps in their departments
CREATE POLICY "sop_steps_update_policy" ON sop_steps
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_departments ud
            JOIN sops s ON ud.department_id = s.department_id
            WHERE ud.user_id = auth.uid() AND s.id = sop_steps.sop_id
        ) OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND is_superadmin = true
        )
    );

-- Policy 4: Only superadmins can delete SOP steps
CREATE POLICY "sop_steps_delete_policy" ON sop_steps
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND is_superadmin = true
        )
    );

-- =====================================================
-- STEP 8: Verify implementation
-- =====================================================

-- Check RLS status
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity = true THEN 'RLS ENABLED'
        ELSE 'RLS DISABLED'
    END as rls_status
FROM pg_tables 
WHERE tablename IN ('invite_codes', 'departments', 'user_profiles', 'user_departments', 'sops', 'sop_steps')
ORDER BY tablename;

-- Check policy count
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('invite_codes', 'departments', 'user_profiles', 'user_departments', 'sops', 'sop_steps')
GROUP BY tablename
ORDER BY tablename; 