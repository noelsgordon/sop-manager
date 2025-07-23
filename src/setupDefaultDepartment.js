import { supabase } from './supabaseClient.js';

async function setupDefaultDepartment() {
  console.log('Setting up Default Department...\n');

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

    // 1. Get or create Default Department
    console.log('1. Getting/Creating Default Department...');
    let { data: defaultDept, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .eq('name', 'Default Department')
      .single();

    if (!defaultDept) {
      const { data: newDept, error: createError } = await supabase
        .from('departments')
        .insert({
          name: 'Default Department',
          is_default: true
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Failed to create Default Department:', createError.message);
        return;
      }
      defaultDept = newDept;
      console.log('✓ Created Default Department');
    } else {
      console.log('✓ Found existing Default Department');
    }

    // 2. Update all SOPs to use Default Department
    console.log('\n2. Updating SOPs...');
    const { error: updateError } = await supabase
      .from('sops')
      .update({ department_id: defaultDept.department_id })
      .is('department_id', null);

    if (updateError) {
      console.error('❌ Failed to update SOPs:', updateError.message);
    } else {
      console.log('✓ Updated SOPs to use Default Department');
    }

    // 3. Check existing membership
    console.log('\n3. Checking existing membership...');
    const { data: existingMembership, error: checkError } = await supabase
      .from('user_departments')
      .select('*')
      .eq('user_id', auth.user.id)
      .eq('department_id', defaultDept.department_id)
      .single();

    if (checkError && !checkError.message.includes('No rows found')) {
      console.error('❌ Failed to check membership:', checkError.message);
      return;
    }

    // 4. Delete existing membership if found
    if (existingMembership) {
      console.log('Found existing membership, deleting...');
      const { error: deleteError } = await supabase
        .from('user_departments')
        .delete()
        .eq('user_id', auth.user.id)
        .eq('department_id', defaultDept.department_id);

      if (deleteError) {
        console.error('❌ Failed to delete existing membership:', deleteError.message);
        return;
      }
      console.log('✓ Deleted existing membership');
    }

    // 5. Add user to Default Department
    console.log('\n4. Adding user to Default Department...');
    
    // Wait a moment to ensure deletion is processed
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { error: membershipError } = await supabase
      .from('user_departments')
      .insert({
        user_id: auth.user.id,
        department_id: defaultDept.department_id,
        role: 'super'
      });

    if (membershipError) {
      console.error('❌ Failed to add user to Default Department:', membershipError.message);
    } else {
      console.log('✓ Added user to Default Department');
    }

    console.log('\nDefault Department setup complete!');
    console.log('Please log out and log back in to see the changes.');

  } catch (error) {
    console.error('Script failed:', error.message);
  }
}

// Run the script
setupDefaultDepartment(); 