import { supabase } from './supabaseClient.js';

async function cleanupInvites() {
  console.log('Starting invite code cleanup...\n');

  try {
    // 1. Get valid department IDs
    console.log('1. Getting valid department IDs...');
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('department_id');

    if (deptError) {
      throw new Error(`Failed to fetch departments: ${deptError.message}`);
    }

    const validDeptIds = new Set(departments.map(d => d.department_id));
    console.log(`Found ${validDeptIds.size} valid departments`);

    // 2. Find orphaned invites
    console.log('\n2. Finding orphaned invites...');
    let orphanedInvites = [];
    
    if (validDeptIds.size > 0) {
      const { data, error: orphanError } = await supabase
        .from('invite_codes')
        .select('id, department_id, email, role')
        .not('department_id', 'in', `(${Array.from(validDeptIds).map(id => `'${id}'`).join(',')})`);

      if (orphanError) {
        throw new Error(`Failed to find orphaned invites: ${orphanError.message}`);
      }
      orphanedInvites = data || [];
    } else {
      // If no valid departments, all invites are orphaned
      const { data, error: allInvitesError } = await supabase
        .from('invite_codes')
        .select('id, department_id, email, role');

      if (allInvitesError) {
        throw new Error(`Failed to fetch invites: ${allInvitesError.message}`);
      }
      orphanedInvites = data || [];
    }

    console.log(`Found ${orphanedInvites.length} orphaned invites:`);
    orphanedInvites.forEach(invite => {
      console.log(`- ID: ${invite.id}, Dept: ${invite.department_id}, Email: ${invite.email}, Role: ${invite.role}`);
    });

    // 3. Delete orphaned invites
    if (orphanedInvites.length > 0) {
      console.log('\n3. Deleting orphaned invites...');
      for (const invite of orphanedInvites) {
        const { error: deleteError } = await supabase
          .from('invite_codes')
          .delete()
          .eq('id', invite.id);

        if (deleteError) {
          console.log(`❌ Failed to delete invite ${invite.id}: ${deleteError.message}`);
        } else {
          console.log(`✓ Deleted invite ${invite.id}`);
        }
      }
    }

    // 4. Update roles
    console.log('\n4. Updating invalid roles...');
    const roleUpdates = [
      { from: 'viewer', to: 'look' },
      { from: 'Viewer', to: 'look' },
      { from: 'updater', to: 'tweak' },
      { from: 'Updater', to: 'tweak' },
      { from: 'creator', to: 'build' },
      { from: 'Creator', to: 'build' },
      { from: 'admin', to: 'manage' },
      { from: 'Admin', to: 'manage' },
      { from: 'superadmin', to: 'super' },
      { from: 'Superadmin', to: 'super' }
    ];

    // First, get all invalid roles
    const { data: currentInvalidRoles } = await supabase
      .from('invite_codes')
      .select('id, role')
      .not('role', 'in', '(look,tweak,build,manage,super)');

    console.log(`Found ${currentInvalidRoles?.length || 0} invites with invalid roles`);

    // Update each invalid role
    for (const invite of (currentInvalidRoles || [])) {
      const matchingRole = roleUpdates.find(r => r.from.toLowerCase() === invite.role.toLowerCase());
      if (matchingRole) {
        const { error: updateError } = await supabase
          .from('invite_codes')
          .update({ role: matchingRole.to })
          .eq('id', invite.id);

        if (updateError) {
          console.log(`❌ Failed to update role for invite ${invite.id}: ${updateError.message}`);
        } else {
          console.log(`✓ Updated role from ${invite.role} to ${matchingRole.to} for invite ${invite.id}`);
        }
      } else {
        console.log(`⚠️ No mapping found for role: ${invite.role}`);
      }
    }

    // 5. Verify results
    console.log('\n5. Verifying results...');
    
    // Check for remaining invalid roles
    const { data: invalidRoles, error: roleError } = await supabase
      .from('invite_codes')
      .select('id, role')
      .not('role', 'in', '(look,tweak,build,manage,super)');

    if (roleError) {
      throw new Error(`Failed to check invalid roles: ${roleError.message}`);
    }

    // Check for remaining orphaned invites
    let remainingOrphaned = [];
    if (validDeptIds.size > 0) {
      const { data, error: remainingError } = await supabase
        .from('invite_codes')
        .select('id, department_id, email')
        .not('department_id', 'in', `(${Array.from(validDeptIds).map(id => `'${id}'`).join(',')})`);

      if (remainingError) {
        throw new Error(`Failed to check remaining orphaned invites: ${remainingError.message}`);
      }
      remainingOrphaned = data || [];
    } else {
      const { data, error: allInvitesError } = await supabase
        .from('invite_codes')
        .select('id, department_id, email');

      if (allInvitesError) {
        throw new Error(`Failed to check remaining invites: ${allInvitesError.message}`);
      }
      remainingOrphaned = data || [];
    }

    console.log('\nFinal Status:');
    console.log('--------------');
    console.log(`Invalid roles remaining: ${invalidRoles.length}`);
    console.log(`Orphaned invites remaining: ${remainingOrphaned.length}`);

    if (invalidRoles.length === 0 && remainingOrphaned.length === 0) {
      console.log('\n✅ All invite codes are now valid!');
    } else {
      console.log('\n⚠️ Some issues remain:');
      if (invalidRoles.length > 0) {
        console.log('Invalid roles found:');
        invalidRoles.forEach(r => {
          console.log(`- ID: ${r.id}, Role: ${r.role}`);
        });
      }
      if (remainingOrphaned.length > 0) {
        console.log('Orphaned invites:');
        remainingOrphaned.forEach(i => {
          console.log(`- ID: ${i.id}, Dept: ${i.department_id}, Email: ${i.email}`);
        });
      }
    }

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error.message);
  }
}

cleanupInvites(); 