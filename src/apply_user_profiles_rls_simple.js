import { supabase } from './supabaseClientNode.js';

async function applyUserProfilesRLS() {
  console.log('🔧 Applying RLS policies to user_profiles table...\n');
  
  try {
    // First, let's check if the user_profiles table exists and get its structure
    console.log('📋 Checking user_profiles table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error accessing user_profiles table:', tableError.message);
      return;
    }
    
    console.log('✅ user_profiles table is accessible');
    
    // Since we can't use exec_sql, let's apply policies manually
    // We'll need to run these SQL statements directly in Supabase dashboard
    console.log('\n📝 RLS Policies to apply manually in Supabase SQL Editor:');
    console.log('========================================================');
    
    const policies = `
-- Enable RLS on user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Only superadmins can delete profiles" ON user_profiles;
DROP POLICY IF EXISTS "Superadmins have full access" ON user_profiles;

-- 1. SELECT POLICY: All authenticated users can view all profiles
CREATE POLICY "Users can view all profiles"
ON user_profiles FOR SELECT
TO authenticated
USING (true);

-- 2. INSERT POLICY: Users can only insert their own profile
CREATE POLICY "Users can insert own profile"
ON user_profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 3. UPDATE POLICY: Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 4. DELETE POLICY: Only superadmins can delete profiles
CREATE POLICY "Only superadmins can delete profiles"
ON user_profiles FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_superadmin = true
  )
);

-- 5. SUPERADMIN OVERRIDE: Superadmins have full access
CREATE POLICY "Superadmins have full access"
ON user_profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_superadmin = true
  )
);
`;
    
    console.log(policies);
    console.log('\n📋 Instructions:');
    console.log('1. Copy the SQL above');
    console.log('2. Go to your Supabase dashboard');
    console.log('3. Navigate to SQL Editor');
    console.log('4. Paste and execute the SQL');
    console.log('5. Run the test script: node src/apply_user_profiles_rls_simple.js --test');
    
    // Test current state
    console.log('\n🧪 Testing current user_profiles access...');
    await testUserProfilesAccess();
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

async function testUserProfilesAccess() {
  try {
    // Test 1: Check if we can view profiles
    console.log('Test 1: Viewing user profiles...');
    const { data: profiles, error: viewError } = await supabase
      .from('user_profiles')
      .select('user_id, email, display_name, is_superadmin')
      .limit(3);
    
    if (viewError) {
      console.error('❌ View profiles failed:', viewError.message);
    } else {
      console.log(`✅ Successfully viewed ${profiles?.length || 0} profiles`);
      if (profiles && profiles.length > 0) {
        console.log('Sample profiles:', profiles.map(p => ({ 
          user_id: p.user_id?.slice(0, 8) + '...', 
          email: p.email,
          is_superadmin: p.is_superadmin 
        })));
      }
    }
    
    // Test 2: Get current user
    console.log('\nTest 2: Getting current user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Get user failed:', userError.message);
    } else if (user) {
      console.log('✅ Current user:', user.email);
      
      // Test 3: Try to update own profile
      console.log('\nTest 3: Attempting to update own profile...');
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
      console.log('⚠️ No authenticated user found');
    }
    
  } catch (error) {
    console.error('❌ Testing failed:', error.message);
  }
}

// Run the script
if (process.argv.includes('--test')) {
  testUserProfilesAccess();
} else {
  applyUserProfilesRLS();
} 