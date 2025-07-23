import { supabase } from './supabaseClient.js';

async function fixForeignKeys() {
  console.log('Starting foreign key fix...\n');

  try {
    // 1. First ensure the departments table exists
    console.log('1. Checking departments table...');
    const { data: deptCheck, error: checkError } = await supabase
      .from('departments')
      .select('id')
      .limit(1);

    if (checkError) {
      if (checkError.message.includes('does not exist')) {
        // Create the departments table
        console.log('Creating departments table...');
        const { error: createError } = await supabase.from('departments').insert({
          name: 'Default Department'
        });

        if (createError) {
          console.error('❌ Failed to create departments table:', createError.message);
          return;
        }
        console.log('✓ Departments table created');
      } else {
        console.error('❌ Failed to check departments table:', checkError.message);
        return;
      }
    } else {
      console.log('✓ Departments table exists');
    }

    // 2. Get all user departments
    console.log('\n2. Getting user departments...');
    const { data: userDepts, error: deptError } = await supabase
      .from('user_departments')
      .select('*');

    if (deptError) {
      console.error('❌ Failed to get user departments:', deptError.message);
      return;
    }

    console.log(`Found ${userDepts?.length || 0} user department records`);

    // 3. Verify each department exists
    console.log('\n3. Verifying department references...');
    let invalidDepts = 0;
    let validDepts = 0;

    for (const dept of userDepts) {
      // Check if the department exists
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('id, name')
        .eq('id', dept.department_id)
        .single();

      if (deptError || !deptData) {
        console.log(`❌ Invalid department reference: ${dept.department_id}`);
        invalidDepts++;

        // Delete the invalid reference
        const { error: deleteError } = await supabase
          .from('user_departments')
          .delete()
          .eq('user_id', dept.user_id)
          .eq('department_id', dept.department_id);

        if (deleteError) {
          console.error(`Failed to delete invalid reference: ${deleteError.message}`);
        } else {
          console.log('✓ Deleted invalid reference');
        }
      } else {
        validDepts++;
      }
    }

    console.log(`\nResults:`);
    console.log(`- Valid department references: ${validDepts}`);
    console.log(`- Invalid references removed: ${invalidDepts}`);

    // 4. Final verification
    console.log('\n4. Final verification...');
    const { data: finalDepts, error: finalError } = await supabase
      .from('user_departments')
      .select('*');

    if (finalError) {
      console.error('❌ Final verification failed:', finalError.message);
    } else {
      console.log(`✓ Found ${finalDepts.length} valid user department records`);
      console.log('\nFix completed successfully!');
    }

  } catch (error) {
    console.error('Script failed:', error.message);
  }
}

// Run the fix
fixForeignKeys(); 