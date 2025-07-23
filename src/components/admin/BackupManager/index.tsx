import React from 'react';
import { Button } from "../../../components/ui/button";
import { Download, Loader2 } from 'lucide-react';
import { createBackup } from '../../../services/backup/backupService';
import { useSupabase } from '../../../utils/hooks/useSupabase';
import { useRoleBasedUI } from '../../../utils/hooks/useRoleBasedUI';

export default function BackupManager({ departmentId = '' }) {
  const [isBackupInProgress, setIsBackupInProgress] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const supabase = useSupabase();
  
  const { 
    canShowFeature,
    FEATURE_PERMISSIONS
  } = useRoleBasedUI({ role: 'superadmin' }, departmentId);

  const handleBackup = async () => {
    if (!canShowFeature(FEATURE_PERMISSIONS.MANAGE_ALL)) return;
    
    try {
      setIsBackupInProgress(true);
      setProgress(0);
      
      await createBackup(supabase, (progress) => {
        setProgress(progress);
      });
      
      alert('Backup completed successfully!');
    } catch (error) {
      console.error('Backup failed:', error);
      alert('Failed to create backup. Please try again.');
    } finally {
      setIsBackupInProgress(false);
      setProgress(0);
    }
  };

  if (!canShowFeature(FEATURE_PERMISSIONS.MANAGE_ALL)) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
        <p className="mt-2 text-gray-600">You do not have permission to manage backups.</p>
      </div>
    );
  }

  const buttonContent = isBackupInProgress ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      <span>Creating Backup ({progress}%)</span>
    </>
  ) : (
    <>
      <Download className="mr-2 h-4 w-4" />
      <span>Create Backup</span>
    </>
  );

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="mb-4">
          <p className="text-gray-600">
            Create a complete backup of all SOPs, including images and metadata.
            The backup will be downloaded as a ZIP file.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={handleBackup}
            disabled={isBackupInProgress}
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
          >
            {buttonContent}
          </Button>

          {isBackupInProgress && (
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-500">
          <p>The backup will include:</p>
          <ul className="list-disc list-inside mt-1">
            <li>All SOPs and their metadata</li>
            <li>All step images in original quality</li>
            <li>Department information</li>
            <li>A preview interface for easy viewing</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 