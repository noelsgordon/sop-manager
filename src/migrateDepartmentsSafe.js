import { supabase } from './supabaseClient.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrateDepartmentsSafe() {
  process.stdout.write('Starting safe departments migration...\n\n');

  try {
    // 1. Read the migration SQL file
    process.stdout.write('Reading migration SQL file...\n');
    const sqlPath = join(__dirname, 'migrate_departments_safe.sql');
    const migrationSQL = readFileSync(sqlPath, 'utf8');
    process.stdout.write(`Found SQL file at: ${sqlPath}\n`);
    process.stdout.write(`SQL content length: ${migrationSQL.length} characters\n\n`);

    // 2. Execute the migration
    process.stdout.write('Executing migration...\n');
    const { error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      process.stderr.write(`❌ Migration failed: ${error.message}\n`);
      if (error.details) process.stderr.write(`Details: ${error.details}\n`);
      return false;
    }
    process.stdout.write('Migration SQL executed\n\n');

    // 3. Verify the migration
    process.stdout.write('Verifying migration results...\n');
    
    // Check departments table
    const { data: depts, error: deptError } = await supabase
      .from('departments')
      .select('count');
    
    if (deptError) {
      process.stderr.write(`❌ Failed to verify departments: ${deptError.message}\n`);
      return false;
    }
    
    process.stdout.write(`✓ Found ${depts[0].count} departments\n\n`);

    // Check related tables
    const tables = ['sops', 'user_departments', 'invite_codes'];
    for (const table of tables) {
      process.stdout.write(`Checking ${table} table...\n`);
      const { data, error: tableError } = await supabase
        .from(table)
        .select('department_id')
        .is('department_id', null)
        .limit(1);

      if (tableError) {
        process.stderr.write(`❌ Failed to verify ${table}: ${tableError.message}\n`);
        return false;
      }

      if (data && data.length > 0) {
        process.stderr.write(`❌ Found orphaned records in ${table}\n`);
        return false;
      }

      process.stdout.write(`✓ Verified ${table} integrity\n`);
    }

    process.stdout.write('\n✓ Migration completed successfully\n');
    return true;

  } catch (error) {
    process.stderr.write(`Script failed: ${error.message}\n`);
    if (error.stack) process.stderr.write(`Stack trace: ${error.stack}\n`);
    return false;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateDepartmentsSafe()
    .then(success => {
      if (!success) {
        process.stdout.write('\n❌ Migration failed\n');
        process.exit(1);
      }
      process.stdout.write('\n✓ Migration completed\n');
      process.exit(0);
    })
    .catch(error => {
      process.stderr.write(`\nUnexpected error: ${error}\n`);
      if (error.stack) process.stderr.write(`Stack trace: ${error.stack}\n`);
      process.exit(1);
    });
}

export default migrateDepartmentsSafe; 