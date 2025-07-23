console.log('Starting test...');
console.error('This is an error message');
console.warn('This is a warning message');

setTimeout(() => {
  console.log('Delayed message');
}, 1000);

process.on('exit', () => {
  console.log('Exiting...');
}); 