#!/usr/bin/env node

import { spawn } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

class DevWatcher {
  constructor() {
    this.logDir = '.cursor';
    this.runtimeLogPath = join(this.logDir, 'runtime-log.json');
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

    writeFileSync(this.runtimeLogPath, JSON.stringify(logData, null, 2));
    console.log(`📊 Runtime log written to ${this.runtimeLogPath}`);
  }

  generateSummary() {
    const errorCount = this.logs.filter(log => 
      log.level === 'error' || 
      log.message.toLowerCase().includes('error') ||
      log.message.toLowerCase().includes('failed')
    ).length;

    const successCount = this.logs.filter(log => 
      log.level === 'success' || 
      log.message.toLowerCase().includes('compiled') ||
      log.message.toLowerCase().includes('ready') ||
      log.message.toLowerCase().includes('success')
    ).length;

    return {
      totalLogs: this.logs.length,
      errors: errorCount,
      successes: successCount,
      isHealthy: errorCount === 0 && successCount > 0,
      hasCompiled: this.logs.some(log => 
        log.message.toLowerCase().includes('compiled') ||
        log.message.toLowerCase().includes('ready')
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
    if (lowerMessage.includes('error') || lowerMessage.includes('failed')) {
      this.status = 'error';
    } else if (lowerMessage.includes('compiled') || lowerMessage.includes('ready')) {
      this.status = 'success';
    } else if (lowerMessage.includes('starting') || lowerMessage.includes('building')) {
      this.status = 'building';
    }

    // Write log immediately for real-time monitoring
    this.writeLog();
  }

  start() {
    console.log('🚀 Starting development server monitoring...');
    console.log(`📁 Logs will be written to ${this.runtimeLogPath}`);
    
    // Start the development server
    const devProcess = spawn('npm', ['run', 'dev'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    // Monitor stdout
    devProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[DEV] ${output.trim()}`);
      this.addLog('info', output);
    });

    // Monitor stderr
    devProcess.stderr.on('data', (data) => {
      const output = data.toString();
      console.error(`[DEV ERROR] ${output.trim()}`);
      this.addLog('error', output);
    });

    // Handle process exit
    devProcess.on('exit', (code) => {
      const exitMessage = `Process exited with code ${code}`;
      console.log(`[DEV] ${exitMessage}`);
      this.addLog(code === 0 ? 'success' : 'error', exitMessage);
      this.status = code === 0 ? 'success' : 'error';
      this.writeLog();
    });

    // Handle process errors
    devProcess.on('error', (error) => {
      const errorMessage = `Process error: ${error.message}`;
      console.error(`[DEV ERROR] ${errorMessage}`);
      this.addLog('error', errorMessage);
      this.status = 'error';
      this.writeLog();
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down development server...');
      devProcess.kill('SIGINT');
      this.writeLog();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Terminating development server...');
      devProcess.kill('SIGTERM');
      this.writeLog();
      process.exit(0);
    });
  }
}

// Start the watcher
const watcher = new DevWatcher();
watcher.start(); 