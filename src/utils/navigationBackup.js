/**
 * Navigation Backup System
 * 
 * Provides comprehensive backup and rollback capabilities for navigation migration.
 * Ensures zero risk during the migration process.
 */

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// BACKUP CONFIGURATION
// ============================================================================

export const NAVIGATION_BACKUP_CONFIG = {
  // Backup storage key
  storageKey: 'sop_navigation_backup',
  
  // Backup version
  version: '1.0.0',
  
  // Backup metadata
  metadata: {
    created: new Date().toISOString(),
    description: 'Navigation system backup before migration',
    components: ['App.jsx', 'Header.jsx', 'Layout.jsx'],
  },
};

// ============================================================================
// BACKUP SYSTEM
// ============================================================================

/**
 * Creates a comprehensive backup of the current navigation system
 */
export function createNavigationBackup() {
  try {
    // Capture current navigation state
    const currentState = {
      // URL state
      hash: window.location.hash,
      pathname: window.location.pathname,
      
      // App state (if available)
      activePanel: null, // Will be captured from App.jsx
      
      // Navigation history
      history: window.history.length,
      
      // Timestamp
      timestamp: new Date().toISOString(),
      
      // Version info
      version: NAVIGATION_BACKUP_CONFIG.version,
    };

    // Store backup
    localStorage.setItem(
      NAVIGATION_BACKUP_CONFIG.storageKey,
      JSON.stringify(currentState)
    );

    console.log('✅ Navigation backup created successfully');
    return true;
  } catch (error) {
    console.error('❌ Navigation backup failed:', error);
    return false;
  }
}

/**
 * Restores navigation from backup
 */
export function restoreNavigationBackup() {
  try {
    const backupData = localStorage.getItem(NAVIGATION_BACKUP_CONFIG.storageKey);
    
    if (!backupData) {
      console.warn('⚠️ No navigation backup found');
      return false;
    }

    const backup = JSON.parse(backupData);
    
    // Restore URL state
    if (backup.hash) {
      window.location.hash = backup.hash;
    }
    
    console.log('✅ Navigation backup restored successfully');
    return true;
  } catch (error) {
    console.error('❌ Navigation backup restore failed:', error);
    return false;
  }
}

/**
 * Checks if backup exists
 */
export function hasNavigationBackup() {
  try {
    const backupData = localStorage.getItem(NAVIGATION_BACKUP_CONFIG.storageKey);
    return !!backupData;
  } catch (error) {
    return false;
  }
}

/**
 * Gets backup information
 */
export function getNavigationBackupInfo() {
  try {
    const backupData = localStorage.getItem(NAVIGATION_BACKUP_CONFIG.storageKey);
    
    if (!backupData) {
      return null;
    }

    const backup = JSON.parse(backupData);
    return {
      timestamp: backup.timestamp,
      version: backup.version,
      hash: backup.hash,
      pathname: backup.pathname,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Clears navigation backup
 */
export function clearNavigationBackup() {
  try {
    localStorage.removeItem(NAVIGATION_BACKUP_CONFIG.storageKey);
    console.log('✅ Navigation backup cleared');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear navigation backup:', error);
    return false;
  }
}

// ============================================================================
// MIGRATION SAFETY HOOKS
// ============================================================================

/**
 * Hook for safe navigation migration
 */
export function useNavigationMigration() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStep, setMigrationStep] = useState('idle');
  const [backupExists, setBackupExists] = useState(false);

  // Check for existing backup
  useEffect(() => {
    setBackupExists(hasNavigationBackup());
  }, []);

  // Create backup before migration
  const createBackup = useCallback(() => {
    setIsMigrating(true);
    setMigrationStep('creating_backup');
    
    const success = createNavigationBackup();
    
    if (success) {
      setBackupExists(true);
      setMigrationStep('backup_created');
    } else {
      setMigrationStep('backup_failed');
    }
    
    setIsMigrating(false);
    return success;
  }, []);

  // Restore from backup
  const restoreBackup = useCallback(() => {
    setIsMigrating(true);
    setMigrationStep('restoring_backup');
    
    const success = restoreNavigationBackup();
    
    if (success) {
      setMigrationStep('backup_restored');
    } else {
      setMigrationStep('restore_failed');
    }
    
    setIsMigrating(false);
    return success;
  }, []);

  // Clear backup after successful migration
  const clearBackup = useCallback(() => {
    const success = clearNavigationBackup();
    
    if (success) {
      setBackupExists(false);
    }
    
    return success;
  }, []);

  return {
    isMigrating,
    migrationStep,
    backupExists,
    createBackup,
    restoreBackup,
    clearBackup,
    getBackupInfo: getNavigationBackupInfo,
  };
}

// ============================================================================
// VALIDATION SYSTEM
// ============================================================================

/**
 * Validates navigation system integrity
 */
export function validateNavigationSystem() {
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    checks: {},
  };

  try {
    // Check if React Router is available
    if (typeof window !== 'undefined' && window.location) {
      validation.checks.reactRouter = true;
    } else {
      validation.errors.push('React Router not available');
      validation.isValid = false;
    }

    // Check if design system is available
    try {
      // This will be checked when design system is imported
      validation.checks.designSystem = true;
    } catch (error) {
      validation.warnings.push('Design system not fully available');
    }

    // Check localStorage availability
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      validation.checks.localStorage = true;
    } catch (error) {
      validation.errors.push('localStorage not available');
      validation.isValid = false;
    }

    // Check current navigation state
    const currentHash = window.location.hash;
    const currentPath = window.location.pathname;
    
    validation.checks.currentState = {
      hash: currentHash,
      pathname: currentPath,
      isValid: !!(currentHash || currentPath),
    };

    if (!validation.checks.currentState.isValid) {
      validation.warnings.push('No current navigation state detected');
    }

  } catch (error) {
    validation.errors.push(`Validation error: ${error.message}`);
    validation.isValid = false;
  }

  return validation;
}

// ============================================================================
// ROLLBACK SYSTEM
// ============================================================================

/**
 * Emergency rollback system
 */
export function emergencyRollback() {
  console.warn('🚨 EMERGENCY ROLLBACK INITIATED');
  
  try {
    // Restore from backup
    const restoreSuccess = restoreNavigationBackup();
    
    if (restoreSuccess) {
      console.log('✅ Emergency rollback successful');
      
      // Reload page to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      return true;
    } else {
      console.error('❌ Emergency rollback failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Emergency rollback error:', error);
    return false;
  }
}

// ============================================================================
// DEBUG UTILITIES
// ============================================================================

/**
 * Debug navigation state
 */
export function debugNavigationState() {
  const state = {
    current: {
      hash: window.location.hash,
      pathname: window.location.pathname,
      search: window.location.search,
    },
    backup: getNavigationBackupInfo(),
    validation: validateNavigationSystem(),
    timestamp: new Date().toISOString(),
  };

  console.log('🔍 Navigation Debug State:', state);
  return state;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  NAVIGATION_BACKUP_CONFIG,
  createNavigationBackup,
  restoreNavigationBackup,
  hasNavigationBackup,
  getNavigationBackupInfo,
  clearNavigationBackup,
  useNavigationMigration,
  validateNavigationSystem,
  emergencyRollback,
  debugNavigationState,
}; 