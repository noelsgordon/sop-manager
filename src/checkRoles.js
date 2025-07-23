import { supabase } from './supabaseClient.js';

async function checkRoles() {
  try {
    const { data, error } = await supabase
      .from('invite_codes')
      .select('id, role');

    if (error) {
      console.error('Failed to fetch:', error.message);
      return;
    }

    console.log('Current roles:');
    data.forEach(row => {
      console.log(`${row.id}: "${row.role}"`);
    });

  } catch (error) {
    console.error('Check failed:', error.message);
  }
}

checkRoles(); 