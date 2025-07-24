-- Simple RLS Status Check
-- Run this to see what's currently active

-- Check which tables have RLS enabled
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity = true THEN 'RLS ENABLED'
        ELSE 'RLS DISABLED'
    END as rls_status
FROM pg_tables 
WHERE tablename IN ('user_profiles', 'user_departments', 'departments', 'invite_codes', 'sops', 'sop_steps')
ORDER BY tablename;

-- Check active policies
SELECT 
    tablename,
    policyname,
    cmd as operation
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'user_departments', 'departments', 'invite_codes', 'sops', 'sop_steps')
ORDER BY tablename, policyname; 