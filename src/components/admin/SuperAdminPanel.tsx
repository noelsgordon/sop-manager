import React, { useState, useEffect } from 'react';
import BackupManager from './BackupManager';
import UsersAdmin from './UsersAdmin';
import AdminPanel from '../AdminPanel';
import { useRoleBasedUI } from '../../utils/hooks/useRoleBasedUI';
import { Card } from '../ui/card';
import { Users2, Database, Archive } from 'lucide-react';

interface SuperAdminPanelProps {
  currentUserId: string;
  userProfile: any;
  departments: any[];
  setViewMode: (mode: string) => void;
}

const TileContent = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <div className="p-6">
    <div className="flex items-center mb-4">
      <Icon className="h-6 w-6" />
      <h3 className="text-lg font-semibold ml-3">{title}</h3>
    </div>
    <p className="text-gray-600">{description}</p>
  </div>
);

export default function SuperAdminPanel({ 
  currentUserId,
  userProfile,
  departments,
  setViewMode
}: SuperAdminPanelProps) {
  const [activeSection, setActiveSection] = useState('users');
  const [visibleDepartmentIds, setVisibleDepartmentIds] = useState(departments.map(d => d.department_id));
  
  // Debug function
  const logDebug = (location: string, data: any) => {
    console.log(`[SuperAdminPanel Debug ${location}]`, {
      ...data,
      timestamp: new Date().toISOString()
    });
  };

  const { 
    canShowFeature,
    FEATURE_PERMISSIONS,
    isSuper
  } = useRoleBasedUI({ 
    ...userProfile, 
    role: 'superadmin',  // Force superadmin role for this component
    is_superadmin: true  // Ensure superadmin status
  }, departments[0]?.department_id || '');

  // Debug effect for permission changes
  useEffect(() => {
    logDebug('Permissions State', {
      isSuper,
      canShowAdminPanel: canShowFeature(FEATURE_PERMISSIONS.VIEW_ADMIN_PANEL),
      canShowBackup: canShowFeature(FEATURE_PERMISSIONS.MANAGE_ALL),
      canManageUsers: canShowFeature(FEATURE_PERMISSIONS.MANAGE_USERS),
      userProfile,
      departments: departments.length
    });
  }, [canShowFeature, isSuper, userProfile, departments]);

  // Only super admins should access this panel
  if (!isSuper) {
    logDebug('Access Denied', {
      reason: 'Not SuperAdmin',
      userProfile
    });
    return (
      <div className="col-span-full p-6 text-center">
        <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
        <p className="mt-2 text-gray-600">You do not have permission to access the Super Admin Panel.</p>
      </div>
    );
  }

  logDebug('Rendering Panel', {
    activeSection,
    visibleDepartmentIds,
    departmentsCount: departments.length,
    userProfile
  });

  // Render the appropriate section based on activeSection
  const renderSection = () => {
    switch (activeSection) {
      case 'users':
        return <UsersAdmin currentUserId={currentUserId} />;
      case 'admin':
        return (
          <AdminPanel
            userProfile={userProfile}
            departments={departments}
            visibleDepartmentIds={visibleDepartmentIds}
            setVisibleDepartmentIds={setVisibleDepartmentIds}
            setViewMode={setViewMode}
            currentUserId={currentUserId}
            userRole="superadmin"
          />
        );
      case 'backup':
        return <BackupManager departmentId={departments[0]?.department_id} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          className={`cursor-pointer ${activeSection === 'users' ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}
          onClick={() => setActiveSection('users')}
        >
          <Card className="hover:bg-gray-50 transition" children={
            <TileContent
              icon={Users2}
              title="User Management"
              description="Manage users and their permissions across departments"
            />
          } />
        </div>

        <div 
          className={`cursor-pointer ${activeSection === 'admin' ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}
          onClick={() => setActiveSection('admin')}
        >
          <Card className="hover:bg-gray-50 transition" children={
            <TileContent
              icon={Database}
              title="Admin Panel"
              description="Access department settings and administrative tools"
            />
          } />
        </div>

        <div 
          className={`cursor-pointer ${activeSection === 'backup' ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}
          onClick={() => setActiveSection('backup')}
        >
          <Card className="hover:bg-gray-50 transition" children={
            <TileContent
              icon={Archive}
              title="Backup System"
              description="Create and manage system backups"
            />
          } />
        </div>
      </div>

      {/* Active Section Content */}
      <div className="mt-6">
        {renderSection()}
      </div>
    </div>
  );
} 