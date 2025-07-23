-- Function to check column names in a table
CREATE OR REPLACE FUNCTION check_columns()
RETURNS TABLE (
    table_name text,
    has_company_id boolean,
    has_department_id boolean
) AS $$
BEGIN
    RETURN QUERY
    WITH table_columns AS (
        SELECT 
            c.table_name::text as table_name,
            string_agg(c.column_name::text, ',') as columns
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
        AND c.table_name IN ('sops', 'invite_codes')
        GROUP BY c.table_name
    )
    SELECT 
        tc.table_name,
        tc.columns LIKE '%company_id%' as has_company_id,
        tc.columns LIKE '%department_id%' as has_department_id
    FROM table_columns tc;
END;
$$ LANGUAGE plpgsql;

-- Run the check
SELECT * FROM check_columns(); 