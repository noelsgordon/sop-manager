#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

class EnhancedMonitor {
  constructor() {
    this.logDir = '.cursor';
    this.runtimeLogPath = join(this.logDir, 'runtime-log.json');
    this.frontendLogPath = join(this.logDir, 'frontend-log.json');
    this.terminalLogPath = join(this.logDir, 'terminal-log.json');
    this.feedbackPath = join(this.logDir, 'feedback.md');
    this.devProcess = null;
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

  async startDevServer() {
    console.log('🚀 Starting development server...');
    
    return new Promise((resolve) => {
      this.devProcess = spawn('npm', ['run', 'dev'], {
        stdio: 'pipe',
        shell: true
      });

      let hasStarted = false;

      this.devProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`[DEV] ${output.trim()}`);
        
        // Check if dev server is ready
        if (output.includes('ready') || output.includes('Local:')) {
          if (!hasStarted) {
            console.log('✅ Development server is ready');
            hasStarted = true;
            resolve(true);
          }
        }
      });

      this.devProcess.stderr.on('data', (data) => {
        const output = data.toString();
        console.log(`[DEV-ERR] ${output.trim()}`);
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!hasStarted) {
          console.log('⚠️ Dev server startup timeout');
          resolve(false);
        }
      }, 30000);
    });
  }

  async runTerminalMonitoring() {
    console.log('💻 Starting terminal monitoring...');
    
    return new Promise((resolve) => {
      const terminalProcess = spawn('node', ['tools/terminal-monitor.js'], {
        stdio: 'inherit',
        shell: true
      });

      terminalProcess.on('exit', (code) => {
        console.log(`💻 Terminal monitoring completed with code ${code}`);
        // For terminal monitoring, we expect it to detect errors (code 1 is success for testing)
        resolve(code === 1);
      });

      terminalProcess.on('error', (error) => {
        console.error('💻 Terminal monitoring error:', error.message);
        resolve(false);
      });
    });
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

  async cleanup() {
    if (this.devProcess) {
      console.log('🧹 Cleaning up dev server...');
      this.devProcess.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  async start() {
    console.log('🎯 Starting enhanced development monitoring...');
    console.log('📁 Logs will be written to .cursor/ directory');
    console.log('💡 This enhanced version includes terminal monitoring to catch PowerShell and command errors');
    
    try {
      // Step 0: Start development server first
      console.log('\n🔍 Step 0: Starting Development Server');
      const devServerStarted = await this.startDevServer();
      
      if (!devServerStarted) {
        console.log('❌ Failed to start development server, stopping');
        return false;
      }
      
      // Step 1: Start terminal monitoring (NEW!)
      console.log('\n🔍 Step 1: Terminal Monitoring');
      const terminalSuccess = await this.runTerminalMonitoring();
      
      if (terminalSuccess) {
        console.log('✅ Terminal monitoring successfully detected deliberate errors - this is the expected behavior');
      } else {
        console.log('❌ Terminal monitoring failed to detect deliberate errors - this indicates a problem');
      }
      
      // Step 2: Start runtime monitoring
      console.log('\n🔍 Step 2: Runtime Monitoring');
      const runtimeSuccess = await this.runRuntimeMonitoring();
      
      if (!runtimeSuccess) {
        console.log('❌ Runtime monitoring failed, stopping');
        return false;
      }
      
      // Step 3: Start frontend monitoring
      console.log('\n🔍 Step 3: Frontend Monitoring');
      const frontendSuccess = await this.runFrontendMonitoring();
      
      if (!frontendSuccess) {
        console.log('❌ Frontend monitoring failed');
      }
      
      // Step 4: Run feedback analysis
      console.log('\n🔍 Step 4: Feedback Analysis');
      const analysisSuccess = await this.runFeedbackAnalysis();
      
      // Final summary
      console.log('\n📊 Enhanced Monitoring Summary:');
      console.log(`   Terminal: ${terminalSuccess ? '✅' : '❌'} (NEW - catches PowerShell errors)`);
      console.log(`   Runtime: ${runtimeSuccess ? '✅' : '❌'}`);
      console.log(`   Frontend: ${frontendSuccess ? '✅' : '❌'}`);
      console.log(`   Analysis: ${analysisSuccess ? '✅' : '❌'}`);
      
      if (existsSync(this.feedbackPath)) {
        console.log(`\n📝 Full feedback report available at: ${this.feedbackPath}`);
      }
      
      // Enhanced success criteria - terminal should detect errors, others should be healthy
      const overallSuccess = terminalSuccess && runtimeSuccess && frontendSuccess && analysisSuccess;
      
      if (overallSuccess) {
        console.log('\n🎉 Enhanced monitoring working correctly! Terminal detected deliberate errors as expected.');
      } else {
        console.log('\n⚠️ Some monitoring components failed. Check the feedback report for details.');
      }
      
      return overallSuccess;
      
    } catch (error) {
      console.error('💥 Enhanced monitoring error:', error.message);
      return false;
    } finally {
      await this.cleanup();
    }
  }
}

// Start the enhanced monitor
const monitor = new EnhancedMonitor();
monitor.start().then(success => {
  process.exit(success ? 0 : 1);
}); 