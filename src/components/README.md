# Components Directory

This directory contains all React components used in the SOP Manager application. Components are organized by feature and responsibility.

## Directory Structure

```
components/
├── ui/              # Reusable UI components
│   ├── button.jsx   # Base button component
│   ├── input.jsx    # Form input components
│   └── ...         # Other UI primitives
├── SuperAdminPanel.jsx    # Super admin management interface
├── AdminPanel.jsx         # Department admin interface
├── CreateUserModal.jsx    # User creation modal
└── ...                   # Other feature components
```

## Core Components

### Administrative Components

#### SuperAdminPanel
- Cross-department user management
- Permission matrix interface
- User creation and deletion
- Real-time updates
- Search functionality

#### AdminPanel
- Department-specific management
- User role management
- Invite code generation
- Department settings

### Modal Components

#### CreateUserModal
- User creation form
- Department assignment
- Permission level selection
- Form validation
- Invite code generation

#### ConfirmationModal
- Reusable confirmation dialog
- Customizable messages
- Loading state support
- Danger state styling

## UI Components

The `ui/` directory contains reusable UI components built on top of shadcn/ui and Tailwind CSS. These components maintain consistent styling and behavior across the application.

## Best Practices

1. **Component Organization**
   - Keep components focused and single-responsibility
   - Use proper TypeScript types/interfaces
   - Document props and behaviors
   - Include error boundaries where appropriate

2. **State Management**
   - Use local state for UI-only data
   - Implement proper loading states
   - Handle errors gracefully
   - Use optimistic updates where appropriate

3. **Performance**
   - Memoize expensive computations
   - Implement proper cleanup
   - Use proper React hooks
   - Avoid unnecessary re-renders

4. **Security**
   - Validate all inputs
   - Check permissions before actions
   - Sanitize displayed data
   - Handle sensitive data properly

## Adding New Components

When adding new components:

1. Follow the established naming convention
2. Add proper JSDoc documentation
3. Include error handling
4. Add loading states
5. Consider mobile responsiveness
6. Test thoroughly
7. Update this README if needed

## Testing

Components should be tested for:
- Proper rendering
- User interactions
- Error states
- Loading states
- Permission checks
- Edge cases

## Maintenance

Regular maintenance tasks:
1. Update dependencies
2. Check for deprecated patterns
3. Verify error handling
4. Test performance
5. Review security implications 