import { supabase } from './supabaseClient.js';

async function fixRolesInDBV3() {
  console.log('Starting database role fix (v3)...\n');

  try {
    // 1. Get all invite codes with invalid roles
    console.log('1. Checking invite codes...');
    const { data: invites, error: inviteError } = await supabase
      .from('invite_codes')
      .select('id, role, department_id')
      .not('role', 'in', '(look,tweak,build,manage,super)');

    if (inviteError) {
      console.error('Failed to fetch invite codes:', inviteError.message);
    } else {
      console.log(`Found ${invites?.length || 0} invite codes with invalid roles`);

      // Update each invite code
      if (invites && invites.length > 0) {
        console.log('\nUpdating invite codes...');
        for (const invite of invites) {
          const oldRole = invite.role;
          let newRole = oldRole.toLowerCase();

          // Map roles
          switch (newRole) {
            case 'viewer': newRole = 'look'; break;
            case 'updater': newRole = 'tweak'; break;
            case 'creator': newRole = 'build'; break;
            case 'admin': newRole = 'manage'; break;
            case 'superadmin': newRole = 'super'; break;
          }

          if (newRole !== oldRole) {
            console.log(`Updating invite ${invite.id}: ${oldRole} -> ${newRole}`);
            
            // First check if we can read the invite
            const { data: checkData, error: checkError } = await supabase
              .from('invite_codes')
              .select('role')
              .eq('id', invite.id)
              .single();

            if (checkError) {
              console.error(`Cannot read invite ${invite.id}:`, checkError.message);
              continue;
            }

            // Then try to update it
            const { error: updateError } = await supabase
              .from('invite_codes')
              .update({ role: newRole })
              .eq('id', invite.id);

            if (updateError) {
              console.error(`Failed to update invite ${invite.id}:`, updateError.message);
            } else {
              // Verify the update
              const { data: verifyData, error: verifyError } = await supabase
                .from('invite_codes')
                .select('role')
                .eq('id', invite.id)
                .single();

              if (verifyError) {
                console.error(`Failed to verify invite ${invite.id}:`, verifyError.message);
              } else {
                console.log(`- New role: ${verifyData.role}`);
              }
            }
          }
        }
      }
    }

    // 2. Get all user_departments with invalid roles
    console.log('\n2. Checking user_departments...');
    const { data: userDepts, error: deptError } = await supabase
      .from('user_departments')
      .select('user_id, department_id, role')
      .not('role', 'in', '(look,tweak,build,manage,super)');

    if (deptError) {
      console.error('Failed to fetch user_departments:', deptError.message);
    } else {
      console.log(`Found ${userDepts?.length || 0} user_departments with invalid roles`);

      // Update each user_department
      if (userDepts && userDepts.length > 0) {
        console.log('\nUpdating user_departments...');
        for (const dept of userDepts) {
          const oldRole = dept.role;
          let newRole = oldRole.toLowerCase();

          // Map roles
          switch (newRole) {
            case 'viewer': newRole = 'look'; break;
            case 'updater': newRole = 'tweak'; break;
            case 'creator': newRole = 'build'; break;
            case 'admin': newRole = 'manage'; break;
            case 'superadmin': newRole = 'super'; break;
          }

          if (newRole !== oldRole) {
            console.log(`Updating user_department for user ${dept.user_id} in department ${dept.department_id}: ${oldRole} -> ${newRole}`);
            
            const { error: updateError } = await supabase
              .from('user_departments')
              .update({ role: newRole })
              .eq('user_id', dept.user_id)
              .eq('department_id', dept.department_id);

            if (updateError) {
              console.error(`Failed to update user_department:`, updateError.message);
            } else {
              console.log('✓ Updated successfully');
            }
          }
        }
      }
    }

    // 3. Final verification
    console.log('\n3. Final verification...');
    
    // Check invite_codes
    const { data: finalInvites, error: finalInviteError } = await supabase
      .from('invite_codes')
      .select('role');

    if (finalInviteError) {
      console.error('Failed to check invite_codes:', finalInviteError.message);
    } else {
      const inviteRoles = [...new Set(finalInvites.map(i => i.role))];
      console.log('Current invite code roles:', inviteRoles);
    }

    // Check user_departments
    const { data: finalUserDepts, error: finalDeptError } = await supabase
      .from('user_departments')
      .select('role');

    if (finalDeptError) {
      console.error('Failed to check user_departments:', finalDeptError.message);
    } else {
      const deptRoles = [...new Set(finalUserDepts.map(d => d.role))];
      console.log('Current user department roles:', deptRoles);
    }

  } catch (error) {
    console.error('Script failed:', error.message);
  }
}

fixRolesInDBV3(); 