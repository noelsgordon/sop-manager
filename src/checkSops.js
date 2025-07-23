import { supabase } from './supabaseClient.js';

async function checkSops() {
  console.log('Checking SOPs and department assignments...\n');

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

    // 1. Get all SOPs
    console.log('1. Fetching all SOPs...\n');
    const { data: sops, error: sopsError } = await supabase
      .from('sops')
      .select('*');

    if (sopsError) {
      console.error('❌ Failed to fetch SOPs:', sopsError.message);
      return;
    }

    // Get all departments
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('*');

    if (deptError) {
      console.error('❌ Failed to fetch departments:', deptError.message);
      return;
    }

    // Create a map of department IDs to names
    const departmentMap = new Map(departments.map(d => [d.department_id, d.name]));

    // Get unique department IDs from SOPs
    const departmentIds = [...new Set(sops.map(sop => sop.department_id))];
    console.log('Department IDs found in SOPs:', departmentIds);

    console.log('\nAll departments in database:');
    departments.forEach(dept => {
      console.log(`- ${dept.name} (${dept.department_id})`);
    });

    // Display SOPs with department info
    console.log('\nFound', sops.length, 'total SOPs:\n');
    sops.forEach(sop => {
      console.log(`SOP: ${sop.name}`);
      console.log(`- ID: ${sop.id}`);
      console.log(`- Department: ${departmentMap.get(sop.department_id) || 'Unknown'} (${sop.department_id})`);
      console.log('---');
    });

    // 2. Check user department memberships
    console.log('\n2. Checking your department memberships...\n');
    const { data: memberships, error: membershipError } = await supabase
      .from('user_departments')
      .select('*')
      .eq('user_id', auth.user.id);

    if (membershipError) {
      console.error('❌ Failed to fetch memberships:', membershipError.message);
      return;
    }

    // Filter out memberships with non-existent departments
    const validDepartmentIds = new Set(departments.map(d => d.department_id));
    const validMemberships = memberships.filter(m => validDepartmentIds.has(m.department_id));

    console.log(`You are a member of ${validMemberships.length} departments:`);
    validMemberships.forEach(mem => {
      const deptName = departmentMap.get(mem.department_id) || 'Unknown';
      const sopsInDept = sops.filter(sop => sop.department_id === mem.department_id);
      console.log(`- ${deptName} (${mem.department_id}) - Role: ${mem.role}`);
      console.log(`  Contains ${sopsInDept.length} SOPs`);
    });

  } catch (error) {
    console.error('Script failed:', error.message);
  }
}

// Run the script
checkSops(); 