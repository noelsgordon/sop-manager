import { supabase } from './supabaseClient.js';

async function updateRolesById() {
  try {
    // Update specific invite codes by ID
    const updates = [
      { id: '3c74cb1c-e04a-4d1c-a71a-c0555a4c4f9b', role: 'look' },
      { id: '3b3ce0c1-22ce-47a3-8114-5c161d47c00e', role: 'look' }
    ];

    for (const update of updates) {
      const { error } = await supabase
        .from('invite_codes')
        .update({ role: update.role })
        .eq('id', update.id);

      if (error) {
        console.error(`Failed to update ${update.id}:`, error.message);
      } else {
        console.log(`Updated ${update.id} to ${update.role}`);
      }
    }

    // Verify the updates
    const { data, error } = await supabase
      .from('invite_codes')
      .select('id, role')
      .in('id', updates.map(u => u.id));

    if (error) {
      console.error('Failed to verify:', error.message);
      return;
    }

    console.log('\nVerified roles:');
    data.forEach(row => {
      console.log(`${row.id}: "${row.role}"`);
    });

  } catch (error) {
    console.error('Update failed:', error.message);
  }
}

updateRolesById(); 