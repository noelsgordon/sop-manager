import JSZip from 'jszip';

// Result type for import summary
export interface ImportResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: any[];
}

/**
 * Import a backup ZIP file into the database.
 * @param zipFile File or Blob (from file input)
 * @param supabase Supabase client instance
 * @param onProgress Optional progress callback (0-100)
 * @returns ImportResult summary
 */
export async function importBackup(zipFile: File | Blob, supabase: any, onProgress?: (progress: number) => void): Promise<ImportResult> {
  const result: ImportResult = { inserted: 0, updated: 0, skipped: 0, errors: [] };
  try {
    // 1. Unzip the file
    const zip = await JSZip.loadAsync(zipFile);
    // 2. Parse JSON data
    const sopsJson = await zip.file('data/sops.json')?.async('string');
    const stepsJson = await zip.file('data/sop_steps.json')?.async('string');
    const deptsJson = await zip.file('data/departments.json')?.async('string');
    if (!sopsJson || !stepsJson || !deptsJson) throw new Error('Missing required data files in backup');
    const sops = JSON.parse(sopsJson);
    const steps = JSON.parse(stepsJson);
    const departments = JSON.parse(deptsJson);
    // 3. Import departments
    for (const dept of departments) {
      const { data: existing, error } = await supabase
        .from('departments')
        .select('department_id')
        .eq('department_id', dept.department_id)
        .maybeSingle();
      if (error) { result.errors.push(error); continue; }
      if (existing) {
        // Overwrite
        const { error: updateError } = await supabase
          .from('departments')
          .update(dept)
          .eq('department_id', dept.department_id);
        if (updateError) { result.errors.push(updateError); } else { result.updated++; }
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from('departments')
          .insert(dept);
        if (insertError) { result.errors.push(insertError); } else { result.inserted++; }
      }
      onProgress?.(Math.round((result.inserted + result.updated) / (departments.length + sops.length + steps.length) * 100));
    }
    // 4. Import SOPs
    for (const sop of sops) {
      const { data: existing, error } = await supabase
        .from('sops')
        .select('id')
        .eq('id', sop.id)
        .maybeSingle();
      if (error) { result.errors.push(error); continue; }
      if (existing) {
        // Overwrite
        const { error: updateError } = await supabase
          .from('sops')
          .update(sop)
          .eq('id', sop.id);
        if (updateError) { result.errors.push(updateError); } else { result.updated++; }
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from('sops')
          .insert(sop);
        if (insertError) { result.errors.push(insertError); } else { result.inserted++; }
      }
      onProgress?.(Math.round((result.inserted + result.updated) / (departments.length + sops.length + steps.length) * 100));
    }
    // 5. Import SOP steps
    for (const step of steps) {
      const { data: existing, error } = await supabase
        .from('sop_steps')
        .select('id')
        .eq('id', step.id)
        .maybeSingle();
      if (error) { result.errors.push(error); continue; }
      if (existing) {
        // Overwrite
        const { error: updateError } = await supabase
          .from('sop_steps')
          .update(step)
          .eq('id', step.id);
        if (updateError) { result.errors.push(updateError); } else { result.updated++; }
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from('sop_steps')
          .insert(step);
        if (insertError) { result.errors.push(insertError); } else { result.inserted++; }
      }
      onProgress?.(Math.round((result.inserted + result.updated) / (departments.length + sops.length + steps.length) * 100));
    }
    // 6. (Phase 2) Restore images if needed
    // TODO: Implement image restore logic
    // 7. Return result
    onProgress?.(100);
    return result;
  } catch (err) {
    result.errors.push(err);
    return result;
  }
}

// For Node.js ES module compatibility
export default importBackup; 