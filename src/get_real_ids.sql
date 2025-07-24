-- Get real department and SOP IDs for testing
-- This will help us use valid foreign keys

-- Get existing department IDs
SELECT 
    department_id,
    name,
    created_at
FROM departments 
ORDER BY created_at DESC;

-- Get existing SOP IDs
SELECT 
    id,
    name,
    department_id,
    created_at
FROM sops 
ORDER BY created_at DESC 
LIMIT 5; 