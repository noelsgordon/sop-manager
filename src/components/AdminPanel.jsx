import React from 'react';
import { Card } from './ui/card';
import { Users2, Database, Archive } from 'lucide-react';
import { useRoleBasedUI } from '../utils/hooks/useRoleBasedUI';
import { Button } from './ui/button';
import { supabase } from '../supabaseClient';
import { FEATURE_PERMISSIONS } from '../utils/permissions';

export default function AdminPanel({ 
  userProfile,
  departments,
  visibleDepartmentIds,
  setVisibleDepartmentIds,
  setViewMode: setAdminViewMode,
  currentUserId,
  userRole
}) {
  const { canShowFeature, getFeatureProps } = useRoleBasedUI({ ...userProfile, role: userRole }, departments[0]?.department_id);

  const toggleDepartment = (departmentId) => {
    if (visibleDepartmentIds.includes(departmentId)) {
      setVisibleDepartmentIds(visibleDepartmentIds.filter(id => id !== departmentId));
    } else {
      setVisibleDepartmentIds([...visibleDepartmentIds, departmentId]);
    }
  };

  if (!canShowFeature(FEATURE_PERMISSIONS.VIEW_ADMIN_PANEL)) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
        <p className="mt-2 text-gray-600">You do not have permission to view the admin panel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Info Section */}
      <div className="p-4 border rounded shadow bg-white">
        <h2 className="text-xl font-semibold mb-4">Admin Panel</h2>

        <div className="mb-4">
          <p className="text-sm text-gray-600">Logged in as:</p>
          <p className="font-medium">{userProfile?.email}</p>
          <p className="text-xs text-gray-500">UID: {currentUserId}</p>
          <p className="text-sm text-gray-600 mt-2">Current Role: <span className="font-medium capitalize">{userRole}</span></p>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Visible Departments</p>
          {departments.map((dept) => (
            <label key={dept.department_id} className="flex items-center mb-1 text-sm">
              <input
                type="checkbox"
                checked={visibleDepartmentIds.includes(dept.department_id)}
                onChange={() => toggleDepartment(dept.department_id)}
                className="mr-2"
              />
              {dept.name}
            </label>
          ))}
        </div>

      </div>

      {/* Admin Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {canShowFeature(FEATURE_PERMISSIONS.MANAGE_USERS) && (
          <Card
            className="p-6 cursor-pointer hover:bg-gray-50 transition"
            onClick={() => setAdminViewMode('users')}
            {...getFeatureProps(FEATURE_PERMISSIONS.MANAGE_USERS)}
          >
            <div className="flex items-center mb-4">
              <Users2 className="h-6 w-6" />
              <h3 className="text-lg font-semibold ml-3">User Management</h3>
            </div>
            <p className="text-gray-600">Manage users, roles, and permissions</p>
          </Card>
        )}

        {canShowFeature(FEATURE_PERMISSIONS.MANAGE_DEPARTMENTS) && (
          <Card
            className="p-6 cursor-pointer hover:bg-gray-50 transition"
            onClick={() => setAdminViewMode('departments')}
            {...getFeatureProps(FEATURE_PERMISSIONS.MANAGE_DEPARTMENTS)}
          >
            <div className="flex items-center mb-4">
              <Database className="h-6 w-6" />
              <h3 className="text-lg font-semibold ml-3">Department Management</h3>
            </div>
            <p className="text-gray-600">Manage departments and their settings</p>
          </Card>
        )}

        {canShowFeature(FEATURE_PERMISSIONS.MANAGE_ALL) && (
          <Card
            className="p-6 cursor-pointer hover:bg-gray-50 transition"
            onClick={() => setAdminViewMode('backup')}
            {...getFeatureProps(FEATURE_PERMISSIONS.MANAGE_ALL)}
          >
            <div className="flex items-center mb-4">
              <Archive className="h-6 w-6" />
              <h3 className="text-lg font-semibold ml-3">Backup System</h3>
            </div>
            <p className="text-gray-600">Create and manage system backups</p>
          </Card>
        )}
      </div>
    </div>
  );
}
