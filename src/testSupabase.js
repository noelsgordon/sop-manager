import { supabase } from './supabaseClient.js';

process.stdout.write('Testing Supabase client...\n');

async function testSupabase() {
  try {
    // Test departments table
    const { data: deptData, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .limit(1);

    if (deptError) {
      process.stderr.write(`Error accessing departments: ${deptError.message}\n`);
      return;
    }

    process.stdout.write(`Successfully accessed departments table. First record: ${JSON.stringify(deptData[0])}\n`);

  } catch (error) {
    process.stderr.write(`Unexpected error: ${error}\n`);
  }
}

// Add event listeners for unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  process.stderr.write(`Unhandled Rejection at: ${promise}\n`);
  process.stderr.write(`Reason: ${reason}\n`);
});

process.on('uncaughtException', (error) => {
  process.stderr.write(`Uncaught Exception: ${error}\n`);
});

// Run the test
testSupabase()
  .then(() => {
    process.stdout.write('Test completed\n');
    setTimeout(() => process.exit(0), 1000);
  })
  .catch(error => {
    process.stderr.write(`Test failed: ${error}\n`);
    setTimeout(() => process.exit(1), 1000);
  }); 