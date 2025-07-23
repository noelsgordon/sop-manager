-- Function to clean up invite codes and fix roles
CREATE OR REPLACE FUNCTION cleanup_invite_codes()
RETURNS void AS $$
DECLARE
    orphaned_count INTEGER;
    role_count INTEGER;
BEGIN
    -- Start transaction
    BEGIN
        -- Delete orphaned invites (where department doesn't exist)
        WITH orphaned_invites AS (
            SELECT ic.id
            FROM invite_codes ic
            LEFT JOIN departments d ON d.id = ic.department_id
            WHERE d.id IS NULL
        )
        DELETE FROM invite_codes
        WHERE id IN (SELECT id FROM orphaned_invites)
        RETURNING id INTO orphaned_count;

        -- Update roles to new format (case-insensitive)
        WITH role_updates AS (
            UPDATE invite_codes
            SET role = CASE 
                WHEN LOWER(role) = 'viewer' THEN 'look'
                WHEN LOWER(role) = 'updater' THEN 'tweak'
                WHEN LOWER(role) = 'creator' THEN 'build'
                WHEN LOWER(role) = 'admin' THEN 'manage'
                WHEN LOWER(role) = 'superadmin' THEN 'super'
                ELSE role
            END
            WHERE role NOT IN ('look', 'tweak', 'build', 'manage', 'super')
            RETURNING id
        )
        SELECT COUNT(*) INTO role_count FROM role_updates;

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

        -- Log results
        RAISE NOTICE 'Cleanup complete: Deleted % orphaned invites, Updated % roles', 
            COALESCE(orphaned_count, 0), 
            COALESCE(role_count, 0);

    -- Commit transaction
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error during cleanup: %', SQLERRM;
        RAISE;
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to verify invite codes
CREATE OR REPLACE FUNCTION verify_invite_codes()
RETURNS TABLE (
    invalid_roles bigint,
    orphaned_invites bigint,
    total_invites bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) 
         FROM invite_codes 
         WHERE role NOT IN ('look', 'tweak', 'build', 'manage', 'super')) as invalid_roles,
        (SELECT COUNT(*) 
         FROM invite_codes ic
         LEFT JOIN departments d ON d.id = ic.department_id
         WHERE d.id IS NULL) as orphaned_invites,
        (SELECT COUNT(*) FROM invite_codes) as total_invites;
END;
$$ LANGUAGE plpgsql; 