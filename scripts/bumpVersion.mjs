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
    
    // 3. Update version.json
    versionData.version = newVersion;
    fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));
    console.log('✅ Updated version.json');
    
    // 4. Run comprehensive project audit
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
    const snapshot = {
      version: newVersion,
      timestamp: new Date().toISOString(),
      bumpType: bumpType,
      previousVersion: currentVersion,
      
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
      auditResults: null // Will be populated if audit succeeded
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
    
    // 6. Save progress snapshot
    const snapshotPath = path.join(process.cwd(), 'src', 'progress-snapshot.json');
    fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
    console.log('✅ Progress snapshot saved');
    
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
