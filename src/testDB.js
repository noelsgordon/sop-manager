import { supabase } from './supabaseClient.js';

process.stdout.write('Testing database connection...\n');

async function testDB() {
  try {
    // Test simple query
    const { data, error } = await supabase
      .from('departments')
      .select('count');

    if (error) {
      process.stderr.write(`Query error: ${error.message}\n`);
      return;
    }

    process.stdout.write(`Query successful: ${JSON.stringify(data)}\n`);

    // Test SQL execution
    const { data: sqlData, error: sqlError } = await supabase.sql('SELECT NOW();');

    if (sqlError) {
      process.stderr.write(`SQL error: ${sqlError.message}\n`);
      return;
    }

    process.stdout.write(`SQL execution successful: ${JSON.stringify(sqlData)}\n`);

  } catch (error) {
    process.stderr.write(`Unexpected error: ${error}\n`);
  }
}

testDB(); 