import { supabase } from './supabaseClient.js';

async function verifyFixes() {
  console.log('Verifying fixes...\n');

  try {
    // 1. Check database constraints
    console.log('1. Checking database constraints...');
    const { data: constraints, error: constraintError } = await supabase
      .from('information_schema.table_constraints')
      .select('*')
      .in('table_name', ['departments', 'user_departments']);

    if (constraintError) {
      console.error('❌ Failed to check constraints:', constraintError.message);
    } else {
      console.log('Found constraints:', constraints.length);
      constraints.forEach(c => {
        console.log(`- ${c.constraint_name} on ${c.table_name}`);
      });
    }

    // 2. Check department roles
    console.log('\n2. Checking department roles...');
    const { data: roles, error: roleError } = await supabase
      .from('user_departments')
      .select('role');

    if (roleError) {
      console.error('❌ Failed to check roles:', roleError.message);
    } else {
      const uniqueRoles = [...new Set(roles.map(r => r.role))];
      console.log('Found roles:', uniqueRoles);
    }

    // 3. Check invite codes
    console.log('\n3. Checking invite codes...');
    const { data: invites, error: inviteError } = await supabase
      .from('invite_codes')
      .select('code, email, role, department_id, departments(name)');

    if (inviteError) {
      console.error('❌ Failed to check invites:', inviteError.message);
    } else {
      console.log(`Found ${invites.length} active invite codes`);
      invites.forEach(invite => {
        console.log(`- Code: ${invite.code}, Email: ${invite.email}, Role: ${invite.role}, Department: ${invite.departments?.name}`);
      });
    }

    // 4. Check department memberships
    console.log('\n4. Checking department memberships...');
    const { data: memberships, error: membershipError } = await supabase
      .from('user_departments')
      .select('user_id, department_id, role, departments(name)');

    if (membershipError) {
      console.error('❌ Failed to check memberships:', membershipError.message);
    } else {
      console.log(`Found ${memberships.length} department memberships`);
      const membershipsByDept = {};
      memberships.forEach(m => {
        if (!membershipsByDept[m.department_id]) {
          membershipsByDept[m.department_id] = [];
        }
        membershipsByDept[m.department_id].push(m);
      });

      for (const [deptId, members] of Object.entries(membershipsByDept)) {
        console.log(`\nDepartment: ${members[0].departments?.name} (${deptId})`);
        console.log(`Members: ${members.length}`);
      }
    }

    // 5. Check Default Department
    console.log('\n5. Checking Default Department...');
    const { data: defaultDept, error: defaultError } = await supabase
      .from('departments')
      .select('*')
      .eq('name', 'Default Department')
      .single();

    if (defaultError) {
      console.error('❌ Failed to check Default Department:', defaultError.message);
    } else if (!defaultDept) {
      console.error('❌ Default Department not found');
    } else {
      console.log('✓ Default Department exists:', defaultDept);
    }

    console.log('\nVerification complete!');

  } catch (error) {
    console.error('Verification failed:', error.message);
  }
}

// Run the verification
verifyFixes(); 