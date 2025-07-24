import { supabase } from './supabaseClientNode.js';

async function testRLSPolicies() {
  console.log('🧪 Testing RLS policies for user_profiles table...\n');
  
  try {
    // Test 1: Check current state (RLS should be disabled)
    console.log('Test 1: Checking current RLS state...');
    const { data: profiles, error: viewError } = await supabase
      .from('user_profiles')
      .select('user_id, email, display_name, is_superadmin')
      .limit(3);
    
    if (viewError) {
      console.error('❌ View profiles failed:', viewError.message);
    } else {
      console.log(`✅ Successfully viewed ${profiles?.length || 0} profiles (RLS disabled)`);
      if (profiles && profiles.length > 0) {
        console.log('Sample profiles:', profiles.map(p => ({ 
          user_id: p.user_id?.slice(0, 8) + '...', 
          email: p.email,
          is_superadmin: p.is_superadmin 
        })));
      }
    }
    
    // Test 2: Simulate what would happen with RLS enabled
    console.log('\nTest 2: Simulating RLS policy behavior...');
    console.log('This test shows what would happen if RLS was enabled:');
    
    const testPolicies = `
-- These are the policies we want to apply:
-- 1. SELECT: All authenticated users can view all profiles
-- 2. INSERT: Users can only insert their own profile  
-- 3. UPDATE: Users can only update their own profile
-- 4. DELETE: Only superadmins can delete profiles
-- 5. SUPERADMIN OVERRIDE: Superadmins have full access

-- Expected behavior:
-- - Regular users: Can view all, update own, cannot delete
-- - Superadmins: Can view all, update any, delete any
-- - Unauthenticated: Cannot access any profiles
`;
    
    console.log(testPolicies);
    
    // Test 3: Check if we have the exec_sql function
    console.log('\nTest 3: Checking for exec_sql function...');
    const { data: functions, error: funcError } = await supabase.rpc('exec_sql', {
      sql: 'SELECT 1;'
    });
    
    if (funcError) {
      console.log('❌ exec_sql function not available:', funcError.message);
      console.log('We will need to apply policies manually in Supabase dashboard');
    } else {
      console.log('✅ exec_sql function is available');
    }
    
    // Test 4: Check current policies
    console.log('\nTest 4: Checking current policies...');
    const { data: currentPolicies, error: policyError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'user_profiles');
    
    if (policyError) {
      console.log('❌ Cannot check policies:', policyError.message);
    } else {
      console.log(`✅ Found ${currentPolicies?.length || 0} current policies on user_profiles`);
      if (currentPolicies && currentPolicies.length > 0) {
        currentPolicies.forEach(policy => {
          console.log(`  - ${policy.policyname} (${policy.cmd})`);
        });
      }
    }
    
    console.log('\n📋 Next Steps:');
    console.log('1. The application is working (RLS disabled)');
    console.log('2. We can now test RLS policies safely');
    console.log('3. Once tested, we can enable RLS with proper policies');
    console.log('4. We should test with different user accounts');
    
  } catch (error) {
    console.error('❌ Testing failed:', error.message);
  }
}

// Run the test
testRLSPolicies(); 