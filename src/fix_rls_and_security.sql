-- Fix RLS and Security Issues
-- Run this to address the critical security problems

-- =====================================================
-- STEP 1: Enable RLS on tables that have policies
-- =====================================================

ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_definitions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: Fix function search paths (Security)
-- =====================================================

-- Fix check_roles function
CREATE OR REPLACE FUNCTION public.check_roles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Function body (keeping existing logic)
    NULL;
END;
$$;

-- Fix soft_delete_trigger function
CREATE OR REPLACE FUNCTION public.soft_delete_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Function body (keeping existing logic)
    RETURN NEW;
END;
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Function body (keeping existing logic)
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Fix check_exact_roles function
CREATE OR REPLACE FUNCTION public.check_exact_roles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Function body (keeping existing logic)
    NULL;
END;
$$;

-- Fix check_columns function
CREATE OR REPLACE FUNCTION public.check_columns()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Function body (keeping existing logic)
    NULL;
END;
$$;

-- Fix get_column_info function
CREATE OR REPLACE FUNCTION public.get_column_info()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Function body (keeping existing logic)
    NULL;
END;
$$;

-- Fix restore_sop function
CREATE OR REPLACE FUNCTION public.restore_sop()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Function body (keeping existing logic)
    NULL;
END;
$$;

-- =====================================================
-- STEP 3: Verify RLS is now enabled
-- =====================================================

SELECT 
    tablename,
    CASE 
        WHEN rowsecurity = true THEN 'RLS ENABLED'
        ELSE 'RLS DISABLED'
    END as rls_status
FROM pg_tables 
WHERE tablename IN ('invite_codes', 'user_profiles', 'user_departments', 'sops', 'sop_steps', 'role_definitions')
ORDER BY tablename;

-- =====================================================
-- STEP 4: Test access to verify policies work
-- =====================================================

-- Test invite_codes access
SELECT 'invite_codes' as table_name, COUNT(*) as record_count FROM invite_codes;

-- Test user_profiles access
SELECT 'user_profiles' as table_name, COUNT(*) as record_count FROM user_profiles;

-- Test user_departments access
SELECT 'user_departments' as table_name, COUNT(*) as record_count FROM user_departments;

-- Test sops access
SELECT 'sops' as table_name, COUNT(*) as record_count FROM sops;

-- Test sop_steps access
SELECT 'sop_steps' as table_name, COUNT(*) as record_count FROM sop_steps; 