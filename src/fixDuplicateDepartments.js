import { supabase } from './supabaseClient.js';

async function fixDuplicateDepartments() {
  console.log('Starting department cleanup...');
  
  try {
    // 1. Get all departments
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .order('created_at');

    if (deptError) throw deptError;

    // Group departments by name
    const departmentsByName = departments.reduce((acc, dept) => {
      if (!acc[dept.name]) acc[dept.name] = [];
      acc[dept.name].push(dept);
      return acc;
    }, {});

    // Process each group of departments
    for (const [name, depts] of Object.entries(departmentsByName)) {
      if (depts.length > 1) {
        console.log(`Found ${depts.length} duplicates for "${name}"`);
        
        // Keep the oldest department
        const [keepDept, ...duplicates] = depts;
        
        // Update references in user_departments
        for (const duplicate of duplicates) {
          // Move user_departments references
          const { error: udError } = await supabase
            .from('user_departments')
            .update({ department_id: keepDept.department_id })
            .eq('department_id', duplicate.department_id);
          
          if (udError) console.error(`Error updating user_departments for ${duplicate.department_id}:`, udError);

          // Move SOPs references
          const { error: sopError } = await supabase
            .from('sops')
            .update({ department_id: keepDept.department_id })
            .eq('department_id', duplicate.department_id);
          
          if (sopError) console.error(`Error updating sops for ${duplicate.department_id}:`, sopError);

          // Move invite_codes references
          const { error: inviteError } = await supabase
            .from('invite_codes')
            .update({ department_id: keepDept.department_id })
            .eq('department_id', duplicate.department_id);
          
          if (inviteError) console.error(`Error updating invite_codes for ${duplicate.department_id}:`, inviteError);

          // Delete the duplicate department
          const { error: deleteError } = await supabase
            .from('departments')
            .delete()
            .eq('department_id', duplicate.department_id);
          
          if (deleteError) console.error(`Error deleting department ${duplicate.department_id}:`, deleteError);
        }
      }
    }

    console.log('Department cleanup completed.');
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Run the cleanup
fixDuplicateDepartments(); 