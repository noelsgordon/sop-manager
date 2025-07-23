import { supabase } from './supabaseClient.js';
import fs from 'fs';
import path from 'path';

async function applySQLFunctions() {
  try {
    console.log('Applying SQL functions...\n');

    // Read the SQL file
    const sqlContent = fs.readFileSync(
      path.join(process.cwd(), 'src', 'cleanup_invites.sql'),
      'utf8'
    );

    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Execute each statement
    for (const statement of statements) {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error('❌ Failed to execute SQL:', error.message);
        console.error('Statement:', statement);
      } else {
        console.log('✓ Successfully executed SQL statement');
      }
    }

    console.log('\nSQL functions applied successfully!');

  } catch (error) {
    console.error('Failed to apply SQL:', error.message);
  }
}

applySQLFunctions(); 