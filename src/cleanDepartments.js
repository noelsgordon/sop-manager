import { supabase } from './supabaseClient.js';

async function cleanDepartments() {
  console.log('Cleaning departments...\n');

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

    // 1. Delete all user memberships
    console.log('1. Deleting all user memberships...');
    const { error: deleteMemError } = await supabase
      .from('user_departments')
      .delete()
      .eq('user_id', auth.user.id);

    if (deleteMemError) {
      console.error('❌ Failed to delete memberships:', deleteMemError.message);
    } else {
      console.log('✓ Deleted all memberships');
    }

    // 2. Get or create Default Department
    console.log('\n2. Getting/Creating Default Department...');
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

    // 3. Update all SOPs to use Default Department
    console.log('\n3. Updating SOPs...');
    const { error: updateError } = await supabase
      .from('sops')
      .update({ department_id: defaultDept.department_id })
      .is('department_id', null);

    if (updateError) {
      console.error('❌ Failed to update SOPs:', updateError.message);
    } else {
      console.log('✓ Updated SOPs to use Default Department');
    }

    // 4. Add user to Default Department
    console.log('\n4. Adding user to Default Department...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { error: addError } = await supabase
      .from('user_departments')
      .insert({
        user_id: auth.user.id,
        department_id: defaultDept.department_id,
        role: 'super'
      });

    if (addError) {
      console.error('❌ Failed to add to Default Department:', addError.message);
    } else {
      console.log('✓ Added to Default Department as super');
    }

    console.log('\nDepartments cleaned up!');
    console.log('Please log out and log back in to see the changes.');

  } catch (error) {
    console.error('Script failed:', error.message);
  }
}

// Run the script
cleanDepartments(); 