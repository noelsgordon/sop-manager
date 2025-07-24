// Fix Test Record Creation - Based on actual table structures
// This will be used to update the RlsTestEnvironment component

// Helper function to get test record for insert (FIXED VERSION)
const getTestRecord = (tableName, userProfile) => {
  switch (tableName) {
    case 'departments':
      return {
        department_id: crypto.randomUUID(),
        name: `Test Department ${Date.now()}`,
        created_by: userProfile.user_id,
        is_default: false
        // Don't set created_at/updated_at - let database handle it
      };
      
    case 'user_departments':
      return {
        user_id: userProfile.user_id,
        department_id: '33333333-3333-3333-3333-333333333333',
        role: 'build'
        // Don't set created_at - let database handle it
      };
      
    case 'invite_codes':
      return {
        code: `TEST_${Date.now()}`,
        email: 'test@example.com',
        department_id: '33333333-3333-3333-3333-333333333333',
        role: 'build'
        // Don't set created_at - let database handle it
      };
      
    case 'sops':
      return {
        name: `Test SOP ${Date.now()}`,
        description: 'Test description',
        department_id: '33333333-3333-3333-3333-333333333333',
        created_by: userProfile.user_id,
        is_deleted: false,
        tags: ['test']
        // Don't set created_at/updated_at - let database handle it
      };
      
    case 'sop_steps':
      return {
        sop_id: '11111111-1111-1111-1111-111111111111',
        step_number: 1,
        instruction: 'Test instruction',
        tools: 'Test tools',
        parts: 'Test parts',
        photo: null
        // Don't set created_at/updated_at - let database handle it
      };
      
    default:
      return {};
  }
};

// Helper function to get update data (FIXED VERSION)
const getUpdateData = (tableName) => {
  switch (tableName) {
    case 'user_profiles':
      return { display_name: `Updated ${Date.now()}` };
    case 'departments':
      return { name: `Updated Department ${Date.now()}` };
    case 'user_departments':
      return { role: 'manage' };
    case 'invite_codes':
      return { email: `updated${Date.now()}@example.com` };
    case 'sops':
      return { name: `Updated SOP ${Date.now()}` };
    case 'sop_steps':
      return { instruction: `Updated instruction ${Date.now()}` };
    default:
      return {};
  }
};

// Test the functions
console.log('Test record for departments:', getTestRecord('departments', { user_id: 'test-user' }));
console.log('Test record for sop_steps:', getTestRecord('sop_steps', { user_id: 'test-user' })); 