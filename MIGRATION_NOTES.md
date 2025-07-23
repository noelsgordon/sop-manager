# SOP Manager Migration Notes

## Current Architecture State

### Database Structure
- **Departments Table**
  - Primary organizational unit
  - Columns:
    - `department_id` (UUID, primary key)
    - `name` (text)
    - `created_by` (UUID, foreign key) - References auth.users
    - `is_default` (boolean)
    - `created_at` (timestamp)
    - `metadata` (jsonb) - Stores additional department data

- **User Profiles Table**
  - User information and permissions
  - Columns:
    - `user_id` (UUID, primary key) - References auth.users
    - `display_name` (text)
    - `email` (text)
    - `is_superadmin` (boolean)
    - `created_at` (timestamp)
    - `metadata` (jsonb)

- **User Departments Table**
  - User-department relationships and roles
  - Columns:
    - `user_id` (UUID) - References user_profiles
    - `department_id` (UUID) - References departments
    - `role` (text) - One of: look, tweak, build, manage, super
    - `created_at` (timestamp)

### Migration Status
- ✅ Migration from company-centric to department-centric model is complete
- ✅ Companies have been migrated to top-level departments
- ✅ Companies table has been removed
- ✅ All necessary columns exist in departments table
- ✅ Department duplication issues resolved
- ✅ SOP assignments fixed and verified
- ✅ User department memberships cleaned up
- ✅ Database constraints and relationships fixed
- ✅ Role validation implemented
- ✅ Signup with invite code fixed
- ✅ New department creation fixed
- ✅ Query structure updated to handle relationship limitations
- ✅ SuperAdmin panel user management fixed
- ✅ RLS policies implemented for all tables
- ✅ User profile visibility issues resolved
- ✅ Department access control improved

### Recent Fixes

1. **RLS Policy Implementation**
   - Added policies for user_profiles table
   - Added policies for user_departments table
   - Fixed circular dependency issues
   - Implemented proper superadmin access
   - Added department-scoped permissions

2. **SuperAdmin Panel Improvements**
   - Fixed user visibility issues
   - Added department access management
   - Improved role management interface
   - Added user activity tracking
   - Enhanced error handling and logging

3. **SOP Management Updates**
   - Fixed step reordering functionality
   - Added step number tracking
   - Improved step deletion handling
   - Enhanced image compression
   - Added delete confirmation dialogs

4. **Security Enhancements**
   - Implemented proper RLS policies
   - Fixed permission inheritance
   - Added role validation
   - Improved error messages
   - Enhanced access control

### RLS Policy Examples

1. **User Profiles Policy**
```sql
-- Allow all authenticated users to view profiles
CREATE POLICY "View profiles policy"
ON user_profiles FOR SELECT
TO authenticated
USING (true);

-- Users can only update their own profile
CREATE POLICY "Update own profile policy"
ON user_profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

2. **User Departments Policy**
```sql
-- Allow superadmins to manage all department assignments
CREATE POLICY "Superadmins can manage all department assignments"
ON user_departments 
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_superadmin = true
  )
);

-- Users can view their own department assignments
CREATE POLICY "Users can view their own department assignments"
ON user_departments FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```

### Known Issues & Solutions

1. **RLS Policy Management**
   - Issue: Circular dependencies in policies
   - Solution: Use simpler policy structure
   - Solution: Separate concerns in policies
   - Solution: Use EXISTS clauses efficiently

2. **SuperAdmin Access**
   - Issue: Superadmin visibility of users
   - Solution: Simplified RLS policies
   - Solution: Proper role checking
   - Solution: Enhanced error handling

3. **Performance Considerations**
   - Issue: Multiple policy checks
   - Solution: Optimize policy conditions
   - Solution: Use efficient queries
   - Solution: Cache when possible

### Future Improvements

1. **Policy Management**
   - Add policy versioning
   - Implement policy testing
   - Add policy documentation
   - Create policy migration tools

2. **SuperAdmin Features**
   - Add user audit logs
   - Enhance user management
   - Add bulk operations
   - Improve activity tracking

3. **Security Enhancements**
   - Add role audit logs
   - Enhance permission tracking
   - Improve error reporting
   - Add security monitoring

### Best Practices

1. **RLS Policies**
   ```sql
   -- Keep policies simple
   CREATE POLICY "Basic select policy"
   ON table_name FOR SELECT
   TO authenticated
   USING (true);

   -- Use EXISTS for efficient checks
   CREATE POLICY "Superadmin policy"
   ON table_name FOR ALL
   TO authenticated
   USING (
     EXISTS (
       SELECT 1 FROM user_profiles
       WHERE user_id = auth.uid()
       AND is_superadmin = true
     )
   );
   ```

2. **Error Handling**
   ```javascript
   try {
     const { data, error } = await supabase
       .from("table_name")
       .select("*");
     
     if (error) {
       console.error("Error:", error);
       throw error;
     }
     
     console.log("Success:", data);
   } catch (err) {
     console.error("Operation failed:", err);
   }
   ```

3. **Role Management**
   ```javascript
   const VALID_ROLES = ['look', 'tweak', 'build', 'manage', 'super'];
   
   const validateRole = (role) => {
     const normalized = role.toLowerCase();
     return VALID_ROLES.includes(normalized) ? normalized : 'look';
   };
   ```

---
*Last updated: Version 1.6 - March 2024*

### Query Examples
```javascript
// Fetching user departments with names
const { data: userDepts } = await supabase
  .from("user_departments")
  .select("*")
  .eq("user_id", uid);

const { data: deptNames } = await supabase
  .from("departments")
  .select("department_id, name")
  .in("department_id", userDepts.map(d => d.department_id));

// Create a map for quick lookups
const deptNameMap = new Map(deptNames?.map(d => [d.department_id, d.name]));

// Enrich the data
const enriched = userDepts.map(dept => ({
  ...dept,
  name: deptNameMap.get(dept.department_id) ?? dept.department_id.slice(0, 8)
}));
```

### Known Issues & Solutions
1. **Relationship Constraints**
   - Cannot use direct joins in Supabase queries
   - Solution: Use separate queries and client-side joins
   - Fallback: Use department IDs when names unavailable
   - Cache: Store department names for reuse

2. **Performance Considerations**
   - Multiple queries increase latency
   - Solution: Cache department names
   - Solution: Batch related queries
   - Solution: Use optimistic updates

3. **Error Handling**
   - Handle missing department names
   - Provide fallback values
   - Log relationship errors
   - Maintain data consistency

### Future Improvements
1. **Caching**
   - Implement department name cache
   - Add cache invalidation
   - Use local storage
   - Add version tracking

2. **Performance**
   - Batch related queries
   - Implement query debouncing
   - Add loading states
   - Optimize data structures

3. **Error Handling**
   - Add retry mechanisms
   - Improve error messages
   - Add data validation
   - Implement recovery strategies

4. **User Experience**
   - Add loading indicators
   - Improve error messages
   - Add data refresh options
   - Implement optimistic updates

### Lessons Learned
1. **Database Design**
   - Plan for relationship limitations
   - Use separate queries when needed
   - Cache frequently used data
   - Handle missing data gracefully

2. **Query Structure**
   - Keep queries simple
   - Use client-side joins
   - Cache related data
   - Handle errors properly

3. **Performance**
   - Balance query count
   - Use appropriate caching
   - Optimize data structures
   - Monitor query times

4. **Error Handling**
   - Provide clear messages
   - Add fallback values
   - Log important errors
   - Maintain consistency

### Testing
1. **Query Testing**
   - Test with missing data
   - Verify data consistency
   - Check error handling
   - Validate relationships

2. **Performance Testing**
   - Monitor query times
   - Check cache efficiency
   - Test with large datasets
   - Verify error recovery

3. **Integration Testing**
   - Test all components
   - Verify data flow
   - Check error propagation
   - Test recovery mechanisms

## Access Control
- New role system implemented:
  - Look (previously Viewer)
  - Tweak (previously Updater)
  - Build (previously Creator)
  - Manage (previously Admin)
  - Super (previously SuperAdmin)

## Development Notes

### Database Connection
- Using Supabase client
- Connection works through `supabaseClient.js`
- Direct SQL execution (`supabase.sql()`) is not available
- Must use Supabase's built-in functions (select, insert, update, delete)
- RPC functions available for complex operations

### Best Practices

1. **Department Creation**
   ```javascript
   // Always include created_by
   const { data: department } = await supabase
     .from("departments")
     .insert({
       name: departmentName.trim(),
       created_by: userId
     })
     .select()
     .single();
   ```

2. **Department Membership**
   ```javascript
   // Clean up before adding
   await supabase
     .from("user_departments")
     .delete()
     .eq("user_id", userId)
     .eq("department_id", deptId);

   // Wait for deletion
   await new Promise(resolve => setTimeout(resolve, 1000));

   // Add new membership
   await supabase
     .from("user_departments")
     .insert({
       user_id: userId,
       department_id: deptId,
       role: normalizedRole
     });
   ```

3. **Role Normalization**
   ```javascript
   const normalizeRole = (role) => {
     const roleMap = {
       'look': 'look',
       'tweak': 'tweak',
       'build': 'build',
       'manage': 'manage',
       'super': 'super',
       'viewer': 'look',
       'updater': 'tweak',
       'creator': 'build',
       'admin': 'manage',
       'superadmin': 'super'
     };
     return roleMap[role.toLowerCase()] || 'look';
   };
   ```

4. **Invite Code Handling**
   ```javascript
   // Case-insensitive email check
   const { data: invites } = await supabase
     .from("invite_codes")
     .select("*")
     .eq("code", code)
     .eq("email", email.toLowerCase());
   ```

### Testing Scripts
- `verifyFixes.js` - Verifies all fixes
- `fix_schema.sql` - Sets up proper database relationships
- `fix_departments.sql` - Handles department cleanup
- `cleanupInvites.js` - Cleans up orphaned invites

## Future Considerations

### Database Operations
- Use RPC functions for complex operations
- Implement proper error handling
- Use transactions where possible
- Maintain audit logs
- Regular cleanup of orphaned records

### Code Structure
- Consistent role normalization
- Proper error handling
- User feedback
- Loading states
- Retry mechanisms

### Security
- RLS policies for all operations
- Role validation at database level
- Email case-insensitivity
- Proper constraint enforcement
- Audit logging

### Performance
- Proper indexing
- Efficient queries
- Batch operations
- Connection pooling
- Cache invalidation

### Maintenance
1. Regular cleanup of:
   - Orphaned invites
   - Invalid memberships
   - Unused departments
2. Monitoring of:
   - Failed operations
   - Performance issues
   - Error rates
3. Backup of:
   - Database
   - User data
   - Critical configurations

## Lessons Learned
1. **Database Design**
   - Always use proper constraints
   - Implement role validation
   - Track record ownership
   - Use cascade deletes
   - Index frequently queried fields

2. **Error Handling**
   - Provide clear user feedback
   - Log errors properly
   - Handle edge cases
   - Implement retries
   - Clean up partial operations

3. **Performance**
   - Use proper indexes
   - Batch operations
   - Handle race conditions
   - Implement caching
   - Monitor query performance

4. **Security**
   - Implement RLS properly
   - Validate at database level
   - Track ownership
   - Audit sensitive operations
   - Clean up sensitive data

5. **Testing**
   - Verify all fixes
   - Test edge cases
   - Monitor performance
   - Check constraints
   - Validate data integrity

## Useful Commands

### Check Database State
```javascript
// Check departments table structure
node src/checkDepartments.js

// Verify metadata column
node src/addMetadataColumn.js

// Check SOP assignments
node src/checkSops.js

// Fix department structure
node src/fixDepartments.js
```

### Test Database Connection
```javascript
// Test Supabase connection
node src/testSupabase.js

// Test database operations
node src/testDB.js
```

### Data Verification
```javascript
// Create test data
node src/createTestData.js

// Check department memberships
node src/checkDepartments.js

// Verify SOP visibility
node src/checkSops.js
```

### Connection and Deletion Verification
```javascript
// Verify successful deletions
node src/checkTables.js

// Fix failed deletions
node src/fixDepartments.js --verify-deletions

// Check connection status
node src/testSupabase.js --connection-check

// Monitor long-running operations
node src/checkTables.js --watch

// Verify data integrity
node src/checkSops.js --verify-integrity
```

### Recovery Operations
```javascript
// Restore orphaned records
node src/fixDepartments.js --restore-orphaned

// Clean up failed deletions
node src/fixDepartments.js --clean-failed-deletes

// Verify and fix department memberships
node src/cleanUserMemberships.js

// Clean up unknown departments
node src/cleanUnknownDepartments.js
```

### Lessons Learned
1. **Department Management**
   - Always maintain a Default Department
   - Clean up unknown/invalid departments regularly
   - Verify department references before deletion
   - Handle legacy constraints carefully

2. **User Memberships**
   - Delete all memberships before recreating
   - Handle legacy constraints from company system
   - Verify memberships after changes
   - Use Default Department as fallback

3. **SOP Visibility**
   - Keep all SOPs in valid departments
   - Clean up orphaned SOPs
   - Verify user access regularly
   - Handle department changes carefully

4. **Database Operations**
   - Always verify table/column existence before operations
   - Use Supabase's built-in functions instead of raw SQL
   - Handle errors explicitly and provide clear error messages
   - Maintain proper constraints and relationships

## Database Queries and Dependencies

### Supabase Foreign Key Relationships
When querying related tables in Supabase:
1. If foreign key relationships are not properly defined in the schema, nested selects will fail
2. In such cases, fetch related data separately and join in memory
3. Example: Instead of `select('*, related_table(*)')`, use separate queries and combine the data in the application

### Package Dependencies
1. When using lodash in a Vite project:
   - Install using `npm install lodash`
   - Import using `import { function } from 'lodash'` instead of `import function from 'lodash/function'`
   - This ensures proper module resolution in Vite's development server 

### Invite Code System
1. **Invite Code Generation**
   - Invite codes are generated but do not automatically send emails
   - Users must manually share the invite code with new users
   - New users must go to the signup page and enter the code
   - Codes are single-use and are deleted after successful use
   - Only Admin and Super roles can manage invite codes

2. **Invite Code Workflow**
   - Admin/Super generates invite code for specific email and role
   - Code is manually shared with the user
   - User signs up using the code
   - Code is automatically deleted after successful use
   - User is added to department with specified role

3. **Permission Requirements**
   - Generate/Manage Invites: Admin, Super roles only
   - View Invites: Admin, Super roles only
   - Use Invites: Any user with valid code
   - Delete Invites: Admin, Super roles only 

### SuperAdminPanel Updates

1. **User Management Features**
   - Added user deletion capability with confirmation modal
   - Added user creation with department and permission assignment
   - Protected Super Admin accounts from deletion
   - Added visual indicators for Super Admin users
   - Implemented optimistic UI updates for better UX

2. **User Creation Workflow**
   - One-step user creation with department and permission assignment
   - Form validation for required fields
   - Multi-department selection support
   - Optional invite email generation
   - Real-time feedback on creation status

3. **Security Considerations**
   - Super Admin accounts are protected from deletion
   - Users cannot delete their own accounts
   - Role-based access control for all operations
   - Clear visual feedback for restricted operations

4. **UI/UX Improvements**
   - Consistent modal designs
   - Loading states for all operations
   - Error handling with clear messages
   - Optimistic updates for better responsiveness
   - Visual indicators for user roles and states

### Important Notes
- User creation now supports department and permission assignment in one step
- User deletion is protected by confirmation dialog
- Invite codes do not automatically send emails - manual sharing required
- Super Admin accounts have additional protections and visual indicators 