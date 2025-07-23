import { supabase } from './supabaseClient.js';

process.stdout.write('Adding metadata column to departments table...\n');

// First, try to select metadata to see if it exists
const { error: checkError } = await supabase
  .from('departments')
  .select('metadata')
  .limit(1);

if (!checkError || !checkError.message.includes('column "metadata" does not exist')) {
  process.stdout.write('Metadata column already exists\n');
  process.exit(0);
}

// Add metadata column by inserting a test record
const { error: insertError } = await supabase
  .from('departments')
  .upsert({
    department_id: '00000000-0000-0000-0000-000000000000',
    name: 'Metadata Test',
    metadata: { test: true }
  });

if (insertError) {
  process.stderr.write(`Failed to add metadata column: ${insertError.message}\n`);
  process.exit(1);
}

// Clean up test record
const { error: deleteError } = await supabase
  .from('departments')
  .delete()
  .eq('department_id', '00000000-0000-0000-0000-000000000000');

if (deleteError) {
  process.stderr.write(`Warning: Failed to clean up test record: ${deleteError.message}\n`);
}

// Verify the column exists
const { error: verifyError } = await supabase
  .from('departments')
  .select('metadata')
  .limit(1);

if (verifyError) {
  process.stderr.write(`Failed to verify metadata column: ${verifyError.message}\n`);
  process.exit(1);
}

process.stdout.write('Successfully added metadata column\n');
process.exit(0); 