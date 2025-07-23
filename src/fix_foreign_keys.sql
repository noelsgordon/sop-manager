-- Begin transaction
BEGIN;

-- First ensure the departments table exists with proper structure
CREATE TABLE IF NOT EXISTS departments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Drop existing foreign key if it exists
ALTER TABLE user_departments
    DROP CONSTRAINT IF EXISTS user_departments_department_id_fkey;

-- Add the foreign key constraint
ALTER TABLE user_departments
    ADD CONSTRAINT user_departments_department_id_fkey 
    FOREIGN KEY (department_id) REFERENCES departments(id)
    ON DELETE CASCADE;

-- Create index for better join performance
CREATE INDEX IF NOT EXISTS idx_user_departments_department_id 
    ON user_departments(department_id);

-- Commit transaction
COMMIT; 