-- 🔧 Create exec_sql function for Supabase
-- This function allows running custom SQL queries from Python scripts

-- Drop the function if it already exists
DROP FUNCTION IF EXISTS public.exec_sql(text);

-- Create the exec_sql function
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    -- Execute the dynamic SQL and return results as JSON
    EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || sql_query || ') t' INTO result;
    
    -- Return the result, or empty array if null
    RETURN COALESCE(result, '[]'::json);
EXCEPTION
    WHEN OTHERS THEN
        -- Return error information as JSON
        RETURN json_build_object(
            'error', SQLERRM,
            'sql_state', SQLSTATE,
            'detail', SQLERRM
        );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;

-- Grant execute permission to service role (for your Python scripts)
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;

-- Test the function with a simple query
SELECT public.exec_sql('SELECT COUNT(*) as total_records FROM part_images');

-- Show function creation confirmation
SELECT 
    'exec_sql function created successfully!' as status,
    'You can now use supabase.rpc(''exec_sql'', {''sql_query'': ''YOUR_SQL_HERE''})' as usage_example; 