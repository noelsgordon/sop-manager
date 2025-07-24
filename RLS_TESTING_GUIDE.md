# RLS Testing Guide

## Overview

This guide explains how to use the RLS (Row Level Security) testing system in the SOP Manager application. The RLS test page is a superadmin-only tool for verifying database security policies and testing CRUD operations with different user scenarios.

## Accessing the RLS Test Page

1. **Login as a SuperAdmin**
   - Only users with `is_superadmin = true` can access the test page
   - Regular users will see "Access denied" message

2. **Navigate to SuperAdmin Panel**
   - Click on "SuperAdmin" in the sidebar navigation
   - This opens the SuperAdmin panel with menu options

3. **Open RLS Test Page**
   - Click "RLS Test Page" button in the SuperAdmin menu
   - This opens the dedicated RLS testing interface

## Test Table Structure

The RLS test system uses a dedicated table `rls_test_items` with the following schema:

```sql
CREATE TABLE rls_test_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id),
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Testing CRUD Operations

### 1. **Create (Insert)**
- Enter text in the "New item value..." input field
- Click "Add" button
- **Expected Behavior**: 
  - Superadmin can create items for any user
  - Regular users can only create items for themselves
  - Success toast notification appears

### 2. **Read (Select)**
- Items are automatically loaded when the page opens
- Table shows: Value, Owner, Created date, Actions
- **Expected Behavior**:
  - Superadmin sees all items
  - Regular users see only their own items
  - Loading spinner during fetch operations

### 3. **Update (Edit)**
- Click "Edit" button next to any item
- Modify the value in the inline input field
- Click "Save" or "Cancel"
- **Expected Behavior**:
  - Superadmin can edit any item
  - Regular users can only edit their own items
  - Success/error toast notifications

### 4. **Delete**
- Click the trash icon next to any item
- **Expected Behavior**:
  - Superadmin can delete any item
  - Regular users can only delete their own items
  - Confirmation toast notification

## Testing Different User Scenarios

### Scenario 1: SuperAdmin Testing
1. Login as superadmin user
2. Create items for different users
3. Verify you can see, edit, and delete all items
4. Test cross-user operations

### Scenario 2: Regular User Testing
1. Login as regular user
2. Create items (should be owned by current user)
3. Verify you can only see your own items
4. Test editing and deleting your items
5. Verify you cannot access other users' items

### Scenario 3: Multi-User Testing
1. Create items as User A
2. Switch to User B account
3. Verify User B cannot see User A's items
4. Create items as User B
5. Switch back to User A
6. Verify User A cannot see User B's items

## RLS Policy Testing

### Current Test Policies

The `rls_test_items` table has the following RLS policies:

```sql
-- Enable RLS
ALTER TABLE rls_test_items ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own items
CREATE POLICY "Users can view own items"
ON rls_test_items FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

-- Allow users to insert their own items
CREATE POLICY "Users can insert own items"
ON rls_test_items FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Allow users to update their own items
CREATE POLICY "Users can update own items"
ON rls_test_items FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Allow users to delete their own items
CREATE POLICY "Users can delete own items"
ON rls_test_items FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- Allow superadmins full access
CREATE POLICY "Superadmins have full access"
ON rls_test_items FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_superadmin = true
  )
);
```

### Testing Policy Enforcement

1. **Owner-Based Access**
   - Create items as different users
   - Verify each user only sees their own items
   - Test edit/delete permissions

2. **SuperAdmin Override**
   - Login as superadmin
   - Verify you can see all items
   - Test cross-user operations

3. **Policy Violations**
   - Try to access items you don't own
   - Verify proper error messages
   - Check that operations are blocked

## Error Handling

### Common Error Scenarios

1. **Permission Denied**
   - Error: "new row violates row-level security policy"
   - Cause: Trying to access/modify data you don't own
   - Solution: Check user permissions and ownership

2. **Authentication Required**
   - Error: "JWT must not be null"
   - Cause: User not properly authenticated
   - Solution: Ensure user is logged in

3. **Policy Not Found**
   - Error: "policy does not exist"
   - Cause: RLS policies not properly applied
   - Solution: Check database policy setup

### Debugging Tips

1. **Check User Context**
   ```javascript
   // In browser console
   const { data: { user } } = await supabase.auth.getUser();
   console.log('Current user:', user);
   ```

2. **Check RLS Status**
   ```sql
   -- In Supabase SQL editor
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'rls_test_items';
   ```

3. **Check Policies**
   ```sql
   -- In Supabase SQL editor
   SELECT * FROM pg_policies 
   WHERE tablename = 'rls_test_items';
   ```

## Best Practices

### For Developers

1. **Always Test Both Roles**
   - Test as superadmin and regular user
   - Verify proper access control

2. **Test Edge Cases**
   - Empty data scenarios
   - Invalid user IDs
   - Network errors

3. **Monitor Console**
   - Check browser console for errors
   - Look for Supabase error messages
   - Verify toast notifications

### For Administrators

1. **Regular Testing**
   - Test RLS policies after any changes
   - Verify superadmin access works
   - Check regular user restrictions

2. **Policy Updates**
   - Document policy changes
   - Test thoroughly before production
   - Have rollback plan ready

## Troubleshooting

### Common Issues

1. **Page Not Loading**
   - Check if user is superadmin
   - Verify authentication status
   - Check browser console for errors

2. **Operations Failing**
   - Verify RLS policies are enabled
   - Check user permissions
   - Ensure proper error handling

3. **Data Not Showing**
   - Check if user owns the data
   - Verify policy conditions
   - Test with different users

### Getting Help

1. **Check Logs**
   - Browser console for client errors
   - Supabase logs for server errors
   - Application error messages

2. **Verify Setup**
   - Confirm RLS is enabled on table
   - Check policy syntax
   - Verify user authentication

3. **Test Isolation**
   - Test with minimal data
   - Use different user accounts
   - Check policy conditions

## Future Enhancements

### Planned Features

1. **Advanced Testing**
   - Department-based testing
   - Role-based permission testing
   - Complex policy scenarios

2. **Automated Testing**
   - Unit tests for policies
   - Integration test suite
   - Policy validation tools

3. **Enhanced UI**
   - Policy status indicators
   - Real-time policy testing
   - Visual policy editor

### Contributing

When adding new RLS policies or test scenarios:

1. **Document Changes**
   - Update this guide
   - Add policy descriptions
   - Include test cases

2. **Test Thoroughly**
   - Test all user roles
   - Verify edge cases
   - Check error handling

3. **Follow Standards**
   - Use consistent naming
   - Follow security best practices
   - Maintain backward compatibility

---

*Last updated: Version 1.11*
*Maintained by: Development Team* 