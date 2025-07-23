import { supabase } from './supabaseClient.js';

async function cleanUserMemberships() {
  console.log('Cleaning user memberships...\n');

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

    // 1. Delete all user department memberships
    console.log('1. Deleting user memberships...');
    
    // Delete from user_departments
    const { error: membershipError } = await supabase
      .from('user_departments')
      .delete()
      .eq('user_id', auth.user.id);

    if (membershipError) {
      console.error('❌ Failed to delete department memberships:', membershipError.message);
    } else {
      console.log('✓ Department memberships deleted');
    }

    // 2. Get valid departments
    console.log('\n2. Getting valid departments...');
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('*');

    if (deptError) {
      console.error('❌ Failed to fetch departments:', deptError.message);
      return;
    }

    // 3. Update user profile
    console.log('\n3. Updating user profile...');
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select()
      .eq('user_id', auth.user.id)
      .single();

    if (!existingProfile) {
      const { error: createProfileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: auth.user.id,
          email: auth.user.email,
          display_name: auth.user.email.split('@')[0],
          is_superadmin: false
        });

      if (createProfileError) {
        console.error('❌ Failed to create user profile:', createProfileError.message);
        return;
      }
      console.log('✓ New user profile created');
    } else {
      const { error: updateProfileError } = await supabase
        .from('user_profiles')
        .update({
          email: auth.user.email,
          display_name: auth.user.email.split('@')[0],
          is_superadmin: false
        })
        .eq('user_id', auth.user.id);

      if (updateProfileError) {
        console.error('❌ Failed to update user profile:', updateProfileError.message);
        return;
      }
      console.log('✓ User profile updated');
    }

    // 4. Add user to Default Department
    console.log('\n4. Adding user to departments...');
    const defaultDept = departments.find(d => d.name === 'Default Department');
    if (defaultDept) {
      // Add to user_departments with a delay to avoid race conditions
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { error: addDeptError } = await supabase
        .from('user_departments')
        .insert({
          user_id: auth.user.id,
          department_id: defaultDept.department_id,
          role: 'super'
        });

      if (addDeptError) {
        console.error('❌ Failed to add to Default Department:', addDeptError.message);
      } else {
        console.log('✓ Added to Default Department as super');
      }
    }

    console.log('\nUser memberships cleaned up!');
    console.log('Please log out and log back in to complete the process.');

  } catch (error) {
    console.error('Script failed:', error.message);
  }
}

// Run the script
cleanUserMemberships(); 