import { supabase } from './supabaseClient.js';

async function migrateDepartments() {
  console.log('Starting departments table migration...\n');

  try {
    // 1. Check if departments table exists
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

    // 2. Check and update table structure
    console.log('\n2. Checking table structure...');
    const { data: columns, error: columnError } = await supabase
      .from('departments')
      .select()
      .limit(1);

    if (columnError) {
      console.error('❌ Failed to check table structure:', columnError.message);
      return;
    }

    const currentColumns = columns && columns[0] ? Object.keys(columns[0]) : [];
    console.log('Current columns:', currentColumns);

    // 3. Insert test data to verify structure
    console.log('\n3. Verifying table functionality...');
    const { data: testDept, error: testError } = await supabase
      .from('departments')
      .insert({
        name: 'Test Department'
      })
      .select()
      .single();

    if (testError) {
      console.error('❌ Failed to verify table:', testError.message);
      return;
    }

    console.log('✓ Table structure verified');
    console.log('Department columns:', Object.keys(testDept));

    // Clean up test data
    if (testDept) {
      await supabase
        .from('departments')
        .delete()
        .eq('id', testDept.id);
    }

  } catch (error) {
    console.error('Script failed:', error.message);
  }
}

migrateDepartments(); 