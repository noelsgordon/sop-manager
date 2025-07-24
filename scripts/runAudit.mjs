#!/usr/bin/env node

/**
 * @fileoverview Project Audit Runner - Runs comprehensive project analysis
 * 
 * This script runs the project auditor and saves results for use by the
 * project snapshot system.
 */

import { runComprehensiveAudit } from '../src/utils/projectAuditor.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    console.log('🚀 Starting Project Audit...');
    
    const audit = await runComprehensiveAudit();
    
    // ENHANCED AUDIT DATA
    let gitCommits = [];
    let gitBranch = '';
    try {
      gitCommits = execSync('git log -n 5 --pretty=format:"%h|%an|%ad|%s" --date=iso').toString().split('\n');
      gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    } catch (e) {
      gitCommits = ['Could not retrieve git log'];
      gitBranch = 'unknown';
    }
    const nodeEnv = process.env.NODE_ENV || 'development';
    let lastBackup = null;
    try {
      const backupMetaPath = path.join(process.cwd(), 'src', 'backup-metadata.json');
      if (fs.existsSync(backupMetaPath)) {
        const backupMeta = JSON.parse(fs.readFileSync(backupMetaPath, 'utf8'));
        lastBackup = backupMeta.timestamp || null;
      }
    } catch (e) { lastBackup = null; }
    let migrationStatus = null;
    try {
      const migrationStatusPath = path.join(process.cwd(), 'src', 'migration-status.json');
      if (fs.existsSync(migrationStatusPath)) {
        migrationStatus = JSON.parse(fs.readFileSync(migrationStatusPath, 'utf8'));
      }
    } catch (e) { migrationStatus = null; }
    const crypto = await import('crypto');
    function hashFile(filePath) {
      try {
        const data = fs.readFileSync(filePath);
        return crypto.createHash('sha256').update(data).digest('hex');
      } catch (e) { return null; }
    }
    const rlsFiles = [
      'src/fix_all_rls_policies.sql',
      'src/production_rls_implementation.sql',
      'src/rls_implementation_plan.sql'
    ];
    const rlsHashes = {};
    for (const file of rlsFiles) {
      rlsHashes[file] = hashFile(file);
    }
    let packageLockHash = null;
    try {
      const lockData = fs.readFileSync(path.join(process.cwd(), 'package-lock.json'));
      packageLockHash = crypto.createHash('sha256').update(lockData).digest('hex');
    } catch (e) { packageLockHash = null; }
    let frontendBuildHash = null;
    try {
      const buildData = fs.readFileSync(path.join(process.cwd(), 'dist', 'index.html'));
      frontendBuildHash = crypto.createHash('sha256').update(buildData).digest('hex');
    } catch (e) { frontendBuildHash = null; }
    // Add to audit
    audit.gitBranch = gitBranch;
    audit.gitCommits = gitCommits;
    audit.nodeEnv = nodeEnv;
    audit.lastBackup = lastBackup;
    audit.migrationStatus = migrationStatus;
    audit.rlsHashes = rlsHashes;
    audit.packageLockHash = packageLockHash;
    audit.frontendBuildHash = frontendBuildHash;
    // Add snapshot hash for AI continuity
    try {
      const auditString = JSON.stringify(audit);
      audit.snapshotHash = crypto.createHash('sha256').update(auditString).digest('hex');
    } catch (e) { audit.snapshotHash = null; }
    
    // Save audit results
    const outputPath = path.join(process.cwd(), 'src', 'audit-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(audit, null, 2));
    
    console.log(`✅ Audit complete! Results saved to: ${outputPath}`);
    console.log(`📊 Found ${audit.issues.length} issues and ${audit.recommendations.length} recommendations`);
    
    // Print summary
    console.log('\n📋 Audit Summary:');
    audit.issues.forEach(issue => {
      console.log(`  ${issue.severity}: ${issue.message}`);
    });
    
    console.log('\n💡 Recommendations:');
    audit.recommendations.forEach(rec => {
      console.log(`  ${rec.priority}: ${rec.action}`);
    });
    
    // Exit with error code if there are critical issues
    const criticalIssues = audit.issues.filter(i => i.severity === 'HIGH');
    if (criticalIssues.length > 0) {
      console.log(`\n⚠️  ${criticalIssues.length} critical issues found!`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  }
}

// Run if called directly
main(); 