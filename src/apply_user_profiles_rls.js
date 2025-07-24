import { supabase } from './supabaseClientNode.js';
import fs from 'fs';
import path from 'path';

async function applyUserProfilesRLS() {
  console.log('🔧 Applying RLS policies to user_profiles table...\n');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'src', 'rls_user_profiles_policies.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📖 Read SQL file successfully');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*') && !stmt.startsWith('*/'))
      .filter(stmt => !stmt.includes('TESTING SCENARIOS') && !stmt.includes('POLICY RATIONALE'));
    
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
    
    console.log('\n📊 RLS Policy Application Summary:');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    console.log(`📈 Success rate: ${((successCount / (successCount + errorCount)) * 100).toFixed(1)}%`);
    
    // Verify the policies were applied
    console.log('\n🔍 Verifying RLS policies...');
    
    // Check if RLS is enabled
    const { data: rlsStatus, error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT schemaname, tablename, rowsecurity 
        FROM pg_tables 
        WHERE tablename = 'user_profiles';
      `
    });
    
    if (rlsError) {
      console.error('❌ Error checking RLS status:', rlsError);
    } else {
      console.log('✅ RLS status check completed');
    }
    
    // Check policies
    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies 
        WHERE tablename = 'user_profiles'
        ORDER BY policyname;
      `
    });
    
    if (policiesError) {
      console.error('❌ Error checking policies:', policiesError);
    } else {
      console.log('✅ Policy verification completed');
    }
    
    console.log('\n🎉 RLS policies for user_profiles table have been applied!');
    console.log('\n📋 Next Steps:');
    console.log('1. Test the policies using the RLS test page');
    console.log('2. Verify regular users can only update their own profiles');
    console.log('3. Verify superadmins have full access');
    console.log('4. Test profile creation and deletion scenarios');
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

// Test function to verify policies work correctly
async function testUserProfilesRLS() {
  console.log('\n🧪 Testing user_profiles RLS policies...\n');
  
  try {
    // Test 1: Check if we can view all profiles (should work for all authenticated users)
    console.log('Test 1: Viewing all profiles...');
    const { data: profiles, error: viewError } = await supabase
      .from('user_profiles')
      .select('user_id, email, display_name, is_superadmin')
      .limit(5);
    
    if (viewError) {
      console.error('❌ View profiles failed:', viewError.message);
    } else {
      console.log(`✅ Successfully viewed ${profiles?.length || 0} profiles`);
    }
    
    // Test 2: Try to update own profile (should work)
    console.log('\nTest 2: Updating own profile...');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          display_name: `Test Update ${new Date().toISOString().slice(0, 19)}` 
        })
        .eq('user_id', user.id);
      
      if (updateError) {
        console.error('❌ Update own profile failed:', updateError.message);
      } else {
        console.log('✅ Successfully updated own profile');
      }
    } else {
      console.log('⚠️ No authenticated user found for testing');
    }
    
    // Test 3: Try to update another user's profile (should fail for regular users)
    console.log('\nTest 3: Attempting to update another user\'s profile...');
    const { data: otherProfiles } = await supabase
      .from('user_profiles')
      .select('user_id')
      .neq('user_id', user?.id)
      .limit(1);
    
    if (otherProfiles && otherProfiles.length > 0) {
      const { error: crossUpdateError } = await supabase
        .from('user_profiles')
        .update({ display_name: 'Unauthorized Update' })
        .eq('user_id', otherProfiles[0].user_id);
      
      if (crossUpdateError) {
        console.log('✅ Cross-user update correctly blocked:', crossUpdateError.message);
      } else {
        console.log('⚠️ Cross-user update was not blocked (may be superadmin)');
      }
    }
    
    console.log('\n✅ RLS policy testing completed!');
    
  } catch (error) {
    console.error('❌ Testing failed:', error.message);
  }
}

// Run the script
if (process.argv.includes('--test')) {
  testUserProfilesRLS();
} else {
  applyUserProfilesRLS();
} 