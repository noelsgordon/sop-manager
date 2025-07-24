-- Check existing user_departments records
SELECT 
    user_id,
    department_id,
    role,
    created_at
FROM user_departments 
ORDER BY created_at DESC; 