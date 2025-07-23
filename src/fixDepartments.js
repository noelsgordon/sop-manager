import { supabase } from './supabaseClient.js';
import { v4 as uuidv4 } from 'uuid';

async function fixDepartments() {
  console.log('Fixing departments table...\n');

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
    console.log('1. Fetching all departments...');
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('*');

    if (deptError) {
      console.error('❌ Failed to fetch departments:', deptError.message);
      return;
    }

    // Group departments by name
    const departmentsByName = departments.reduce((acc, dept) => {
      if (!acc[dept.name]) acc[dept.name] = [];
      acc[dept.name].push(dept);
      return acc;
    }, {});

    console.log('\nFound department groups:');
    Object.entries(departmentsByName).forEach(([name, depts]) => {
      console.log(`- ${name}: ${depts.length} entries`);
    });

    // 2. Fix each group
    console.log('\n2. Fixing department groups...');
    const fixedDepartments = [];
    const departmentIdMap = new Map(); // Map old IDs to new IDs

    // First, delete all departments
    console.log('Deleting all departments...');
    const { error: deleteError } = await supabase
      .from('departments')
      .delete()
      .not('department_id', 'is', null); // Delete all rows

    if (deleteError) {
      console.error('❌ Failed to delete departments:', deleteError.message);
      return;
    }

    // Then recreate them with proper IDs
    for (const [name, depts] of Object.entries(departmentsByName)) {
      const newId = uuidv4();
      const oldId = depts[0]?.department_id;
      
      // Store ID mapping
      if (oldId) {
        departmentIdMap.set(oldId, newId);
      }

      // Insert department with new ID
      const { data: newDept, error: insertError } = await supabase
        .from('departments')
        .insert({
          department_id: newId,
          name,
          created_at: depts[0]?.created_at || new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error(`❌ Failed to insert department ${name}:`, insertError.message);
        continue;
      }

      fixedDepartments.push(newDept);
      console.log(`✓ Fixed department: ${name} (${newDept.department_id})`);
    }

    // Get or create Default Department
    let defaultDept = fixedDepartments.find(d => d.name === 'Default Department');
    if (!defaultDept) {
      const defaultDeptId = uuidv4();
      const { data: newDefaultDept, error: defaultError } = await supabase
        .from('departments')
        .insert({
          department_id: defaultDeptId,
          name: 'Default Department',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (defaultError) {
        console.error('❌ Failed to create Default Department:', defaultError.message);
        return;
      }

      defaultDept = newDefaultDept;
      fixedDepartments.push(defaultDept);
      console.log(`✓ Created Default Department (${defaultDept.department_id})`);
    }

    // 3. Get all SOPs
    console.log('\n3. Checking SOPs...');
    const { data: sops, error: sopsError } = await supabase
      .from('sops')
      .select('*');

    if (sopsError) {
      console.error('❌ Failed to fetch SOPs:', sopsError.message);
      return;
    }

    // Fix SOPs with invalid department_id
    console.log('\n4. Fixing SOP department assignments...');
    for (const sop of sops) {
      const newDeptId = departmentIdMap.get(sop.department_id) || defaultDept.department_id;
      const { error: updateError } = await supabase
        .from('sops')
        .update({ department_id: newDeptId })
        .eq('id', sop.id);

      if (updateError) {
        console.error(`❌ Failed to update SOP ${sop.name}:`, updateError.message);
      } else {
        console.log(`✓ Assigned SOP "${sop.name}" to department ${newDeptId}`);
      }
    }

    // 5. Fix user department memberships
    console.log('\n5. Fixing user department memberships...');

    // First, get all user department memberships
    const { data: userDepts, error: userDeptError } = await supabase
      .from('user_departments')
      .select('*');

    if (userDeptError) {
      console.error('❌ Failed to fetch user departments:', userDeptError.message);
      return;
    }

    // Delete each user department membership
    console.log('Deleting all user department memberships...');
    for (const userDept of userDepts) {
      const { error: deleteUserDeptError } = await supabase
        .from('user_departments')
        .delete()
        .eq('user_id', userDept.user_id)
        .eq('department_id', userDept.department_id);

      if (deleteUserDeptError) {
        console.error(`❌ Failed to delete user department:`, deleteUserDeptError.message);
      }
    }

    // Add user to each fixed department as super
    for (const dept of fixedDepartments) {
      const { error: addUserError } = await supabase
        .from('user_departments')
        .insert({
          user_id: auth.user.id,
          department_id: dept.department_id,
          role: 'super'
        });

      if (addUserError) {
        console.error(`❌ Failed to add user to department ${dept.name}:`, addUserError.message);
      } else {
        console.log(`✓ Added user to ${dept.name} as super`);
      }
    }

    console.log('\nDepartment fixes completed!');

  } catch (error) {
    console.error('Script failed:', error.message);
  }
}

// Run the script
fixDepartments(); 