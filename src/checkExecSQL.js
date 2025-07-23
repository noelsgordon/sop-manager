import { supabase } from './supabaseClient.js';

async function checkExecSQL() {
  console.log('Checking exec_sql function...');

  try {
    // Try to list available functions
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT routine_name, routine_type
        FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND routine_type = 'FUNCTION';
      `
    });

    if (error) {
      console.error('Error checking functions:', error.message);
      if (error.details) console.error('Details:', error.details);
      
      // Try a simple query to verify database connection
      console.log('\nTrying simple query to verify connection...');
      const { data: testData, error: testError } = await supabase
        .from('departments')
        .select('count');
      
      if (testError) {
        console.error('Database connection error:', testError.message);
      } else {
        console.log('Database connection successful');
        console.log('Department count:', testData[0].count);
      }
    } else {
      console.log('Available functions:', data);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkExecSQL(); 