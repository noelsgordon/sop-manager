import { supabase } from './supabaseClient.js';

async function fixInviteCodesV2() {
  console.log('Starting invite codes fix (v2)...\n');

  try {
    // 1. Get all invite codes
    console.log('1. Fetching invite codes...');
    const { data: invites, error: fetchError } = await supabase
      .from('invite_codes')
      .select('*');

    if (fetchError) {
      throw new Error(`Failed to fetch invite codes: ${fetchError.message}`);
    }

    console.log(`Found ${invites?.length || 0} invite codes`);

    // 2. Update each invite code individually
    if (invites && invites.length > 0) {
      console.log('\n2. Updating roles...');
      
      const roleMap = {
        'viewer': 'look',
        'updater': 'tweak',
        'creator': 'build',
        'admin': 'manage',
        'superadmin': 'super'
      };

      for (const invite of invites) {
        const currentRole = invite.role.toLowerCase();
        const newRole = roleMap[currentRole] || currentRole;
        
        if (newRole !== invite.role) {
          console.log(`\nUpdating invite ${invite.id}:`);
          console.log(`- Current role: "${invite.role}"`);
          console.log(`- New role: "${newRole}"`);
          
          // First try to read the invite
          const { data: checkData, error: checkError } = await supabase
            .from('invite_codes')
            .select('role')
            .eq('id', invite.id)
            .single();

          if (checkError) {
            console.error(`Failed to read invite ${invite.id}:`, checkError.message);
            continue;
          }

          console.log(`- Verified current role: "${checkData.role}"`);
          
          // Then update it
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
              console.log(`- Updated role: "${verifyData.role}"`);
              if (verifyData.role !== newRole) {
                console.error(`❌ Update failed: Role is still "${verifyData.role}"`);
              } else {
                console.log('✓ Update successful');
              }
            }
          }
        }
      }
    }

    // 3. Final verification
    console.log('\n3. Final verification...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('invite_codes')
      .select('role');

    if (verifyError) {
      throw new Error(`Failed to verify: ${verifyError.message}`);
    }

    const roles = [...new Set(verifyData.map(d => d.role))];
    console.log('Current roles in use:', roles);

    const validRoles = ['look', 'tweak', 'build', 'manage', 'super'];
    const invalidRoles = roles.filter(role => !validRoles.includes(role));

    if (invalidRoles.length > 0) {
      console.log('⚠️ Found invalid roles:', invalidRoles);
    } else {
      console.log('✓ All roles are valid');
    }

  } catch (error) {
    console.error('\n❌ Fix failed:', error.message);
  }
}

fixInviteCodesV2(); 