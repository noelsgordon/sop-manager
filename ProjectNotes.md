# 2024-Refactor: Role & Department System Restoration

## Summary of Fixes (June 2024)

**Major issues with the role, department, and permission system were fully resolved with a robust, modern React + Supabase architecture.**

### Key Fixes
- **Centralized State:** All user, department, and role state is now managed in `useUserState.js`. No duplicate state in `App.jsx` or elsewhere.
- **Supabase Query Robustness:** The hook attempts a join for department names, but falls back to two queries if the foreign key is missing. This prevents schema errors and ensures department names always load.
- **No Fallbacks:** The current role is always sourced from Supabase, never defaulted to `'look'` or any fallback.
- **Role Button System:** Role buttons in `Header.jsx` use a loading state, update the role in Supabase, and reflect changes in the UI. Errors are shown if updates fail.
- **SuperAdmin Panel:** Always visible if `userProfile.is_superadmin === true`, regardless of department selection.
- **Permission Utilities:** All permission button visibility is determined by `getVisibleButtons(role)` and `isButtonVisible(button, role)` from `permissions.js`.
- **Debug Helpers:** `window.debugState()` exposes all relevant state and a `changeRole` function for console testing.
- **Error Handling:** All async operations have robust error and loading state management.

### Architecture Changes
- **Single Source of Truth:** Only `useUserState` manages user/department/role state. All components consume this hook.
- **Supabase Query Fallback:** If the schema does not support a join, the hook fetches department names separately.
- **UI Consistency:** All role/permission UI is driven by the current state from the hook, ensuring consistency and reliability.
- **Debugging:** Developers can inspect and mutate state from the browser console for rapid testing.

### TODOs / Improvements
- [ ] Add more granular error toasts for user feedback (currently only error banners)
- [ ] Add E2E tests for role/department switching and permission UI
- [ ] Consider React Context for global user/department state if more components need access
- [ ] Add optimistic UI updates for role changes
- [ ] Audit all SOP-related components to ensure they use permission utilities for button visibility

### Supabase Foreign Key Constraint (2024-06)

A foreign key constraint was added to ensure robust department joins:

```sql
-- Rollback/guard: Drop if exists
ALTER TABLE user_departments
DROP CONSTRAINT IF EXISTS user_departments_department_id_fkey;

-- Add the correct foreign key (assuming departments.department_id is PK)
ALTER TABLE user_departments
ADD CONSTRAINT user_departments_department_id_fkey
FOREIGN KEY (department_id)
REFERENCES departments(department_id)
ON DELETE CASCADE;
```

If your PK is `departments.id`, change the reference to `departments(id)`.

### Corrected Fetch Query

The fetch for user departments now uses:
```js
.from('user_departments')
.select('department_id, role, departments:department_id(name)')
.eq('user_id', session.user.id)
```
This only works if the foreign key exists. If not, the code falls back to fetching department names separately.

### Error Handling & Fallback
- All fetches are wrapped in try/catch.
- If the join fails, a fallback fetch is used.
- If both fail, the UI will not break, but department names will be omitted.
- All errors are logged clearly in the console for debugging.

### UI & Role-Based Rendering Fixes (2024-06)
- **Panel visibility is now strictly role-gated:**
  - AdminPanel only renders if `activePanel === 'admin'` and user is Admin or SuperAdmin.
  - SuperAdminPanel only renders if `userProfile.is_superadmin === true`.
  - Panels never leak onto the Library or other views.
- **Role buttons in Header:**
  - Only show up to 'manage' (no 'super' button).
  - Buttons reflect current view role and provide feedback via console logs.
  - Role switching is local unless SuperAdmin.
- **Rogue UI elements like 'super' button have been removed** from all selectors and enums.
- **New SOP button is restored and working:**
  - Sets up blank SOP state and opens the Wizard.
  - Console log confirms initialization.
- **Centralized helpers** are used for all role/panel logic, avoiding duplicated conditionals.
- **Console logs** are present for all panel switches, role changes, and SOP creation for easy validation.

### Wizard.jsx Crash Fix & SOP Prop Contract (2024-06)
- **Wizard.jsx now requires a valid `sop` object with a `.steps` array.**
- All `.steps`, `.steps.length`, and `.steps.map` accesses are robustly guarded.
- If `sop` or `sop.steps` is missing/invalid, Wizard logs a warning and renders a fallback UI instead of crashing.
- Parent components (e.g., App.jsx) must always pass a valid `sop` object, even for new SOP creation (e.g., `{ name: '', description: '', tags: [], steps: [] }`).
- Debug logs are present for both valid and invalid cases.
- This future-proofs Wizard against undefined props and incomplete SOP state.

## Latest Updates (March 2024)

### SuperAdmin Panel and Backup System Overhaul

#### 1. SuperAdmin Panel Improvements
- **Unified Layout**: Implemented a clean, vertical stacking layout for all components
- **Component Organization**:
  1. Admin Panel: Department visibility and basic admin tools
  2. User Management: Matrix-based permission control
  3. Backup System: System-wide backup functionality
- **Fixed Duplicate Headers**: Removed redundant "Admin Panel" heading
- **Enhanced User Management**:
  - Matrix view for user permissions across departments
  - Real-time permission updates
  - Granular access control with checkboxes
  - User search functionality
  - Add/Delete user capabilities
  - Loading states and error handling

#### 2. Backup System Implementation
- **Core Features**:
  - Complete system backup functionality
  - Progress tracking with status updates
  - Organized backup structure
  - Metadata and README inclusion
- **File Organization**:
  - Windows-friendly file naming
  - Consistent image naming: `[SOP_Name]_[Step_Number]_[Hash].[ext]`
  - Clear directory structure
- **Technical Details**:
  - Safe filename generation
  - ZIP file creation with organized structure
  - Progress tracking and error handling
  - Metadata and README generation

#### 3. UI/UX Improvements
- **Layout Fixes**:
  - Proper vertical stacking of components
  - Consistent spacing and alignment
  - Improved component visibility
- **User Feedback**:
  - Loading indicators for async operations
  - Error messages and success notifications
  - Progress bars for backup operations
- **Search and Filter**:
  - User search functionality
  - Real-time filtering
  - Debounced search input

---

# SOP Manager Project Documentation

## 🏗️ Architecture Overview

### Core Concepts
The SOP Manager is a standalone web application built to manage Standard Operating Procedures (SOPs) across departments. It uses a department-centric model where:

- **Departments** are the primary organizational units
- **Users** can belong to multiple departments with different roles
- **SOPs** are owned by departments and inherit their access controls
- **Roles** follow a progressive permission model
- **Super Admins** have cross-department management capabilities and are the sole source of user management

### Technology Stack
- **Frontend**: React + Vite
- **UI Framework**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase
- **State Management**: React Context + Local State
- **Authentication**: Supabase Auth

### Key Design Decisions

1. **Department-Centric Model**
   - Departments are the primary unit of organization
   - Users can have different roles in different departments
   - SOPs belong to departments, not individual users
   - Permissions are managed at the department level

2. **Role-Based Access Control**
   ```
   Look   → Read-only access to SOPs
   Tweak  → Can suggest changes to SOPs
   Build  → Can create and edit SOPs + all lower permissions
   Admin  → Can manage department users and SOPs + all lower permissions
   Super  → Cross-department management + all permissions
   ```

3. **Progressive Enhancement**
   - Each role includes all permissions of lower roles
   - Role checks cascade down (e.g., Build includes Look and Tweak)
   - Super Admin is a special role with cross-department access

4. **Optimistic UI Updates**
   - Changes are reflected immediately in UI
   - Background sync with error handling
   - Loading states for all async operations
   - Clear error feedback on failures

## 🔄 Recent Architecture Changes

### User Management Simplification
1. **Centralized User Control**
   - Super Admin is now the sole authority for user management
   - Direct user creation/modification through Super Admin Panel
   - Invite code system temporarily parked
   - Simplified onboarding process

2. **Role-Based UI Controls**
   - UI elements strictly gated by user role
   - Progressive button visibility based on permission level
   - Edit functionality enabled for Build+ roles
   - Server-side validation ensures security

3. **Permission Visibility Matrix**
   | Role  | Visible Actions                    |
   |-------|-----------------------------------|
   | Look  | View SOPs                         |
   | Tweak | View + Suggest Changes            |
   | Build | View + Suggest + Edit/Create      |
   | Admin | All SOP actions + User Management |
   | Super | All actions across departments    |

### Role and Permission System Improvements
1. **Centralized Permission Management**
   - Unified permission logic in `permissions.js`
   - Role hierarchy with progressive permissions
   - Centralized action validation
   - Clear permission inheritance model

2. **User State Management**
   - New `useUserState` hook for reliable user data
   - Automatic department selection
   - Real-time role updates
   - Error-tolerant state management

3. **Role Button System**
   - Visual feedback during role changes
   - Loading states and error handling
   - Real-time Supabase updates
   - Role validation before changes

4. **Super Admin Access**
   - Department-independent Super Admin access
   - Global visibility of admin features
   - Proper role inheritance for Super Admins

5. **Debug Capabilities**
   - `window.debugState()` for state inspection
   - Role change testing through console
   - Comprehensive error logging
   - State validation helpers

### Implementation Details
1. **Permission Levels**
   ```javascript
   LOOK → TWEAK → BUILD → MANAGE → SUPER
   ```
   Each level inherits all permissions below it

2. **Role Validation**
   - Server-side validation in Supabase
   - Client-side pre-validation
   - Real-time role updates
   - Error handling and recovery

3. **Department Context**
   - Role permissions per department
   - Automatic department selection
   - Role persistence across sessions
   - Clear department-role relationship

4. **UI Components**
   - Role-aware button visibility
   - Loading states during changes
   - Error feedback
   - Progressive permission display

5. **Testing & Debugging**
   ```javascript
   // Debug current state
   window.debugState()
   
   // Test role change
   window.debugState().changeRole('build')
   ```

### Implementation Notes
1. **User Creation**
   - Only through Super Admin Panel
   - Direct department and role assignment
   - No self-registration flow
   - Email-based user identification

2. **SOP Access Control**
   - Role-based button visibility
   - Server-side permission validation
   - Edit capability for Build+ roles
   - Progressive feature access

3. **Security Considerations**
   - Client and server permission checks
   - No UI-only security gates
   - Role validation on all operations
   - Audit logging of admin actions

## 📦 Database Schema

### Tables

1. **departments**
   ```sql
   - department_id (UUID, PK)
   - name (text)
   - created_by (UUID, FK to auth.users)
   - is_default (boolean)
   - created_at (timestamp)
   - metadata (jsonb)
   ```

2. **user_profiles**
   ```sql
   - user_id (UUID, PK)
   - email (text)
   - display_name (text)
   - first_name (text)
   - last_name (text)
   - is_superadmin (boolean)
   ```

3. **user_departments**
   ```sql
   - user_id (UUID, FK)
   - department_id (UUID, FK)
   - role (text)
   - created_at (timestamp)
   ```

4. **invite_codes**
   ```sql
   - id (UUID, PK)
   - code (text)
   - email (text)
   - department_id (UUID, FK)
   - role (text)
   - created_at (timestamp)
   ```

### Key Relationships
- Users can belong to multiple departments (many-to-many)
- Departments can have multiple users (many-to-many)
- Invite codes are single-use and department-specific
- SOPs belong to one department (one-to-many)

### Parked Features
The following features are temporarily disabled:
- Invite code management
- Self-registration flow
- Department-level invite system
- User-initiated role requests

### Active Features
- Super Admin user management
- Direct role assignment
- Department access control
- SOP edit capabilities for Build+

## 📁 Project Structure

### Core Directories
\`\`\`
src/
├── components/     # React components
│   ├── ui/        # Reusable UI components
│   └── ...        # Feature-specific components
├── utils/         # Utility functions and hooks
├── supabaseClient # Database connection
└── ...           # Other app files
\`\`\`

### Key Components

1. **SuperAdminPanel**
   - Cross-department user management
   - Permission matrix view
   - User creation and deletion
   - Role management across departments

2. **AdminPanel**
   - Department-specific user management
   - Invite code generation
   - Department settings
   - User role management

3. **SOPManager**
   - SOP creation and editing
   - Version control
   - Access control
   - Change tracking

## 🔐 Security Model

### Authentication
- Supabase handles user authentication
- Email-based signup/signin
- Invite-only registration
- Session management via Supabase

### Authorization
1. **Role-Based Access**
   - Look: Read-only
   - Tweak: Suggest changes
   - Build: Create/Edit
   - Admin: Manage users
   - Super: Global management

2. **Permission Checks**
   - Client-side role validation
   - Server-side RLS policies
   - Department membership verification
   - Super Admin privilege checks

### Data Protection
- Row Level Security (RLS) in Supabase
- Role-specific database policies
- Encrypted connections
- Audit logging for sensitive operations

### Role Enforcement
1. **UI Layer**
   - Button visibility based on role
   - Progressive feature access
   - Clear visual feedback
   - No hidden functionality

2. **API Layer**
   - Permission validation on all routes
   - Role-based access control
   - Department membership checks
   - Operation logging

3. **Database Layer**
   - RLS policies enforce permissions
   - Role-based query restrictions
   - Department access validation
   - Audit trail maintenance

## 🔄 State Management

### Data Flow
1. User actions trigger state updates
2. Optimistic UI updates show immediate feedback
3. Background sync with Supabase
4. Error handling and rollback if needed

### Caching Strategy
- Department data is cached
- User permissions are cached
- SOP content uses optimistic updates
- Real-time updates for collaborative features

## 🚀 Development Workflow

### Getting Started
1. Clone repository
2. Install dependencies (\`npm install\`)
3. Set up Supabase environment
4. Run development server (\`npm run dev\`)

### Best Practices
1. **Code Organization**
   - Use feature-based component structure
   - Keep components focused and small
   - Use custom hooks for logic reuse
   - Follow consistent naming conventions

2. **State Management**
   - Use local state for UI-only data
   - Use context for shared state
   - Implement optimistic updates
   - Handle loading and error states

3. **Security**
   - Always verify permissions
   - Use proper role checks
   - Validate user input
   - Handle edge cases

4. **Performance**
   - Implement proper caching
   - Use debouncing for searches
   - Optimize database queries
   - Monitor loading states

### Current Development Focus
1. **User Management**
   - Super Admin Panel improvements
   - Role management refinement
   - Department access controls
   - User modification tracking

2. **SOP Access**
   - Role-based button visibility
   - Edit capability for Build+
   - Permission validation
   - UI feedback improvements

3. **Security**
   - Permission enforcement
   - Role validation
   - Access control
   - Audit logging

## 🐛 Known Issues & Solutions

### Database Relationships
1. **Issue**: Supabase nested queries limitations
   **Solution**: Use separate queries and client-side joins

2. **Issue**: Race conditions in updates
   **Solution**: Implement optimistic updates with rollback

3. **Issue**: Permission sync delays
   **Solution**: Cache permissions and update optimistically

### UI/UX Considerations
1. **Issue**: Loading state feedback
   **Solution**: Implement skeleton loaders and spinners

2. **Issue**: Error message clarity
   **Solution**: Use consistent error handling pattern

3. **Issue**: Permission feedback
   **Solution**: Clear visual indicators for role-based actions

### Current Limitations
1. **User Management**
   - No self-registration
   - Super Admin-only user creation
   - Manual email communication
   - Direct role assignment only

2. **Permission Changes**
   - Only through Super Admin
   - No role request system
   - Manual approval process
   - Direct department assignment

## 📈 Future Improvements

### Planned Features
1. **Enhanced User Management**
   - Automated email notifications
   - Bulk user operations
   - Role request workflow
   - Department templates

2. **Enhanced Audit Logging**
   - Track all user actions
   - Monitor permission changes
   - Log access attempts

3. **Advanced Search**
   - Full-text search for SOPs
   - Filter by multiple criteria
   - Save search preferences

4. **Batch Operations**
   - Bulk user management
   - Mass permission updates
   - Department merging

### Technical Debt
1. **Query Optimization**
   - Implement proper caching
   - Reduce database calls
   - Optimize joins

2. **Error Handling**
   - Implement retry mechanisms
   - Improve error messages
   - Add error boundaries

3. **Testing**
   - Add unit tests
   - Implement E2E testing
   - Add performance testing

## 📝 Maintenance Guide

### Regular Tasks
1. Clean up unused invite codes
2. Verify user permissions
3. Check for orphaned records
4. Monitor performance metrics

### Troubleshooting
1. **Permission Issues**
   - Check user_departments table
   - Verify role assignments
   - Check Super Admin status

2. **Database Sync**
   - Verify Supabase connection
   - Check RLS policies
   - Monitor real-time updates

3. **UI Problems**
   - Clear browser cache
   - Check console errors
   - Verify state updates

## 🤝 Contributing

### Development Flow
1. Create feature branch
2. Implement changes
3. Test thoroughly
4. Submit PR with documentation

### Documentation Standards
1. Use JSDoc for functions
2. Add inline comments for complex logic
3. Update README files
4. Keep ProjectNotes.md current

### Testing Requirements
1. Verify permission logic
2. Test edge cases
3. Check error handling
4. Validate UI feedback 

## 2024 Overhaul Plan & Known Issues

### Navigation & State
- Manual syncing of `activePanel` and `window.location.hash` is fragile and causes infinite loops or view reverts.
- State is sometimes duplicated (e.g., `activePanel` in state and in hash), leading to bugs.
- Solution: Move to React Router, centralize navigation logic, and use a single source of truth for navigation.

### Permissions
- Permission checks are scattered across components, making it easy to miss a check or use the wrong one.
- Solution: Centralize permission logic in `permissions.js` and `useRoleBasedUI.js`.

### Error Handling
- Errors are often silent or only logged, making it hard to debug permission issues.
- Solution: Add user-facing error banners and robust error handling.

### Component Structure
- Some components (e.g., `App.jsx`, `Header.jsx`) do too much, making them hard to reason about.
- Solution: Break up large components, use container/presenter patterns, and keep logic focused.

### SOP Edit Flow
- The architecture supports reviewing an SOP in wizard mode for editing: when a user with permission clicks "Edit" on a SOP, the SOP is loaded into the Wizard component, which allows editing and saving back to Supabase. This is handled by `handleEditSop` in App.jsx, which sets `isEditing` and `editSopId`, and switches the panel to "wizard" with the current SOP loaded.

### Overhaul Steps
- Adopt React Router for navigation.
- Centralize all navigation logic in a router context/provider.
- Keep all user/department/role state in `useUserState` (or context).
- Remove duplicate/derived state.
- All permission checks must use helpers from `permissions.js` and `useRoleBasedUI`.
- Add user-facing error banners for all Supabase errors.
- Break up App.jsx into smaller containers (SOPManager, AdminManager, etc.).
- Add error boundaries and a debug panel for state inspection.
- Add E2E and unit tests for all critical flows. 