import { supabase } from './supabaseClient.js';

async function fixUserDepartmentsV2() {
  console.log('Starting user_departments table fix (v2)...\n');

  try {
    // 1. Get all existing user-department assignments
    console.log('1. Fetching current assignments...');
    const { data: currentAssignments, error: fetchError } = await supabase
      .from('user_departments')
      .select('*');

    if (fetchError) {
      throw new Error(`Failed to fetch assignments: ${fetchError.message}`);
    }

    console.log(`Found ${currentAssignments?.length || 0} assignments`);

    // 2. Delete all assignments (we'll reinsert them)
    console.log('\n2. Removing old assignments...');
    const { error: deleteError } = await supabase
      .from('user_departments')
      .delete()
      .neq('user_id', 'dummy'); // Delete all rows

    if (deleteError) {
      throw new Error(`Failed to delete assignments: ${deleteError.message}`);
    }

    // 3. Reinsert assignments with correct structure
    if (currentAssignments && currentAssignments.length > 0) {
      console.log('\n3. Reinserting assignments...');
      const cleanAssignments = currentAssignments.map(assignment => ({
        user_id: assignment.user_id,
        department_id: assignment.department_id,
        role: assignment.role.toLowerCase()
      }));

      const { error: insertError } = await supabase
        .from('user_departments')
        .insert(cleanAssignments);

      if (insertError) {
        throw new Error(`Failed to reinsert assignments: ${insertError.message}`);
      }
    }

    // 4. Verify the fix
    console.log('\n4. Verifying fix...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('user_departments')
      .select('*');

    if (verifyError) {
      throw new Error(`Failed to verify: ${verifyError.message}`);
    }

    console.log(`✓ Found ${verifyData?.length || 0} assignments after fix`);
    console.log('✓ Fix completed successfully!');

  } catch (error) {
    console.error('\n❌ Fix failed:', error.message);
  }
}

fixUserDepartmentsV2(); 