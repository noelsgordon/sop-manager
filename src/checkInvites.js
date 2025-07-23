import { supabase } from './supabaseClient.js';

async function checkInvites() {
  console.log('Checking invite code roles...\n');

  try {
    // Get all invite codes with roles
    const { data: invites, error: fetchError } = await supabase
      .from('invite_codes')
      .select('id, role, department_id')
      .order('role');

    if (fetchError) {
      console.error('Failed to fetch invite codes:', fetchError.message);
      return;
    }

    console.log('Found invite codes with roles:');
    invites.forEach(invite => {
      console.log(`ID: ${invite.id}`);
      console.log(`Role: "${invite.role}" (${typeof invite.role})`);
      console.log(`Department: ${invite.department_id}`);
      console.log('---');
    });

    // Get unique roles
    const roles = [...new Set(invites.map(i => i.role))];
    console.log('\nUnique roles:', roles);
    
    // Check for exact matches
    const validRoles = ['look', 'tweak', 'build', 'manage', 'super'];
    const invalidRoles = roles.filter(role => !validRoles.includes(role));
    
    if (invalidRoles.length > 0) {
      console.log('\nInvalid roles found:');
      invalidRoles.forEach(role => {
        console.log(`"${role}" (${typeof role})`);
        console.log('Character codes:', [...role].map(c => c.charCodeAt(0)));
      });
    }

  } catch (error) {
    console.error('Check failed:', error.message);
  }
}

checkInvites(); 