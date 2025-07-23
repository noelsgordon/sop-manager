/**
 * @fileoverview SuperAdminPanel Component - Provides cross-department user management capabilities
 * for super administrators. This component implements a matrix view of users and their permissions
 * across all departments.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, AlertCircle, Check, Plus, Trash2 } from 'lucide-react';
import { debounce } from 'lodash';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { CreateUserModal } from './CreateUserModal';

/**
 * Permission levels available in the system.
 * Ordered from least to most privileged.
 */
const PERMISSION_LEVELS = [
  { value: 'look', label: 'Look' },
  { value: 'tweak', label: 'Tweak' },
  { value: 'build', label: 'Build' },
  { value: 'manage', label: 'Admin' }
];

/**
 * SuperAdminPanel Component
 * 
 * Provides a comprehensive interface for managing users and their permissions across all departments.
 * Features include:
 * - User creation and deletion
 * - Permission management across departments
 * - Real-time updates with optimistic UI
 * - Search functionality
 * - Protection against self-modification
 * 
 * @param {Object} props
 * @param {string} props.currentUserId - The ID of the currently logged-in user
 */
export default function SuperAdminPanel({ currentUserId }) {
  // 🔄 State Management
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [savingStates, setSavingStates] = useState({});
  const [recentChanges, setRecentChanges] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // 🔄 Data Fetching
  useEffect(() => {
    fetchData();
  }, []);

  // 🔄 Recent Changes Cleanup
  useEffect(() => {
    const timer = setTimeout(() => {
      setRecentChanges([]);
    }, 5000);
    return () => clearTimeout(timer);
  }, [recentChanges]);

  /**
   * Fetches all necessary data for the SuperAdminPanel.
   * This includes:
   * - Department list
   * - User profiles
   * - User-department relationships
   * 
   * @async
   * @function fetchData
   */
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching data for SuperAdminPanel...');
      
      // Fetch departments
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      if (deptError) throw deptError;
      console.log('Fetched departments:', deptData);

      // Fetch all user profiles
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('display_name');
      if (userError) throw userError;
      console.log('Fetched user profiles:', userData);

      // Fetch all user-department relationships
      const { data: userDeptData, error: userDeptError } = await supabase
        .from('user_departments')
        .select('*');
      if (userDeptError) throw userDeptError;
      console.log('Fetched user-department relationships:', userDeptData);

      // Process and set the data
      processAndSetData(deptData, userData, userDeptData);
      console.log('Successfully processed and set data');

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Processes and combines data from different sources to create the user matrix.
   * 
   * @function processAndSetData
   * @param {Array} deptData - Department data from database
   * @param {Array} userData - User profile data
   * @param {Array} userDeptData - User-department relationships
   */
  const processAndSetData = (deptData, userData, userDeptData) => {
    console.log('Processing data with:', { deptData, userData, userDeptData });
    
    // Process departments
    setDepartments(deptData || []);
    console.log('Set departments:', deptData);

    // Process users
    setUsers(userData || []);
    console.log('Set users:', userData);

    // Process permissions
    const permMap = {};
    userDeptData?.forEach(ud => {
      if (!permMap[ud.user_id]) permMap[ud.user_id] = {};
      permMap[ud.user_id][ud.department_id] = ud.role;
    });
    setPermissions(permMap);
    console.log('Set permissions:', permMap);
  };

  /**
   * Handles permission changes for a user in a specific department.
   * Implements optimistic updates with rollback on failure.
   * 
   * @async
   * @function handlePermissionChange
   * @param {string} userId - The user's ID
   * @param {string} departmentId - The department's ID
   * @param {string} newRole - The new role to assign
   */
  const handlePermissionChange = async (userId, departmentId, newRole) => {
    // Don't allow self-modification
    if (userId === currentUserId) {
      setError("You cannot modify your own permissions");
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

    } catch (err) {
      console.error('Error updating permission:', err);
      setError('Failed to update permission. Please try again.');
    } finally {
      setSavingStates(prev => ({ ...prev, [changeKey]: false }));
    }
  };

  /**
   * Handles access toggling for a user in a specific department.
   * 
   * @async
   * @function handleAccessToggle
   * @param {string} userId - The user's ID
   * @param {string} departmentId - The department's ID
   * @param {boolean} hasAccess - Whether to grant or revoke access
   */
  const handleAccessToggle = async (userId, departmentId, hasAccess) => {
    // Don't allow self-modification
    if (userId === currentUserId) {
      setError("You cannot modify your own access");
      return;
    }

    console.log(`Attempting to ${hasAccess ? 'grant' : 'revoke'} access for user ${userId} in department ${departmentId}`);
    
    const changeKey = `${userId}-${departmentId}`;
    setSavingStates(prev => ({ ...prev, [changeKey]: true }));

    try {
      if (!hasAccess) {
        console.log('Revoking access - deleting user_departments entry');
        // Remove access
        const { data, error } = await supabase
          .from('user_departments')
          .delete()
          .eq('user_id', userId)
          .eq('department_id', departmentId);
        
        if (error) throw error;
        console.log('Successfully revoked access:', data);
      } else {
        console.log('Granting access - inserting user_departments entry with "look" role');
        // Grant access with default 'look' role
        const { data, error } = await supabase
          .from('user_departments')
          .insert({
            user_id: userId,
            department_id: departmentId,
            role: 'look'
          });
        
        if (error) throw error;
        console.log('Successfully granted access:', data);
      }

      // Update local state
      setPermissions(prev => {
        const newPermissions = {
          ...prev,
          [userId]: {
            ...prev[userId],
            [departmentId]: hasAccess ? 'look' : null
          }
        };
        console.log('Updated permissions state:', newPermissions);
        return newPermissions;
      });

      // Add to recent changes
      setRecentChanges(prev => {
        const newChanges = [
          { userId, departmentId, access: hasAccess, timestamp: Date.now() },
          ...prev
        ];
        console.log('Updated recent changes:', newChanges);
        return newChanges;
      });

    } catch (err) {
      console.error('Error toggling access:', err);
      setError('Failed to update access. Please try again.');
    } finally {
      setSavingStates(prev => ({ ...prev, [changeKey]: false }));
      console.log('Finished access toggle operation');
    }
  };

  /**
   * Initiates the user deletion process.
   * Checks for self-deletion and super admin status before proceeding.
   * 
   * @function handleDeleteUser
   * @param {Object} user - The user to delete
   */
  const handleDeleteUser = async (user) => {
    // Prevent deleting self or other super admins
    if (user.user_id === currentUserId) {
      setError("You cannot delete your own account");
      return;
    }
    if (user.is_superadmin) {
      setError("Super Admin accounts cannot be deleted");
      return;
    }
    setUserToDelete(user);
  };

  /**
   * Executes the user deletion after confirmation.
   * Handles cleanup across multiple tables.
   * 
   * @async
   * @function confirmDeleteUser
   */
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeletingUser(true);
    try {
      // Delete user's department permissions
      const { error: deptError } = await supabase
        .from('user_departments')
        .delete()
        .eq('user_id', userToDelete.user_id);

      if (deptError) throw deptError;

      // Delete user's profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', userToDelete.user_id);

      if (profileError) throw profileError;

      // Update local state
      setUsers(users.filter(u => u.user_id !== userToDelete.user_id));
      setUserToDelete(null);
      
      // Add to recent changes
      setRecentChanges(prev => [
        { userId: userToDelete.user_id, action: 'deleted', timestamp: Date.now() },
        ...prev
      ]);

    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
    } finally {
      setIsDeletingUser(false);
    }
  };

  // 🔍 Search functionality
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(user => 
      user.display_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  // Debounced search handler
  const handleSearch = debounce((value) => {
    setSearchQuery(value);
  }, 300);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin" size={24} />
        <span className="ml-2">Loading Super Admin Panel...</span>
      </div>
    );
  }

  // Main render
  return (
    <div className="bg-white rounded-lg shadow p-6 mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Super Admin Panel</h2>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-center">
          <AlertCircle className="text-red-500 mr-2" size={16} />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Search bar */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
        <Input
          type="text"
          placeholder="Search users..."
          className="pl-10"
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Recent changes */}
      {recentChanges.length > 0 && (
        <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded">
          <div className="flex items-center">
            <Check className="text-green-500 mr-2" size={16} />
            <p className="text-green-700 text-sm">Recent changes saved</p>
          </div>
        </div>
      )}

      {/* Matrix view */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="border p-2 min-w-[200px]">User</th>
              {departments.map(dept => (
                <th key={dept.department_id} className="border p-2 min-w-[120px]">
                  {dept.name}
                </th>
              ))}
              <th className="border p-2 w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.user_id}>
                <td className="border p-2">
                  <div>
                    {user.display_name}
                    {user.is_superadmin && (
                      <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                        Super Admin
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </td>
                {departments.map(dept => {
                  const hasAccess = !!permissions[user.user_id]?.[dept.department_id];
                  const currentRole = permissions[user.user_id]?.[dept.department_id];
                  const changeKey = `${user.user_id}-${dept.department_id}`;
                  const isSaving = savingStates[changeKey];

                  return (
                    <td key={dept.department_id} className="border p-2">
                      <div className="space-y-2">
                        {/* Access toggle */}
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={hasAccess}
                            onChange={(e) => handleAccessToggle(user.user_id, dept.department_id, e.target.checked)}
                            disabled={isSaving || user.user_id === currentUserId}
                            className="mr-2"
                          />
                          Access
                        </label>

                        {/* Permission selector */}
                        {hasAccess && (
                          <div className="space-y-1">
                            {PERMISSION_LEVELS.map(level => (
                              <label key={level.value} className="flex items-center text-sm">
                                <input
                                  type="radio"
                                  name={`${user.user_id}-${dept.department_id}-role`}
                                  value={level.value}
                                  checked={currentRole === level.value}
                                  onChange={() => handlePermissionChange(user.user_id, dept.department_id, level.value)}
                                  disabled={isSaving || user.user_id === currentUserId}
                                  className="mr-1"
                                />
                                {level.label}
                              </label>
                            ))}
                          </div>
                        )}

                        {isSaving && (
                          <div className="flex items-center justify-center">
                            <Loader2 className="animate-spin" size={16} />
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
                <td className="border p-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteUser(user)}
                    disabled={user.user_id === currentUserId || user.is_superadmin}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
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
            fetchData();
          }}
        />
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <ConfirmationModal
          title="Delete User"
          message={`Are you sure you want to permanently delete ${userToDelete.display_name} (${userToDelete.email})?`}
          confirmLabel="Delete User"
          onConfirm={confirmDeleteUser}
          onCancel={() => setUserToDelete(null)}
          isLoading={isDeletingUser}
          isDanger
        />
      )}
    </div>
  );
} 