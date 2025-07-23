-- Function to check current roles
CREATE OR REPLACE FUNCTION check_roles()
RETURNS TABLE (
    role text,
    count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ud.role::text,
        COUNT(*)::bigint
    FROM user_departments ud
    WHERE ud.role IS NOT NULL
    GROUP BY ud.role
    ORDER BY ud.role;
END;
$$ LANGUAGE plpgsql;

-- Run the check
SELECT * FROM check_roles(); 