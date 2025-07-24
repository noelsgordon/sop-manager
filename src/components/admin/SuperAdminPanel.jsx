/**
 * @fileoverview SuperAdminPanel Component - Provides cross-department user management capabilities
 * for super administrators.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Loader2, Search, AlertCircle, Check, Plus, Trash2, Lock } from 'lucide-react';
import { debounce } from 'lodash';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { CreateUserModal } from '../CreateUserModal';
import { PERMISSION_LEVELS } from '../../utils/permissions';
import { toast } from '../ui/use-toast';
import { 
  generateEssentialInfo, 
  generateDetailedKnowledge, 
  generateCompleteDocumentation,
  copyToClipboard 
} from '../../utils/projectSnapshot';

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
  // Menu state: 'menu', 'userManagement', 'rlsTest', etc.
  const [activeSection, setActiveSection] = useState('menu');

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
  const [copyLoading, setCopyLoading] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionLog, setRevisionLog] = useState(null);
  const [revisionLoading, setRevisionLoading] = useState(false);
  // Fallback mock notes
  const fallbackNotes = [
    { hash: '', author: '', date: '', message: 'chore: bump version to 2.4.0 (minor)' },
    { hash: '', author: '', date: '', message: 'chore: bump version to 2.3.0 and enhance snapshot/audit metadata' },
    { hash: '', author: '', date: '', message: 'fix: restore backup manager panel rendering' },
    { hash: '', author: '', date: '', message: 'feat: add backup restore modal for superadmins' },
    { hash: '', author: '', date: '', message: 'refactor: improve RLS policy handling' },
    { hash: '', author: '', date: '', message: 'docs: update project notes for backup improvements' },
  ];
  // Fetch revision log on modal open
  useEffect(() => {
    if (showRevisionModal) {
      setRevisionLoading(true);
      fetch('/src/revision-log.json')
        .then(res => res.ok ? res.json() : Promise.reject('Not found'))
        .then(data => setRevisionLog(Array.isArray(data) ? data : fallbackNotes))
        .catch(() => setRevisionLog(fallbackNotes))
        .finally(() => setRevisionLoading(false));
    }
  }, [showRevisionModal]);

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

  // Handle project snapshot copying
  const handleCopySnapshot = async (generator, type) => {
    console.log(`Starting copy process for: ${type}`);
    setCopyLoading(true);
    try {
      console.log('Calling generator function...');
      const data = await generator();
      console.log('Generator completed, data size:', JSON.stringify(data).length);
      
      console.log('Calling copyToClipboard...');
      const result = await copyToClipboard(data);
      console.log('Copy result:', result);
      
      if (result.success) {
        toast({
          title: '✅ Copied Successfully!',
          description: `${type} copied to clipboard (${Math.round(result.size / 1024)}KB)`,
          variant: 'default'
        });
      } else {
        toast({
          title: '❌ Copy Failed',
          description: result.error || 'Failed to copy to clipboard',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error copying snapshot:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to generate project snapshot',
        variant: 'destructive'
      });
    } finally {
      setCopyLoading(false);
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

  // --- ROOT RENDER ---
  return (
    <>
      {/* Always show revision notes button at the top */}
      <div className="mb-4">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
          onClick={() => setShowRevisionModal(true)}
        >
          View Revision Control Notes
        </button>
      </div>
      {/* Section renders */}
      {activeSection === 'menu' && (
        <div className="p-8 max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">SuperAdmin Tools</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            
            {/* Project Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">📋 Project Information</h3>
              
              <div className="space-y-2">
                <Button
                  className="w-full h-16 text-lg"
                  variant="outline"
                  onClick={() => handleCopySnapshot(generateEssentialInfo, 'Essential Info')}
                  disabled={copyLoading}
                >
                  Info
                </Button>
                
                <Button
                  className="w-full h-16 text-lg"
                  variant="outline"
                  onClick={() => handleCopySnapshot(generateDetailedKnowledge, 'Detailed Knowledge')}
                  disabled={copyLoading}
                >
                  Detail
                </Button>
                
                <Button
                  className="w-full h-16 text-lg"
                  variant="outline"
                  onClick={() => handleCopySnapshot(generateCompleteDocumentation, 'Complete Documentation')}
                  disabled={copyLoading}
                >
                  Complete
                </Button>
              </div>
            </div>

            {/* Testing Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">🧪 Testing & Security</h3>
              
              <div className="space-y-2">
                <Button
                  className="w-full h-24 text-lg"
                  variant="outline"
                  onClick={() => setViewMode ? setViewMode('rlsTestEnvironment') : setActiveSection('rlsTestEnvironment')}
                >
                  RLS Test Environment
                </Button>
                
                <Button
                  className="w-full h-24 text-lg"
                  variant="outline"
                  onClick={() => setViewMode ? setViewMode('rlsTest') : setActiveSection('rlsTest')}
                >
                  RLS Test Page
                </Button>
              </div>
            </div>

            {/* User Management Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">👥 User Management</h3>
              
              <div className="space-y-2">
                <Button
                  className="w-full h-24 text-lg"
                  variant="outline"
                  onClick={() => setActiveSection('userManagement')}
                >
                  User Management
                </Button>
                
                <Button
                  className="w-full h-24 text-lg"
                  variant="outline"
                  onClick={() => setViewMode ? setViewMode('backupManager') : setActiveSection('backupManager')}
                >
                  Backup Manager
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeSection === 'userManagement' && (
        <div className="p-4">
          <Button variant="ghost" className="mb-4" onClick={() => setActiveSection('menu')}>← Back to SuperAdmin Menu</Button>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold">User Management</h2>
              <Button onClick={() => setShowCreateModal(true)}>
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
                  const isSuperadmin = user.is_superadmin;
                  return (
                    <tr key={user.user_id}>
                      <td className="border p-2">
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {user.email}
                            {isSuperadmin && (
                              <span className="text-blue-700 font-bold flex items-center ml-2">
                                <Lock className="h-4 w-4 mr-1" /> Superadmin
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.first_name} {user.last_name}
                          </div>
                        </div>
                      </td>
                      {departments.map(dept => {
                        const hasAccess = !!permissions[user.user_id]?.[dept.department_id];
                        // For superadmin, always show 'superadmin' as selected
                        const currentRole = isSuperadmin ? PERMISSION_LEVELS.SUPERADMIN : (permissions[user.user_id]?.[dept.department_id] || PERMISSION_LEVELS.LOOK);
                        const isSavingThis = savingStates[`${user.user_id}-${dept.department_id}`];
                        const cellClass = isSuperadmin ? "border p-2 bg-gray-100 opacity-60" : "border p-2";
                        return (
                          <td key={dept.department_id} className={cellClass}>
                            <div className="space-y-2">
                              {/* Access toggle */}
                              <label className="flex items-center cursor-pointer" style={{ position: 'relative', zIndex: 1002 }}>
                                <input
                                  type="checkbox"
                                  checked={hasAccess}
                                  onChange={(e) => {
                                    if (!isSuperadmin) handleAccessToggle(user.user_id, dept.department_id, e.target.checked);
                                  }}
                                  disabled={isSaving || user.user_id === currentUserId || isSuperadmin}
                                  className="mr-2 cursor-pointer"
                                  style={{ cursor: 'not-allowed', position: 'relative', zIndex: 1003 }}
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
                                          if (!isSuperadmin) handlePermissionChange(user.user_id, dept.department_id, level.value);
                                        }}
                                        disabled={isSaving || user.user_id === currentUserId || isSuperadmin}
                                        className="mr-1 cursor-pointer"
                                        style={{ cursor: 'not-allowed', position: 'relative', zIndex: 1006 }}
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
                          disabled={user.user_id === currentUserId || isSuperadmin}
                          onClick={() => {
                            if (!isSuperadmin) {
                              setUserToDelete(user);
                              setShowDeleteConfirm(true);
                            }
                          }}
                          style={{ 
                            position: 'relative', 
                            zIndex: 1000,
                            background: isSuperadmin ? '#cbd5e1' : '#dc2626',
                            color: isSuperadmin ? '#64748b' : 'white',
                            padding: '4px 8px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isSuperadmin ? 'not-allowed' : 'pointer'
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
                  await supabase
                    .from('user_departments')
                    .delete()
                    .eq('user_id', userToDelete.user_id);
                  await supabase
                    .from('user_profiles')
                    .delete()
                    .eq('user_id', userToDelete.user_id);
                  const { error } = await supabase.auth.admin.deleteUser(
                    userToDelete.user_id
                  );
                  if (error) throw error;
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
      )}
      {/* Revision Notes Modal (always available) */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full relative">
            <h2 className="text-lg font-semibold mb-4">Revision Control Notes</h2>
            {revisionLoading ? (
              <div>Loading revision log...</div>
            ) : (
              <ul className="mb-6 max-h-96 overflow-y-auto">
                {(revisionLog || fallbackNotes).map((note, idx) => (
                  <li key={idx} className="mb-2 border-b pb-2 last:border-b-0 last:pb-0">
                    <div className="font-mono text-xs text-gray-500 mb-1">
                      {note.hash && <span className="mr-2">{note.hash.slice(0,7)}</span>}
                      {note.author && <span className="mr-2">{note.author}</span>}
                      {note.date && <span className="mr-2">{note.date.slice(0, 19).replace('T', ' ')}</span>}
                    </div>
                    <div>{note.message}</div>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-end">
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
                onClick={() => setShowRevisionModal(false)}
              >
                Return
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 