const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'AICTE-APPROVED-16-17.csv');
const data = fs.readFileSync(filePath, 'utf8');
const lines = data.split(/\r?\n/);

console.log("Total raw lines in file:", lines.length);

const colleges = [];
let pending = null;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  
  // Clean surrounding quotes
  line = line.replace(/^"|"$/g, '').trim();
  if (!line) continue;
  
  // Skip headers and page dividers
  if (line.includes("List of AICTE approved institutions") || line.includes("Institute Permanent ID") || line.includes("List of AICTE approved")) {
    continue;
  }
  
  // Check if it's a new record
  if (/^\d+-\d+/.test(line)) {
    // If we have a pending record, save it first
    if (pending) {
      colleges.push(pending);
      pending = null;
    }
    
    // Split by at least 2 spaces
    const parts = line.split(/\s{2,}/).map(p => p.trim());
    if (parts.length >= 5) {
      colleges.push({
        id: parts[0],
        name: parts[1],
        state: parts[2],
        district: parts[3],
        city: parts[4]
      });
    } else {
      // Pending incomplete record
      pending = {
        id: parts[0],
        name: parts[1] || "",
        state: parts[2] || "",
        district: parts[3] || "",
        city: parts[4] || "",
        partsCount: parts.length
      };
    }
  } else {
    // It is a continuation line
    if (pending) {
      const parts = line.split(/\s{2,}/).map(p => p.trim());
      
      // Merge based on what is missing
      if (pending.partsCount === 2) {
        // We only had ID and Name
        if (parts.length === 3) {
          pending.state = parts[0];
          pending.district = parts[1];
          pending.city = parts[2];
          colleges.push(pending);
          pending = null;
        } else if (parts.length === 2) {
          pending.state = parts[0];
          pending.district = parts[1];
          pending.partsCount = 4;
        } else if (parts.length === 1) {
          // Could be name continuation or state
          if (parts[0].toLowerCase().includes("pradesh") || parts[0].toLowerCase().includes("bengal") || parts[0].toLowerCase().includes("maharashtra") || parts[0].toLowerCase().includes("karnataka")) {
            pending.state = parts[0];
            pending.partsCount = 3;
          } else {
            pending.name += " " + parts[0];
          }
        }
      } else if (pending.partsCount === 3) {
        // We have ID, Name, State
        if (parts.length === 2) {
          pending.district = parts[0];
          pending.city = parts[1];
          colleges.push(pending);
          pending = null;
        } else if (parts.length === 1) {
          pending.district = parts[0];
          pending.partsCount = 4;
        }
      } else if (pending.partsCount === 4) {
        // We have ID, Name, State, District. This part is City
        pending.city = parts[0];
        colleges.push(pending);
        pending = null;
      }
    }
  }
}

// Push any remaining pending
if (pending) {
  colleges.push(pending);
}

console.log("Successfully parsed colleges count:", colleges.length);
console.log("\nSample 20 colleges:");
colleges.slice(0, 20).forEach((c, idx) => {
  console.log(`${idx + 1}. [${c.id}] Name: ${c.name} | State: ${c.state} | City: ${c.city}`);
});
