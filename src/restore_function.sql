-- Drop existing function if it exists
DROP FUNCTION IF EXISTS restore_sop(uuid);

-- Create new restore_sop function with fully qualified names
CREATE OR REPLACE FUNCTION public.restore_sop(target_sop_id uuid)
RETURNS void AS $$
BEGIN
    -- Restore the SOP
    UPDATE public.sops
    SET deleted_at = NULL
    WHERE public.sops.id = target_sop_id;

    -- Restore all associated steps
    UPDATE public.sop_steps
    SET deleted_at = NULL
    WHERE public.sop_steps.sop_id = target_sop_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.restore_sop(uuid) TO authenticated; 