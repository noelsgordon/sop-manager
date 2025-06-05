// Header.jsx
import React, { useCallback, useEffect, useState } from "react";
import { Loader2, Archive } from "lucide-react";
import version from "../version.json";
import { useRoleBasedUI } from "../utils/hooks/useRoleBasedUI";
import { Checkbox } from "./ui/checkbox";

const Header = React.memo(({ 
  userRole,
  viewRole,
  changeViewRole,
  getActualRole,
  setViewMode, 
  isSuperAdmin: isSuperAdminProp,
  isLoading = false,
  roleLoading = false,
  showDeletedSOPs,
  setShowDeletedSOPs
}) => {
  const [renderCount, setRenderCount] = useState(0);

  // Get role-based permissions at component level
  const {
    canShowFeature,
    getFeatureProps,
    FEATURE_PERMISSIONS,
    switchableRoles,
  } = useRoleBasedUI({ 
    is_superadmin: isSuperAdminProp,
    role: viewRole || userRole
  }, null);

  // Enhanced Debug Logger
  const logDebug = useCallback((location, data, type = 'info') => {
    const debugInfo = {
      ...data,
      timestamp: new Date().toISOString(),
      component: 'Header',
      location,
      type,
      renderCount,
      state: {
        userRole,
        viewRole,
        actualRole: getActualRole(),
        isSuperAdmin: isSuperAdminProp,
        isLoading,
        roleLoading
      }
    };
    console.log(`[Header Debug ${location}]`, debugInfo);
    
    if (!window._headerDebugHistory) {
      window._headerDebugHistory = [];
    }
    window._headerDebugHistory.push(debugInfo);
  }, [
    userRole,
    viewRole,
    getActualRole,
    isSuperAdminProp,
    isLoading,
    roleLoading,
    renderCount
  ]);

  // Track render count
  useEffect(() => {
    setRenderCount(prev => prev + 1);
  }, []);

  // Role change handler
  const handleRoleChange = useCallback(async (role) => {
    try {
      logDebug('handleRoleChange Entry', {
        requestedRole: role,
        currentRole: userRole,
        viewRole,
        isLoading,
        roleLoading,
        stack: new Error().stack
      }, 'function');

      if (roleLoading || isLoading) {
        logDebug('handleRoleChange Blocked', { 
          reason: 'Loading state active',
          isLoading,
          roleLoading
        }, 'warning');
        return;
      }

      // Update view role for SuperAdmin
      if (isSuperAdminProp) {
        logDebug('SuperAdmin Role Change Start', {
          from: viewRole,
          to: role,
          stack: new Error().stack
        }, 'function');

        try {
          await changeViewRole(role);
          logDebug('Role Change Success', {
            newRole: role,
            previousRole: viewRole
          }, 'success');

          logDebug('Updating View Mode', {
            action: 'setViewMode',
            target: 'library'
          }, 'function');
          
          setViewMode('library');
          
          logDebug('View Mode Update Complete', {
            newRole: role,
            newView: 'library'
          }, 'success');
        } catch (error) {
          logDebug('Role Change Error', {
            error: error.message,
            stack: error.stack
          }, 'error');
          throw error;
        }
      }
    } catch (error) {
      logDebug('handleRoleChange Error', {
        error: error.message,
        stack: error.stack
      }, 'error');
      console.error('Role change failed:', error);
    }
  }, [
    userRole,
    viewRole,
    isLoading,
    roleLoading,
    isSuperAdminProp,
    changeViewRole,
    setViewMode,
    logDebug
  ]);

  // Admin panel handler
  const handleAdminPanel = useCallback(() => {
    try {
      logDebug('handleAdminPanel Entry', {
        isSuperAdmin: isSuperAdminProp,
        currentRole: userRole,
        viewRole,
        canAccessAdmin: canShowFeature(FEATURE_PERMISSIONS.VIEW_ADMIN_PANEL),
        stack: new Error().stack
      }, 'function');

      if (isSuperAdminProp) {
        logDebug('Opening SuperAdmin Panel', {
          action: 'setViewMode',
          target: 'superadmin'
        }, 'function');
        setViewMode('superadmin');
        return;
      }

      logDebug('Opening Admin Panel', {
        action: 'setViewMode',
        target: 'admin'
      }, 'function');
      setViewMode('admin');
    } catch (error) {
      logDebug('handleAdminPanel Error', {
        error: error.message,
        stack: error.stack
      }, 'error');
      console.error('Admin panel toggle failed:', error);
    }
  }, [
    isSuperAdminProp,
    userRole,
    viewRole,
    canShowFeature,
    FEATURE_PERMISSIONS.VIEW_ADMIN_PANEL,
    setViewMode,
    logDebug
  ]);

  // Role state change effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      logDebug('Role State Change', {
        userRole,
        viewRole,
        actualRole: getActualRole(),
        isSuperAdmin: isSuperAdminProp,
        switchableRoles,
        canAccessAdmin: canShowFeature(FEATURE_PERMISSIONS.VIEW_ADMIN_PANEL)
      }, 'state');
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [
    userRole,
    viewRole,
    getActualRole,
    isSuperAdminProp,
    switchableRoles,
    canShowFeature,
    FEATURE_PERMISSIONS.VIEW_ADMIN_PANEL,
    logDebug
  ]);

  if (isLoading) {
    logDebug('Rendering Loading State');
    return (
      <header className="flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading...</span>
        </div>
      </header>
    );
  }

  return (
    <header className="flex items-center justify-between p-4 bg-white border-b">
      <div className="flex items-center space-x-4">
        <select
          value={viewRole || userRole}
          onChange={(e) => handleRoleChange(e.target.value)}
          disabled={roleLoading}
          className="border rounded px-2 py-1"
        >
          {switchableRoles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>

        {canShowFeature(FEATURE_PERMISSIONS.VIEW_ADMIN_PANEL) && (
          <button
            onClick={handleAdminPanel}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {isSuperAdminProp ? "SuperAdmin Panel" : "Admin Panel"}
          </button>
        )}

        <div className="flex items-center space-x-2">
          <Checkbox
            id="showDeleted"
            checked={showDeletedSOPs}
            onCheckedChange={setShowDeletedSOPs}
          />
          <label htmlFor="showDeleted" className="text-sm cursor-pointer">
            Show Deleted SOPs
          </label>
          <Archive className="w-4 h-4" />
        </div>
      </div>

      <div className="text-sm text-gray-500">
        Version {version.version}
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
