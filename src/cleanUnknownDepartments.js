import { supabase } from './supabaseClient.js';

async function cleanUnknownDepartments() {
  console.log('Cleaning unknown department memberships...\n');

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

    // 1. Get all departments
    console.log('1. Getting all departments...');
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('*');

    if (deptError) {
      console.error('❌ Failed to fetch departments:', deptError.message);
      return;
    }

    // 2. Get all user memberships
    console.log('\n2. Getting user memberships...');
    const { data: memberships, error: memError } = await supabase
      .from('user_departments')
      .select('*')
      .eq('user_id', auth.user.id);

    if (memError) {
      console.error('❌ Failed to fetch memberships:', memError.message);
      return;
    }

    // 3. Find unknown department memberships
    console.log('\n3. Finding unknown memberships...');
    const validDepartmentIds = new Set(departments.map(d => d.department_id));
    const unknownMemberships = memberships.filter(m => !validDepartmentIds.has(m.department_id));

    if (unknownMemberships.length === 0) {
      console.log('✓ No unknown memberships found');
      return;
    }

    console.log(`Found ${unknownMemberships.length} unknown memberships`);

    // 4. Delete unknown memberships
    console.log('\n4. Deleting unknown memberships...');
    for (const mem of unknownMemberships) {
      const { error: deleteError } = await supabase
        .from('user_departments')
        .delete()
        .eq('user_id', auth.user.id)
        .eq('department_id', mem.department_id);

      if (deleteError) {
        console.error(`❌ Failed to delete membership ${mem.department_id}:`, deleteError.message);
      } else {
        console.log(`✓ Deleted membership for department ${mem.department_id}`);
      }
    }

    console.log('\nUnknown memberships cleaned up!');

  } catch (error) {
    console.error('Script failed:', error.message);
  }
}

// Run the script
cleanUnknownDepartments(); 