# Cursor Feedback Loop & Auto-Debugging Framework

This framework enables Cursor to self-diagnose and verify success/failure of the development process by capturing runtime logs, frontend console output, and structured feedback. It prevents false positives like "great, it's all done!" when actual failure occurred.

## 🎯 Overview

The framework consists of three main components:

1. **Runtime Monitoring** (`dev-watch.js`) - Wraps `npm run dev` and captures stdout/stderr
2. **Frontend Monitoring** (`observe-frontend.js`) - Uses Puppeteer to monitor browser console and page errors
3. **Feedback Analysis** (`feedback-analyzer.js`) - Analyzes logs and generates comprehensive reports

## 📁 Directory Structure

```
tools/
├── dev-watch.js          # Runtime monitoring script
├── observe-frontend.js   # Frontend monitoring script
├── feedback-analyzer.js  # Feedback analysis script
├── monitor-dev.js        # Combined monitoring orchestrator
└── README.md            # This file

.cursor/                  # Generated logs and reports
├── runtime-log.json     # Runtime monitoring output
├── frontend-log.json    # Frontend monitoring output
├── feedback.md          # Human-readable feedback report
└── frontend-screenshot.png # Screenshot for debugging
```

## 🚀 Quick Start

### Option 1: Full Monitoring (Recommended)
```bash
npm run monitor:full
```

This runs the complete monitoring suite:
1. Starts runtime monitoring
2. Waits for backend to be ready
3. Runs frontend monitoring
4. Generates comprehensive feedback report

### Option 2: Individual Components
```bash
# Runtime monitoring only
npm run monitor:dev

# Frontend monitoring only (requires backend to be running)
npm run monitor:frontend

# Analysis only (requires logs to exist)
npm run monitor:analyze
```

## 📊 Output Files

### Runtime Log (`.cursor/runtime-log.json`)
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "status": "success",
  "startTime": "2024-01-01T11:59:30.000Z",
  "duration": 30000,
  "logs": [...],
  "summary": {
    "totalLogs": 15,
    "errors": 0,
    "successes": 3,
    "isHealthy": true,
    "hasCompiled": true
  }
}
```

### Frontend Log (`.cursor/frontend-log.json`)
```json
{
  "timestamp": "2024-01-01T12:00:30.000Z",
  "status": "success",
  "startTime": "2024-01-01T12:00:00.000Z",
  "duration": 30000,
  "url": "http://localhost:5173",
  "logs": [...],
  "summary": {
    "totalLogs": 8,
    "consoleErrors": 0,
    "pageErrors": 0,
    "networkErrors": 0,
    "totalErrors": 0,
    "hasFatalErrors": false,
    "isAccessible": true,
    "isHealthy": true
  }
}
```

### Feedback Report (`.cursor/feedback.md`)
Markdown report with:
- Overall status (SUCCESS, CRITICAL_FAILURE, RUNTIME_FAILURE, FRONTEND_FAILURE)
- Detailed runtime analysis
- Detailed frontend analysis
- Specific recommendations
- Next steps

## 🔍 Success Criteria

### Runtime Success
- ✅ Detects "compiled", "ready", or "success" messages
- ✅ No error messages in stderr
- ✅ Process exits with code 0

### Frontend Success
- ✅ Page loads successfully (HTTP 200)
- ✅ No console errors
- ✅ No page errors (JavaScript exceptions)
- ✅ No network errors (4xx/5xx responses)
- ✅ Application is accessible

### Overall Success
- ✅ Runtime is healthy AND frontend is healthy

## 🚨 Failure Detection

### Runtime Failures
- ❌ Compilation errors
- ❌ Runtime exceptions
- ❌ Process crashes
- ❌ Missing dependencies
- ❌ Configuration errors

### Frontend Failures
- ❌ Console errors
- ❌ JavaScript exceptions
- ❌ Network request failures
- ❌ Page load failures
- ❌ CORS errors
- ❌ API endpoint errors

## 🛠️ Configuration

### Customizing URLs
Edit `observe-frontend.js` to change the target URL:
```javascript
this.url = 'http://localhost:3000'; // Change port
```

### Customizing Timeouts
Edit timeouts in the monitoring scripts:
```javascript
this.maxWaitTime = 30000; // 30 seconds
this.checkInterval = 2000; // 2 seconds
```

### Customizing Success Patterns
Edit success detection patterns in `dev-watch.js`:
```javascript
if (lowerMessage.includes('compiled') || lowerMessage.includes('ready')) {
  this.status = 'success';
}
```

## 🔧 Troubleshooting

### Common Issues

1. **Puppeteer not found**
   ```bash
   npm install puppeteer
   ```

2. **Port already in use**
   - Change the URL in `observe-frontend.js`
   - Or kill existing processes on port 5173

3. **Timeout waiting for backend**
   - Increase timeout in `monitor-dev.js`
   - Check if dev server is actually running

4. **Permission denied**
   - Ensure scripts are executable: `chmod +x tools/*.js`
   - Run with appropriate permissions

### Debug Mode

Add debug logging by modifying the scripts:
```javascript
console.log('DEBUG:', message);
```

## 🔄 Integration with Cursor

### For Cursor AI
The framework provides structured feedback that Cursor can read:

1. **Check runtime status**: Read `.cursor/runtime-log.json`
2. **Check frontend status**: Read `.cursor/frontend-log.json`
3. **Get human-readable report**: Read `.cursor/feedback.md`

### Example Cursor Integration
```javascript
// In Cursor AI context
const runtimeLog = JSON.parse(fs.readFileSync('.cursor/runtime-log.json'));
const frontendLog = JSON.parse(fs.readFileSync('.cursor/frontend-log.json'));

if (runtimeLog.summary.isHealthy && frontendLog.summary.isHealthy) {
  console.log('✅ Development environment is healthy');
} else {
  console.log('❌ Issues detected - check .cursor/feedback.md');
}
```

## 🚀 Future Enhancements

### Planned Features
- [ ] Multi-page monitoring
- [ ] Performance metrics
- [ ] Memory usage tracking
- [ ] Network latency monitoring
- [ ] Custom success/failure patterns
- [ ] Integration with CI/CD pipelines
- [ ] Slack/Discord notifications
- [ ] Historical trend analysis

### Extensibility
The framework is designed to be modular and extensible:

- Add new monitoring scripts to `tools/`
- Extend log formats in `.cursor/`
- Customize analysis logic in `feedback-analyzer.js`
- Add new npm scripts to `package.json`

## 📝 License

This framework is part of the SOP Manager project and follows the same MIT license.

## 🤝 Contributing

To contribute to the monitoring framework:

1. Create feature branch
2. Add tests for new functionality
3. Update documentation
4. Submit pull request

---

*This framework prevents false positives and ensures Cursor has accurate information about the development environment status.* 