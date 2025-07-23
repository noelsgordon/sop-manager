import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { Button } from "../../../components/ui/button";
import { Loader2, Search, AlertCircle, Check, Plus, Trash2, RotateCw } from 'lucide-react';
import debounce from 'lodash/debounce';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { CreateUserModal } from '../../../components/CreateUserModal';
import { toast } from '../../../components/ui/use-toast';
import { useRoleBasedUI } from '../../../utils/hooks/useRoleBasedUI';

const PERMISSION_LEVELS = [
  { value: 'look', label: 'Look' },
  { value: 'tweak', label: 'Tweak' },
  { value: 'build', label: 'Build' },
  { value: 'manage', label: 'Admin' }
];

export default function UsersAdmin({ currentUserId }) {
  // State Management
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

  const { canShowFeature, getFeatureProps } = useRoleBasedUI({ user_id: currentUserId }, null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRecentChanges([]);
    }, 5000);
    return () => clearTimeout(timer);
  }, [recentChanges]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch departments
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      if (deptError) throw deptError;
      setDepartments(deptData || []);

      // Fetch users
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('email');
      if (userError) throw userError;
      setUsers(userData || []);

      // Fetch permissions
      const { data: permsData, error: permsError } = await supabase
        .from('user_departments')
        .select('*');
      if (permsError) throw permsError;

      // Organize permissions by user and department
      const permsByUser = {};
      permsData.forEach(perm => {
        if (!permsByUser[perm.user_id]) {
          permsByUser[perm.user_id] = {};
        }
        permsByUser[perm.user_id][perm.department_id] = perm.role;
      });
      setPermissions(permsByUser);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load user data');
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = async (userId, departmentId, newRole) => {
    if (!canShowFeature(FEATURE_PERMISSIONS.MANAGE_USERS)) return;
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
      const { error } = await supabase
        .from('user_departments')
        .upsert({
          user_id: userId,
          department_id: departmentId,
          role: newRole
        });

      if (error) throw error;

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

  const handleAccessToggle = async (userId, departmentId, hasAccess) => {
    if (!canShowFeature(FEATURE_PERMISSIONS.MANAGE_USERS)) return;
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
            role: 'look'
          });
        
        if (error) throw error;

        // Update local state
        setPermissions(prev => ({
          ...prev,
          [userId]: {
            ...prev[userId],
            [departmentId]: 'look'
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

  const handleDeleteUser = async (user) => {
    if (!canShowFeature(FEATURE_PERMISSIONS.MANAGE_USERS)) return;
    if (user.user_id === currentUserId) {
      toast({
        title: "Error",
        description: "You cannot delete your own account",
        variant: "destructive"
      });
      return;
    }
    setUserToDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete || !canShowFeature(FEATURE_PERMISSIONS.MANAGE_USERS)) return;
    
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
      setIsDeletingUser(false);
    }
  };

  const handlePasswordReset = async (user) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Password Reset Email Sent",
        description: `A password reset email has been sent to ${user.email}`,
        variant: "default",
      });

      setRecentChanges(prev => [
        { userId: user.user_id, action: 'password_reset_sent', timestamp: Date.now() },
        ...prev
      ]);
    } catch (err) {
      console.error('Error sending password reset:', err);
      toast({
        title: "Error",
        description: "Failed to send password reset email. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filtered users based on search
  const filteredUsers = React.useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(user => 
      user.email?.toLowerCase().includes(query) ||
      user.first_name?.toLowerCase().includes(query) ||
      user.last_name?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  if (!canShowFeature(FEATURE_PERMISSIONS.MANAGE_USERS)) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
        <p className="mt-2 text-gray-600">You do not have permission to manage users.</p>
      </div>
    );
  }

  if (loading) {
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
          {canShowFeature(FEATURE_PERMISSIONS.MANAGE_USERS) && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 border rounded-md w-64"
          />
        </div>
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
            {filteredUsers.map(user => (
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
                  const currentRole = permissions[user.user_id]?.[dept.department_id] || 'look';
                  const isSavingThis = savingStates[`${user.user_id}-${dept.department_id}`];

                  return (
                    <td key={dept.department_id} className="border p-2">
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={hasAccess}
                            onChange={(e) => handleAccessToggle(user.user_id, dept.department_id, e.target.checked)}
                            disabled={!canShowFeature(FEATURE_PERMISSIONS.MANAGE_USERS) || user.user_id === currentUserId}
                            className="mr-2"
                          />
                          Access
                        </label>

                        {hasAccess && (
                          <div className="space-y-1">
                            {['look', 'tweak', 'build', 'manage'].map(role => (
                              <label key={role} className="flex items-center text-sm">
                                <input
                                  type="radio"
                                  name={`${user.user_id}-${dept.department_id}-role`}
                                  value={role}
                                  checked={currentRole === role}
                                  onChange={() => handlePermissionChange(user.user_id, dept.department_id, role)}
                                  disabled={!canShowFeature(FEATURE_PERMISSIONS.MANAGE_USERS) || user.user_id === currentUserId}
                                  className="mr-1"
                                />
                                {role.charAt(0).toUpperCase() + role.slice(1)}
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
                  <div className="flex flex-col gap-2">
                    {canShowFeature(FEATURE_PERMISSIONS.MANAGE_USERS) && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePasswordReset(user)}
                          disabled={user.user_id === currentUserId}
                          className="flex items-center"
                          title="Send Password Reset Email"
                        >
                          <RotateCw className="h-4 w-4" />
                          <span className="sr-only">Reset Password</span>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          disabled={user.user_id === currentUserId || user.is_superadmin}
                          className="flex items-center"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete User</span>
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreateModal && canShowFeature(FEATURE_PERMISSIONS.MANAGE_USERS) && (
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
      {userToDelete && canShowFeature(FEATURE_PERMISSIONS.MANAGE_USERS) && (
        <ConfirmationModal
          title="Delete User"
          message={`Are you sure you want to delete ${userToDelete.email}? This action cannot be undone.`}
          onConfirm={confirmDeleteUser}
          onCancel={() => setUserToDelete(null)}
          isLoading={isDeletingUser}
          confirmLabel="Delete User"
          variant="destructive"
        />
      )}
    </div>
  );
} 