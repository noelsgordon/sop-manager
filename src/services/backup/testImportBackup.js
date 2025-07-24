import fs from 'fs';
import path from 'path';
import { supabase } from '../../supabaseClientNode.js';
import { importBackup } from './backupImportService.js';

async function main() {
  const zipPath = process.argv[2];
  if (!zipPath) {
    console.error('Usage: node testImportBackup.js <backup_zip_path>');
    process.exit(1);
  }
  if (!fs.existsSync(zipPath)) {
    console.error('File not found:', zipPath);
    process.exit(1);
  }
  const zipFile = fs.readFileSync(zipPath);
  console.log('Starting import of backup:', zipPath);
  const result = await importBackup(zipFile, supabase, progress => {
    process.stdout.write(`\rProgress: ${progress}%   `);
  });
  console.log('\nImport complete!');
  console.log('Inserted:', result.inserted);
  console.log('Updated:', result.updated);
  console.log('Skipped:', result.skipped);
  if (result.errors.length) {
    console.error('Errors:', result.errors);
  } else {
    console.log('No errors.');
  }
}

main().catch(err => {
  console.error('Fatal error during import:', err);
  process.exit(1);
}); 