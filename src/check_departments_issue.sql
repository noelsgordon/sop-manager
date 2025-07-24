-- Check departments table structure and constraints
-- Run this in Supabase SQL Editor

-- Check the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'test_departments'
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
WHERE tc.table_name = 'test_departments'
    AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY');

-- Check current data in test_departments
SELECT * FROM test_departments;

-- Check if there are any foreign key constraints
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'test_departments'; 