#!/usr/bin/env node

import { spawn } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

class ErrorScenarioTester {
  constructor() {
    this.logDir = '.cursor';
    this.testLogPath = join(this.logDir, 'error-test-log.json');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  async testNpmError() {
    console.log('🧪 Testing npm error detection...');
    
    return new Promise((resolve) => {
      const process = spawn('npm', ['run', 'devv'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('exit', (code) => {
        console.log(`📊 NPM Error Test Results:`);
        console.log(`   Exit Code: ${code}`);
        console.log(`   STDOUT: ${stdout.trim()}`);
        console.log(`   STDERR: ${stderr.trim()}`);
        
        const hasError = code !== 0 || stderr.includes('error') || stderr.includes('Missing script');
        console.log(`   Has Error: ${hasError ? '❌ Yes' : '✅ No'}`);
        
        resolve(hasError);
      });
    });
  }

  async testPowerShellError() {
    console.log('🧪 Testing PowerShell error detection...');
    
    return new Promise((resolve) => {
      const process = spawn('powershell', ['-Command', 'q'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('exit', (code) => {
        console.log(`📊 PowerShell Error Test Results:`);
        console.log(`   Exit Code: ${code}`);
        console.log(`   STDOUT: ${stdout.trim()}`);
        console.log(`   STDERR: ${stderr.trim()}`);
        
        const hasError = code !== 0 || stderr.includes('not recognized') || stderr.includes('cmdlet');
        console.log(`   Has Error: ${hasError ? '❌ Yes' : '✅ No'}`);
        
        resolve(hasError);
      });
    });
  }

  async testCommandNotFound() {
    console.log('🧪 Testing command not found detection...');
    
    return new Promise((resolve) => {
      const process = spawn('nonexistentcommand', [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('exit', (code) => {
        console.log(`📊 Command Not Found Test Results:`);
        console.log(`   Exit Code: ${code}`);
        console.log(`   STDOUT: ${stdout.trim()}`);
        console.log(`   STDERR: ${stderr.trim()}`);
        
        const hasError = code !== 0 || stderr.includes('not recognized') || stderr.includes('not found');
        console.log(`   Has Error: ${hasError ? '❌ Yes' : '✅ No'}`);
        
        resolve(hasError);
      });
    });
  }

  async runAllTests() {
    console.log('🚀 Starting error scenario tests...\n');
    
    const tests = [
      { name: 'NPM Error', fn: () => this.testNpmError() },
      { name: 'PowerShell Error', fn: () => this.testPowerShellError() },
      { name: 'Command Not Found', fn: () => this.testCommandNotFound() }
    ];
    
    let passed = 0;
    let total = tests.length;
    
    for (const test of tests) {
      console.log(`\n--- ${test.name} ---`);
      try {
        const result = await test.fn();
        if (result) {
          passed++;
          console.log(`✅ ${test.name} correctly detected error`);
        } else {
          console.log(`❌ ${test.name} failed to detect error`);
        }
      } catch (error) {
        console.log(`❌ ${test.name} test failed:`, error.message);
      }
    }
    
    console.log('\n📊 Error Detection Summary:');
    console.log(`   Tests Passed: ${passed}/${total}`);
    console.log(`   Tests Failed: ${total - passed}/${total}`);
    
    if (passed === total) {
      console.log('🎉 All error detection tests passed!');
    } else {
      console.log('⚠️ Some error detection tests failed.');
    }
    
    return passed === total;
  }
}

// Run the error scenario tests
const tester = new ErrorScenarioTester();
tester.runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}); 