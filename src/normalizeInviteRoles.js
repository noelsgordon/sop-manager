import { supabase } from './supabaseClient.js';

async function normalizeInviteRoles() {
  console.log('Starting invite code role normalization...\n');

  try {
    // 1. Get all invite codes
    const { data: invites, error: fetchError } = await supabase
      .from('invite_codes')
      .select('id, role');

    if (fetchError) {
      throw new Error(`Failed to fetch invite codes: ${fetchError.message}`);
    }

    console.log(`Found ${invites.length} invite codes`);

    // 2. Process each invite code
    for (const invite of invites) {
      const originalRole = invite.role;
      let normalizedRole = originalRole.toLowerCase();

      // Map non-standard roles
      switch (normalizedRole) {
        case 'viewer':
          normalizedRole = 'look';
          break;
        case 'updater':
          normalizedRole = 'tweak';
          break;
        case 'creator':
          normalizedRole = 'build';
          break;
        case 'admin':
          normalizedRole = 'manage';
          break;
        case 'superadmin':
          normalizedRole = 'super';
          break;
      }

      // Only update if the role changed
      if (normalizedRole !== originalRole) {
        console.log(`Updating role from "${originalRole}" to "${normalizedRole}"`);
        
        const { error: updateError } = await supabase
          .from('invite_codes')
          .update({ role: normalizedRole })
          .eq('id', invite.id);

        if (updateError) {
          console.error(`❌ Failed to update invite ${invite.id}:`, updateError.message);
        } else {
          console.log(`✓ Updated invite ${invite.id}`);
        }
      }
    }

    // 3. Verify results
    const { data: verifyData, error: verifyError } = await supabase
      .from('invite_codes')
      .select('role')
      .not('role', 'in', '(look,tweak,build,manage,super)');

    if (verifyError) {
      throw new Error(`Failed to verify results: ${verifyError.message}`);
    }

    if (verifyData.length === 0) {
      console.log('\n✅ All invite code roles are now normalized!');
    } else {
      console.log('\n⚠️ Some invalid roles remain:');
      const remainingRoles = [...new Set(verifyData.map(d => d.role))];
      console.log(remainingRoles);
    }

  } catch (error) {
    console.error('\n❌ Normalization failed:', error.message);
  }
}

// Run the normalization
normalizeInviteRoles(); 