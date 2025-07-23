-- Function to check exact role values
CREATE OR REPLACE FUNCTION check_exact_roles()
RETURNS TABLE (
    role text,
    role_length int,
    has_spaces boolean,
    exact_value text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ud.role::text,
        LENGTH(ud.role)::int,
        (ud.role LIKE '% %')::boolean,
        quote_literal(ud.role)::text
    FROM user_departments ud
    WHERE ud.role IS NOT NULL
    GROUP BY ud.role
    ORDER BY ud.role;
END;
$$ LANGUAGE plpgsql;

-- Run the check
SELECT * FROM check_exact_roles(); 