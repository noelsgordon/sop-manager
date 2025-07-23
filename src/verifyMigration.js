import { supabase } from './supabaseClient.js';

async function verifyMigration() {
  console.log('Verifying user data migration...\n');

  try {
    // 1. Check if old table exists
    console.log('1. Checking for old user_companies table...');
    const { data: oldTable, error: oldTableError } = await supabase
      .from('user_companies')
      .select('count');

    if (oldTableError) {
      console.log('✓ Old table has been dropped');
    } else {
      console.log('❌ user_companies table still exists');
    }

    // Get valid department IDs (used by multiple checks)
    const { data: departments } = await supabase
      .from('departments')
      .select('id');
    const validDeptIds = new Set(departments?.map(d => d.id) || []);

    // 2. Check user_departments data
    console.log('\n2. Checking user_departments data...');
    const { data: userDepts, error: deptError } = await supabase
      .from('user_departments')
      .select('user_id, department_id, role');

    if (deptError) {
      console.log('❌ Failed to fetch user_departments:', deptError.message);
    } else {
      console.log(`Found ${userDepts.length} user-department assignments`);

      // Check roles
      const roles = [...new Set(userDepts.map(ud => ud.role))];
      console.log('\nCurrent roles in use:', roles);

      const invalidRoles = roles.filter(
        role => !['look', 'tweak', 'build', 'manage', 'super'].includes(role)
      );

      if (invalidRoles.length > 0) {
        console.log('❌ Invalid roles found:', invalidRoles);
      } else {
        console.log('✓ All roles are valid');
      }

      // Check for orphaned records
      console.log('\nChecking for orphaned records...');
      
      // Check user_profiles relationships
      const { data: userProfiles } = await supabase
        .from('user_profiles')
        .select('user_id');
      
      const validUserIds = new Set(userProfiles?.map(p => p.user_id) || []);
      const orphanedUsers = userDepts.filter(ud => !validUserIds.has(ud.user_id));

      if (orphanedUsers.length > 0) {
        console.log('❌ Found orphaned user assignments:', orphanedUsers.length);
        console.log('Orphaned user_ids:', orphanedUsers.map(u => u.user_id));
      } else {
        console.log('✓ All user relationships are valid');
      }

      // Check departments relationships
      const orphanedDepts = userDepts.filter(ud => !validDeptIds.has(ud.department_id));

      if (orphanedDepts.length > 0) {
        console.log('❌ Found orphaned department assignments:', orphanedDepts.length);
        console.log('Orphaned department_ids:', orphanedDepts.map(d => d.department_id));
      } else {
        console.log('✓ All department relationships are valid');
      }
    }

    // 3. Check invite_codes
    console.log('\n3. Checking invite_codes...');
    const { data: invites, error: inviteError } = await supabase
      .from('invite_codes')
      .select('role, department_id');

    if (inviteError) {
      console.log('❌ Failed to fetch invite_codes:', inviteError.message);
    } else {
      console.log(`Found ${invites.length} invite codes`);

      // Check roles in invites
      const inviteRoles = [...new Set(invites.map(i => i.role))];
      const invalidInviteRoles = inviteRoles.filter(
        role => !['look', 'tweak', 'build', 'manage', 'super'].includes(role)
      );

      if (invalidInviteRoles.length > 0) {
        console.log('❌ Invalid roles in invites:', invalidInviteRoles);
      } else {
        console.log('✓ All invite roles are valid');
      }

      // Check for orphaned invites
      const orphanedInvites = invites.filter(i => !validDeptIds.has(i.department_id));
      if (orphanedInvites.length > 0) {
        console.log('❌ Found orphaned invite codes:', orphanedInvites.length);
        console.log('Orphaned department_ids:', orphanedInvites.map(i => i.department_id));
      } else {
        console.log('✓ All invite department relationships are valid');
      }
    }

  } catch (error) {
    console.error('Verification failed:', error.message);
  }
}

verifyMigration(); 