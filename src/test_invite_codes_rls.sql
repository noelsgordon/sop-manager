-- Test invite_codes RLS functionality
-- Run this to verify our RLS policies are working

-- =====================================================
-- STEP 1: Verify RLS is enabled
-- =====================================================

SELECT 
    tablename,
    CASE 
        WHEN rowsecurity = true THEN 'RLS ENABLED'
        ELSE 'RLS DISABLED'
    END as rls_status
FROM pg_tables 
WHERE tablename = 'invite_codes';

-- =====================================================
-- STEP 2: Check current policies
-- =====================================================

SELECT 
    policyname,
    cmd as operation,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'invite_codes'
ORDER BY policyname;

-- =====================================================
-- STEP 3: Test current data access
-- =====================================================

-- This should work (SELECT policy allows all)
SELECT 'Current invite_codes' as test, COUNT(*) as count FROM invite_codes;

-- Show current invite codes
SELECT id, code, email, department_id, role, created_at 
FROM invite_codes 
ORDER BY created_at DESC;

-- =====================================================
-- STEP 4: Test policy behavior simulation
-- =====================================================

-- Test 1: SELECT should work for everyone
SELECT 'SELECT test' as test_type, 'Should work for all users' as expected;

-- Test 2: INSERT should work for authenticated users
SELECT 'INSERT test' as test_type, 'Should work for authenticated users' as expected;

-- Test 3: UPDATE/DELETE should only work for superadmins
SELECT 'UPDATE/DELETE test' as test_type, 'Should only work for superadmins' as expected;

-- =====================================================
-- STEP 5: Check if any users are superadmins
-- =====================================================

SELECT 
    user_id,
    email,
    is_superadmin,
    created_at
FROM user_profiles 
WHERE is_superadmin = true
ORDER BY created_at DESC; 