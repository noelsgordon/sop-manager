# SOP Manager

A standalone application for managing Standard Operating Procedures (SOPs) with department-based access control.

## Features

- Department-based organization
- Role-based access control (RBAC)
- Invite code system
- SOP creation and management
- Image support with compression
- Real-time updates
- Responsive UI
- SuperAdmin panel for user management
- Soft delete and recovery system for SOPs
- Point-in-Time Recovery support (via Supabase)
- Comprehensive backup system

## Recent Updates (v1.7)

- Implemented comprehensive backup system with progress tracking
- Enhanced SuperAdmin panel with improved layout and functionality
- Added matrix-based user permission management
- Added backup metadata and README generation
- Implemented Windows-friendly backup naming
- Added image naming convention: `[SOP_Name]_[Step_Number]_[Hash].[ext]`
- Fixed SuperAdmin panel layout and duplicate headings
- Improved user management interface with real-time updates
- Enhanced error handling and loading states
- Added search functionality to user management

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
4. Update `.env` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
5. Run the development server:
   ```bash
   npm run dev
   ```

## Database Setup

The application uses Supabase for the database. The following tables are required:

- `departments` - Department management
- `user_departments` - User-department relationships
- `user_profiles` - User profile information
- `invite_codes` - Department invite system
- `sops` - SOP storage with soft delete support
- `sop_steps` - Individual SOP steps with soft delete support

Run the database setup scripts in order:
1. `src/fix_schema.sql` - Sets up proper relationships
2. `src/fix_departments.sql` - Handles department cleanup
3. `src/create_policies.sql` - Sets up RLS policies
4. `src/add_user_profiles_policy.sql` - Sets up user profile policies
5. `src/add_user_departments_policy.sql` - Sets up department access policies
6. `src/migration_functions.sql` - Sets up soft delete functionality

## User Roles

The system uses a hierarchical role system:
- **Look** - Can view SOPs
- **Tweak** - Can edit existing SOPs and delete steps
- **Build** - Can create and delete SOPs
- **Manage** - Can restore deleted SOPs and manage users
- **Super** - Full system access

## Backup and Recovery

The application implements a comprehensive backup and recovery system:

### Soft Delete System
- SOPs and their steps are not permanently deleted
- Deleted items are marked with a timestamp
- Only Builders and above can delete SOPs
- Only Managers and SuperAdmins can view and restore deleted SOPs
- Automatic cascading soft delete for SOP steps

### Supabase Backups
- Daily automated backups (Pro plan and above)
- Point-in-Time Recovery (PITR) available for granular recovery
- Physical backups for databases >15GB
- Backup retention based on plan:
  - Pro: 7 days
  - Team: 14 days
  - Enterprise: 30 days

### Recovery Options
1. **Soft Delete Recovery**
   - Managers and SuperAdmins can restore deleted SOPs
   - All associated steps are restored automatically
   - Available through the UI with a simple restore button

2. **Point-in-Time Recovery**
   - Available on Pro plan and above
   - Allows recovery to any point in time
   - Useful for recovering from accidental changes or deletions
   - Managed through Supabase dashboard

3. **Daily Backups**
   - Full database backups
   - Available on all paid plans
   - Can be used for full system recovery

## Security Considerations

- Role-based access control for all operations
- Soft delete triggers prevent accidental permanent deletion
- Only authorized roles can view and restore deleted items
- Audit trail via deleted_at timestamps
- Comprehensive RLS policies for all operations

## SuperAdmin Features

The SuperAdmin panel now includes three main sections:

### 1. Admin Panel
- Department visibility controls
- User profile information
- Basic administrative tools

### 2. User Management
- Matrix view of user permissions across departments
- Granular permission control (Look, Tweak, Build, Admin)
- Department access toggles
- User search functionality
- Add/Delete user capabilities
- Real-time updates and loading states

### 3. Backup System
- Complete system backup functionality
- Progress tracking with status updates
- Organized backup structure
- Metadata and README inclusion
- Windows-friendly file naming
- Image organization by SOP

## Development

### Prerequisites

- Node.js >= 16.16.0
- npm >= 10.9.2
- Supabase account

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Database Migrations

```bash
# Fix database schema
node src/runSql.js fix_schema.sql

# Fix department structure
node src/runSql.js fix_departments.sql

# Set up RLS policies
node src/runSql.js create_policies.sql
```

## Security

The application implements multiple security layers:
- Supabase authentication
- Row Level Security (RLS) policies
- Role-based access control
- Department-scoped permissions
- SuperAdmin access control

See [SECURITY.md](SECURITY.md) for detailed security information.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Version Information

Current Version: 1.7 (Backup & Admin Live)
- Added comprehensive backup system
- Enhanced SuperAdmin panel
- Improved user management interface
- Added backup progress tracking
- Fixed layout issues

For detailed deployment and version information, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Architecture & State Model (2024)

- All user, department, and role state is managed in `useUserState.js` (single source of truth).
- Navigation is currently hash-based with `activePanel` state, but will move to React Router for robustness.
- Permissions are managed via `src/utils/permissions.js` and `useRoleBasedUI.js`.
- All permission checks should use helpers, not ad-hoc logic.
- Known issues: panel/hash desync, state duplication, scattered permission logic, some silent Supabase errors.

## Overhaul Plan (v2.0)
- Adopt React Router for navigation (URL = single source of truth).
- Centralize all navigation logic in a router context/provider.
- Keep all user/department/role state in `useUserState` (or context).
- Remove duplicate/derived state.
- All permission checks must use helpers from `permissions.js` and `useRoleBasedUI`.
- Add user-facing error banners for all Supabase errors.
- Break up App.jsx into smaller containers (SOPManager, AdminManager, etc.).
- Add error boundaries and a debug panel for state inspection.
- Add E2E and unit tests for all critical flows.

## Known Issues
- Manual syncing of `activePanel` and `window.location.hash` is fragile and causes infinite loops or view reverts.
- State is sometimes duplicated (e.g., `activePanel` in state and in hash), leading to bugs.
- Permission checks are scattered across components, making it easy to miss a check or use the wrong one.
- Errors are often silent or only logged, making it hard to debug permission issues.
- Some components (e.g., `App.jsx`, `Header.jsx`) do too much, making them hard to reason about.

---
*Last updated: Version 1.7 - March 2024* 