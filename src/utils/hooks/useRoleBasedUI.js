/**
 * @fileoverview Custom hook for managing role-based UI visibility
 */

import { useMemo } from 'react';
import {
  PERMISSION_LEVELS,
  FEATURE_PERMISSIONS,
  hasFeatureAccess,
  getAvailableFeatures,
  getAvailableRoles,
  getSwitchableRoles,
  canModifyAdminSettings,
  isSuperAdmin,
  getFeatureProps
} from '../permissions';

/**
 * Custom hook for managing role-based UI visibility
 * 
 * @param {Object} user - The current user object
 * @param {string} departmentId - The current department ID
 * @returns {Object} Object containing UI visibility helpers
 */
export function useRoleBasedUI(user, departmentId) {
  // Check if user is SuperAdmin
  const isUserSuperAdmin = useMemo(() => {
    return user?.is_superadmin || false;
  }, [user]);

  // Get the effective role - either the current view role or fallback to LOOK
  const currentRole = useMemo(() => {
    if (!user) return null;
    return user.role || PERMISSION_LEVELS.LOOK;
  }, [user]);

  // Get available features based on current role
  const availableFeatures = useMemo(() => {
    return getAvailableFeatures(currentRole);
  }, [currentRole]);

  // Feature visibility check function
  const canShowFeature = useMemo(() => {
    return (feature) => {
      // If no user or no feature, deny access
      if (!user || !feature) return false;
      // Check if user has access to the feature based on their current role
      return hasFeatureAccess(currentRole, feature);
    };
  }, [user, currentRole]);

  // Admin modification check
  const canModifyAdmin = useMemo(() => {
    return canModifyAdminSettings(currentRole);
  }, [currentRole]);

  // Get available roles for switching
  const availableRoles = useMemo(() => {
    return getAvailableRoles(currentRole, isUserSuperAdmin);
  }, [currentRole, isUserSuperAdmin]);

  // Get roles that can be switched to
  const switchableRoles = useMemo(() => {
    return getSwitchableRoles(currentRole, isUserSuperAdmin);
  }, [currentRole, isUserSuperAdmin]);

  return {
    currentRole,
    PERMISSION_LEVELS,
    FEATURE_PERMISSIONS,
    canShowFeature,
    canModifyAdmin,
    isSuper: isUserSuperAdmin,
    availableFeatures,
    availableRoles,
    switchableRoles,
    getFeatureProps: (feature) => getFeatureProps(currentRole, feature)
  };
} 