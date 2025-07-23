import { supabase } from './supabaseClient.js';

async function createTestData() {
  console.log('Creating test data...\n');

  try {
    // 1. Sign in with an existing user
    console.log('1. Signing in...');
    const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
      email: 'noelsgordon@gmail.com',
      password: 'BoatBoat123!'
    });

    if (authError) {
      console.error('❌ Failed to sign in:', authError.message);
      return;
    }
    console.log('✓ Signed in as:', auth.user);

    // 2. Create a test department
    console.log('\n2. Creating test department...');
    const { data: dept, error: deptError } = await supabase
      .from('departments')
      .insert({
        name: 'Test Department'
      })
      .select('*')
      .single();

    if (deptError) {
      console.error('❌ Failed to create department:', deptError.message);
      return;
    }

    if (!dept || !dept.department_id) {
      console.error('❌ Department created but no ID returned');
      return;
    }

    console.log('✓ Department created:', dept);

    // 3. Join department as super user
    console.log('\n3. Joining department as super user...');
    const { data: userDept, error: userDeptError } = await supabase
      .from('user_departments')
      .insert({
        user_id: auth.user.id,
        department_id: dept.department_id,
        role: 'super'
      })
      .select();

    if (userDeptError) {
      console.error('❌ Failed to join department:', userDeptError.message);
      return;
    }
    console.log('✓ Department joined:', userDept);

    // 4. Verify the relationship
    console.log('\n4. Verifying relationship...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('user_departments')
      .select('*')
      .eq('department_id', dept.department_id);

    if (verifyError) {
      console.error('❌ Failed to verify relationship:', verifyError.message);
      return;
    }
    console.log('✓ Relationship verified:', verifyData);

    console.log('\nTest data created successfully!');

  } catch (error) {
    console.error('Script failed:', error.message);
  }
}

// Run the script
createTestData(); 