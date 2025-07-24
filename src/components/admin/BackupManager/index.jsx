// Debug: confirm file is loaded
console.log('BackupManager component file loaded');
import React from 'react';
import { Button } from "../../../components/ui/button";
import { Download, Loader2 } from 'lucide-react';
import { createBackup } from '../../../services/backup/backupService';
import { importBackup } from '../../../services/backup/backupImportService.js';
import { useState, useRef } from 'react';
import { useSupabase } from '../../../utils/hooks/useSupabase';
import { useRoleBasedUI } from '../../../utils/hooks/useRoleBasedUI';
import { FEATURE_PERMISSIONS } from '../../../utils/permissions';

export default function BackupManager({ departmentId = '' }) {
  console.log('BackupManager function running');
  const [isBackupInProgress, setIsBackupInProgress] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [importResult, setImportResult] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const fileInputRef = useRef();
  const supabase = useSupabase();
  
  const { canShowFeature, getFeatureProps } = useRoleBasedUI({ role: 'superadmin' }, departmentId);
  // Debug log for permissions
  console.log('BackupManager: canShowFeature(MANAGE_ALL):', canShowFeature(FEATURE_PERMISSIONS.MANAGE_ALL));

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

  // Handler for restore/import
  const handleImportBackup = async (file) => {
    setIsBackupInProgress(true);
    setProgress(0);
    setImportResult(null);
    try {
      const result = await importBackup(file, supabase, (p) => setProgress(p));
      setImportResult(result);
    } catch (err) {
      setImportResult({ errors: [err] });
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
        {/* Backup Button */}
        <Button onClick={handleBackup} disabled={isBackupInProgress} className="mb-4">
          {buttonContent}
        </Button>
        {/* Restore Button for Superadmins */}
        {canShowFeature(FEATURE_PERMISSIONS.MANAGE_ALL) && (
          <div className="mt-4">
            <Button variant="outline" onClick={() => setShowImportModal(true)} disabled={isBackupInProgress}>
              Restore previous backup
            </Button>
          </div>
        )}
        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full relative">
              <h2 className="text-lg font-semibold mb-4">Restore Previous Backup</h2>
              <input
                type="file"
                accept=".zip"
                ref={fileInputRef}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleImportBackup(file);
                }}
                disabled={isBackupInProgress}
                className="mb-4"
              />
              {isBackupInProgress && (
                <div className="mb-2">Restoring... {progress}%</div>
              )}
              {importResult && (
                <div className="mb-2">
                  <div>Inserted: {importResult.inserted}</div>
                  <div>Updated: {importResult.updated}</div>
                  <div>Skipped: {importResult.skipped}</div>
                  {importResult.errors?.length > 0 && (
                    <div className="text-red-600">
                      Errors:
                      <ul className="text-xs max-h-32 overflow-y-auto">
                        {importResult.errors.map((err, i) => (
                          <li key={i}>{err.message || JSON.stringify(err)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-end mt-4">
                <Button variant="ghost" onClick={() => setShowImportModal(false)} disabled={isBackupInProgress}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

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