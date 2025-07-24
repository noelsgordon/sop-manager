-- Debug Test Data - Check current state
-- Run this in Supabase SQL Editor

-- Check what data exists in test tables
SELECT 'test_user_profiles' as table_name, COUNT(*) as count FROM test_user_profiles
UNION ALL
SELECT 'test_departments' as table_name, COUNT(*) as count FROM test_departments
UNION ALL
SELECT 'test_user_departments' as table_name, COUNT(*) as count FROM test_user_departments
UNION ALL
SELECT 'test_invite_codes' as table_name, COUNT(*) as count FROM test_invite_codes
UNION ALL
SELECT 'test_sops' as table_name, COUNT(*) as count FROM test_sops
UNION ALL
SELECT 'test_sop_steps' as table_name, COUNT(*) as count FROM test_sop_steps;

-- Check the structure of test_user_profiles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'test_user_profiles'
ORDER BY ordinal_position;

-- Check the structure of test_departments
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'test_departments'
ORDER BY ordinal_position;

-- Check the structure of test_user_departments
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'test_user_departments'
ORDER BY ordinal_position;

-- Check the structure of test_invite_codes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'test_invite_codes'
ORDER BY ordinal_position;

-- Check the structure of test_sops
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'test_sops'
ORDER BY ordinal_position;

-- Check the structure of test_sop_steps
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'test_sop_steps'
ORDER BY ordinal_position; 