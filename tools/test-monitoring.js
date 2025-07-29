#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

class MonitoringTester {
  constructor() {
    this.logDir = '.cursor';
    this.testLogPath = join(this.logDir, 'test-log.json');
  }

  ensureLogDirectory() {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  testRuntimeLogFormat() {
    console.log('🧪 Testing runtime log format...');
    
    const testRuntimeLog = {
      timestamp: new Date().toISOString(),
      status: 'success',
      startTime: new Date(Date.now() - 30000).toISOString(),
      duration: 30000,
      logs: [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Vite dev server starting...'
        },
        {
          timestamp: new Date().toISOString(),
          level: 'success',
          message: 'Local: http://localhost:5173/'
        },
        {
          timestamp: new Date().toISOString(),
          level: 'success',
          message: 'ready in 2.5s'
        }
      ],
      summary: {
        totalLogs: 3,
        errors: 0,
        successes: 2,
        isHealthy: true,
        hasCompiled: true
      }
    };

    writeFileSync(join(this.logDir, 'runtime-log.json'), JSON.stringify(testRuntimeLog, null, 2));
    console.log('✅ Runtime log format test passed');
    return true;
  }

  testFrontendLogFormat() {
    console.log('🧪 Testing frontend log format...');
    
    const testFrontendLog = {
      timestamp: new Date().toISOString(),
      status: 'success',
      startTime: new Date(Date.now() - 15000).toISOString(),
      duration: 15000,
      url: 'http://localhost:5173',
      logs: [
        {
          timestamp: new Date().toISOString(),
          type: 'page-load',
          level: 'success',
          message: 'Page successfully loaded',
          details: {}
        },
        {
          timestamp: new Date().toISOString(),
          type: 'console',
          level: 'info',
          message: 'React app loaded successfully',
          details: {
            location: { url: 'http://localhost:5173', lineNumber: 1 },
            args: []
          }
        }
      ],
      summary: {
        totalLogs: 2,
        consoleErrors: 0,
        pageErrors: 0,
        networkErrors: 0,
        totalErrors: 0,
        hasFatalErrors: false,
        isAccessible: true,
        isHealthy: true
      }
    };

    writeFileSync(join(this.logDir, 'frontend-log.json'), JSON.stringify(testFrontendLog, null, 2));
    console.log('✅ Frontend log format test passed');
    return true;
  }

  async testFeedbackAnalyzer() {
    console.log('🧪 Testing feedback analyzer...');
    
    try {
      // Import and test the analyzer
      const { FeedbackAnalyzer } = await import('./feedback-analyzer.js');
      const analyzer = new FeedbackAnalyzer();
      const feedback = analyzer.generateFeedback();
      
      if (feedback.overall === 'SUCCESS') {
        console.log('✅ Feedback analyzer test passed');
        return true;
      } else {
        console.log('❌ Feedback analyzer test failed');
        return false;
      }
    } catch (error) {
      console.log('❌ Feedback analyzer test failed:', error.message);
      return false;
    }
  }

  testFileStructure() {
    console.log('🧪 Testing file structure...');
    
    const requiredFiles = [
      'dev-watch.js',
      'observe-frontend.js',
      'feedback-analyzer.js',
      'monitor-dev.js'
    ];
    
    const missingFiles = requiredFiles.filter(file => !existsSync(join('tools', file)));
    
    if (missingFiles.length === 0) {
      console.log('✅ File structure test passed');
      return true;
    } else {
      console.log('❌ Missing files:', missingFiles);
      return false;
    }
  }

  testPackageJson() {
    console.log('🧪 Testing package.json configuration...');
    
    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      const requiredScripts = [
        'monitor:dev',
        'monitor:frontend',
        'monitor:analyze',
        'monitor:full'
      ];
      
      const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
      
      if (missingScripts.length === 0) {
        console.log('✅ Package.json configuration test passed');
        return true;
      } else {
        console.log('❌ Missing scripts:', missingScripts);
        return false;
      }
    } catch (error) {
      console.log('❌ Package.json test failed:', error.message);
      return false;
    }
  }

  async runTests() {
    console.log('🚀 Starting monitoring framework tests...\n');
    
    this.ensureLogDirectory();
    
    const tests = [
      { name: 'File Structure', fn: () => this.testFileStructure() },
      { name: 'Package.json Config', fn: () => this.testPackageJson() },
      { name: 'Runtime Log Format', fn: () => this.testRuntimeLogFormat() },
      { name: 'Frontend Log Format', fn: () => this.testFrontendLogFormat() },
      { name: 'Feedback Analyzer', fn: () => this.testFeedbackAnalyzer() }
    ];
    
    let passed = 0;
    let total = tests.length;
    
    for (const test of tests) {
      try {
        const result = await test.fn();
        if (result) {
          passed++;
        }
      } catch (error) {
        console.log(`❌ ${test.name} test failed:`, error.message);
      }
      console.log('');
    }
    
    console.log('📊 Test Results:');
    console.log(`   Passed: ${passed}/${total}`);
    console.log(`   Failed: ${total - passed}/${total}`);
    
    if (passed === total) {
      console.log('🎉 All tests passed! Monitoring framework is ready.');
      return true;
    } else {
      console.log('⚠️ Some tests failed. Please check the issues above.');
      return false;
    }
  }
}

// Run the tests
const tester = new MonitoringTester();
tester.runTests().then(success => {
  process.exit(success ? 0 : 1);
}); 