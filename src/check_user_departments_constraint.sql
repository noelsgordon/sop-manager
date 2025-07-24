-- Check constraints on test_user_departments table
-- Run this in Supabase SQL Editor

-- Check the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'test_user_departments'
ORDER BY ordinal_position;

-- Check for unique constraints
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'test_user_departments'
    AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY');

-- Check for indexes
SELECT 
    indexname, 
    indexdef
FROM pg_indexes 
WHERE tablename = 'test_user_departments';

-- Check current data in test_user_departments
SELECT * FROM test_user_departments; 