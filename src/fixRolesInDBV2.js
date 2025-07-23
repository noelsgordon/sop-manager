import { supabase } from './supabaseClient.js';

async function fixRolesInDBV2() {
  console.log('Starting database role fix (v2)...\n');

  try {
    // 1. Update invite_codes table
    console.log('1. Updating invite_codes table...');
    const { error: inviteError } = await supabase
      .from('invite_codes')
      .update({ role: 'look' })
      .eq('role', 'viewer');

    if (inviteError) {
      console.error('Failed to update invite_codes:', inviteError.message);
    } else {
      console.log('✓ Updated invite_codes');
    }

    // 2. Update user_departments table
    console.log('\n2. Updating user_departments table...');
    const { error: deptError } = await supabase
      .from('user_departments')
      .update({ role: 'look' })
      .eq('role', 'viewer');

    if (deptError) {
      console.error('Failed to update user_departments:', deptError.message);
    } else {
      console.log('✓ Updated user_departments');
    }

    // 3. Verify the results
    console.log('\n3. Verifying results...');
    
    // Check invite_codes
    const { data: invites, error: inviteCheckError } = await supabase
      .from('invite_codes')
      .select('role');

    if (inviteCheckError) {
      console.error('Failed to check invite_codes:', inviteCheckError.message);
    } else {
      const inviteRoles = [...new Set(invites.map(i => i.role))];
      console.log('Invite code roles:', inviteRoles);
    }

    // Check user_departments
    const { data: userDepts, error: deptCheckError } = await supabase
      .from('user_departments')
      .select('role');

    if (deptCheckError) {
      console.error('Failed to check user_departments:', deptCheckError.message);
    } else {
      const deptRoles = [...new Set(userDepts.map(d => d.role))];
      console.log('User department roles:', deptRoles);
    }

  } catch (error) {
    console.error('Script failed:', error.message);
  }
}

fixRolesInDBV2(); 