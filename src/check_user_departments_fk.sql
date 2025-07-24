-- Check foreign key constraints on user_departments table
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='user_departments';

-- Also check what tables exist that might be referenced
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name LIKE '%user%' 
    OR table_name LIKE '%company%'
ORDER BY table_name;

-- Check if there's a user_companies table
SELECT * FROM user_companies LIMIT 5; 