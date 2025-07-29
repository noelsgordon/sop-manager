#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

class DevMonitor {
  constructor() {
    this.logDir = '.cursor';
    this.runtimeLogPath = join(this.logDir, 'runtime-log.json');
    this.frontendLogPath = join(this.logDir, 'frontend-log.json');
    this.feedbackPath = join(this.logDir, 'feedback.md');
  }

  async waitForFile(path, timeout = 60000) {
    console.log(`⏳ Waiting for ${path}...`);
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (existsSync(path)) {
        try {
          const data = JSON.parse(readFileSync(path, 'utf8'));
          if (data.summary && data.summary.hasCompiled) {
            console.log(`✅ ${path} is ready`);
            return true;
          }
        } catch (error) {
          // File exists but not ready yet
        }
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`⚠️ Timeout waiting for ${path}`);
    return false;
  }

  async runRuntimeMonitoring() {
    console.log('🚀 Starting runtime monitoring...');
    
    return new Promise((resolve) => {
      const runtimeProcess = spawn('node', ['tools/dev-watch.js'], {
        stdio: 'inherit',
        shell: true
      });

      // Wait for runtime to be ready
      setTimeout(async () => {
        const isReady = await this.waitForFile(this.runtimeLogPath, 30000);
        if (isReady) {
          console.log('✅ Runtime monitoring is ready');
          resolve(true);
        } else {
          console.log('❌ Runtime monitoring failed to start properly');
          resolve(false);
        }
      }, 5000);
    });
  }

  async runFrontendMonitoring() {
    console.log('🌐 Starting frontend monitoring...');
    
    return new Promise((resolve) => {
      const frontendProcess = spawn('node', ['tools/observe-frontend.js'], {
        stdio: 'inherit',
        shell: true
      });

      frontendProcess.on('exit', (code) => {
        console.log(`🌐 Frontend monitoring completed with code ${code}`);
        resolve(code === 0);
      });

      frontendProcess.on('error', (error) => {
        console.error('🌐 Frontend monitoring error:', error.message);
        resolve(false);
      });
    });
  }

  async runFeedbackAnalysis() {
    console.log('🔍 Running feedback analysis...');
    
    return new Promise((resolve) => {
      const analyzerProcess = spawn('node', ['tools/feedback-analyzer.js'], {
        stdio: 'inherit',
        shell: true
      });

      analyzerProcess.on('exit', (code) => {
        console.log(`🔍 Feedback analysis completed with code ${code}`);
        resolve(code === 0);
      });

      analyzerProcess.on('error', (error) => {
        console.error('🔍 Feedback analysis error:', error.message);
        resolve(false);
      });
    });
  }

  async start() {
    console.log('🎯 Starting comprehensive development monitoring...');
    console.log('📁 Logs will be written to .cursor/ directory');
    
    try {
      // Step 1: Start runtime monitoring
      const runtimeSuccess = await this.runRuntimeMonitoring();
      
      if (!runtimeSuccess) {
        console.log('❌ Runtime monitoring failed, stopping');
        return false;
      }
      
      // Step 2: Start frontend monitoring
      const frontendSuccess = await this.runFrontendMonitoring();
      
      if (!frontendSuccess) {
        console.log('❌ Frontend monitoring failed');
      }
      
      // Step 3: Run feedback analysis
      const analysisSuccess = await this.runFeedbackAnalysis();
      
      // Final summary
      console.log('\n📊 Monitoring Summary:');
      console.log(`   Runtime: ${runtimeSuccess ? '✅' : '❌'}`);
      console.log(`   Frontend: ${frontendSuccess ? '✅' : '❌'}`);
      console.log(`   Analysis: ${analysisSuccess ? '✅' : '❌'}`);
      
      if (existsSync(this.feedbackPath)) {
        console.log(`\n📝 Full feedback report available at: ${this.feedbackPath}`);
      }
      
      return runtimeSuccess && frontendSuccess && analysisSuccess;
      
    } catch (error) {
      console.error('💥 Monitoring error:', error.message);
      return false;
    }
  }
}

// Start the monitor
const monitor = new DevMonitor();
monitor.start().then(success => {
  process.exit(success ? 0 : 1);
}); 