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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    console.log('🚀 Starting Project Audit...');
    
    const audit = await runComprehensiveAudit();
    
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