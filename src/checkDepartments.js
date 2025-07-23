import { supabase } from './supabaseClient.js';

process.stdout.write('Checking departments table structure...\n');

// Get departments with all columns
const { data, error } = await supabase
  .from('departments')
  .select('*')
  .limit(2);

if (error) {
  process.stderr.write(`Error: ${error.message}\n`);
  process.exit(1);
}

process.stdout.write('Departments table columns:\n');
if (data && data.length > 0) {
  const columns = Object.keys(data[0]);
  columns.forEach(col => process.stdout.write(`- ${col}\n`));
  process.stdout.write('\nSample data:\n');
  process.stdout.write(JSON.stringify(data, null, 2) + '\n');
} else {
  process.stdout.write('No departments found\n');
}

process.exit(0); 