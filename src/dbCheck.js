import { supabase } from './supabaseClient.js';

async function checkDatabaseStructure() {
  // Check departments table structure
  console.log('Checking departments table structure...');
  const { data: deptData, error: deptError } = await supabase
    .from('departments')
    .select('*')
    .limit(1);
  
  if (deptError) {
    console.log('❌ departments table error:', deptError.message);
  } else {
    console.log('✅ departments table exists');
    if (deptData && deptData.length > 0) {
      console.log('Departments columns:', Object.keys(deptData[0]));
    }
  }

  // Check user_departments table structure
  console.log('\nChecking user_departments table structure...');
  const { data: userDeptData, error: userDeptError } = await supabase
    .from('user_departments')
    .select('*')
    .limit(1);
  
  if (userDeptError) {
    console.log('❌ user_departments table error:', userDeptError.message);
  } else {
    console.log('✅ user_departments table exists');
    if (userDeptData && userDeptData.length > 0) {
      console.log('User departments columns:', Object.keys(userDeptData[0]));
    }
  }

  // Check sops table structure
  console.log('\nChecking sops table structure...');
  const { data: sopsData, error: sopsError } = await supabase
    .from('sops')
    .select('*')
    .limit(1);
  
  if (sopsError) {
    console.log('❌ sops table error:', sopsError.message);
  } else {
    console.log('✅ sops table exists');
    if (sopsData && sopsData.length > 0) {
      console.log('Sops columns:', Object.keys(sopsData[0]));
    }
  }

  // Check invite_codes table structure
  console.log('\nChecking invite_codes table structure...');
  const { data: inviteData, error: inviteError } = await supabase
    .from('invite_codes')
    .select('*')
    .limit(1);
  
  if (inviteError) {
    console.log('❌ invite_codes table error:', inviteError.message);
  } else {
    console.log('✅ invite_codes table exists');
    if (inviteData && inviteData.length > 0) {
      console.log('Invite codes columns:', Object.keys(inviteData[0]));
    }
  }
}

checkDatabaseStructure(); 