import { supabase } from './supabaseClient.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

process.stdout.write('Setting up SQL functions...\n');

// Read the SQL function definition
const sqlPath = join(__dirname, 'add_metadata_column.sql');
const sqlContent = readFileSync(sqlPath, 'utf8');

// Create the function
const { error } = await supabase.sql(sqlContent);

if (error) {
  process.stderr.write(`Error creating function: ${error.message}\n`);
  process.exit(1);
}

process.stdout.write('Successfully created SQL functions\n');
process.exit(0); 