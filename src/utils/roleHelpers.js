import { PERMISSION_LEVELS } from './permissions';

export function isSuperAdmin(userProfile) {
  return !!userProfile?.is_superadmin;
}

export function isAdminOrSuper(currentRole, userProfile) {
  return (
    currentRole === PERMISSION_LEVELS.MANAGE ||
    isSuperAdmin(userProfile)
  );
} 