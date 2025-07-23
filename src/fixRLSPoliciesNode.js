import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env file manually
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  return env;
}

// Load environment variables
const env = loadEnvFile();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

console.log('Environment check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  envKeys: Object.keys(env).filter(key => key.startsWith('VITE_'))
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env file:', {
    VITE_SUPABASE_URL: supabaseUrl ? 'present' : 'missing',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'present' : 'missing'
  });
  throw new Error('Missing required Supabase configuration. Check the console for more details.');
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixRLSPolicies() {
  console.log('🔧 Starting RLS Policy Fix...');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'src', 'fix_all_rls_policies.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📖 Read SQL file successfully');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}:`);
        console.log(statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
          errorCount++;
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err);
        errorCount++;
      }
    }
    
    console.log('\n📊 RLS Policy Fix Summary:');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    console.log(`📈 Success rate: ${((successCount / (successCount + errorCount)) * 100).toFixed(1)}%`);
    
    if (errorCount === 0) {
      console.log('\n🎉 All RLS policies have been fixed successfully!');
      console.log('🔒 Your database now has clean, consistent policies');
    } else {
      console.log('\n⚠️  Some statements failed. Check the errors above.');
    }
    
  } catch (error) {
    console.error('💥 Fatal error during RLS policy fix:', error);
  }
}

// Run the fix
fixRLSPolicies(); 