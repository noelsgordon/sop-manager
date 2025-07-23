/**
 * @fileoverview SuperAdminPanel Component - Provides cross-department user management capabilities
 * for super administrators.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, AlertCircle, Check, Plus, Trash2 } from 'lucide-react';
import { debounce } from 'lodash';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { CreateUserModal } from '../CreateUserModal';
import { PERMISSION_LEVELS } from '../../utils/permissions';
import { toast } from '@/components/ui/use-toast';

/**
 * Permission levels available in the system.
 * Ordered from least to most privileged.
 */
const AVAILABLE_PERMISSION_LEVELS = [
  { value: PERMISSION_LEVELS.LOOK, label: 'Look' },
  { value: PERMISSION_LEVELS.TWEAK, label: 'Tweak' },
  { value: PERMISSION_LEVELS.BUILD, label: 'Build' },
  { value: PERMISSION_LEVELS.MANAGE, label: 'Admin' },
  { value: PERMISSION_LEVELS.SUPERADMIN, label: 'Superadmin' }
];

/**
 * SuperAdminPanel Component
 * 
 * @param {Object} props
 * @param {string} props.currentUserId - The ID of the currently logged-in user
 * @param {Object} props.userProfile - The current user's profile
 * @param {Array} props.departments - List of available departments
 * @param {Function} props.setViewMode - Function to change view mode
 */
export default function SuperAdminPanel({ currentUserId, userProfile, departments, setViewMode }) {
  // State Management
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingStates, setSavingStates] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [recentChanges, setRecentChanges] = useState([]);

  // Fetch users and their permissions
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all users
        const { data: usersData, error: usersError } = await supabase
          .from('user_profiles')
          .select('*')
          .order('email');

        if (usersError) throw usersError;

        // Fetch all permissions
        const { data: permsData, error: permsError } = await supabase
          .from('user_departments')
          .select(`
            user_id,
            department_id,
            role,
            departments (
              department_id,
              name
            )
          `);

        if (permsError) throw permsError;

        // Organize permissions by user and department
        const permsByUser = {};
        permsData.forEach(perm => {
          if (!permsByUser[perm.user_id]) {
            permsByUser[perm.user_id] = {};
          }
          permsByUser[perm.user_id][perm.department_id] = perm.role;
        });

        setUsers(usersData || []);
        setPermissions(permsByUser);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users and permissions');
        toast({
          title: "Error",
          description: "Failed to load users and permissions",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Handle permission changes
  const handlePermissionChange = async (userId, departmentId, newRole) => {
    console.log('handlePermissionChange called:', { userId, departmentId, newRole });
    
    if (userId === currentUserId) {
      toast({
        title: "Error",
        description: "You cannot modify your own permissions",
        variant: "destructive"
      });
      return;
    }

    const changeKey = `${userId}-${departmentId}`;
    setSavingStates(prev => ({ ...prev, [changeKey]: true }));

    try {
      // Check if permission already exists
      const { data: existing } = await supabase
        .from('user_departments')
        .select('*')
        .eq('user_id', userId)
        .eq('department_id', departmentId)
        .maybeSingle();

      if (existing) {
        // Update existing permission
        const { error } = await supabase
          .from('user_departments')
          .update({ role: newRole })
          .eq('user_id', userId)
          .eq('department_id', departmentId);
        
        if (error) throw error;
      } else {
        // Insert new permission
        const { error } = await supabase
          .from('user_departments')
          .insert({
            user_id: userId,
            department_id: departmentId,
            role: newRole
          });
        
        if (error) throw error;
      }

      // Update local state
      setPermissions(prev => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          [departmentId]: newRole
        }
      }));

      // Add to recent changes
      setRecentChanges(prev => [
        { userId, departmentId, role: newRole, timestamp: Date.now() },
        ...prev
      ]);

      toast({
        title: "Success",
        description: "Permission updated successfully",
      });
    } catch (err) {
      console.error('Error updating permission:', err);
      toast({
        title: "Error",
        description: "Failed to update permission",
        variant: "destructive"
      });
    } finally {
      setSavingStates(prev => ({ ...prev, [changeKey]: false }));
    }
  };

  // Handle access toggle
  const handleAccessToggle = async (userId, departmentId, hasAccess) => {
    console.log('handleAccessToggle called:', { userId, departmentId, hasAccess });
    
    if (userId === currentUserId) {
      toast({
        title: "Error",
        description: "You cannot modify your own permissions",
        variant: "destructive"
      });
      return;
    }

    const changeKey = `${userId}-${departmentId}`;
    setSavingStates(prev => ({ ...prev, [changeKey]: true }));

    try {
      if (hasAccess) {
        // Grant access with default 'look' permission
        const { error } = await supabase
          .from('user_departments')
          .insert({
            user_id: userId,
            department_id: departmentId,
            role: PERMISSION_LEVELS.LOOK
          });
        
        if (error) throw error;

        // Update local state
        setPermissions(prev => ({
          ...prev,
          [userId]: {
            ...prev[userId],
            [departmentId]: PERMISSION_LEVELS.LOOK
          }
        }));
      } else {
        // Remove access
        const { error } = await supabase
          .from('user_departments')
          .delete()
          .eq('user_id', userId)
          .eq('department_id', departmentId);
        
        if (error) throw error;

        // Update local state
        setPermissions(prev => {
          const newPerms = { ...prev };
          if (newPerms[userId]) {
            delete newPerms[userId][departmentId];
          }
          return newPerms;
        });
      }

      toast({
        title: "Success",
        description: `Access ${hasAccess ? 'granted' : 'removed'} successfully`,
      });
    } catch (err) {
      console.error('Error toggling access:', err);
      toast({
        title: "Error",
        description: "Failed to update access",
        variant: "destructive"
      });
    } finally {
      setSavingStates(prev => ({ ...prev, [changeKey]: false }));
    }
  };

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(user => 
      user.email?.toLowerCase().includes(term) ||
      user.first_name?.toLowerCase().includes(term) ||
      user.last_name?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin mr-2" />
        <span>Loading user management...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-500">
        <AlertCircle className="mr-2" />
        <span>{error}</span>
      </div>
    );
  }

        return (
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">

            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold">User Management</h2>
                          
              <Button 
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-4 mb-4">
            <Input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">User</th>
              {departments.map(dept => (
                <th key={dept.department_id} className="border p-2">
                  {dept.name}
                </th>
              ))}
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => {
              const isSaving = Object.values(savingStates).some(state => state);
              return (
                <tr key={user.user_id}>
                  <td className="border p-2">
                    <div>
                      <div className="font-medium">{user.email}</div>
                      <div className="text-sm text-gray-500">
                        {user.first_name} {user.last_name}
                      </div>
                    </div>
                  </td>
                  {departments.map(dept => {
                    const hasAccess = !!permissions[user.user_id]?.[dept.department_id];
                    const currentRole = permissions[user.user_id]?.[dept.department_id] || PERMISSION_LEVELS.LOOK;
                    const isSavingThis = savingStates[`${user.user_id}-${dept.department_id}`];

                    return (
                      <td key={dept.department_id} className="border p-2">
                        <div className="space-y-2">

                          {/* Access toggle */}
                          <label className="flex items-center cursor-pointer" style={{ position: 'relative', zIndex: 1002 }}>
                            <input
                              type="checkbox"
                              checked={hasAccess}
                              onChange={(e) => {
                                console.log('Checkbox clicked:', { user: user.user_id, dept: dept.department_id, checked: e.target.checked });
                                handleAccessToggle(user.user_id, dept.department_id, e.target.checked);
                              }}
                              disabled={isSaving || user.user_id === currentUserId}
                              className="mr-2 cursor-pointer"
                              style={{ cursor: 'pointer', position: 'relative', zIndex: 1003 }}
                            />
                            <span className="cursor-pointer">Access</span>
                          </label>

                          {/* Permission selector */}
                          {hasAccess && (
                            <div className="space-y-1" style={{ position: 'relative', zIndex: 1004 }}>
                              {AVAILABLE_PERMISSION_LEVELS.map(level => (
                                <label key={level.value} className="flex items-center text-sm cursor-pointer" style={{ position: 'relative', zIndex: 1005 }}>
                                  <input
                                    type="radio"
                                    name={`${user.user_id}-${dept.department_id}-role`}
                                    value={level.value}
                                    checked={currentRole === level.value}
                                    onChange={() => {
                                      console.log('Radio button clicked:', { user: user.user_id, dept: dept.department_id, role: level.value });
                                      handlePermissionChange(user.user_id, dept.department_id, level.value);
                                    }}
                                    disabled={isSaving || user.user_id === currentUserId}
                                    className="mr-1 cursor-pointer"
                                    style={{ cursor: 'pointer', position: 'relative', zIndex: 1006 }}
                                  />
                                  <span className="cursor-pointer">{level.label}</span>
                                </label>
                              ))}
                            </div>
                          )}

                          {isSavingThis && (
                            <div className="mt-1">
                              <Loader2 className="animate-spin h-4 w-4" />
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="border p-2">

                    <button
                      disabled={user.user_id === currentUserId}
                      onClick={() => {
                        console.log('Delete button clicked for user:', user.user_id);
                        setUserToDelete(user);
                        setShowDeleteConfirm(true);
                      }}
                      style={{ 
                        position: 'relative', 
                        zIndex: 1000,
                        background: '#dc2626',
                        color: 'white',
                        padding: '4px 8px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          departments={departments}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            // Refresh users list
            window.location.reload();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && userToDelete && (
        <ConfirmationModal
          title="Delete User"
          message={`Are you sure you want to delete ${userToDelete.email}? This action cannot be undone.`}
          onConfirm={async () => {
            try {
              // Delete user permissions first
              await supabase
                .from('user_departments')
                .delete()
                .eq('user_id', userToDelete.user_id);

              // Delete user profile
              await supabase
                .from('user_profiles')
                .delete()
                .eq('user_id', userToDelete.user_id);

              // Delete auth user
              const { error } = await supabase.auth.admin.deleteUser(
                userToDelete.user_id
              );

              if (error) throw error;

              // Update local state
              setUsers(prev => prev.filter(u => u.user_id !== userToDelete.user_id));
              setPermissions(prev => {
                const newPerms = { ...prev };
                delete newPerms[userToDelete.user_id];
                return newPerms;
              });

              toast({
                title: "Success",
                description: "User deleted successfully",
              });
            } catch (err) {
              console.error('Error deleting user:', err);
              toast({
                title: "Error",
                description: "Failed to delete user",
                variant: "destructive"
              });
            } finally {
              setShowDeleteConfirm(false);
              setUserToDelete(null);
            }
          }}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setUserToDelete(null);
          }}
        />
      )}
    </div>
  );
} 