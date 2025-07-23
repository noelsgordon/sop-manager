import { supabase } from './supabaseClient.js';

async function fixInviteCodes() {
  console.log('Starting invite codes fix...\n');

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

    // 2. Update roles to new format
    if (invites && invites.length > 0) {
      console.log('\n2. Updating roles...');
      
      const roleMap = {
        'viewer': 'look',
        'updater': 'tweak',
        'creator': 'build',
        'admin': 'manage',
        'superadmin': 'super',
        'VIEWER': 'look',
        'UPDATER': 'tweak',
        'CREATOR': 'build',
        'ADMIN': 'manage',
        'SUPERADMIN': 'super',
        'Viewer': 'look',
        'Updater': 'tweak',
        'Creator': 'build',
        'Admin': 'manage',
        'SuperAdmin': 'super'
      };

      for (const invite of invites) {
        const newRole = roleMap[invite.role] || invite.role.toLowerCase();
        
        if (newRole !== invite.role) {
          console.log(`Updating invite ${invite.id}: ${invite.role} -> ${newRole}`);
          
          const { error: updateError } = await supabase
            .from('invite_codes')
            .update({ role: newRole })
            .eq('id', invite.id);

          if (updateError) {
            console.error(`Failed to update invite ${invite.id}:`, updateError.message);
          }
        }
      }
    }

    // 3. Verify the updates
    console.log('\n3. Verifying updates...');
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

fixInviteCodes(); 