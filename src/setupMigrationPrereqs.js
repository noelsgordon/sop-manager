import { supabase } from './supabaseClient.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupMigrationPrereqs() {
  process.stdout.write('Setting up migration prerequisites...\n\n');

  try {
    // 1. Read the SQL function definition
    process.stdout.write('Reading SQL function definition...\n');
    const execSqlPath = join(__dirname, 'create_exec_sql.sql');
    const execSqlContent = readFileSync(execSqlPath, 'utf8');
    process.stdout.write(`Found SQL file at: ${execSqlPath}\n`);

    // 2. Create the function using direct SQL execution
    process.stdout.write('Creating SQL execution function...\n');
    const { error: createError } = await supabase.sql(execSqlContent);

    if (createError) {
      process.stderr.write(`❌ Failed to create exec_sql function: ${createError.message}\n`);
      if (createError.details) process.stderr.write(`Details: ${createError.details}\n`);
      return false;
    }
    process.stdout.write('✓ Created exec_sql function\n');

    // 3. Verify the function exists
    const { data: funcCheck, error: checkError } = await supabase.sql(`
      SELECT routine_name, routine_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name = 'exec_sql';
    `);

    if (checkError) {
      process.stderr.write(`❌ Failed to verify function creation: ${checkError.message}\n`);
      return false;
    }

    if (funcCheck && funcCheck.length > 0) {
      process.stdout.write('✓ Verified exec_sql function exists\n');
    } else {
      process.stderr.write('❌ exec_sql function not found after creation\n');
      return false;
    }

    process.stdout.write('\n✓ Setup completed successfully\n');
    return true;

  } catch (error) {
    process.stderr.write(`Script failed: ${error.message}\n`);
    if (error.stack) process.stderr.write(`Stack trace: ${error.stack}\n`);
    return false;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupMigrationPrereqs()
    .then(success => {
      if (!success) {
        process.stdout.write('\n❌ Setup failed\n');
        process.exit(1);
      }
      process.stdout.write('\n✓ Setup completed\n');
      process.exit(0);
    })
    .catch(error => {
      process.stderr.write(`\nUnexpected error: ${error}\n`);
      if (error.stack) process.stderr.write(`Stack trace: ${error.stack}\n`);
      process.exit(1);
    });
}

export default setupMigrationPrereqs; 