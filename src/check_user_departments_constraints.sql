-- Check unique constraints on user_departments table
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    tc.constraint_type
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'user_departments'
    AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
ORDER BY tc.constraint_name;

-- Check existing user_departments records to understand the pattern
SELECT 
    user_id, 
    department_id, 
    role, 
    COUNT(*) as count
FROM user_departments 
GROUP BY user_id, department_id, role
ORDER BY count DESC;

-- Check if there are any users that don't have this department
SELECT 
    up.user_id,
    up.email,
    ud.department_id,
    ud.role
FROM user_profiles up
LEFT JOIN user_departments ud ON up.user_id = ud.user_id 
    AND ud.department_id = '47133618-13ed-4103-8c71-e0a2417a5d23'
WHERE ud.user_id IS NULL
LIMIT 5; 