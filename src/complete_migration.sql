-- Begin transaction
BEGIN;

-- 1. First, drop the existing constraint
ALTER TABLE user_departments 
DROP CONSTRAINT user_companies_role_check;

-- 2. Add temporary constraint that allows both old and new values
ALTER TABLE user_departments 
ADD CONSTRAINT user_departments_role_check 
CHECK (role = ANY (ARRAY[
    -- Old values
    'viewer', 'creator', 'admin',
    -- New values
    'look', 'build', 'manage', 'tweak', 'super'
]::text[]));

-- 3. Update roles
UPDATE user_departments SET role = 'look' WHERE role = 'viewer';
UPDATE user_departments SET role = 'build' WHERE role = 'creator';
UPDATE user_departments SET role = 'manage' WHERE role = 'admin';

-- 4. Now that roles are updated, tighten the constraint to only allow new values
ALTER TABLE user_departments 
DROP CONSTRAINT user_departments_role_check;

ALTER TABLE user_departments 
ADD CONSTRAINT user_departments_role_check 
CHECK (role = ANY (ARRAY[
    'look', 'build', 'manage', 'tweak', 'super'
]::text[]));

-- Debug: Show final role distribution
SELECT role, COUNT(*) FROM user_departments GROUP BY role;

-- Commit transaction
COMMIT; 