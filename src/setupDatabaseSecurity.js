import { supabase } from './supabaseClient.js';

async function setupDatabaseSecurity() {
  console.log('Setting up database security...');

  try {
    // 1. Add unique constraint to departments
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE departments 
        DROP CONSTRAINT IF EXISTS departments_name_key;
        
        ALTER TABLE departments 
        ADD CONSTRAINT departments_name_key UNIQUE (name);
      `
    });
    console.log('✓ Added unique constraint to departments');

    // 2. Set up RLS policies
    // Enable RLS on all tables
    const tables = ['departments', 'user_departments', 'sops', 'invite_codes'];
    for (const table of tables) {
      await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`
      });
    }
    console.log('✓ Enabled RLS on all tables');

    // 3. Create RLS policies
    // Departments policies
    await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing policies
        DROP POLICY IF EXISTS "departments_select_policy" ON departments;
        DROP POLICY IF EXISTS "departments_insert_policy" ON departments;
        DROP POLICY IF EXISTS "departments_update_policy" ON departments;
        DROP POLICY IF EXISTS "departments_delete_policy" ON departments;

        -- Create new policies
        CREATE POLICY "departments_select_policy" ON departments
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM user_departments
              WHERE user_departments.department_id = departments.department_id
              AND user_departments.user_id = auth.uid()
            )
          );

        CREATE POLICY "departments_insert_policy" ON departments
          FOR INSERT WITH CHECK (
            auth.uid() IS NOT NULL
          );

        CREATE POLICY "departments_update_policy" ON departments
          FOR UPDATE USING (
            EXISTS (
              SELECT 1 FROM user_departments
              WHERE user_departments.department_id = departments.department_id
              AND user_departments.user_id = auth.uid()
              AND user_departments.role IN ('manage', 'super')
            )
          );

        CREATE POLICY "departments_delete_policy" ON departments
          FOR DELETE USING (
            EXISTS (
              SELECT 1 FROM user_departments
              WHERE user_departments.department_id = departments.department_id
              AND user_departments.user_id = auth.uid()
              AND user_departments.role = 'super'
            )
          );
      `
    });
    console.log('✓ Created department policies');

    // SOPs policies
    await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing policies
        DROP POLICY IF EXISTS "sops_select_policy" ON sops;
        DROP POLICY IF EXISTS "sops_insert_policy" ON sops;
        DROP POLICY IF EXISTS "sops_update_policy" ON sops;
        DROP POLICY IF EXISTS "sops_delete_policy" ON sops;
        DROP POLICY IF EXISTS "sops_restore_policy" ON sops;

        -- Create new policies
        CREATE POLICY "sops_select_policy" ON sops
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM user_departments
              WHERE user_departments.department_id = sops.department_id
              AND user_departments.user_id = auth.uid()
            )
            AND deleted_at IS NULL  -- Only show non-deleted SOPs
          );

        CREATE POLICY "sops_insert_policy" ON sops
          FOR INSERT WITH CHECK (
            EXISTS (
              SELECT 1 FROM user_departments
              WHERE user_departments.department_id = sops.department_id
              AND user_departments.user_id = auth.uid()
              AND user_departments.role IN ('build', 'manage', 'super')
            )
          );

        CREATE POLICY "sops_update_policy" ON sops
          FOR UPDATE USING (
            EXISTS (
              SELECT 1 FROM user_departments
              WHERE user_departments.department_id = sops.department_id
              AND user_departments.user_id = auth.uid()
              AND user_departments.role IN ('tweak', 'build', 'manage', 'super')
            )
            AND deleted_at IS NULL  -- Can't update deleted SOPs
          );

        CREATE POLICY "sops_delete_policy" ON sops
          FOR DELETE USING (
            EXISTS (
              SELECT 1 FROM user_departments
              WHERE user_departments.department_id = sops.department_id
              AND user_departments.user_id = auth.uid()
              AND user_departments.role IN ('build', 'manage', 'super')  -- Only Builder and above can delete
            )
            AND deleted_at IS NULL  -- Can't delete already deleted SOPs
          );

        -- New policy for viewing deleted SOPs (for potential restoration)
        CREATE POLICY "sops_view_deleted_policy" ON sops
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM user_departments
              WHERE user_departments.department_id = sops.department_id
              AND user_departments.user_id = auth.uid()
              AND user_departments.role IN ('manage', 'super')  -- Only Manager and Super can see deleted SOPs
            )
            AND deleted_at IS NOT NULL
          );

        -- New policy for restoring deleted SOPs
        CREATE POLICY "sops_restore_policy" ON sops
          FOR UPDATE USING (
            EXISTS (
              SELECT 1 FROM user_departments
              WHERE user_departments.department_id = sops.department_id
              AND user_departments.user_id = auth.uid()
              AND user_departments.role IN ('manage', 'super')  -- Only Manager and Super can restore
            )
            AND deleted_at IS NOT NULL  -- Only allow restoring deleted SOPs
          );
      `
    });
    console.log('✓ Created SOP policies');

    // User departments policies
    await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing policies
        DROP POLICY IF EXISTS "user_departments_select_policy" ON user_departments;
        DROP POLICY IF EXISTS "user_departments_insert_policy" ON user_departments;
        DROP POLICY IF EXISTS "user_departments_update_policy" ON user_departments;
        DROP POLICY IF EXISTS "user_departments_delete_policy" ON user_departments;

        -- Create new policies
        CREATE POLICY "user_departments_select_policy" ON user_departments
          FOR SELECT USING (
            user_id = auth.uid() OR
            EXISTS (
              SELECT 1 FROM user_departments ud
              WHERE ud.department_id = user_departments.department_id
              AND ud.user_id = auth.uid()
              AND ud.role IN ('manage', 'super')
            )
          );

        CREATE POLICY "user_departments_insert_policy" ON user_departments
          FOR INSERT WITH CHECK (
            EXISTS (
              SELECT 1 FROM invite_codes
              WHERE invite_codes.department_id = user_departments.department_id
              AND invite_codes.email = (
                SELECT email FROM auth.users WHERE id = auth.uid()
              )
            ) OR
            EXISTS (
              SELECT 1 FROM user_departments ud
              WHERE ud.department_id = user_departments.department_id
              AND ud.user_id = auth.uid()
              AND ud.role IN ('manage', 'super')
            )
          );

        CREATE POLICY "user_departments_update_policy" ON user_departments
          FOR UPDATE USING (
            EXISTS (
              SELECT 1 FROM user_departments ud
              WHERE ud.department_id = user_departments.department_id
              AND ud.user_id = auth.uid()
              AND ud.role IN ('manage', 'super')
            )
          );

        CREATE POLICY "user_departments_delete_policy" ON user_departments
          FOR DELETE USING (
            user_id = auth.uid() OR
            EXISTS (
              SELECT 1 FROM user_departments ud
              WHERE ud.department_id = user_departments.department_id
              AND ud.user_id = auth.uid()
              AND ud.role = 'super'
            )
          );
      `
    });
    console.log('✓ Created user_departments policies');

    // Invite codes policies
    await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing policies
        DROP POLICY IF EXISTS "invite_codes_select_policy" ON invite_codes;
        DROP POLICY IF EXISTS "invite_codes_insert_policy" ON invite_codes;
        DROP POLICY IF EXISTS "invite_codes_delete_policy" ON invite_codes;

        -- Create new policies
        CREATE POLICY "invite_codes_select_policy" ON invite_codes
          FOR SELECT USING (
            created_by = auth.uid() OR
            EXISTS (
              SELECT 1 FROM user_departments ud
              WHERE ud.department_id = invite_codes.department_id
              AND ud.user_id = auth.uid()
              AND ud.role IN ('manage', 'super')
            )
          );

        CREATE POLICY "invite_codes_insert_policy" ON invite_codes
          FOR INSERT WITH CHECK (
            EXISTS (
              SELECT 1 FROM user_departments ud
              WHERE ud.department_id = invite_codes.department_id
              AND ud.user_id = auth.uid()
              AND ud.role IN ('manage', 'super')
            )
          );

        CREATE POLICY "invite_codes_delete_policy" ON invite_codes
          FOR DELETE USING (
            created_by = auth.uid() OR
            EXISTS (
              SELECT 1 FROM user_departments ud
              WHERE ud.department_id = invite_codes.department_id
              AND ud.user_id = auth.uid()
              AND ud.role IN ('manage', 'super')
            )
          );
      `
    });
    console.log('✓ Created invite_codes policies');

    // 4. Add role validation
    await supabase.rpc('exec_sql', {
      sql: `
        -- Add role validation
        ALTER TABLE user_departments 
        DROP CONSTRAINT IF EXISTS user_departments_role_check;
        
        ALTER TABLE user_departments 
        ADD CONSTRAINT user_departments_role_check 
        CHECK (role IN ('look', 'tweak', 'build', 'manage', 'super'));
      `
    });
    console.log('✓ Added role validation');

    console.log('Database security setup completed successfully.');
  } catch (error) {
    console.error('Error setting up database security:', error);
  }
}

// Run the setup
setupDatabaseSecurity(); 