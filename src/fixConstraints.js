import { supabase } from './supabaseClient.js';

async function fixConstraints() {
  console.log('Fixing database constraints...\n');

  try {
    // 1. Drop the problematic constraint
    console.log('1. Dropping user_companies_pkey constraint...');
    const { error: dropError } = await supabase.rpc('drop_constraint', {
      table_name: 'user_departments',
      constraint_name: 'user_companies_pkey'
    });

    if (dropError) {
      console.error('❌ Failed to drop constraint:', dropError.message);
    } else {
      console.log('✓ Dropped user_companies_pkey constraint');
    }

    // 2. Add the correct primary key
    console.log('\n2. Adding user_departments_pkey constraint...');
    const { error: pkError } = await supabase.rpc('add_primary_key', {
      table_name: 'user_departments',
      column_names: ['user_id', 'department_id']
    });

    if (pkError) {
      console.error('❌ Failed to add primary key:', pkError.message);
    } else {
      console.log('✓ Added user_departments_pkey constraint');
    }

    // 3. Add foreign key constraints
    console.log('\n3. Adding foreign key constraints...');
    const { error: fkError1 } = await supabase.rpc('add_foreign_key', {
      table_name: 'user_departments',
      column_name: 'department_id',
      referenced_table: 'departments',
      referenced_column: 'department_id'
    });

    if (fkError1) {
      console.error('❌ Failed to add department_id foreign key:', fkError1.message);
    } else {
      console.log('✓ Added department_id foreign key');
    }

    const { error: fkError2 } = await supabase.rpc('add_foreign_key', {
      table_name: 'user_departments',
      column_name: 'user_id',
      referenced_table: 'auth.users',
      referenced_column: 'id'
    });

    if (fkError2) {
      console.error('❌ Failed to add user_id foreign key:', fkError2.message);
    } else {
      console.log('✓ Added user_id foreign key');
    }

    console.log('\nConstraint fixes completed!');

  } catch (error) {
    console.error('Script failed:', error.message);
  }
}

// Run the fixes
fixConstraints(); 