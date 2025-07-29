# Cursor AI Integration Guide

This guide explains how Cursor AI can integrate with the feedback loop and auto-debugging framework to get accurate information about the development environment status.

## 🎯 Purpose

The framework prevents false positives by providing structured, machine-readable feedback about:
- Runtime compilation and execution status
- Frontend accessibility and error state
- Network connectivity and API health
- Overall system health

## 📁 Key Files for Cursor

### Runtime Status
```javascript
// Read runtime status
const runtimeLog = JSON.parse(fs.readFileSync('.cursor/runtime-log.json', 'utf8'));
const isRuntimeHealthy = runtimeLog.summary.isHealthy;
const hasCompiled = runtimeLog.summary.hasCompiled;
const errorCount = runtimeLog.summary.errors;
```

### Frontend Status
```javascript
// Read frontend status
const frontendLog = JSON.parse(fs.readFileSync('.cursor/frontend-log.json', 'utf8'));
const isFrontendHealthy = frontendLog.summary.isHealthy;
const consoleErrors = frontendLog.summary.consoleErrors;
const networkErrors = frontendLog.summary.networkErrors;
```

### Human-Readable Report
```javascript
// Read comprehensive report
const feedbackReport = fs.readFileSync('.cursor/feedback.md', 'utf8');
// Contains detailed analysis and recommendations
```

## 🔍 Success/Failure Detection

### Success Criteria
- ✅ Runtime: `isHealthy: true` AND `hasCompiled: true`
- ✅ Frontend: `isHealthy: true` AND `isAccessible: true`
- ✅ Overall: Both runtime and frontend healthy

### Failure Indicators
- ❌ Runtime: `errors > 0` OR `hasCompiled: false`
- ❌ Frontend: `consoleErrors > 0` OR `networkErrors > 0` OR `isAccessible: false`
- ❌ Overall: Any component unhealthy

## 🚀 Integration Examples

### Basic Health Check
```javascript
function checkDevelopmentHealth() {
  try {
    const runtimeLog = JSON.parse(fs.readFileSync('.cursor/runtime-log.json', 'utf8'));
    const frontendLog = JSON.parse(fs.readFileSync('.cursor/frontend-log.json', 'utf8'));
    
    const isHealthy = runtimeLog.summary.isHealthy && frontendLog.summary.isHealthy;
    
    if (isHealthy) {
      return { status: 'SUCCESS', message: 'Development environment is healthy' };
    } else {
      return { 
        status: 'FAILURE', 
        message: 'Issues detected - check .cursor/feedback.md for details',
        runtimeIssues: runtimeLog.summary.errors,
        frontendIssues: frontendLog.summary.totalErrors
      };
    }
  } catch (error) {
    return { status: 'ERROR', message: 'Could not read monitoring logs' };
  }
}
```

### Detailed Analysis
```javascript
function analyzeDevelopmentStatus() {
  const runtimeLog = JSON.parse(fs.readFileSync('.cursor/runtime-log.json', 'utf8'));
  const frontendLog = JSON.parse(fs.readFileSync('.cursor/frontend-log.json', 'utf8'));
  
  const analysis = {
    overall: 'UNKNOWN',
    runtime: {
      status: runtimeLog.summary.isHealthy ? 'HEALTHY' : 'UNHEALTHY',
      errors: runtimeLog.summary.errors,
      compiled: runtimeLog.summary.hasCompiled
    },
    frontend: {
      status: frontendLog.summary.isHealthy ? 'HEALTHY' : 'UNHEALTHY',
      consoleErrors: frontendLog.summary.consoleErrors,
      networkErrors: frontendLog.summary.networkErrors,
      accessible: frontendLog.summary.isAccessible
    }
  };
  
  // Determine overall status
  if (analysis.runtime.status === 'HEALTHY' && analysis.frontend.status === 'HEALTHY') {
    analysis.overall = 'SUCCESS';
  } else if (analysis.runtime.status === 'UNHEALTHY' && analysis.frontend.status === 'UNHEALTHY') {
    analysis.overall = 'CRITICAL_FAILURE';
  } else if (analysis.runtime.status === 'UNHEALTHY') {
    analysis.overall = 'RUNTIME_FAILURE';
  } else {
    analysis.overall = 'FRONTEND_FAILURE';
  }
  
  return analysis;
}
```

### Error Reporting
```javascript
function getErrorDetails() {
  const runtimeLog = JSON.parse(fs.readFileSync('.cursor/runtime-log.json', 'utf8'));
  const frontendLog = JSON.parse(fs.readFileSync('.cursor/frontend-log.json', 'utf8'));
  
  const errors = [];
  
  // Runtime errors
  if (runtimeLog.summary.errors > 0) {
    errors.push(`Runtime: ${runtimeLog.summary.errors} error(s)`);
  }
  if (!runtimeLog.summary.hasCompiled) {
    errors.push('Runtime: Compilation failed');
  }
  
  // Frontend errors
  if (frontendLog.summary.consoleErrors > 0) {
    errors.push(`Frontend: ${frontendLog.summary.consoleErrors} console error(s)`);
  }
  if (frontendLog.summary.networkErrors > 0) {
    errors.push(`Frontend: ${frontendLog.summary.networkErrors} network error(s)`);
  }
  if (!frontendLog.summary.isAccessible) {
    errors.push('Frontend: Not accessible');
  }
  
  return errors;
}
```

## 📋 Best Practices for Cursor

### 1. Always Check Before Reporting Success
```javascript
// ❌ Don't assume success
console.log("Great! It's all done!");

// ✅ Check actual status
const health = checkDevelopmentHealth();
if (health.status === 'SUCCESS') {
  console.log("Great! It's all done!");
} else {
  console.log(`Issues detected: ${health.message}`);
}
```

### 2. Use Structured Data
```javascript
// Prefer structured logs over parsing console output
const runtimeLog = JSON.parse(fs.readFileSync('.cursor/runtime-log.json', 'utf8'));
// Instead of trying to parse "npm run dev" output
```

### 3. Provide Actionable Feedback
```javascript
const analysis = analyzeDevelopmentStatus();
if (analysis.overall !== 'SUCCESS') {
  const errors = getErrorDetails();
  console.log('Issues found:');
  errors.forEach(error => console.log(`- ${error}`));
  console.log('Check .cursor/feedback.md for detailed recommendations');
}
```

### 4. Monitor Continuously
```javascript
// For long-running operations, check periodically
setInterval(() => {
  const health = checkDevelopmentHealth();
  if (health.status === 'FAILURE') {
    console.log('Development environment issues detected');
    // Take appropriate action
  }
}, 30000); // Check every 30 seconds
```

## 🔧 Troubleshooting

### Common Issues

1. **Log files don't exist**
   - Run `npm run monitor:full` to generate logs
   - Check if monitoring scripts are working

2. **Stale log data**
   - Logs are timestamped - check `timestamp` field
   - Re-run monitoring if data is old

3. **Permission errors**
   - Ensure `.cursor/` directory exists and is writable
   - Check file permissions

### Debug Mode
```javascript
// Enable detailed logging
const DEBUG = true;

function checkDevelopmentHealth() {
  if (DEBUG) {
    console.log('Checking development health...');
  }
  
  // ... rest of function
  
  if (DEBUG) {
    console.log('Health check result:', result);
  }
  
  return result;
}
```

## 📊 Metrics and Monitoring

### Key Metrics to Track
- Runtime compilation success rate
- Frontend accessibility rate
- Error frequency by type
- Response times
- Overall system uptime

### Alerting Thresholds
- Runtime errors > 0
- Frontend errors > 0
- Compilation failures
- Network timeouts
- Accessibility failures

## 🚀 Future Enhancements

### Planned Cursor Integration Features
- Real-time status updates
- Automatic error reporting
- Performance metrics
- Historical trend analysis
- Custom alerting rules

---

*This integration guide ensures Cursor AI has accurate, structured information about the development environment status, preventing false positives and enabling better decision-making.* 