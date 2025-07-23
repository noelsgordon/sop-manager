import { supabase } from './supabaseClient.js';

async function fixRemainingRoles() {
  console.log('Fixing remaining invalid roles...\n');

  try {
    // Update all viewer roles to look
    const { error: updateError } = await supabase
      .from('invite_codes')
      .update({ role: 'look' })
      .eq('role', 'viewer');

    if (updateError) {
      throw new Error(`Failed to update viewer roles: ${updateError.message}`);
    }

    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('invite_codes')
      .select('role')
      .not('role', 'in', '(look,tweak,build,manage,super)');

    if (verifyError) {
      throw new Error(`Failed to verify results: ${verifyError.message}`);
    }

    if (verifyData.length === 0) {
      console.log('✅ All roles are now valid!');
    } else {
      console.log('⚠️ Some invalid roles still remain:');
      const remainingRoles = [...new Set(verifyData.map(d => d.role))];
      console.log(remainingRoles);
    }

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

// Run the fix
fixRemainingRoles(); 