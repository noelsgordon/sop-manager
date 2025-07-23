# Utils Directory

This directory contains utility functions, hooks, and helpers used throughout the SOP Manager application.

## Directory Structure

```
utils/
├── hooks/           # Custom React hooks
├── permissions.js   # Permission checking utilities
├── validation.js    # Form validation helpers
└── ...            # Other utility files
```

## Core Utilities

### Permission Utilities

The permission system is based on progressive enhancement where each role includes all permissions of lower roles:

```javascript
const ROLES = {
  LOOK: 'look',     // Read-only access
  TWEAK: 'tweak',   // Can suggest changes
  BUILD: 'build',   // Can create/edit
  ADMIN: 'manage',  // Department management
  SUPER: 'super'    // Cross-department management
};

// Role hierarchy (higher roles include all lower permissions)
const ROLE_HIERARCHY = {
  super: ['manage', 'build', 'tweak', 'look'],
  manage: ['build', 'tweak', 'look'],
  build: ['tweak', 'look'],
  tweak: ['look'],
  look: []
};
```

### Validation Utilities

Form validation helpers for:
- Email validation
- Required fields
- Permission checks
- Department validation
- Role validation

### Custom Hooks

1. **usePermissions**
   - Manages user permissions
   - Caches permission checks
   - Provides role validation
   - Handles permission updates

2. **useDepartments**
   - Manages department data
   - Handles department updates
   - Provides filtering
   - Caches department info

3. **useLoading**
   - Manages loading states
   - Provides feedback utilities
   - Handles multiple states
   - Cleanup on unmount

## Best Practices

1. **Code Organization**
   - Keep utilities focused and pure
   - Use TypeScript for type safety
   - Document all functions
   - Include usage examples

2. **Performance**
   - Memoize expensive operations
   - Use proper caching
   - Optimize loops
   - Minimize re-renders

3. **Error Handling**
   - Use consistent patterns
   - Provide helpful messages
   - Include stack traces
   - Handle edge cases

4. **Security**
   - Validate all inputs
   - Sanitize data
   - Check permissions
   - Handle sensitive data

## Using Utilities

Example usage of permission checking:

```javascript
import { hasPermission, ROLES } from '../utils/permissions';

// Check if user can edit
if (hasPermission(userRole, ROLES.BUILD)) {
  // Allow edit
}

// Check specific department access
if (hasPermission(userRole, ROLES.MANAGE, departmentId)) {
  // Allow department management
}
```

## Adding New Utilities

When adding new utilities:

1. Follow naming conventions
2. Add proper documentation
3. Include tests
4. Consider performance
5. Handle errors
6. Update this README

## Testing

Utilities should be tested for:
- Correct functionality
- Edge cases
- Error handling
- Performance
- Security implications

## Maintenance

Regular tasks:
1. Review and update documentation
2. Check for deprecated methods
3. Optimize performance
4. Update type definitions
5. Verify security measures 