-- Function to normalize invite code roles
CREATE OR REPLACE FUNCTION normalize_invite_roles()
RETURNS void AS $$
BEGIN
    -- Update roles to lowercase
    UPDATE invite_codes
    SET role = LOWER(role)
    WHERE role != LOWER(role);

    -- Update any remaining non-standard roles
    UPDATE invite_codes
    SET role = CASE 
        WHEN LOWER(role) = 'viewer' THEN 'look'
        WHEN LOWER(role) = 'updater' THEN 'tweak'
        WHEN LOWER(role) = 'creator' THEN 'build'
        WHEN LOWER(role) = 'admin' THEN 'manage'
        WHEN LOWER(role) = 'superadmin' THEN 'super'
        ELSE role
    END
    WHERE role NOT IN ('look', 'tweak', 'build', 'manage', 'super');

    -- Add role constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'invite_codes_role_check'
    ) THEN
        ALTER TABLE invite_codes
        ADD CONSTRAINT invite_codes_role_check
        CHECK (role IN ('look', 'tweak', 'build', 'manage', 'super'));
    END IF;
END;
$$ LANGUAGE plpgsql; 