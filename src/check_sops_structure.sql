-- Check actual column names for sops and sop_steps
-- This will help us fix the RLS Test Environment

-- Check sops table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'sops' 
ORDER BY ordinal_position;

-- Check sop_steps table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'sop_steps' 
ORDER BY ordinal_position;

-- Check sample data to understand structure
SELECT 
    id,
    name,
    department_id,
    created_by,
    created_at
FROM sops 
LIMIT 1;

-- Check sop_steps sample data
SELECT 
    id,
    sop_id,
    step_number,
    instruction,
    created_at
FROM sop_steps 
LIMIT 1; 