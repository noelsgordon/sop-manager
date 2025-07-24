/**
 * @fileoverview Project Auditor - Comprehensive project analysis and audit system
 * 
 * This script performs deep analysis of the project to identify:
 * - Version inconsistencies across files
 * - Duplicate files and components
 * - TODO/FIXME items in code
 * - Build warnings and issues
 * - File structure and organization problems
 * - Orphaned files and unused imports
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Runs a comprehensive project audit
 * @returns {Object} Complete audit results
 */
async function runComprehensiveAudit() {
  const audit = {
    timestamp: new Date().toISOString(),
    versionCheck: {},
    duplicateFiles: [],
    todoItems: [],
    buildWarnings: [],
    fileStructure: {},
    orphanedFiles: [],
    importAnalysis: {},
    issues: [],
    recommendations: []
  };

  try {
    console.log('🔍 Starting comprehensive project audit...');
    
    // 1. Version Consistency Check
    console.log('📋 Checking version consistency...');
    audit.versionCheck = await checkVersionConsistency();
    
    // 2. Duplicate File Detection
    console.log('🔍 Finding duplicate files...');
    audit.duplicateFiles = await findDuplicateFiles();
    
    // 3. TODO/FIXME Scan
    console.log('📝 Scanning for TODO items...');
    audit.todoItems = await scanForTodos();
    
    // 4. Build Status Check
    console.log('🏗️ Checking build status...');
    audit.buildWarnings = await checkBuildStatus();
    
    // 5. File Structure Analysis
    console.log('📁 Analyzing file structure...');
    audit.fileStructure = await analyzeFileStructure();
    
    // 6. Orphaned File Detection
    console.log('🧹 Finding orphaned files...');
    audit.orphanedFiles = await findOrphanedFiles();
    
    // 7. Import Analysis
    console.log('📦 Analyzing imports...');
    audit.importAnalysis = await analyzeImports();
    
    // 8. Compile Issues and Recommendations
    console.log('📊 Compiling results...');
    audit.issues = compileIssues(audit);
    audit.recommendations = generateRecommendations(audit);
    
    console.log('✅ Audit complete!');
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
    audit.error = error.message;
  }

  return audit;
}

/**
 * Checks version consistency across all version files
 */
async function checkVersionConsistency() {
  const versions = {};
  
  try {
    // Check package.json
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      versions.packageJson = packageJson.version;
    }
    
    // Check version.json
    const versionJsonPath = path.join(process.cwd(), 'src', 'version.json');
    if (fs.existsSync(versionJsonPath)) {
      const versionJson = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
      versions.versionJson = versionJson.version;
    }
    
    // Check for other version files
    const srcPath = path.join(process.cwd(), 'src');
    const otherVersionFiles = [];
    
    function scanForVersionFiles(dir) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          scanForVersionFiles(filePath);
        } else if (file.includes('version') || file.includes('Version')) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            const versionMatch = content.match(/["']version["']\s*:\s*["']([^"']+)["']/i);
            if (versionMatch) {
              otherVersionFiles.push({
                file: path.relative(process.cwd(), filePath),
                version: versionMatch[1]
              });
            }
          } catch (e) {
            // Skip files that can't be read
          }
        }
      }
    }
    
    scanForVersionFiles(srcPath);
    versions.otherFiles = otherVersionFiles;
    
    // Determine if versions are consistent
    const allVersions = [
      versions.packageJson,
      versions.versionJson,
      ...otherVersionFiles.map(f => f.version)
    ].filter(v => v);
    
    const uniqueVersions = [...new Set(allVersions)];
    versions.isConsistent = uniqueVersions.length <= 1;
    versions.inconsistencies = uniqueVersions.length > 1 ? uniqueVersions : [];
    versions.allVersions = allVersions;
    
  } catch (error) {
    console.error('Error checking version consistency:', error);
    versions.error = error.message;
  }
  
  return versions;
}

/**
 * Finds duplicate files in the project
 */
async function findDuplicateFiles() {
  const duplicates = [];
  
  try {
    const srcPath = path.join(process.cwd(), 'src');
    const allFiles = [];
    
    function scanFiles(dir) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          scanFiles(filePath);
        } else if (file.match(/\.(js|jsx|ts|tsx)$/)) {
          allFiles.push({
            name: file,
            path: path.relative(process.cwd(), filePath),
            dir: path.dirname(filePath)
          });
        }
      }
    }
    
    scanFiles(srcPath);
    
    // Group by filename
    const fileGroups = {};
    allFiles.forEach(file => {
      if (!fileGroups[file.name]) {
        fileGroups[file.name] = [];
      }
      fileGroups[file.name].push(file);
    });
    
    // Find duplicates
    Object.entries(fileGroups).forEach(([filename, files]) => {
      if (files.length > 1) {
        duplicates.push({
          name: filename,
          files: files,
          count: files.length
        });
      }
    });
    
  } catch (error) {
    console.error('Error finding duplicate files:', error);
  }
  
  return duplicates;
}

/**
 * Scans for TODO, FIXME, and BUG comments
 */
async function scanForTodos() {
  const todos = [];
  
  try {
    const srcPath = path.join(process.cwd(), 'src');
    const patterns = [
      { type: 'TODO', regex: /TODO[:\s]*([^\n]*)/gi },
      { type: 'FIXME', regex: /FIXME[:\s]*([^\n]*)/gi },
      { type: 'BUG', regex: /BUG[:\s]*([^\n]*)/gi },
      { type: 'HACK', regex: /HACK[:\s]*([^\n]*)/gi },
      { type: 'NOTE', regex: /NOTE[:\s]*([^\n]*)/gi }
    ];
    
    function scanFile(filePath) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileTodos = [];
        
        patterns.forEach(pattern => {
          let match;
          while ((match = pattern.regex.exec(content)) !== null) {
            fileTodos.push({
              type: pattern.type,
              message: match[1]?.trim() || 'No description',
              line: content.substring(0, match.index).split('\n').length,
              context: content.split('\n')[content.substring(0, match.index).split('\n').length - 1]?.trim()
            });
          }
        });
        
        if (fileTodos.length > 0) {
          todos.push({
            file: path.relative(process.cwd(), filePath),
            todos: fileTodos
          });
        }
      } catch (e) {
        // Skip files that can't be read
      }
    }
    
    function scanDirectory(dir) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          scanDirectory(filePath);
        } else if (file.match(/\.(js|jsx|ts|tsx)$/)) {
          scanFile(filePath);
        }
      }
    }
    
    scanDirectory(srcPath);
    
  } catch (error) {
    console.error('Error scanning TODOs:', error);
  }
  
  return todos;
}

/**
 * Checks build status and captures warnings
 */
async function checkBuildStatus() {
  const warnings = [];
  
  try {
    console.log('Running build check...');
    const buildOutput = execSync('npm run build 2>&1', { 
      encoding: 'utf8',
      cwd: process.cwd(),
      timeout: 60000 // 60 second timeout
    });
    
    // Parse build output for warnings
    const lines = buildOutput.split('\n');
    lines.forEach(line => {
      if (line.includes('warning') || line.includes('Warning')) {
        warnings.push({
          type: 'BUILD_WARNING',
          message: line.trim(),
          severity: 'warning'
        });
      } else if (line.includes('error') || line.includes('Error')) {
        warnings.push({
          type: 'BUILD_ERROR',
          message: line.trim(),
          severity: 'error'
        });
      } else if (line.includes('chunk') && line.includes('larger than')) {
        warnings.push({
          type: 'BUNDLE_SIZE',
          message: line.trim(),
          severity: 'warning'
        });
      }
    });
    
    warnings.push({
      type: 'BUILD_STATUS',
      message: buildOutput.includes('error') ? 'Build failed' : 'Build successful',
      severity: buildOutput.includes('error') ? 'error' : 'info'
    });
    
  } catch (error) {
    warnings.push({
      type: 'BUILD_ERROR',
      message: `Build check failed: ${error.message}`,
      severity: 'error'
    });
  }
  
  return warnings;
}

/**
 * Analyzes file structure
 */
async function analyzeFileStructure() {
  const structure = {
    totalFiles: 0,
    directories: [],
    fileTypes: {},
    largestFiles: [],
    recentChanges: []
  };
  
  try {
    const srcPath = path.join(process.cwd(), 'src');
    const allFiles = [];
    
    function scanStructure(dir, depth = 0) {
      const files = fs.readdirSync(dir);
      const dirInfo = {
        name: path.basename(dir),
        path: path.relative(process.cwd(), dir),
        depth: depth,
        files: [],
        subdirs: []
      };
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          dirInfo.subdirs.push(scanStructure(filePath, depth + 1));
        } else {
          const fileInfo = {
            name: file,
            size: stat.size,
            modified: stat.mtime,
            path: path.relative(process.cwd(), filePath)
          };
          dirInfo.files.push(fileInfo);
          allFiles.push(fileInfo);
          
          // Count file types
          const ext = path.extname(file);
          structure.fileTypes[ext] = (structure.fileTypes[ext] || 0) + 1;
        }
      }
      
      return dirInfo;
    }
    
    structure.directories = scanStructure(srcPath);
    structure.totalFiles = allFiles.length;
    
    // Find largest files
    structure.largestFiles = allFiles
      .sort((a, b) => b.size - a.size)
      .slice(0, 10)
      .map(f => ({
        name: f.name,
        path: f.path,
        size: f.size,
        sizeKB: Math.round(f.size / 1024)
      }));
    
    // Find recent changes
    structure.recentChanges = allFiles
      .sort((a, b) => b.modified - a.modified)
      .slice(0, 10)
      .map(f => ({
        name: f.name,
        path: f.path,
        modified: f.modified.toISOString()
      }));
    
  } catch (error) {
    console.error('Error analyzing file structure:', error);
    structure.error = error.message;
  }
  
  return structure;
}

/**
 * Finds orphaned files (not imported anywhere)
 */
async function findOrphanedFiles() {
  const orphaned = [];
  
  try {
    const srcPath = path.join(process.cwd(), 'src');
    const allFiles = [];
    const importedFiles = new Set();
    
    // Collect all files
    function collectFiles(dir) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          collectFiles(filePath);
        } else if (file.match(/\.(js|jsx|ts|tsx)$/)) {
          allFiles.push({
            name: file,
            path: path.relative(process.cwd(), filePath),
            fullPath: filePath
          });
        }
      }
    }
    
    collectFiles(srcPath);
    
    // Scan for imports
    function scanImports(filePath) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Look for import statements
        const importMatches = content.match(/import\s+.*from\s+['"]([^'"]+)['"]/g);
        if (importMatches) {
          importMatches.forEach(match => {
            const importPath = match.match(/from\s+['"]([^'"]+)['"]/)[1];
            
            // Resolve relative imports
            if (importPath.startsWith('.')) {
              const resolvedPath = path.resolve(path.dirname(filePath), importPath);
              const relativePath = path.relative(process.cwd(), resolvedPath);
              
              // Add common extensions
              ['.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.jsx', '/index.ts', '/index.tsx'].forEach(ext => {
                importedFiles.add(relativePath + ext);
              });
            }
          });
        }
      } catch (e) {
        // Skip files that can't be read
      }
    }
    
    // Scan all files for imports
    allFiles.forEach(file => {
      scanImports(file.fullPath);
    });
    
    // Find orphaned files
    allFiles.forEach(file => {
      if (!importedFiles.has(file.path)) {
        // Check if it's a main entry point or special file
        const isSpecialFile = file.name === 'main.jsx' || 
                             file.name === 'App.jsx' || 
                             file.name === 'index.html' ||
                             file.path.includes('node_modules');
        
        if (!isSpecialFile) {
          orphaned.push({
            file: file.path,
            reason: 'Not imported anywhere',
            suggestedAction: 'Remove if unused or add proper imports'
          });
        }
      }
    });
    
  } catch (error) {
    console.error('Error finding orphaned files:', error);
  }
  
  return orphaned;
}

/**
 * Analyzes import statements
 */
async function analyzeImports() {
  const analysis = {
    unusedImports: [],
    missingImports: [],
    circularDependencies: [],
    totalImports: 0
  };
  
  try {
    const srcPath = path.join(process.cwd(), 'src');
    
    function analyzeFile(filePath) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Count imports
        const importMatches = content.match(/import\s+.*from\s+['"]([^'"]+)['"]/g);
        if (importMatches) {
          analysis.totalImports += importMatches.length;
        }
        
        // This is a simplified analysis - full import analysis would require AST parsing
        // For now, we'll provide a placeholder
        
      } catch (e) {
        // Skip files that can't be read
      }
    }
    
    function scanForImports(dir) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          scanForImports(filePath);
        } else if (file.match(/\.(js|jsx|ts|tsx)$/)) {
          analyzeFile(filePath);
        }
      }
    }
    
    scanForImports(srcPath);
    
    analysis.message = 'Import analysis completed (simplified version)';
    
  } catch (error) {
    console.error('Error analyzing imports:', error);
    analysis.error = error.message;
  }
  
  return analysis;
}

/**
 * Compiles all issues found during audit
 */
function compileIssues(audit) {
  const issues = [];
  
  // Version inconsistencies
  if (!audit.versionCheck.isConsistent) {
    issues.push({
      severity: 'HIGH',
      category: 'VERSION',
      message: `Version inconsistencies found: ${audit.versionCheck.inconsistencies.join(', ')}`,
      impact: 'Build and deployment issues',
      details: audit.versionCheck
    });
  }
  
  // Duplicate files
  if (audit.duplicateFiles.length > 0) {
    issues.push({
      severity: 'MEDIUM',
      category: 'DUPLICATES',
      message: `${audit.duplicateFiles.length} duplicate files found`,
      impact: 'Code confusion and maintenance issues',
      details: audit.duplicateFiles
    });
  }
  
  // TODO items
  const totalTodos = audit.todoItems.reduce((sum, file) => sum + file.todos.length, 0);
  if (totalTodos > 0) {
    issues.push({
      severity: 'MEDIUM',
      category: 'TODOS',
      message: `${totalTodos} TODO items found across ${audit.todoItems.length} files`,
      impact: 'Incomplete features and technical debt',
      details: audit.todoItems
    });
  }
  
  // Build warnings
  const buildErrors = audit.buildWarnings.filter(w => w.severity === 'error');
  const buildWarnings = audit.buildWarnings.filter(w => w.severity === 'warning');
  
  if (buildErrors.length > 0) {
    issues.push({
      severity: 'HIGH',
      category: 'BUILD',
      message: `${buildErrors.length} build errors found`,
      impact: 'Application may not build or deploy',
      details: buildErrors
    });
  }
  
  if (buildWarnings.length > 0) {
    issues.push({
      severity: 'LOW',
      category: 'BUILD',
      message: `${buildWarnings.length} build warnings found`,
      impact: 'Performance or compatibility issues',
      details: buildWarnings
    });
  }
  
  // Orphaned files
  if (audit.orphanedFiles.length > 0) {
    issues.push({
      severity: 'LOW',
      category: 'ORPHANED',
      message: `${audit.orphanedFiles.length} orphaned files found`,
      impact: 'Code bloat and confusion',
      details: audit.orphanedFiles
    });
  }
  
  return issues;
}

/**
 * Generates recommendations based on audit results
 */
function generateRecommendations(audit) {
  const recommendations = [];
  
  // Version consistency
  if (!audit.versionCheck.isConsistent) {
    recommendations.push({
      priority: 'HIGH',
      category: 'VERSION',
      action: 'Synchronize all version files',
      command: 'npm run bump-version',
      description: 'Use the bumpVersion.cjs script to update all version files consistently'
    });
  }
  
  // Duplicate files
  if (audit.duplicateFiles.length > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'DUPLICATES',
      action: 'Remove duplicate files',
      command: 'Review and remove unused duplicate files',
      description: 'Identify which duplicate files are actually used and remove the others'
    });
  }
  
  // TODO items
  const totalTodos = audit.todoItems.reduce((sum, file) => sum + file.todos.length, 0);
  if (totalTodos > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'TODOS',
      action: 'Address TODO items',
      command: 'Review and complete TODO items',
      description: `Complete ${totalTodos} TODO items or document why they remain`
    });
  }
  
  // Build issues
  const buildErrors = audit.buildWarnings.filter(w => w.severity === 'error');
  if (buildErrors.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      category: 'BUILD',
      action: 'Fix build errors',
      command: 'npm run build',
      description: 'Resolve build errors before deployment'
    });
  }
  
  // Orphaned files
  if (audit.orphanedFiles.length > 0) {
    recommendations.push({
      priority: 'LOW',
      category: 'ORPHANED',
      action: 'Clean up orphaned files',
      command: 'Remove unused files',
      description: 'Remove orphaned files or add proper imports'
    });
  }
  
  return recommendations;
}

/**
 * Main function to run the audit and save results
 */
async function main() {
  try {
    console.log('🚀 Starting Project Auditor...');
    
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

// Export functions for use in other modules
export {
  runComprehensiveAudit,
  checkVersionConsistency,
  findDuplicateFiles,
  scanForTodos,
  checkBuildStatus,
  analyzeFileStructure,
  findOrphanedFiles,
  analyzeImports,
  compileIssues,
  generateRecommendations
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 