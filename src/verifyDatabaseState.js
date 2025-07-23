import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Create a Supabase client with the service role key
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyDatabaseState() {
  console.log('Starting database verification...\n');
  let hasErrors = false;

  try {
    // 1. Check departments
    console.log('Checking departments...');
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .order('created_at');

    if (deptError) throw deptError;

    // Check for duplicates
    const departmentsByName = departments.reduce((acc, dept) => {
      if (!acc[dept.name]) acc[dept.name] = [];
      acc[dept.name].push(dept);
      return acc;
    }, {});

    for (const [name, depts] of Object.entries(departmentsByName)) {
      if (depts.length > 1) {
        console.error(`❌ Found ${depts.length} duplicate departments with name "${name}"`);
        hasErrors = true;
      }
    }

    console.log(`✓ Found ${departments.length} total departments`);
    console.log(`✓ Found ${Object.keys(departmentsByName).length} unique department names\n`);

    // Create a set of valid department IDs
    const validDeptIds = new Set(departments.map(d => d.department_id));

    // 2. Check user_departments
    console.log('Checking user department assignments...');
    const { data: userDepts, error: userDeptError } = await supabase
      .from('user_departments')
      .select('*');

    if (userDeptError) throw userDeptError;

    // Verify all department_ids exist
    const invalidUserDepts = userDepts.filter(ud => !validDeptIds.has(ud.department_id));

    if (invalidUserDepts.length > 0) {
      console.error(`❌ Found ${invalidUserDepts.length} user_departments entries with invalid department_ids`);
      hasErrors = true;
    }

    console.log(`✓ Found ${userDepts.length} total user department assignments`);
    console.log(`✓ Found ${invalidUserDepts.length} invalid assignments\n`);

    // 3. Check SOPs
    console.log('Checking SOPs...');
    const { data: sops, error: sopError } = await supabase
      .from('sops')
      .select('*');

    if (sopError) throw sopError;

    // Verify all SOP department_ids exist
    const invalidSops = sops.filter(sop => !validDeptIds.has(sop.department_id));

    if (invalidSops.length > 0) {
      console.error(`❌ Found ${invalidSops.length} SOPs with invalid department_ids`);
      hasErrors = true;
    }

    console.log(`✓ Found ${sops.length} total SOPs`);
    console.log(`✓ Found ${invalidSops.length} SOPs with invalid departments\n`);

    // 4. Check invite codes
    console.log('Checking invite codes...');
    const { data: invites, error: inviteError } = await supabase
      .from('invite_codes')
      .select('*');

    if (inviteError) throw inviteError;

    // Verify all invite department_ids exist
    const invalidInvites = invites.filter(inv => !validDeptIds.has(inv.department_id));

    if (invalidInvites.length > 0) {
      console.error(`❌ Found ${invalidInvites.length} invite codes with invalid department_ids`);
      if (invalidInvites.length > 0) {
        console.log('Invalid invite details:');
        invalidInvites.forEach(inv => {
          console.log(`- ID: ${inv.id}, Department: ${inv.department_id}, Email: ${inv.email}`);
        });
      }
      hasErrors = true;
    }

    console.log(`✓ Found ${invites.length} total invite codes`);
    console.log(`✓ Found ${invalidInvites.length} invites with invalid departments\n`);

    // Summary
    if (hasErrors) {
      console.error('\n❌ Database verification completed with errors');
    } else {
      console.log('\n✓ Database verification completed successfully');
      console.log('✓ All relationships are valid');
      console.log('✓ No duplicate departments found');
    }

  } catch (error) {
    console.error('Error during verification:', error);
    process.exit(1);
  }
}

// Run the verification
verifyDatabaseState(); 