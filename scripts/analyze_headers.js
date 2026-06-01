const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'AICTE-APPROVED-16-17.csv');
const data = fs.readFileSync(filePath, 'utf8');
const lines = data.split(/\r?\n/);

// Find some header lines and their indices
for (let i = 0; i < 200; i++) {
  const line = lines[i];
  if (line.includes("Institute Permanent ID")) {
    console.log(`Line ${i + 1} length: ${line.length}`);
    console.log(`Line ${i + 1} content:\n${line}`);
    
    const idxID = line.indexOf("Institute Permanent ID");
    const idxName = line.indexOf("Institute Name");
    const idxState = line.indexOf("STATE");
    const idxDistrict = line.indexOf("DISTRICT");
    const idxCity = line.indexOf("CITY");
    
    console.log(`Indices - ID: ${idxID}, Name: ${idxName}, State: ${idxState}, District: ${idxDistrict}, City: ${idxCity}`);
  }
}
