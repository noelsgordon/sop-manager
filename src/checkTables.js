import { supabase } from './supabaseClient.js';

async function checkTables() {
  console.log('Checking database table structure...\n');

  try {
    // 0. Sign in first
    const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
      email: 'noelsgordon@gmail.com',
      password: 'BoatBoat123!'
    });

    if (authError) {
      console.error('❌ Failed to sign in:', authError.message);
      return;
    }

    // Check departments table
    console.log('1. Checking departments table...');
    const { data: deptData, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .limit(1);

    if (deptError) {
      console.error('❌ Failed to check departments:', deptError.message);
    } else {
      console.log('Departments columns:', deptData[0] ? Object.keys(deptData[0]) : 'No data');
    }

    // Check user_departments table
    console.log('\n2. Checking user_departments table...');
    const { data: userDeptData, error: userDeptError } = await supabase
      .from('user_departments')
      .select('*')
      .limit(1);

    if (userDeptError) {
      console.error('❌ Failed to check user_departments:', userDeptError.message);
    } else {
      console.log('User departments columns:', userDeptData[0] ? Object.keys(userDeptData[0]) : 'No data');
    }

    // Check sops table
    console.log('\n3. Checking sops table...');
    const { data: sopsData, error: sopsError } = await supabase
      .from('sops')
      .select('*')
      .limit(1);

    if (sopsError) {
      console.error('❌ Failed to check sops:', sopsError.message);
    } else {
      console.log('SOPs columns:', sopsData[0] ? Object.keys(sopsData[0]) : 'No data');
    }

  } catch (error) {
    console.error('Script failed:', error.message);
  }
}

// Run the script
checkTables(); 