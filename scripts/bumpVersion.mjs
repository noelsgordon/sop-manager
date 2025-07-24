#!/usr/bin/env node

/**
 * @fileoverview Version Bump Script - Updates version and captures project state
 * 
 * This script:
 * 1. Updates version in version.json
 * 2. Runs comprehensive project audit
 * 3. Generates project snapshot with current state
 * 4. Saves progress snapshot for AI continuity
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { runComprehensiveAudit } from '../src/utils/projectAuditor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get command line arguments
const args = process.argv.slice(2);
const bumpType = args[0] || 'patch'; // patch, minor, major

if (!['patch', 'minor', 'major'].includes(bumpType)) {
  console.error('❌ Invalid bump type. Use: patch, minor, or major');
  process.exit(1);
}

async function main() {
  try {
    console.log(`🚀 Bumping version (${bumpType})...`);
    
    // 1. Read current version
    const versionPath = path.join(process.cwd(), 'src', 'version.json');
    const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
    const currentVersion = versionData.version;
    
    // 2. Calculate new version
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    let newVersion;
    
    switch (bumpType) {
      case 'major':
        newVersion = `${major + 1}.0.0`;
        break;
      case 'minor':
        newVersion = `${major}.${minor + 1}.0`;
        break;
      case 'patch':
        newVersion = `${major}.${minor}.${patch + 1}`;
        break;
    }
    
    console.log(`📋 Version: ${currentVersion} → ${newVersion}`);
    
    // 3. Update version.json and package.json (move this BEFORE audit and snapshot)
    versionData.version = newVersion;
    fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));
    console.log('✅ Updated version.json');

    // Update package.json version as well
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    packageJson.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json');
    
    // 4. Run comprehensive project audit (now uses updated version)
    console.log('🔍 Running project audit...');
    try {
      const audit = await runComprehensiveAudit();
      
      // Save audit results
      const auditPath = path.join(process.cwd(), 'src', 'audit-results.json');
      fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2));
      console.log('✅ Audit results saved');
      
      // Check for critical issues
      const criticalIssues = audit.issues.filter(i => i.severity === 'HIGH');
      if (criticalIssues.length > 0) {
        console.log(`⚠️  Warning: ${criticalIssues.length} critical issues found:`);
        criticalIssues.forEach(issue => {
          console.log(`   - ${issue.message}`);
        });
      }
      
    } catch (auditError) {
      console.error('❌ Audit failed:', auditError.message);
      // Continue with version bump even if audit fails
    }
    
    // 5. Generate project snapshot
    console.log('📸 Generating project snapshot...');
    // --- ENHANCED SNAPSHOT DATA ---
    // Get last N git commits
    let gitCommits = [];
    let gitBranch = '';
    try {
      gitCommits = execSync('git log -n 5 --pretty=format:"%h|%an|%ad|%s" --date=iso').toString().split('\n');
      gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    } catch (e) {
      gitCommits = ['Could not retrieve git log'];
      gitBranch = 'unknown';
    }
    // Get environment
    const nodeEnv = process.env.NODE_ENV || 'development';
    // Get last backup timestamp (if available)
    let lastBackup = null;
    try {
      const backupMetaPath = path.join(process.cwd(), 'src', 'backup-metadata.json');
      if (fs.existsSync(backupMetaPath)) {
        const backupMeta = JSON.parse(fs.readFileSync(backupMetaPath, 'utf8'));
        lastBackup = backupMeta.timestamp || null;
      }
    } catch (e) { lastBackup = null; }
    // Get migration status (if available)
    let migrationStatus = null;
    try {
      const migrationStatusPath = path.join(process.cwd(), 'src', 'migration-status.json');
      if (fs.existsSync(migrationStatusPath)) {
        migrationStatus = JSON.parse(fs.readFileSync(migrationStatusPath, 'utf8'));
      }
    } catch (e) { migrationStatus = null; }
    // Hash RLS policy files
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
    // Hash package-lock.json
    let packageLockHash = null;
    try {
      const lockData = fs.readFileSync(path.join(process.cwd(), 'package-lock.json'));
      packageLockHash = crypto.createHash('sha256').update(lockData).digest('hex');
    } catch (e) { packageLockHash = null; }
    // Hash frontend build (dist/index.html if exists)
    let frontendBuildHash = null;
    try {
      const buildData = fs.readFileSync(path.join(process.cwd(), 'dist', 'index.html'));
      frontendBuildHash = crypto.createHash('sha256').update(buildData).digest('hex');
    } catch (e) { frontendBuildHash = null; }
    // --- END ENHANCED SNAPSHOT DATA ---
    // 6. Save progress snapshot
    const snapshot = {
      version: newVersion,
      timestamp: new Date().toISOString(),
      bumpType: bumpType,
      previousVersion: currentVersion,
      gitBranch,
      gitCommits,
      nodeEnv,
      lastBackup,
      migrationStatus,
      rlsHashes,
      packageLockHash,
      frontendBuildHash,
      // Project Status
      projectStatus: {
        rlsImplementation: 'COMPLETE',
        userManagement: 'FUNCTIONAL',
        backupSystem: 'ACTIVE',
        auditStatus: 'COMPREHENSIVE_AUDIT_ENABLED'
      },
      // Development Context
      developmentContext: {
        currentWork: 'Project audit system implementation',
        recentDecisions: [
          'Enhanced project snapshot system with comprehensive audits',
          'Implemented server-side audit runner for accurate project analysis',
          'Added version consistency checking and duplicate file detection',
          'Integrated audit results with project snapshot generation'
        ],
        knownIssues: [],
        nextSteps: [
          'Monitor audit results for critical issues',
          'Address any version inconsistencies found',
          'Clean up duplicate files if identified',
          'Complete TODO items before next major release'
        ]
      },
      // Lessons Learned
      lessonsLearned: {
        projectAudit: [
          'Comprehensive audits catch issues before they become problems',
          'Version consistency is critical for deployment',
          'Duplicate files create confusion and maintenance overhead',
          'TODO items accumulate technical debt over time',
          'Build warnings indicate potential performance issues'
        ],
        snapshotSystem: [
          'Real-time audit data improves snapshot accuracy',
          'Server-side analysis provides deeper insights than client-side',
          'Automated issue detection prevents knowledge gaps',
          'Structured audit results enable better AI continuity'
        ]
      },
      // Audit Results (if available)
      auditResults: null
    };
    // Try to include audit results
    try {
      const auditPath = path.join(process.cwd(), 'src', 'audit-results.json');
      if (fs.existsSync(auditPath)) {
        snapshot.auditResults = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
      }
    } catch (e) {
      console.log('⚠️  Could not include audit results in snapshot');
    }
    // Add snapshot hash for AI continuity
    try {
      const snapshotString = JSON.stringify(snapshot);
      snapshot.snapshotHash = crypto.createHash('sha256').update(snapshotString).digest('hex');
    } catch (e) { snapshot.snapshotHash = null; }
    // 7. Save progress snapshot
    const snapshotPath = path.join(process.cwd(), 'src', 'progress-snapshot.json');
    fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
    console.log('✅ Progress snapshot saved');
    
    // 8. Save revision log (latest 50 commits)
    try {
      const logLines = execSync('git log -n 50 --pretty=format:"%h|%an|%ad|%s" --date=iso').toString().split('\n');
      const revisionLog = logLines.map(line => {
        const [hash, author, date, ...msgParts] = line.split('|');
        return { hash, author, date, message: msgParts.join('|') };
      });
      const revisionLogPath = path.join(process.cwd(), 'src', 'revision-log.json');
      fs.writeFileSync(revisionLogPath, JSON.stringify(revisionLog, null, 2));
      console.log('✅ Revision log saved');
    } catch (e) {
      console.error('❌ Failed to save revision log:', e);
    }
    
    // 7. Print summary
    console.log('\n🎉 Version bump complete!');
    console.log(`📋 Version: ${currentVersion} → ${newVersion}`);
    console.log(`📊 Snapshot: ${snapshotPath}`);
    
    if (snapshot.auditResults) {
      const issues = snapshot.auditResults.issues || [];
      const recommendations = snapshot.auditResults.recommendations || [];
      console.log(`🔍 Audit: ${issues.length} issues, ${recommendations.length} recommendations`);
    }
    
    console.log('\n💡 Next steps:');
    console.log('  1. Review audit results for any issues');
    console.log('  2. Commit changes to version control');
    console.log('  3. Deploy to production');
    console.log('  4. Test the new version');
    
  } catch (error) {
    console.error('❌ Version bump failed:', error);
    process.exit(1);
  }
}

// Run the main function
main();
