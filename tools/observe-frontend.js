#!/usr/bin/env node

import puppeteer from 'puppeteer';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

class FrontendObserver {
  constructor() {
    this.logDir = '.cursor';
    this.frontendLogPath = join(this.logDir, 'frontend-log.json');
    this.runtimeLogPath = join(this.logDir, 'runtime-log.json');
    this.ensureLogDirectory();
    this.startTime = new Date();
    this.logs = [];
    this.status = 'starting';
    this.url = 'http://localhost:5173';
    this.maxWaitTime = 30000; // 30 seconds
    this.checkInterval = 2000; // 2 seconds
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
      url: this.url,
      logs: this.logs,
      summary: this.generateSummary()
    };

    writeFileSync(this.frontendLogPath, JSON.stringify(logData, null, 2));
    console.log(`📊 Frontend log written to ${this.frontendLogPath}`);
  }

  generateSummary() {
    const consoleErrors = this.logs.filter(log => 
      log.type === 'console' && log.level === 'error'
    );
    
    const pageErrors = this.logs.filter(log => 
      log.type === 'page-error'
    );
    
    const networkErrors = this.logs.filter(log => 
      log.type === 'network' && log.level === 'error'
    );

    const totalErrors = consoleErrors.length + pageErrors.length + networkErrors.length;
    
    // Only consider fatal errors (page errors or critical network errors)
    const fatalErrors = pageErrors.length + networkErrors.filter(log => 
      log.message.includes('500') || 
      log.message.includes('502') || 
      log.message.includes('503') ||
      log.message.includes('504') ||
      log.message.includes('failed to load resource')
    ).length;
    
    const hasFatalErrors = fatalErrors > 0;
    
    // Improved accessibility detection
    const isAccessible = this.logs.some(log => 
      (log.type === 'page-load' && log.level === 'success') ||
      (log.type === 'console' && log.message.includes('VITE')) ||
      (log.type === 'console' && log.message.includes('ready'))
    );

    return {
      totalLogs: this.logs.length,
      consoleErrors: consoleErrors.length,
      pageErrors: pageErrors.length,
      networkErrors: networkErrors.length,
      totalErrors,
      hasFatalErrors,
      isAccessible,
      isHealthy: !hasFatalErrors && isAccessible
    };
  }

  addLog(type, level, message, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      level,
      message: message.trim(),
      details
    };
    
    this.logs.push(logEntry);
    this.writeLog();
  }

  async waitForBackend() {
    console.log('⏳ Waiting for backend to start...');
    
    let attempts = 0;
    const maxAttempts = this.maxWaitTime / this.checkInterval;
    
    while (attempts < maxAttempts) {
      try {
        // Check if runtime log exists and indicates success
        if (existsSync(this.runtimeLogPath)) {
          const runtimeData = JSON.parse(readFileSync(this.runtimeLogPath, 'utf8'));
          if (runtimeData.summary && runtimeData.summary.hasCompiled) {
            console.log('✅ Backend appears to be ready');
            
            // Try to extract the correct URL from runtime logs
            if (runtimeData.logs) {
              for (const log of runtimeData.logs) {
                if (log.message && log.message.includes('Local:')) {
                  const match = log.message.match(/Local:\s*(http:\/\/localhost:\d+)/);
                  if (match) {
                    this.url = match[1];
                    console.log(`🌐 Detected dev server URL: ${this.url}`);
                    return true;
                  }
                }
              }
            }
            
            // If we can't extract from logs, try common ports
            console.log('🌐 Trying to detect dev server port...');
            for (const port of [5173, 5174, 5175, 5176, 5177, 5178, 5179, 5180, 5181, 5182]) {
              try {
                const testUrl = `http://localhost:${port}`;
                const response = await fetch(testUrl);
                if (response.ok) {
                  this.url = testUrl;
                  console.log(`✅ Backend is accessible at ${this.url}`);
                  return true;
                }
              } catch (error) {
                // Expected during startup
              }
            }
            
            return true;
          }
        }
        
        // Also try to connect to common dev server ports
        for (const port of [5173, 5174, 5175, 5176, 5177, 5178, 5179, 5180, 5181, 5182]) {
          try {
            const testUrl = `http://localhost:${port}`;
            const response = await fetch(testUrl);
            if (response.ok) {
              this.url = testUrl;
              console.log(`✅ Backend is accessible at ${this.url}`);
              return true;
            }
          } catch (error) {
            // Expected during startup
          }
        }
      } catch (error) {
        // Expected during startup
      }
      
      await new Promise(resolve => setTimeout(resolve, this.checkInterval));
      attempts++;
    }
    
    console.log('⚠️ Backend not ready after timeout, proceeding anyway...');
    return false;
  }

  async start() {
    console.log('🌐 Starting frontend monitoring...');
    console.log(`📁 Logs will be written to ${this.frontendLogPath}`);
    
    // Wait for backend to be ready
    await this.waitForBackend();
    
    try {
      // Launch browser with new headless mode and better error handling
      console.log('🌐 Launching browser...');
      const browser = await puppeteer.launch({
        headless: "new", // Updated to new headless mode
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        // Add executable path if Chrome is installed via puppeteer
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
      });
      
      const page = await browser.newPage();
      
      // Set up console log monitoring
      page.on('console', (msg) => {
        const level = msg.type();
        const message = msg.text();
        this.addLog('console', level, message, {
          location: msg.location(),
          args: msg.args().map(arg => arg.toString())
        });
      });
      
      // Set up page error monitoring
      page.on('pageerror', (error) => {
        this.addLog('page-error', 'error', error.message, {
          stack: error.stack
        });
      });
      
      // Set up network monitoring
      page.on('response', (response) => {
        const status = response.status();
        const url = response.url();
        
        if (status >= 400) {
          this.addLog('network', 'error', `HTTP ${status}: ${url}`, {
            status,
            url,
            headers: response.headers()
          });
        }
      });
      
      // Set up request monitoring
      page.on('requestfailed', (request) => {
        this.addLog('network', 'error', `Request failed: ${request.url()}`, {
          url: request.url(),
          failure: request.failure()
        });
      });
      
      // Navigate to the application
      console.log(`🌐 Navigating to ${this.url}...`);
      
      try {
        const response = await page.goto(this.url, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });
        
        if (response && response.ok()) {
          this.addLog('page-load', 'success', 'Page successfully loaded');
          this.status = 'success';
        } else {
          this.addLog('page-load', 'error', `Page load failed with status ${response ? response.status() : 'unknown'}`);
          this.status = 'error';
        }
      } catch (error) {
        this.addLog('page-load', 'error', `Page load error: ${error.message}`);
        this.status = 'error';
      }
      
      // Wait for additional time to capture any delayed errors
      console.log('⏳ Monitoring for 10 seconds...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Take a screenshot for debugging
      try {
        const screenshotPath = join(this.logDir, 'frontend-screenshot.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`📸 Screenshot saved to ${screenshotPath}`);
      } catch (error) {
        console.log('⚠️ Could not take screenshot:', error.message);
      }
      
      await browser.close();
      
    } catch (error) {
      this.addLog('observer', 'error', `Observer error: ${error.message}`, {
        stack: error.stack
      });
      this.status = 'error';
      
      // If it's a Chrome installation issue, provide helpful guidance
      if (error.message.includes('Could not find Chrome')) {
        console.log('\n💡 Chrome installation issue detected. Try running:');
        console.log('   npx puppeteer browsers install chrome');
        console.log('   or');
        console.log('   npm install puppeteer');
      }
    }
    
    // Write final log
    this.writeLog();
    
    const summary = this.generateSummary();
    console.log('📊 Frontend monitoring complete:');
    console.log(`   - Total logs: ${summary.totalLogs}`);
    console.log(`   - Console errors: ${summary.consoleErrors}`);
    console.log(`   - Page errors: ${summary.pageErrors}`);
    console.log(`   - Network errors: ${summary.networkErrors}`);
    console.log(`   - Is healthy: ${summary.isHealthy ? '✅' : '❌'}`);
    
    process.exit(summary.isHealthy ? 0 : 1);
  }
}

// Start the observer
const observer = new FrontendObserver();
observer.start(); 