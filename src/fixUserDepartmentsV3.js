import { supabase } from './supabaseClient.js';

async function fixUserDepartmentsV3() {
  console.log('Starting user_departments table fix (v3)...\n');

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
    if (currentAssignments && currentAssignments.length > 0) {
      console.log('\n2. Removing old assignments...');
      for (const assignment of currentAssignments) {
        const { error: deleteError } = await supabase
          .from('user_departments')
          .delete()
          .eq('user_id', assignment.user_id)
          .eq('department_id', assignment.department_id);

        if (deleteError) {
          console.error(`Failed to delete assignment: ${deleteError.message}`);
        }
      }
    }

    // 3. Create new assignments with correct structure
    if (currentAssignments && currentAssignments.length > 0) {
      console.log('\n3. Creating new assignments...');
      const cleanAssignments = currentAssignments.map(assignment => ({
        user_id: assignment.user_id,
        department_id: assignment.department_id,
        role: assignment.role.toLowerCase()
      }));

      for (const assignment of cleanAssignments) {
        const { error: insertError } = await supabase
          .from('user_departments')
          .insert(assignment);

        if (insertError) {
          console.error(`Failed to insert assignment: ${insertError.message}`);
        }
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

fixUserDepartmentsV3(); 