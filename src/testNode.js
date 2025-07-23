process.stdout.write('Test 1: process.stdout.write\n');
console.log('Test 2: console.log');

const fs = require('fs');
fs.writeFileSync('test.log', 'Test 3: File write\n');

process.stdout.write('Test 4: Another process.stdout.write\n');
console.error('Test 5: console.error\n'); 