import { supabase } from './supabaseClient.js';
import fs from 'fs';
import path from 'path';

async function runSqlFile(filename) {
  try {
    console.log(`Running SQL file: ${filename}\n`);
    
    // Read the SQL file
    const sql = fs.readFileSync(path.join(process.cwd(), 'src', filename), 'utf8');
    
    // Split into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    // Execute each statement
    for (let stmt of statements) {
      const { error } = await supabase.rpc('exec_sql', { sql: stmt });
      if (error) {
        console.error(`❌ Error executing SQL: ${error.message}`);
      }
    }
    
    console.log('✓ SQL execution completed');
    
  } catch (error) {
    console.error('Script failed:', error.message);
  }
}

// Run the script
runSqlFile('fix_constraints.sql'); 