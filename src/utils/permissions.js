/**
 * @fileoverview Centralized permission management system
 */

/**
 * Permission levels in order of increasing privilege
 */
export const PERMISSION_LEVELS = {
  LOOK: 'look',
  TWEAK: 'tweak',
  BUILD: 'build',
  MANAGE: 'manage',
  SUPERADMIN: 'superadmin'
};

/**
 * Feature permissions mapping
 */
export const FEATURE_PERMISSIONS = {
  // Basic features - available to all roles
  VIEW_LIBRARY: 'view_library',
  USE_SEARCH: 'use_search',
  VIEW_ADMIN_PANEL: 'view_admin_panel',

  // Content management features
  VIEW_SOP: 'view_sop',
  SUGGEST_CHANGES: 'suggest_changes',
  EDIT_SOP: 'edit_sop',
  CREATE_SOP: 'create_sop',
  DELETE_SOP: 'delete_sop',
  RESTORE_SOP: 'restore_sop',

  // Admin features
  VIEW_DELETED: 'view_deleted',
  MANAGE_USERS: 'manage_users',
  MANAGE_DEPARTMENTS: 'manage_departments',
  MANAGE_ALL: 'manage_all'
};

/**
 * Role hierarchy defining which permissions each role includes
 */
export const ROLE_HIERARCHY = {
  [PERMISSION_LEVELS.SUPERADMIN]: [
    PERMISSION_LEVELS.MANAGE,
    PERMISSION_LEVELS.BUILD,
    PERMISSION_LEVELS.TWEAK,
    PERMISSION_LEVELS.LOOK
  ],
  [PERMISSION_LEVELS.MANAGE]: [
    PERMISSION_LEVELS.BUILD,
    PERMISSION_LEVELS.TWEAK,
    PERMISSION_LEVELS.LOOK
  ],
  [PERMISSION_LEVELS.BUILD]: [
    PERMISSION_LEVELS.TWEAK,
    PERMISSION_LEVELS.LOOK
  ],
  [PERMISSION_LEVELS.TWEAK]: [
    PERMISSION_LEVELS.LOOK
  ],
  [PERMISSION_LEVELS.LOOK]: []
};

/**
 * Feature permissions mapping to roles
 */
export const FEATURE_ROLE_MAP = {
  // Basic features - available to all roles
  [FEATURE_PERMISSIONS.VIEW_LIBRARY]: [
    PERMISSION_LEVELS.LOOK,
    PERMISSION_LEVELS.TWEAK,
    PERMISSION_LEVELS.BUILD,
    PERMISSION_LEVELS.MANAGE,
    PERMISSION_LEVELS.SUPERADMIN
  ],
  [FEATURE_PERMISSIONS.USE_SEARCH]: [
    PERMISSION_LEVELS.LOOK,
    PERMISSION_LEVELS.TWEAK,
    PERMISSION_LEVELS.BUILD,
    PERMISSION_LEVELS.MANAGE,
    PERMISSION_LEVELS.SUPERADMIN
  ],
  [FEATURE_PERMISSIONS.VIEW_ADMIN_PANEL]: [
    PERMISSION_LEVELS.LOOK,
    PERMISSION_LEVELS.TWEAK,
    PERMISSION_LEVELS.BUILD,
    PERMISSION_LEVELS.MANAGE,
    PERMISSION_LEVELS.SUPERADMIN
  ],
  [FEATURE_PERMISSIONS.VIEW_SOP]: [
    PERMISSION_LEVELS.LOOK,
    PERMISSION_LEVELS.TWEAK,
    PERMISSION_LEVELS.BUILD,
    PERMISSION_LEVELS.MANAGE,
    PERMISSION_LEVELS.SUPERADMIN
  ],

  // Content management features
  [FEATURE_PERMISSIONS.SUGGEST_CHANGES]: [
    PERMISSION_LEVELS.TWEAK,
    PERMISSION_LEVELS.BUILD,
    PERMISSION_LEVELS.MANAGE,
    PERMISSION_LEVELS.SUPERADMIN
  ],
  [FEATURE_PERMISSIONS.EDIT_SOP]: [
    PERMISSION_LEVELS.BUILD,
    PERMISSION_LEVELS.MANAGE,
    PERMISSION_LEVELS.SUPERADMIN
  ],
  [FEATURE_PERMISSIONS.CREATE_SOP]: [
    PERMISSION_LEVELS.BUILD,
    PERMISSION_LEVELS.MANAGE,
    PERMISSION_LEVELS.SUPERADMIN
  ],
  [FEATURE_PERMISSIONS.DELETE_SOP]: [
    PERMISSION_LEVELS.MANAGE,
    PERMISSION_LEVELS.SUPERADMIN
  ],
  [FEATURE_PERMISSIONS.RESTORE_SOP]: [
    PERMISSION_LEVELS.MANAGE,
    PERMISSION_LEVELS.SUPERADMIN
  ],

  // Admin features
  [FEATURE_PERMISSIONS.VIEW_DELETED]: [
    PERMISSION_LEVELS.MANAGE,
    PERMISSION_LEVELS.SUPERADMIN
  ],
  [FEATURE_PERMISSIONS.MANAGE_USERS]: [
    PERMISSION_LEVELS.MANAGE,
    PERMISSION_LEVELS.SUPERADMIN
  ],
  [FEATURE_PERMISSIONS.MANAGE_DEPARTMENTS]: [
    PERMISSION_LEVELS.MANAGE,
    PERMISSION_LEVELS.SUPERADMIN
  ],
  [FEATURE_PERMISSIONS.MANAGE_ALL]: [
    PERMISSION_LEVELS.SUPERADMIN
  ]
};

/**
 * Check if a role has access to a feature
 * @param {string} role - The user's role
 * @param {string} feature - The feature to check
 * @returns {boolean} Whether the role has access to the feature
 */
export function hasFeatureAccess(role, feature) {
  if (!role || !feature) return false;
  if (role === PERMISSION_LEVELS.SUPERADMIN) return true; // Superadmin has all features
  const includedRoles = getIncludedRoles(role);
  return FEATURE_ROLE_MAP[feature]?.some(r => includedRoles.includes(r)) || false;
}

/**
 * Get all roles that a role includes (including itself)
 * @param {string} role - The role to check
 * @returns {string[]} Array of roles included in the hierarchy
 */
export function getIncludedRoles(role) {
  if (!role) return [];
  const includedRoles = new Set([role]);
  const queue = [role];

  while (queue.length > 0) {
    const currentRole = queue.shift();
    const inheritedRoles = ROLE_HIERARCHY[currentRole] || [];
    
    for (const inheritedRole of inheritedRoles) {
      if (!includedRoles.has(inheritedRole)) {
        includedRoles.add(inheritedRole);
        queue.push(inheritedRole);
      }
    }
  }

  return Array.from(includedRoles);
}

/**
 * Get all features available to a role
 * @param {string} role - The role to check
 * @returns {string[]} Array of available features
 */
export function getAvailableFeatures(role) {
  if (!role) return [];
  const includedRoles = getIncludedRoles(role);
  return Object.entries(FEATURE_ROLE_MAP)
    .filter(([_, roles]) => roles.some(r => includedRoles.includes(r)))
    .map(([feature]) => feature);
}

/**
 * Get all roles available to a role (for role switching)
 * @param {string} role - The current role
 * @param {boolean} isSuperAdmin - Whether the user is a SuperAdmin
 * @returns {string[]} Array of available roles
 */
export function getAvailableRoles(role, isSuperAdmin = false) {
  // SuperAdmin can switch to any role
  if (isSuperAdmin) {
    return Object.values(PERMISSION_LEVELS);
  }
  
  // Non-SuperAdmin users can only see their current role
  return [role];
}

/**
 * Get all roles that can be switched to from a role
 * @param {string} role - The current role
 * @param {boolean} isSuperAdmin - Whether the user is a SuperAdmin
 * @returns {string[]} Array of roles that can be switched to
 */
export function getSwitchableRoles(role, isSuperAdmin = false) {
  // SuperAdmin can switch to any role and back
  if (isSuperAdmin) {
    return Object.values(PERMISSION_LEVELS);
  }
  
  // Regular users can switch to any role they have access to (including lower roles)
  const includedRoles = getIncludedRoles(role);
  return includedRoles;
}

/**
 * Check if a user has permission to modify admin settings
 * @param {string} role - The user's role
 * @returns {boolean} Whether the user can modify admin settings
 */
export function canModifyAdminSettings(role) {
  return role === PERMISSION_LEVELS.MANAGE || role === PERMISSION_LEVELS.SUPERADMIN;
}

/**
 * Check if a user is a super admin
 * @param {Object} user - The user object
 * @returns {boolean} Whether the user is a super admin
 */
export function isSuperAdmin(user) {
  return user?.role === PERMISSION_LEVELS.SUPERADMIN || user?.is_superadmin;
}

/**
 * Get feature props for UI components
 * @param {string} role - The user's role
 * @param {string} feature - The feature to check
 * @returns {Object} Props to spread on UI components
 */
export function getFeatureProps(role, feature) {
  const hasAccess = hasFeatureAccess(role, feature);
  return {
    'aria-disabled': !hasAccess,
    'data-disabled': !hasAccess,
    disabled: !hasAccess,
    title: !hasAccess ? 'You do not have permission to use this feature' : undefined
  };
}

/**
 * Get all visible features for a given role
 * @param {string} role - The user's role
 * @returns {string[]} Array of visible feature types
 */
export function getVisibleFeatures(role) {
  if (!role) return [];
  const inheritedRoles = [role, ...(ROLE_HIERARCHY[role] || [])];
  return Object.entries(FEATURE_PERMISSIONS)
    .filter(([_, requiredRole]) => inheritedRoles.includes(requiredRole))
    .map(([featureType]) => featureType);
}

/**
 * Check if a feature should be visible for a given role
 * @param {string} featureType - The type of feature to check
 * @param {string} role - The user's role
 * @returns {boolean} Whether the feature should be visible
 */
export function isFeatureVisible(featureType, role) {
  if (!featureType || !role) return false;
  const requiredRole = FEATURE_PERMISSIONS[featureType];
  if (!requiredRole) return false;
  return hasPermission(role, requiredRole);
}

/**
 * Button visibility mapping based on minimum required role
 */
export const BUTTON_PERMISSIONS = {
  VIEW: PERMISSION_LEVELS.LOOK,
  SUGGEST: PERMISSION_LEVELS.TWEAK,
  EDIT: PERMISSION_LEVELS.BUILD,
  DELETE: PERMISSION_LEVELS.MANAGE,
  MANAGE_USERS: PERMISSION_LEVELS.MANAGE,
  MANAGE_ALL: PERMISSION_LEVELS.SUPERADMIN
};

/**
 * Get all visible buttons for a given role
 * @param {string} role - The user's role
 * @returns {string[]} Array of visible button types
 */
export function getVisibleButtons(role) {
  if (!role) return [];
  const inheritedRoles = [role, ...(ROLE_HIERARCHY[role] || [])];
  return Object.entries(BUTTON_PERMISSIONS)
    .filter(([_, requiredRole]) => inheritedRoles.includes(requiredRole))
    .map(([buttonType]) => buttonType);
}

/**
 * Check if a button should be visible for a given role
 * @param {string} buttonType - The type of button to check
 * @param {string} role - The user's role
 * @returns {boolean} Whether the button should be visible
 */
export function isButtonVisible(buttonType, role) {
  if (!buttonType || !role) return false;
  const requiredRole = BUTTON_PERMISSIONS[buttonType];
  if (!requiredRole) return false;
  return hasPermission(role, requiredRole);
}

/**
 * Get all available actions for a given role
 * @param {string} role - The user's role
 * @returns {string[]} Array of permitted actions
 */
export function getAvailableActionsForRole(role) {
  if (!role) return [];
  const inheritedRoles = [role, ...(ROLE_HIERARCHY[role] || [])];
  return Object.entries(BUTTON_PERMISSIONS)
    .filter(([_, requiredRole]) => inheritedRoles.includes(requiredRole))
    .map(([action]) => action);
}

/**
 * Check if a role has permission for a specific action
 * @param {string} role - The user's role
 * @param {string} action - The action to check
 * @returns {boolean} Whether the role can perform the action
 */
export function canPerformAction(role, action) {
  if (!role || !action) return false;
  const requiredRole = BUTTON_PERMISSIONS[action];
  if (!requiredRole) return false;
  return hasPermission(role, requiredRole);
}

/**
 * Check if a role has the required permission level
 * @param {string} role - The user's role
 * @param {string} requiredRole - The required role level
 * @returns {boolean} Whether the role has the required permission level
 */
export function hasPermission(role, requiredRole) {
  if (!role || !requiredRole) return false;
  return getIncludedRoles(role).includes(requiredRole);
}

/**
 * Get all permissions a role has access to
 * @param {string} role - The role to check
 * @returns {string[]} Array of permission levels the role has access to
 */
export function getPermissionsForRole(role) {
  if (!role) return [];
  return [role, ...(ROLE_HIERARCHY[role] || [])];
}

/**
 * Validate if a role change is allowed
 * @param {string} currentRole - Current role
 * @param {string} newRole - Requested new role
 * @returns {boolean} Whether the role change is valid
 */
export function isValidRoleChange(currentRole, newRole) {
  if (!currentRole || !newRole) return false;
  const validRoles = Object.values(PERMISSION_LEVELS);
  return validRoles.includes(newRole);
}

/**
 * Get the highest role from an array of roles
 * @param {string[]} roles - Array of roles
 * @returns {string} Highest role
 */
export function getHighestRole(roles) {
  if (!roles?.length) return PERMISSION_LEVELS.LOOK;
  const validRoles = Object.values(PERMISSION_LEVELS);
  return roles.reduce((highest, current) => {
    if (!validRoles.includes(current)) return highest;
    const currentIndex = validRoles.indexOf(current);
    const highestIndex = validRoles.indexOf(highest);
    return currentIndex > highestIndex ? current : highest;
  }, PERMISSION_LEVELS.LOOK);
}

/**
 * Test the permission system
 * This function is used for debugging and verifying the permission system
 */
export function testPermissions() {
  const tests = [
    // Test LOOK permissions
    {
      role: PERMISSION_LEVELS.LOOK,
      shouldHave: ['VIEW'],
      shouldNotHave: ['SUGGEST', 'EDIT', 'DELETE', 'MANAGE_USERS', 'MANAGE_ALL']
    },
    // Test TWEAK permissions
    {
      role: PERMISSION_LEVELS.TWEAK,
      shouldHave: ['VIEW', 'SUGGEST'],
      shouldNotHave: ['EDIT', 'DELETE', 'MANAGE_USERS', 'MANAGE_ALL']
    },
    // Test BUILD permissions
    {
      role: PERMISSION_LEVELS.BUILD,
      shouldHave: ['VIEW', 'SUGGEST', 'EDIT'],
      shouldNotHave: ['DELETE', 'MANAGE_USERS', 'MANAGE_ALL']
    },
    // Test MANAGE permissions
    {
      role: PERMISSION_LEVELS.MANAGE,
      shouldHave: ['VIEW', 'SUGGEST', 'EDIT', 'DELETE', 'MANAGE_USERS'],
      shouldNotHave: ['MANAGE_ALL']
    },
    // Test SUPERADMIN permissions
    {
      role: PERMISSION_LEVELS.SUPERADMIN,
      shouldHave: ['VIEW', 'SUGGEST', 'EDIT', 'DELETE', 'MANAGE_USERS', 'MANAGE_ALL'],
      shouldNotHave: []
    }
  ];

  const results = tests.map(test => {
    const visibleButtons = getVisibleButtons(test.role);
    const hasAllRequired = test.shouldHave.every(perm => visibleButtons.includes(perm));
    const hasNoForbidden = test.shouldNotHave.every(perm => !visibleButtons.includes(perm));
    
    return {
      role: test.role,
      passed: hasAllRequired && hasNoForbidden,
      visibleButtons,
      missingRequired: test.shouldHave.filter(perm => !visibleButtons.includes(perm)),
      unexpectedPermissions: test.shouldNotHave.filter(perm => visibleButtons.includes(perm))
    };
  });

  console.log('Permission System Test Results:');
  results.forEach(result => {
    console.log(`\nRole: ${result.role}`);
    console.log(`Passed: ${result.passed}`);
    console.log('Visible Buttons:', result.visibleButtons);
    if (result.missingRequired.length) {
      console.log('Missing Required Permissions:', result.missingRequired);
    }
    if (result.unexpectedPermissions.length) {
      console.log('Unexpected Permissions:', result.unexpectedPermissions);
    }
  });

  return results;
}

/**
 * Check if a role has permission to view admin panel
 * @param {string} role - The user's role
 * @returns {boolean} Whether the role can view admin panel
 */
export function canViewAdminPanel(role) {
  return hasPermission(role, PERMISSION_LEVELS.LOOK);
} 