import { supabase } from './supabaseClient.js';

async function migrateDatabase() {
  console.log('Starting user data migration...\n');

  try {
    // 1. Migrate user_companies to user_departments
    console.log('1. Checking for user_companies data to migrate...');
    const { data: oldUserCompanies, error: fetchError } = await supabase
      .from('user_companies')
      .select('*');

    if (fetchError) {
      console.log('✓ No user_companies table found (already migrated)');
    } else if (oldUserCompanies && oldUserCompanies.length > 0) {
      console.log(`Found ${oldUserCompanies.length} records to migrate`);

      // Map old roles to new roles
      const roleMap = {
        'viewer': 'look',
        'updater': 'tweak',
        'creator': 'build',
        'admin': 'manage',
        'superadmin': 'super',
        // Add case variations
        'Viewer': 'look',
        'Updater': 'tweak',
        'Creator': 'build',
        'Admin': 'manage',
        'Superadmin': 'super'
      };

      // Migrate each record
      for (const record of oldUserCompanies) {
        const newRecord = {
          user_id: record.user_id,
          department_id: record.company_id,
          role: roleMap[record.role] || 'look' // Default to 'look' if role not found
        };

        const { error: insertError } = await supabase
          .from('user_departments')
          .insert(newRecord);

        if (insertError) {
          console.log(`❌ Failed to migrate user ${record.user_id}: ${insertError.message}`);
        } else {
          console.log(`✓ Migrated user ${record.user_id}`);
        }
      }

      // Drop the old table
      const { error: dropError } = await supabase.rpc('drop_user_companies_table');
      if (dropError) {
        console.log('❌ Failed to drop old table:', dropError.message);
      } else {
        console.log('✓ Dropped old user_companies table');
      }
    }

    // 2. Update existing roles in user_departments
    console.log('\n2. Updating existing roles in user_departments...');
    const roleMigrations = [
      { from: 'viewer', to: 'look' },
      { from: 'updater', to: 'tweak' },
      { from: 'creator', to: 'build' },
      { from: 'admin', to: 'manage' },
      { from: 'superadmin', to: 'super' },
      // Add case variations
      { from: 'Viewer', to: 'look' },
      { from: 'Updater', to: 'tweak' },
      { from: 'Creator', to: 'build' },
      { from: 'Admin', to: 'manage' },
      { from: 'Superadmin', to: 'super' }
    ];

    for (const { from, to } of roleMigrations) {
      const { data, error } = await supabase
        .from('user_departments')
        .update({ role: to })
        .eq('role', from);

      if (error) {
        console.log(`❌ Failed to update role ${from} to ${to}: ${error.message}`);
      } else {
        console.log(`✓ Updated role ${from} to ${to}`);
      }
    }

    // 3. Verify the migration
    console.log('\n3. Verifying migration...');
    const { data: userDepts, error: verifyError } = await supabase
      .from('user_departments')
      .select('role');

    if (verifyError) {
      console.log('❌ Failed to verify migration:', verifyError.message);
    } else {
      const invalidRoles = userDepts.filter(
        ud => !['look', 'tweak', 'build', 'manage', 'super'].includes(ud.role)
      );

      if (invalidRoles.length > 0) {
        console.log(`❌ Found ${invalidRoles.length} records with invalid roles`);
        console.log('Invalid roles:', [...new Set(invalidRoles.map(r => r.role))]);
      } else {
        console.log('✓ All roles are valid');
      }
    }

    console.log('\nMigration completed!');

  } catch (error) {
    console.error('Migration failed:', error.message);
  }
}

migrateDatabase(); 