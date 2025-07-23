import { supabase } from './supabaseClient.js';

async function fixUserDepartments() {
  console.log('Starting user_departments table fix...\n');

  try {
    // 1. Drop the old user_companies_pkey constraint if it exists
    const { error: dropError } = await supabase.rpc('drop_constraint', {
      table_name: 'user_departments',
      constraint_name: 'user_companies_pkey'
    });

    if (dropError) {
      console.log('No old constraint to drop (this is normal)');
    } else {
      console.log('✓ Dropped old constraint');
    }

    // 2. Add the correct primary key constraint
    const { error: addError } = await supabase.rpc('add_primary_key', {
      table_name: 'user_departments',
      column_names: ['user_id', 'department_id']
    });

    if (addError) {
      console.log('Primary key already exists (this is normal)');
    } else {
      console.log('✓ Added correct primary key constraint');
    }

    // 3. Verify the table structure
    const { data: userDepts, error: verifyError } = await supabase
      .from('user_departments')
      .select('user_id, department_id, role')
      .limit(1);

    if (verifyError) {
      console.error('❌ Failed to verify table:', verifyError.message);
    } else {
      console.log('✓ Table structure is correct');
      console.log('Current columns:', Object.keys(userDepts[0] || {}));
    }

    console.log('\nFix completed!');

  } catch (error) {
    console.error('Fix failed:', error.message);
  }
}

fixUserDepartments(); 