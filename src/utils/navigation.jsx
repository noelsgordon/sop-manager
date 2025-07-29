/**
 * Enhanced Centralized Navigation System
 * 
 * Provides a single source of truth for navigation state across the SOP Manager platform.
 * Integrates with the design system for consistent styling and cross-platform compatibility.
 * 
 * FEATURES:
 * - Backward compatibility with existing hash-based navigation
 * - Comprehensive error handling and validation
 * - Automatic fallback mechanisms
 * - Design system integration
 * - Cross-platform support
 * - Permission-based routing
 * - Mobile-responsive navigation
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDesignTokens } from '../design-system/hooks/useDesignTokens';
import { 
  createNavigationBackup, 
  restoreNavigationBackup, 
  validateNavigationSystem,
  emergencyRollback 
} from './navigationBackup';

// ============================================================================
// NAVIGATION CONFIGURATION
// ============================================================================

export const NAVIGATION_CONFIG = {
  // Main navigation routes
  routes: {
    library: {
      path: '/library',
      label: 'Library',
      icon: 'Home',
      feature: null, // No special permissions required
      description: 'Browse and manage SOPs',
      order: 1,
      hash: '#library', // Backward compatibility
    },
    search: {
      path: '/search',
      label: 'Search',
      icon: 'Search',
      feature: null,
      description: 'Search through SOPs',
      order: 2,
      hash: '#search',
    },
    wizard: {
      path: '/wizard',
      label: 'Create SOP',
      icon: 'Plus',
      feature: 'CREATE_SOP',
      description: 'Create a new SOP',
      order: 3,
      hash: '#wizard',
    },
    detail: {
      path: '/detail/:id',
      label: 'SOP Detail',
      icon: 'FileText',
      feature: null,
      description: 'View SOP details',
      order: 4,
      dynamic: true, // Route has parameters
      hash: '#detail',
    },
    admin: {
      path: '/admin',
      label: 'Admin Panel',
      icon: 'Shield',
      feature: 'VIEW_ADMIN_PANEL',
      description: 'Department management',
      order: 5,
      hash: '#admin',
    },
    superadmin: {
      path: '/superadmin',
      label: 'SuperAdmin Panel',
      icon: 'UserCog',
      feature: 'VIEW_ADMIN_PANEL',
      description: 'System-wide administration',
      order: 6,
      superOnly: true, // Only for superadmins
      hash: '#superadmin',
    },
    backup: {
      path: '/backup',
      label: 'Backup Manager',
      icon: 'Database',
      feature: 'VIEW_ADMIN_PANEL',
      description: 'System backup and restore',
      order: 7,
      superOnly: true,
      hash: '#backup',
    },
    users: {
      path: '/users',
      label: 'User Management',
      icon: 'Users',
      feature: 'VIEW_ADMIN_PANEL',
      description: 'Manage user accounts',
      order: 8,
      superOnly: true,
      hash: '#users',
    },
    rls: {
      path: '/rls',
      label: 'RLS Testing',
      icon: 'Shield',
      feature: 'VIEW_ADMIN_PANEL',
      description: 'Test RLS policies',
      order: 9,
      superOnly: true,
      hash: '#rls',
    },
  },

  // Default route
  defaultRoute: 'library',

  // Route groups for organization
  groups: {
    main: ['library', 'search', 'wizard', 'detail'],
    admin: ['admin', 'superadmin', 'backup', 'users', 'rls'],
  },

  // Navigation styling (integrated with design system)
  styling: {
    active: 'bg-primary-100 text-primary-700 font-semibold',
    inactive: 'hover:bg-gray-100 text-gray-700',
    disabled: 'text-gray-400 bg-gray-100 cursor-not-allowed',
    mobile: 'md:hidden',
    desktop: 'hidden md:flex',
    // Backward compatibility - matches current styling exactly
    legacy: {
      active: 'bg-blue-100 text-blue-700 font-semibold',
      inactive: 'hover:bg-gray-100 text-gray-700',
      disabled: 'text-gray-400 bg-gray-100 cursor-not-allowed',
    },
  },

  // Migration settings
  migration: {
    enableLegacySupport: true, // Support old hash-based navigation
    enableBackwardCompatibility: true, // Support old styling
    enableFallbackMode: true, // Fallback to old system if new fails
    enableValidation: true, // Validate navigation state
    enableBackup: true, // Create backups before changes
  },
};

// ============================================================================
// NAVIGATION HOOK
// ============================================================================

/**
 * Enhanced centralized navigation hook
 * Provides single source of truth for navigation state with comprehensive safety features
 */
export function useNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { colors, spacing } = useDesignTokens();

  // Navigation state
  const [currentRoute, setCurrentRoute] = useState(NAVIGATION_CONFIG.defaultRoute);
  const [navigationHistory, setNavigationHistory] = useState([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLegacyMode, setIsLegacyMode] = useState(false);
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);

  // Validation state
  const [isValidated, setIsValidated] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // Get current route from URL with backward compatibility
  const getCurrentRouteFromURL = useCallback(() => {
    try {
      const path = location.pathname;
      const hash = window.location.hash;
      
      // First try to match by pathname (new system)
      if (path && path !== '/') {
        // Match dynamic routes first
        if (path.startsWith('/detail/')) {
          return 'detail';
        }
        
        // Match static routes
        for (const [key, route] of Object.entries(NAVIGATION_CONFIG.routes)) {
          if (route.path === path) {
            return key;
          }
        }
      }
      
      // Fallback to hash-based navigation (legacy support)
      if (hash) {
        const hashRoute = hash.slice(1); // Remove #
        for (const [key, route] of Object.entries(NAVIGATION_CONFIG.routes)) {
          if (route.hash === hash) {
            setIsLegacyMode(true);
            return key;
          }
        }
      }
      
      return NAVIGATION_CONFIG.defaultRoute;
    } catch (error) {
      console.error('Error getting current route:', error);
      return NAVIGATION_CONFIG.defaultRoute;
    }
  }, [location.pathname]);

  // Update current route when URL changes
  useEffect(() => {
    try {
      const route = getCurrentRouteFromURL();
      if (route !== currentRoute) {
        setCurrentRoute(route);
      }
    } catch (error) {
      console.error('Error updating current route:', error);
      setErrors(prev => [...prev, `Route update error: ${error.message}`]);
    }
  }, [location.pathname, getCurrentRouteFromURL, currentRoute]);

  // Validate navigation system on mount
  useEffect(() => {
    try {
      const validation = validateNavigationSystem();
      setIsValidated(validation.isValid);
      setValidationErrors(validation.errors);
      
      if (!validation.isValid) {
        setWarnings(prev => [...prev, 'Navigation system validation failed']);
      }
    } catch (error) {
      console.error('Navigation validation error:', error);
      setValidationErrors([error.message]);
    }
  }, []);

  // Navigate to a route with comprehensive error handling
  const navigateTo = useCallback(async (routeKey, options = {}) => {
    try {
      const route = NAVIGATION_CONFIG.routes[routeKey];
      
      if (!route) {
        const error = `Navigation error: Route "${routeKey}" not found`;
        console.error(error);
        setErrors(prev => [...prev, error]);
        return false;
      }

      setIsNavigating(true);
      
      // Create backup before navigation (if enabled)
      if (NAVIGATION_CONFIG.migration.enableBackup) {
        try {
          createNavigationBackup();
        } catch (error) {
          console.warn('Backup creation failed:', error);
          setWarnings(prev => [...prev, 'Navigation backup failed']);
        }
      }

      // Add to navigation history
      setNavigationHistory(prev => [...prev, {
        from: currentRoute,
        to: routeKey,
        timestamp: new Date().toISOString(),
        path: route.path,
        hash: route.hash,
      }]);

      // Update current route
      setCurrentRoute(routeKey);
      
      // Navigate using React Router
      navigate(route.path, options);
      
      // Clear legacy mode if we're using new system
      if (!isLegacyMode) {
        setIsLegacyMode(false);
      }
      
      return true;
    } catch (error) {
      console.error('Navigation failed:', error);
      setErrors(prev => [...prev, `Navigation error: ${error.message}`]);
      
      // Fallback to legacy navigation if enabled
      if (NAVIGATION_CONFIG.migration.enableFallbackMode) {
        try {
          const route = NAVIGATION_CONFIG.routes[routeKey];
          if (route && route.hash) {
            window.location.hash = route.hash;
            setIsLegacyMode(true);
            return true;
          }
        } catch (fallbackError) {
          console.error('Legacy fallback failed:', fallbackError);
        }
      }
      
      return false;
    } finally {
      setIsNavigating(false);
    }
  }, [navigate, currentRoute, isLegacyMode]);

  // Navigate back with error handling
  const navigateBack = useCallback(() => {
    try {
      if (navigationHistory.length > 0) {
        const previousRoute = navigationHistory[navigationHistory.length - 1];
        setNavigationHistory(prev => prev.slice(0, -1));
        return navigateTo(previousRoute.from);
      }
      return false;
    } catch (error) {
      console.error('Navigation back failed:', error);
      setErrors(prev => [...prev, `Navigation back error: ${error.message}`]);
      return false;
    }
  }, [navigationHistory, navigateTo]);

  // Get available routes based on permissions
  const getAvailableRoutes = useCallback((userPermissions = [], isSuperAdmin = false) => {
    try {
      // Ensure userPermissions is always an array
      const permissions = Array.isArray(userPermissions) ? userPermissions : [];
      
      return Object.entries(NAVIGATION_CONFIG.routes)
        .filter(([key, route]) => {
          // Check if route requires special permissions
          if (route.feature && !permissions.includes(route.feature)) {
            return false;
          }
          
          // Check if route is superadmin only
          if (route.superOnly && !isSuperAdmin) {
            return false;
          }
          
          return true;
        })
        .sort(([, a], [, b]) => a.order - b.order)
        .map(([key, route]) => ({
          key,
          ...route,
        }));
    } catch (error) {
      console.error('Error getting available routes:', error);
      setErrors(prev => [...prev, `Available routes error: ${error.message}`]);
      return [];
    }
  }, []);

  // Get route by key
  const getRoute = useCallback((routeKey) => {
    try {
      return NAVIGATION_CONFIG.routes[routeKey] || null;
    } catch (error) {
      console.error('Error getting route:', error);
      return null;
    }
  }, []);

  // Check if route is active
  const isRouteActive = useCallback((routeKey) => {
    try {
      return currentRoute === routeKey;
    } catch (error) {
      console.error('Error checking route active:', error);
      return false;
    }
  }, [currentRoute]);

  // Check if route is accessible
  const isRouteAccessible = useCallback((routeKey, userPermissions = [], isSuperAdmin = false) => {
    try {
      const route = NAVIGATION_CONFIG.routes[routeKey];
      
      if (!route) return false;
      
      // Ensure userPermissions is always an array
      const permissions = Array.isArray(userPermissions) ? userPermissions : [];
      
      // Check feature permissions
      if (route.feature && !permissions.includes(route.feature)) {
        return false;
      }
      
      // Check superadmin requirement
      if (route.superOnly && !isSuperAdmin) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking route accessibility:', error);
      return false;
    }
  }, []);

  // Get navigation styling with backward compatibility
  const getNavigationStyles = useCallback((routeKey, isActive, isAccessible) => {
    try {
      const baseStyles = 'flex items-center gap-2 px-3 py-2 rounded transition';
      
      // Use legacy styling if in legacy mode or backward compatibility is enabled
      const styling = isLegacyMode || NAVIGATION_CONFIG.migration.enableBackwardCompatibility
        ? NAVIGATION_CONFIG.styling.legacy
        : NAVIGATION_CONFIG.styling;
      
      if (!isAccessible) {
        return `${baseStyles} ${styling.disabled}`;
      }
      
      if (isActive) {
        return `${baseStyles} ${styling.active}`;
      }
      
      return `${baseStyles} ${styling.inactive}`;
    } catch (error) {
      console.error('Error getting navigation styles:', error);
      // Fallback to basic styling
      return 'flex items-center gap-2 px-3 py-2 rounded transition hover:bg-gray-100 text-gray-700';
    }
  }, [isLegacyMode]);

  // Get breadcrumb trail
  const getBreadcrumbTrail = useCallback(() => {
    try {
      const trail = [];
      let current = currentRoute;
      
      while (current) {
        const route = NAVIGATION_CONFIG.routes[current];
        if (route) {
          trail.unshift({
            key: current,
            label: route.label,
            path: route.path,
          });
        }
        current = null; // For now, no parent routes
      }
      
      return trail;
    } catch (error) {
      console.error('Error getting breadcrumb trail:', error);
      return [];
    }
  }, [currentRoute]);

  // Emergency rollback function
  const emergencyRollbackToLegacy = useCallback(() => {
    try {
      console.warn('🚨 EMERGENCY ROLLBACK TO LEGACY NAVIGATION');
      
      // Restore from backup
      const restoreSuccess = restoreNavigationBackup();
      
      if (restoreSuccess) {
        setIsLegacyMode(true);
        console.log('✅ Emergency rollback successful');
        return true;
      } else {
        console.error('❌ Emergency rollback failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Emergency rollback error:', error);
      return false;
    }
  }, []);

  // Clear errors
  const clearErrors = useCallback(() => {
    setErrors([]);
    setWarnings([]);
    setValidationErrors([]);
  }, []);

  // Navigation state
  const navigationState = useMemo(() => ({
    currentRoute,
    isNavigating,
    navigationHistory,
    breadcrumbTrail: getBreadcrumbTrail(),
    isLegacyMode,
    isValidated,
    errors,
    warnings,
    validationErrors,
  }), [
    currentRoute, 
    isNavigating, 
    navigationHistory, 
    getBreadcrumbTrail, 
    isLegacyMode, 
    isValidated, 
    errors, 
    warnings, 
    validationErrors
  ]);

  // Navigation actions
  const navigationActions = useMemo(() => ({
    navigateTo,
    navigateBack,
    getAvailableRoutes,
    getRoute,
    isRouteActive,
    isRouteAccessible,
    getNavigationStyles,
    emergencyRollbackToLegacy,
    clearErrors,
  }), [
    navigateTo, 
    navigateBack, 
    getAvailableRoutes, 
    getRoute, 
    isRouteActive, 
    isRouteAccessible, 
    getNavigationStyles, 
    emergencyRollbackToLegacy, 
    clearErrors
  ]);

  return {
    ...navigationState,
    ...navigationActions,
  };
}

// ============================================================================
// NAVIGATION COMPONENTS
// ============================================================================

/**
 * Enhanced Navigation component with comprehensive error handling
 */
export function Navigation({ userPermissions = [], isSuperAdmin = false, onNavigate, className = "" }) {
  const {
    currentRoute,
    getAvailableRoutes,
    isRouteActive,
    isRouteAccessible,
    getNavigationStyles,
    navigateTo,
    errors,
    warnings,
    isLegacyMode,
  } = useNavigation();

  // Only show main navigation routes (not admin-specific routes)
  const mainRoutes = ['library', 'search', 'wizard'];
  const allRoutes = getAvailableRoutes(userPermissions, isSuperAdmin);
  const availableRoutes = allRoutes.filter(route => mainRoutes.includes(route.key));

  const handleNavigation = useCallback(async (routeKey) => {
    try {
      if (routeKey === currentRoute) return;
      
      const success = await navigateTo(routeKey);
      if (success && onNavigate) {
        onNavigate(routeKey);
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }, [currentRoute, navigateTo, onNavigate]);

  // Show warnings if any
  useEffect(() => {
    if (warnings.length > 0) {
      console.warn('Navigation warnings:', warnings);
    }
  }, [warnings]);

  // Show errors if any
  useEffect(() => {
    if (errors.length > 0) {
      console.error('Navigation errors:', errors);
    }
  }, [errors]);

  return (
    <nav className={`flex flex-col gap-2 ${className}`}>
      {/* Legacy mode indicator */}
      {isLegacyMode && (
        <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded mb-2">
          ⚠️ Legacy navigation mode
        </div>
      )}
      
      {/* Error indicator */}
      {errors.length > 0 && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded mb-2">
          ❌ Navigation errors detected
        </div>
      )}
      
      {availableRoutes.map((route) => {
        const isActive = isRouteActive(route.key);
        const isAccessible = isRouteAccessible(route.key, userPermissions, isSuperAdmin);
        
        return (
          <button
            key={route.key}
            onClick={() => handleNavigation(route.key)}
            className={getNavigationStyles(route.key, isActive, isAccessible)}
            disabled={!isAccessible}
            title={route.description}
          >
            {/* Icon placeholder - you can import actual icons */}
            <span className="w-5 h-5 flex items-center justify-center">
              {route.icon}
            </span>
            <span>{route.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/**
 * Enhanced Breadcrumb component
 */
export function Breadcrumb({ className = "" }) {
  const { breadcrumbTrail } = useNavigation();

  if (breadcrumbTrail.length <= 1) return null;

  return (
    <nav className={`flex items-center gap-2 text-sm text-gray-600 mb-4 ${className}`}>
      {breadcrumbTrail.map((item, index) => (
        <div key={item.key} className="flex items-center gap-2">
          {index > 0 && (
            <span className="text-gray-400">/</span>
          )}
          <span className={index === breadcrumbTrail.length - 1 ? 'font-semibold text-gray-900' : ''}>
            {item.label}
          </span>
        </div>
      ))}
    </nav>
  );
}

/**
 * Enhanced Mobile navigation component
 */
export function MobileNavigation({ userPermissions = [], isSuperAdmin = false, onNavigate, className = "" }) {
  const {
    currentRoute,
    getAvailableRoutes,
    isRouteActive,
    isRouteAccessible,
    getNavigationStyles,
    navigateTo,
    isLegacyMode,
  } = useNavigation();

  const availableRoutes = getAvailableRoutes(userPermissions, isSuperAdmin);

  const handleNavigation = useCallback(async (routeKey) => {
    try {
      if (routeKey === currentRoute) return;
      
      const success = await navigateTo(routeKey);
      if (success && onNavigate) {
        onNavigate(routeKey);
      }
    } catch (error) {
      console.error('Mobile navigation error:', error);
    }
  }, [currentRoute, navigateTo, onNavigate]);

  return (
    <nav className={`flex flex-col gap-1 p-2 ${className}`}>
      {/* Legacy mode indicator */}
      {isLegacyMode && (
        <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded mb-2">
          ⚠️ Legacy mode
        </div>
      )}
      
      {availableRoutes.map((route) => {
        const isActive = isRouteActive(route.key);
        const isAccessible = isRouteAccessible(route.key, userPermissions, isSuperAdmin);
        
        return (
          <button
            key={route.key}
            onClick={() => handleNavigation(route.key)}
            className={`${getNavigationStyles(route.key, isActive, isAccessible)} text-sm`}
            disabled={!isAccessible}
            title={route.description}
          >
            <span className="w-4 h-4 flex items-center justify-center">
              {route.icon}
            </span>
            <span>{route.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ============================================================================
// NAVIGATION UTILITIES
// ============================================================================

/**
 * Get route parameters from URL
 */
export function useRouteParams() {
  const location = useLocation();
  
  return useMemo(() => {
    try {
      const params = {};
      const pathSegments = location.pathname.split('/');
      
      // Extract dynamic parameters
      Object.entries(NAVIGATION_CONFIG.routes).forEach(([key, route]) => {
        if (route.dynamic) {
          const routeSegments = route.path.split('/');
          routeSegments.forEach((segment, index) => {
            if (segment.startsWith(':')) {
              const paramName = segment.slice(1);
              params[paramName] = pathSegments[index];
            }
          });
        }
      });
      
      return params;
    } catch (error) {
      console.error('Error getting route params:', error);
      return {};
    }
  }, [location.pathname]);
}

/**
 * Enhanced Navigation guard for protected routes
 */
export function useNavigationGuard(userPermissions = [], isSuperAdmin = false) {
  const { currentRoute, navigateTo } = useNavigation();
  
  useEffect(() => {
    try {
      const route = NAVIGATION_CONFIG.routes[currentRoute];
      
      if (route) {
        // Check if route requires special permissions
        if (route.feature && !userPermissions.includes(route.feature)) {
          console.warn(`Access denied to ${currentRoute}: Missing ${route.feature} permission`);
          navigateTo('library');
          return;
        }
        
        // Check if route is superadmin only
        if (route.superOnly && !isSuperAdmin) {
          console.warn(`Access denied to ${currentRoute}: SuperAdmin required`);
          navigateTo('library');
          return;
        }
      }
    } catch (error) {
      console.error('Navigation guard error:', error);
    }
  }, [currentRoute, userPermissions, isSuperAdmin, navigateTo]);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  NAVIGATION_CONFIG,
  useNavigation,
  Navigation,
  Breadcrumb,
  MobileNavigation,
  useRouteParams,
  useNavigationGuard,
}; 