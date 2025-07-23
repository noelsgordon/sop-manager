import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { getHighestRole, PERMISSION_LEVELS, hasPermission } from '../permissions';
import { isSuperAdmin } from '../roleHelpers';
import { toast } from '@/components/ui/use-toast';

/**
 * Custom hook for managing user state and permissions
 * @param {Object} session - Supabase session object
 * @returns {Object} User state and management functions
 */
export function useUserState(session) {
  const [userProfile, setUserProfile] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);
  const [isUserSuperAdmin, setIsUserSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [viewRole, setViewRole] = useState(null);

  // Fetch user profile and departments
  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch user profile
        let profile;
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          // If profile doesn't exist, create a default one
          if (profileError.code === 'PGRST116') {
            console.log('Creating default user profile...');
            const newProfilePayload = {
              user_id: session.user.id,
              email: session.user.email,
              display_name: session.user.email?.split('@')[0] || 'User',
              is_superadmin: false,
              company_id: null,
              created_at: null,
              updated_at: null,
              first_name: session.user.user_metadata?.first_name || '',
              last_name: session.user.user_metadata?.last_name || ''
            };
            console.log('User profile payload:', newProfilePayload);
            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert(newProfilePayload)
              .select()
              .single();
            
            if (createError) {
              console.error('Error creating profile:', createError);
              throw createError;
            }
            
            console.log('Created default profile:', newProfile);
            profile = newProfile;
          } else {
            throw profileError;
          }
        } else {
          profile = profileData;
        }

        // Fetch user's departments and permissions
        const { data: userDepts, error: deptError } = await supabase
          .from('user_departments')
          .select(`
            department_id,
            role,
            departments (
              department_id,
              name
            )
          `)
          .eq('user_id', session.user.id);

        if (deptError) {
          console.error('Departments fetch error:', deptError);
          throw deptError;
        }

        // Process departments and permissions
        const deptList = userDepts.map(ud => ({
          ...ud.departments,
          role: ud.role
        }));

        // Set user profile with permissions
        const userWithPerms = {
          ...profile,
          permissions: userDepts.reduce((acc, ud) => ({
            ...acc,
            [ud.department_id]: ud.role
          }), {})
        };

        const isSuperAdminUser = isSuperAdmin(userWithPerms);
        setUserProfile(userWithPerms);
        setDepartments(deptList);
        setIsUserSuperAdmin(isSuperAdminUser);
        setViewRole(isSuperAdminUser ? PERMISSION_LEVELS.SUPERADMIN : userWithPerms.permissions?.[selectedDepartmentId] || PERMISSION_LEVELS.LOOK);

        // Set initial department if none selected
        if (deptList.length > 0) {
          setSelectedDepartmentId(deptList[0].department_id);
        } else {
          // No departments assigned: show short friendly message
          setError('Waiting for admin to grant access.');
          toast({
            title: "Access Pending",
            description: "Waiting for admin to grant access.",
            variant: "destructive"
          });
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data');
        toast({
          title: "Error",
          description: "Failed to load user data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [session]);

  // Change actual user role
  const changeRole = useCallback(async (newRole) => {
    if (!userProfile || !selectedDepartmentId) return false;
    
    setRoleLoading(true);
    try {
      console.log('Changing role:', {
        userId: userProfile.user_id,
        departmentId: selectedDepartmentId,
        newRole
      });

      // Update role in database
      const { error } = await supabase
        .from('user_departments')
        .update({ role: newRole })
        .eq('user_id', userProfile.user_id)
        .eq('department_id', selectedDepartmentId);

      if (error) throw error;

      // Update local state
      setUserProfile(prev => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [selectedDepartmentId]: newRole
        }
      }));

      setDepartments(prev =>
        prev.map(dept =>
          dept.department_id === selectedDepartmentId
            ? { ...dept, role: newRole }
            : dept
        )
      );

      // Update view role to match new role
      setViewRole(newRole);

      toast({
        title: "Success",
        description: "Role updated successfully",
      });

      return true;
    } catch (err) {
      console.error('Error changing role:', err);
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive"
      });
      return false;
    } finally {
      setRoleLoading(false);
    }
  }, [userProfile, selectedDepartmentId]);

  // Change view role (for role preview)
  const changeViewRole = useCallback((newViewRole) => {
    // Allow any user to change their view role
    setViewRole(newViewRole);
    return true;
  }, []);

  // Get current role (actual or view role)
  const getCurrentRole = useCallback(() => {
    if (!userProfile) return PERMISSION_LEVELS.LOOK;
    
    // If SuperAdmin is viewing as a different role, return that role
    if (isUserSuperAdmin && viewRole) {
      return viewRole;
    }
    
    // Otherwise return actual role
    return isUserSuperAdmin 
      ? PERMISSION_LEVELS.SUPERADMIN 
      : userProfile.permissions?.[selectedDepartmentId] || PERMISSION_LEVELS.LOOK;
  }, [userProfile, selectedDepartmentId, isUserSuperAdmin, viewRole]);

  // Get actual role (ignoring view role)
  const getActualRole = useCallback(() => {
    if (!userProfile) return PERMISSION_LEVELS.LOOK;
    return isUserSuperAdmin 
      ? PERMISSION_LEVELS.SUPERADMIN 
      : userProfile.permissions?.[selectedDepartmentId] || PERMISSION_LEVELS.LOOK;
  }, [userProfile, selectedDepartmentId, isUserSuperAdmin]);

  // Get debug state
  const getDebugState = useCallback(() => ({
    userProfile,
    departments,
    selectedDepartmentId,
    isUserSuperAdmin,
    currentRole: getCurrentRole(),
    actualRole: getActualRole(),
    viewRole,
    isLoading,
    error,
    roleLoading
  }), [userProfile, departments, selectedDepartmentId, isUserSuperAdmin, getCurrentRole, getActualRole, viewRole, isLoading, error, roleLoading]);

  return {
    userProfile,
    departments,
    selectedDepartmentId,
    setSelectedDepartmentId,
    isSuperAdmin: isUserSuperAdmin,
    isLoading,
    error,
    changeRole,
    changeViewRole,
    getCurrentRole,
    getActualRole,
    getDebugState,
    roleLoading,
    viewRole
  };
} 