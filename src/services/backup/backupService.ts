import { createClient } from '@supabase/supabase-js';
// import JSZip from 'jszip'; // Removed to fix build issues
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
  // Temporarily disabled due to missing JSZip dependency
  throw new Error('Backup service temporarily disabled - JSZip dependency removed');
} 