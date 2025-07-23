# Migration Scripts

This directory contains scripts used for database migrations and testing. These scripts were created during the transition from a company-centric to a department-centric model.

## Core Migration Scripts

### Department Migration
- `migrate_departments_safe_v2.sql` - SQL migration script (not used - Supabase doesn't support direct SQL)
- `migrateDepartmentsSafeV2.js` - JavaScript migration script using Supabase client
- `addMetadataColumn.js` - Adds/verifies metadata column in departments table

### SQL Functions
- `add_metadata_column.sql` - SQL function definition (not used - Supabase doesn't support custom functions)
- `setupSQLFunctions.js` - Attempts to create SQL functions (not used)

## Testing & Verification Scripts

### Database Tests
- `checkDepartments.js` - Verifies departments table structure
- `testDB.js` - Tests basic database operations
- `testSupabase.js` - Tests Supabase client connection
- `checkExecSQL.js` - Tests SQL execution (not used)

### Utility Tests
- `testError.js` - Tests error handling
- `testLogging.js` - Tests console output
- `testNode.js` - Tests Node.js functionality

## Important Notes

1. **Supabase Limitations**
   - Cannot execute raw SQL
   - Cannot create custom functions
   - Must use Supabase's built-in client functions

2. **Console Output**
   - Use `process.stdout.write()` instead of `console.log()`
   - Add error handlers for unhandled rejections/exceptions

3. **Database Operations**
   - Always verify table/column existence
   - Include error handling
   - Back up data before modifications

## Usage

1. Check current database state:
   ```bash
   node checkDepartments.js
   ```

2. Verify metadata column:
   ```bash
   node addMetadataColumn.js
   ```

3. Test database connection:
   ```bash
   node testSupabase.js
   ```

See `MIGRATION_NOTES.md` in the root directory for detailed documentation of the migration process and findings. 

## Current Architecture (2024)
- All user, department, and role state is managed in `useUserState.js`.
- Permissions are managed via `src/utils/permissions.js` and `useRoleBasedUI.js`.
- Navigation is currently hash-based, but will move to React Router.
- Known issues: panel/hash desync, state duplication, scattered permission logic, some silent Supabase errors.

## Planned Overhaul
- Move to React Router for navigation.
- Centralize all navigation and permission logic.
- Add robust error handling and user-facing error banners.
- Add E2E and unit tests for all critical flows. 