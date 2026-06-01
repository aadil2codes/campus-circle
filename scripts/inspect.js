const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'AICTE-APPROVED-16-17.csv');
const data = fs.readFileSync(filePath, 'utf8');
const lines = data.split(/\r?\n/);

console.log("Total lines:", lines.length);
console.log("First 15 lines:");
for (let i = 0; i < 15; i++) {
  console.log(`Line ${i + 1}: [${lines[i]}]`);
}
