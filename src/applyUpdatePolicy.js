import { supabase } from './supabaseClient.js';
import fs from 'fs';

async function applyUpdatePolicy() {
  console.log('Applying update policy...\n');

  try {
    // 1. Read the SQL file
    const sql = fs.readFileSync('src/addUpdatePolicy.sql', 'utf8');
    console.log('SQL to execute:', sql);

    // 2. Apply the policy
    const { error } = await supabase.rpc('apply_policy', {
      policy_sql: sql
    });

    if (error) {
      console.error('Failed to apply policy:', error.message);
      return;
    }

    console.log('✓ Policy applied successfully');

    // 3. Verify the policy
    console.log('\nVerifying policy...');
    const { data: policies, error: policyError } = await supabase.rpc('list_policies', {
      table_name: 'invite_codes'
    });

    if (policyError) {
      console.error('Failed to list policies:', policyError.message);
    } else {
      console.log('Current policies on invite_codes table:');
      console.log(policies);
    }

  } catch (error) {
    console.error('Script failed:', error.message);
  }
}

applyUpdatePolicy(); 