import { supabase } from './supabaseClient.js';

async function applyTriggerV2() {
  console.log('Applying role normalization trigger (v2)...\n');

  try {
    // 1. Create the stored procedure
    console.log('1. Creating stored procedure...');
    const { error: procError } = await supabase.rpc('create_normalize_trigger', {
      function_name: 'normalize_role_on_insert',
      table_name_1: 'user_departments',
      table_name_2: 'invite_codes'
    });

    if (procError) {
      console.error('Failed to create stored procedure:', procError.message);
      return;
    }

    console.log('✓ Stored procedure created');

    // 2. Test the trigger
    console.log('\n2. Testing trigger...');
    
    // Try to insert a test invite code
    const { error: insertError } = await supabase
      .from('invite_codes')
      .insert({
        code: 'TEST123',
        department_id: '3d2351bf-883f-4c22-b7dd-4f7d4946709b',
        role: 'viewer',
        email: 'test@example.com'
      });

    if (insertError) {
      console.error('Failed to insert test invite:', insertError.message);
    } else {
      // Check if the role was normalized
      const { data: testInvite, error: checkError } = await supabase
        .from('invite_codes')
        .select('role')
        .eq('code', 'TEST123')
        .single();

      if (checkError) {
        console.error('Failed to check test invite:', checkError.message);
      } else {
        console.log('Test invite role:', testInvite.role);
      }

      // Clean up test invite
      const { error: deleteError } = await supabase
        .from('invite_codes')
        .delete()
        .eq('code', 'TEST123');

      if (deleteError) {
        console.error('Failed to delete test invite:', deleteError.message);
      }
    }

  } catch (error) {
    console.error('Script failed:', error.message);
  }
}

applyTriggerV2(); 