import { createClient } from '@supabase/supabase-js';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Types
interface SOP {
  id: string;
  name: string;
  description: string;
  department_id: string;
  created_at: string;
  deleted_at: string | null;
  created_by: string;
}

interface SOPStep {
  id: string;
  sop_id: string;
  step_number: number;
  instruction: string;
  tools: string;
  parts: string;
  photo: string;
  deleted_at: string | null;
}

interface Department {
  department_id: string;
  name: string;
  created_at: string;
  created_by: string;
}

interface BackupMetadata {
  version: string;
  timestamp: string;
  totalSops: number;
  totalSteps: number;
  totalImages: number;
  departments: number;
}

// Helper function to generate safe filenames
export function generateSafeImageName(sop: SOP, step: SOPStep, originalFileName: string): string {
  // Clean the SOP name
  const safeSopName = sop.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')  // Replace special chars with underscore
    .replace(/_{2,}/g, '_')       // Replace multiple underscores with single
    .substring(0, 50);            // Limit length
    
  // Get file extension from original URL or fallback to jpg
  const ext = originalFileName.split('.').pop()?.toLowerCase() || 'jpg';
  
  // Create base filename
  const baseFileName = `${safeSopName}_step_${step.step_number}`;
  
  // Add short hash for uniqueness
  const shortHash = step.id.substring(0, 8);
  
  // Combine all parts
  return `${baseFileName}_${shortHash}.${ext}`;
}

// Helper function to download an image and return as blob
async function downloadImage(url: string): Promise<Blob | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    return await response.blob();
  } catch (error) {
    console.error('Error downloading image:', error);
    return null;
  }
}

// Main backup function
export async function createBackup(supabase: any, onProgress?: (progress: number) => void): Promise<void> {
  try {
    // Create a new ZIP file
    const zip = new JSZip();
    
    // Create folders
    const dataFolder = zip.folder('data');
    const imagesFolder = zip.folder('images');
    const previewFolder = zip.folder('preview');
    
    // Fetch all data
    const { data: sops, error: sopsError } = await supabase
      .from('sops')
      .select('*');
    if (sopsError) throw sopsError;

    const { data: steps, error: stepsError } = await supabase
      .from('sop_steps')
      .select('*');
    if (stepsError) throw stepsError;

    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('*');
    if (deptError) throw deptError;

    // NEW: Fetch user_profiles, user_departments, invite_codes
    const { data: userProfiles, error: userProfilesError } = await supabase
      .from('user_profiles')
      .select('*');
    if (userProfilesError) throw userProfilesError;

    const { data: userDepartments, error: userDepartmentsError } = await supabase
      .from('user_departments')
      .select('*');
    if (userDepartmentsError) throw userDepartmentsError;

    const { data: inviteCodes, error: inviteCodesError } = await supabase
      .from('invite_codes')
      .select('*');
    if (inviteCodesError) throw inviteCodesError;

    // Create metadata
    const metadata: BackupMetadata = {
      version: '1.1',
      timestamp: new Date().toISOString(),
      totalSops: sops.length,
      totalSteps: steps.length,
      totalImages: steps.filter(s => s.photo).length,
      departments: departments.length
      // Optionally add user count, etc.
    };

    // Save JSON data
    dataFolder?.file('sops.json', JSON.stringify(sops, null, 2));
    dataFolder?.file('sop_steps.json', JSON.stringify(steps, null, 2));
    dataFolder?.file('departments.json', JSON.stringify(departments, null, 2));
    dataFolder?.file('user_profiles.json', JSON.stringify(userProfiles, null, 2));
    dataFolder?.file('user_departments.json', JSON.stringify(userDepartments, null, 2));
    dataFolder?.file('invite_codes.json', JSON.stringify(inviteCodes, null, 2));
    dataFolder?.file('metadata.json', JSON.stringify(metadata, null, 2));

    // Download and save images
    let processedImages = 0;
    const totalImages = steps.filter(s => s.photo).length;

    for (const sop of sops) {
      const sopSteps = steps.filter(s => s.sop_id === sop.id);
      const sopFolder = imagesFolder?.folder(sop.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'));

      for (const step of sopSteps) {
        if (step.photo) {
          const originalFileName = step.photo.split('/').pop() || 'image.jpg';
          const safeFileName = generateSafeImageName(sop, step, originalFileName);
          
          const imageBlob = await downloadImage(step.photo);
          if (imageBlob) {
            sopFolder?.file(safeFileName, imageBlob);
          }

          processedImages++;
          onProgress?.(Math.round((processedImages / totalImages) * 100));
        }
      }
    }

    // Create README
    const readme = `SOP Manager Backup
Created: ${new Date().toLocaleString()}
Version: 1.1

Contents:
1. data/ - JSON files containing all SOP, user, department, and invite data
   - sops.json
   - sop_steps.json
   - departments.json
   - user_profiles.json
   - user_departments.json
   - invite_codes.json
2. images/ - All SOP images organized by SOP
3. preview/ - Double-click index.html to view SOPs in browser

To view the backup:
1. Extract the ZIP file
2. Open "preview/index.html" in any web browser
3. Browse through your SOPs and images

Backup Statistics:
- Total SOPs: ${metadata.totalSops}
- Total Steps: ${metadata.totalSteps}
- Total Images: ${metadata.totalImages}
- Departments: ${metadata.departments}
- User Profiles: ${userProfiles.length}
- User Departments: ${userDepartments.length}
- Invite Codes: ${inviteCodes.length}`;

    zip.file('README.txt', readme);

    // Generate and save ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    saveAs(zipBlob, `sop_backup_${timestamp}.zip`);

  } catch (error) {
    console.error('Backup creation failed:', error);
    throw error;
  }
} 