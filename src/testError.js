process.stdout.write('Starting error test...\n');

// Test synchronous error
try {
  throw new Error('Test synchronous error');
} catch (error) {
  process.stderr.write(`Caught sync error: ${error.message}\n`);
}

// Test asynchronous error
new Promise((resolve, reject) => {
  reject(new Error('Test async error'));
}).catch(error => {
  process.stderr.write(`Caught async error: ${error.message}\n`);
});

// Test unhandled rejection
new Promise((resolve, reject) => {
  setTimeout(() => {
    reject(new Error('Test unhandled rejection'));
  }, 100);
});

// Test uncaught exception
setTimeout(() => {
  throw new Error('Test uncaught exception');
}, 200);

process.on('unhandledRejection', (reason, promise) => {
  process.stderr.write(`Unhandled Rejection: ${reason}\n`);
});

process.on('uncaughtException', (error) => {
  process.stderr.write(`Uncaught Exception: ${error}\n`);
});

// Keep the process alive
setTimeout(() => {
  process.stdout.write('Test completed\n');
  process.exit(0);
}, 1000); 