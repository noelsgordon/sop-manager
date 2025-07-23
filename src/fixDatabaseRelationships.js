import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Create a Supabase client with the service role key
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixDatabaseRelationships() {
  console.log('Starting database relationship fixes...\n');

  try {
    // 1. Get the Default Department
    const { data: defaultDept, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .eq('name', 'Default Department')
      .single();

    if (deptError) throw deptError;
    console.log('✓ Found Default Department:', defaultDept.department_id);

    // 2. Fix invite codes with invalid department IDs
    const { data: allInvites, error: inviteError } = await supabase
      .from('invite_codes')
      .select('*');

    if (inviteError) throw inviteError;
    console.log(`Found ${allInvites?.length || 0} total invite codes`);

    const { data: validDepts, error: deptListError } = await supabase
      .from('departments')
      .select('department_id');

    if (deptListError) throw deptListError;
    console.log(`Found ${validDepts?.length || 0} valid departments`);

    const validDeptIds = new Set(validDepts?.map(d => d.department_id) || []);
    console.log('Valid department IDs:', Array.from(validDeptIds));

    // 3. Fix user_department assignments
    const { data: userDepts, error: userDeptError } = await supabase
      .from('user_departments')
      .select('*');

    if (userDeptError) throw userDeptError;
    console.log(`Found ${userDepts?.length || 0} total user_department assignments`);

    const invalidUserDepts = (userDepts || []).filter(ud => !validDeptIds.has(ud.department_id));
    console.log(`Found ${invalidUserDepts.length} invalid user_department assignments`);

    if (invalidUserDepts.length > 0) {
      // Delete invalid assignments one by one using composite key
      for (const ud of invalidUserDepts) {
        const { error: deleteError } = await supabase
          .from('user_departments')
          .delete()
          .eq('user_id', ud.user_id)
          .eq('department_id', ud.department_id);

        if (deleteError) {
          console.error(`Failed to delete user_department assignment for user ${ud.user_id}:`, deleteError);
        }
      }
      console.log('Successfully deleted invalid user_department assignments');

      // Add users to Default Department
      const userInserts = [...new Set(invalidUserDepts.map(ud => ud.user_id))].map(userId => ({
        user_id: userId,
        department_id: defaultDept.department_id,
        role: 'super'
      }));

      const { error: insertError } = await supabase
        .from('user_departments')
        .upsert(userInserts, {
          onConflict: 'user_id,department_id',
          ignoreDuplicates: true
        });

      if (insertError) {
        console.error('Failed to add users to Default Department:', insertError);
      } else {
        console.log(`Successfully added ${userInserts.length} users to Default Department`);
      }
    }

    // 4. Ensure all users have access to Default Department
    const { data: users } = await supabase.auth.admin.listUsers();
    let userCount = 0;
    
    if (users?.users?.length > 0) {
      const userInserts = users.users.map(user => ({
        user_id: user.id,
        department_id: defaultDept.department_id,
        role: 'super'
      }));

      const { error: insertError } = await supabase
        .from('user_departments')
        .upsert(userInserts, { 
          onConflict: 'user_id,department_id',
          ignoreDuplicates: true 
        });

      if (insertError) {
        console.error('Failed to add users to Default Department:', insertError);
      } else {
        userCount = userInserts.length;
      }
    }
    console.log(`✓ Added/Updated ${userCount} users in Default Department`);

    // 5. Fix SOPs with invalid departments
    const { data: allSops } = await supabase
      .from('sops')
      .select('*');

    const invalidSops = (allSops || []).filter(sop => !validDeptIds.has(sop.department_id));

    if (invalidSops.length > 0) {
      const { error: updateError } = await supabase
        .from('sops')
        .update({ department_id: defaultDept.department_id })
        .in('id', invalidSops.map(sop => sop.id));

      if (updateError) {
        console.error('Failed to update SOPs:', updateError);
      } else {
        console.log(`Successfully updated ${invalidSops.length} SOPs to use Default Department`);
      }
    }
    console.log(`✓ Updated ${invalidSops.length} SOPs to use Default Department`);

    console.log('\n✓ Database relationship fixes completed');

  } catch (error) {
    console.error('Error during fixes:', error);
    process.exit(1);
  }
}

// Run the fixes
fixDatabaseRelationships(); 