import { supabase } from './supabaseClient.js';

async function runCleanup() {
  console.log('Starting invite code cleanup...\n');

  try {
    // Run cleanup function
    console.log('1. Running cleanup_invite_codes()...');
    const { error: cleanupError } = await supabase.rpc('cleanup_invite_codes');
    
    if (cleanupError) {
      console.error('❌ Cleanup failed:', cleanupError.message);
      return;
    }
    
    console.log('✓ Cleanup completed successfully');

    // Verify results
    console.log('\n2. Verifying results...');
    const { data: verifyData, error: verifyError } = await supabase
      .rpc('verify_invite_codes');

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
      return;
    }

    const results = verifyData[0];
    console.log('\nVerification Results:');
    console.log('--------------------');
    console.log(`Total invite codes: ${results.total_invites}`);
    console.log(`Invalid roles: ${results.invalid_roles}`);
    console.log(`Orphaned invites: ${results.orphaned_invites}`);

    if (results.invalid_roles === 0 && results.orphaned_invites === 0) {
      console.log('\n✅ All invite codes are valid!');
    } else {
      console.log('\n⚠️ Some issues remain:');
      if (results.invalid_roles > 0) {
        // List invalid roles
        const { data: invalidRoles } = await supabase
          .from('invite_codes')
          .select('role')
          .not('role', 'in', '(look,tweak,build,manage,super)');
        
        console.log('Invalid roles found:', [...new Set(invalidRoles.map(r => r.role))]);
      }
      
      if (results.orphaned_invites > 0) {
        // List orphaned invites
        const { data: orphaned } = await supabase
          .from('invite_codes')
          .select('id, department_id, email')
          .not('department_id', 'in', '(select id from departments)');
        
        console.log('Orphaned invites:', orphaned);
      }
    }

  } catch (error) {
    console.error('Script failed:', error.message);
  }
}

runCleanup(); 