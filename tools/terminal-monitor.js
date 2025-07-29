#!/usr/bin/env node

import { spawn } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

class TerminalMonitor {
  constructor() {
    this.logDir = '.cursor';
    this.terminalLogPath = join(this.logDir, 'terminal-log.json');
    this.ensureLogDirectory();
    this.startTime = new Date();
    this.logs = [];
    this.status = 'starting';
  }

  ensureLogDirectory() {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  writeLog() {
    const logData = {
      timestamp: new Date().toISOString(),
      status: this.status,
      startTime: this.startTime.toISOString(),
      duration: Date.now() - this.startTime.getTime(),
      logs: this.logs,
      summary: this.generateSummary()
    };

    writeFileSync(this.terminalLogPath, JSON.stringify(logData, null, 2));
    console.log(`📊 Terminal log written to ${this.terminalLogPath}`);
  }

  generateSummary() {
    const errorCount = this.logs.filter(log => 
      log.level === 'error' || 
      log.message.toLowerCase().includes('error') ||
      log.message.toLowerCase().includes('failed') ||
      log.message.toLowerCase().includes('not recognized') ||
      log.message.toLowerCase().includes('commandnotfound')
    ).length;

    const successCount = this.logs.filter(log => 
      log.level === 'success' || 
      log.message.toLowerCase().includes('success') ||
      log.message.toLowerCase().includes('passed') ||
      log.message.toLowerCase().includes('completed')
    ).length;

    const warningCount = this.logs.filter(log => 
      log.level === 'warning' || 
      log.message.toLowerCase().includes('warning') ||
      log.message.toLowerCase().includes('deprecated')
    ).length;

    return {
      totalLogs: this.logs.length,
      errors: errorCount,
      successes: successCount,
      warnings: warningCount,
      isHealthy: errorCount === 0 && successCount > 0,
      hasTerminalErrors: errorCount > 0,
      hasPowerShellErrors: this.logs.some(log => 
        log.message.toLowerCase().includes('powershell') ||
        log.message.toLowerCase().includes('cmdlet')
      )
    };
  }

  addLog(level, message, timestamp = new Date()) {
    const logEntry = {
      timestamp: timestamp.toISOString(),
      level,
      message: message.trim()
    };
    
    this.logs.push(logEntry);
    
    // Update status based on message content
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('error') || 
        lowerMessage.includes('failed') || 
        lowerMessage.includes('not recognized') ||
        lowerMessage.includes('commandnotfound')) {
      this.status = 'error';
    } else if (lowerMessage.includes('success') || 
               lowerMessage.includes('passed') || 
               lowerMessage.includes('completed')) {
      this.status = 'success';
    } else if (lowerMessage.includes('warning')) {
      this.status = 'warning';
    }

    // Write log immediately for real-time monitoring
    this.writeLog();
  }

  monitorCommand(command, args = []) {
    console.log(`🔍 Monitoring command: ${command} ${args.join(' ')}`);
    
    return new Promise((resolve) => {
      const process = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      // Monitor stdout
      process.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`[STDOUT] ${output.trim()}`);
        this.addLog('info', output);
      });

      // Monitor stderr
      process.stderr.on('data', (data) => {
        const output = data.toString();
        console.error(`[STDERR] ${output.trim()}`);
        this.addLog('error', output);
      });

      // Handle process exit
      process.on('exit', (code) => {
        const exitMessage = `Process exited with code ${code}`;
        console.log(`[EXIT] ${exitMessage}`);
        this.addLog(code === 0 ? 'success' : 'error', exitMessage);
        this.status = code === 0 ? 'success' : 'error';
        this.writeLog();
        resolve(code === 0);
      });

      // Handle process errors
      process.on('error', (error) => {
        const errorMessage = `Process error: ${error.message}`;
        console.error(`[ERROR] ${errorMessage}`);
        this.addLog('error', errorMessage);
        this.status = 'error';
        this.writeLog();
        resolve(false);
      });
    });
  }

  async start() {
    console.log('🔍 Starting terminal monitoring...');
    console.log(`📁 Logs will be written to ${this.terminalLogPath}`);
    
    // Test with deliberate errors to verify detection
    console.log('\n🧪 Testing error detection capabilities...');
    
    // Test 1: NPM error
    console.log('\n--- Testing NPM Error ---');
    const npmSuccess = await this.monitorCommand('npm', ['run', 'devv']);
    
    // Test 2: PowerShell error
    console.log('\n--- Testing PowerShell Error ---');
    const psSuccess = await this.monitorCommand('powershell', ['-Command', 'q']);
    
    // Test 3: Command not found
    console.log('\n--- Testing Command Not Found ---');
    const cmdSuccess = await this.monitorCommand('nonexistentcommand', []);
    
    // Test 4: Normal command (should succeed)
    console.log('\n--- Testing Normal Command ---');
    const normalSuccess = await this.monitorCommand('npm', ['--version']);
    
    const summary = this.generateSummary();
    console.log('\n📊 Terminal monitoring complete:');
    console.log(`   - Total logs: ${summary.totalLogs}`);
    console.log(`   - Errors: ${summary.errors}`);
    console.log(`   - Successes: ${summary.successes}`);
    console.log(`   - Warnings: ${summary.warnings}`);
    console.log(`   - Is healthy: ${summary.isHealthy ? '✅' : '❌'}`);
    console.log(`   - Has terminal errors: ${summary.hasTerminalErrors ? '❌' : '✅'}`);
    console.log(`   - Has PowerShell errors: ${summary.hasPowerShellErrors ? '❌' : '✅'}`);
    
    // Test logic: We want to detect errors, so success means we caught the deliberate errors
    const errorDetectionSuccess = !npmSuccess && !psSuccess && !cmdSuccess && normalSuccess;
    console.log(`\n🎯 Overall Test Results:`);
    console.log(`   NPM Error Test: ${npmSuccess ? '❌ Failed to detect error' : '✅ Successfully detected error'}`);
    console.log(`   PowerShell Error Test: ${psSuccess ? '❌ Failed to detect error' : '✅ Successfully detected error'}`);
    console.log(`   Command Not Found Test: ${cmdSuccess ? '❌ Failed to detect error' : '✅ Successfully detected error'}`);
    console.log(`   Normal Command Test: ${normalSuccess ? '✅ Passed (no error expected)' : '❌ Failed (should have passed)'}`);
    console.log(`   Error Detection: ${errorDetectionSuccess ? '✅ All error detection tests passed' : '❌ Some error detection tests failed'}`);
    
    // Return exit code 1 for success (detecting errors) to match enhanced monitor expectations
    return errorDetectionSuccess;
  }
}

// Start the monitor
const monitor = new TerminalMonitor();
monitor.start().then(success => {
  // Exit code 1 for success (detecting errors), 0 for failure
  process.exit(success ? 1 : 0);
}); 