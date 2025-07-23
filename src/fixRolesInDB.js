import { supabase } from './supabaseClient.js';

async function fixRolesInDB() {
  console.log('Starting database role fix...\n');

  try {
    // 1. Create the function to normalize roles
    console.log('1. Creating normalize_roles function...');
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION normalize_roles()
      RETURNS void AS $$
      BEGIN
        -- Update invite_codes table
        UPDATE invite_codes
        SET role = CASE 
          WHEN LOWER(role) = 'viewer' THEN 'look'
          WHEN LOWER(role) = 'updater' THEN 'tweak'
          WHEN LOWER(role) = 'creator' THEN 'build'
          WHEN LOWER(role) = 'admin' THEN 'manage'
          WHEN LOWER(role) = 'superadmin' THEN 'super'
          ELSE LOWER(role)
        END
        WHERE role NOT IN ('look', 'tweak', 'build', 'manage', 'super');

        -- Update user_departments table
        UPDATE user_departments
        SET role = CASE 
          WHEN LOWER(role) = 'viewer' THEN 'look'
          WHEN LOWER(role) = 'updater' THEN 'tweak'
          WHEN LOWER(role) = 'creator' THEN 'build'
          WHEN LOWER(role) = 'admin' THEN 'manage'
          WHEN LOWER(role) = 'superadmin' THEN 'super'
          ELSE LOWER(role)
        END
        WHERE role NOT IN ('look', 'tweak', 'build', 'manage', 'super');
      END;
      $$ LANGUAGE plpgsql;
    `;

    // 2. Call the function
    console.log('2. Running normalize_roles function...');
    const { error: rpcError } = await supabase.rpc('normalize_roles');

    if (rpcError) {
      console.error('Failed to normalize roles:', rpcError.message);
      return;
    }

    console.log('✓ Roles normalized successfully');

    // 3. Verify the results
    console.log('\n3. Verifying results...');
    
    // Check invite_codes
    const { data: invites, error: inviteError } = await supabase
      .from('invite_codes')
      .select('role');

    if (inviteError) {
      console.error('Failed to check invite_codes:', inviteError.message);
    } else {
      const inviteRoles = [...new Set(invites.map(i => i.role))];
      console.log('Invite code roles:', inviteRoles);
    }

    // Check user_departments
    const { data: userDepts, error: deptError } = await supabase
      .from('user_departments')
      .select('role');

    if (deptError) {
      console.error('Failed to check user_departments:', deptError.message);
    } else {
      const deptRoles = [...new Set(userDepts.map(d => d.role))];
      console.log('User department roles:', deptRoles);
    }

  } catch (error) {
    console.error('Script failed:', error.message);
  }
}

fixRolesInDB(); 