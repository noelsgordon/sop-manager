-- Check existing user_departments records (FIXED)
SELECT 
    user_id,
    department_id,
    role
FROM user_departments 
ORDER BY user_id; 