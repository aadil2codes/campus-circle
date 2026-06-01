const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'AICTE-APPROVED-16-17.csv');
const data = fs.readFileSync(filePath, 'utf8');
const lines = data.split(/\r?\n/);

const colleges = [];
let pending = null;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  line = line.replace(/^"|"$/g, '').trim();
  if (!line) continue;
  if (line.includes("List of AICTE approved institutions") || line.includes("Institute Permanent ID") || line.includes("List of AICTE approved")) {
    continue;
  }
  if (/^\d+-\d+/.test(line)) {
    if (pending) { colleges.push(pending); pending = null; }
    const parts = line.split(/\s{2,}/).map(p => p.trim());
    if (parts.length >= 5) {
      colleges.push({ id: parts[0], name: parts[1], state: parts[2], district: parts[3], city: parts[4] });
    } else {
      pending = { id: parts[0], name: parts[1] || "", state: parts[2] || "", district: parts[3] || "", city: parts[4] || "", partsCount: parts.length };
    }
  } else if (pending) {
    const parts = line.split(/\s{2,}/).map(p => p.trim());
    if (pending.partsCount === 2) {
      if (parts.length === 3) {
        pending.state = parts[0]; pending.district = parts[1]; pending.city = parts[2];
        colleges.push(pending); pending = null;
      } else if (parts.length === 2) {
        pending.state = parts[0]; pending.district = parts[1]; pending.partsCount = 4;
      } else if (parts.length === 1) {
        if (parts[0].toLowerCase().includes("pradesh") || parts[0].toLowerCase().includes("bengal") || parts[0].toLowerCase().includes("maharashtra") || parts[0].toLowerCase().includes("karnataka")) {
          pending.state = parts[0]; pending.partsCount = 3;
        } else {
          pending.name += " " + parts[0];
        }
      }
    } else if (pending.partsCount === 3) {
      if (parts.length === 2) {
        pending.district = parts[0]; pending.city = parts[1];
        colleges.push(pending); pending = null;
      } else if (parts.length === 1) {
        pending.district = parts[0]; pending.partsCount = 4;
      }
    } else if (pending.partsCount === 4) {
      pending.city = parts[0];
      colleges.push(pending); pending = null;
    }
  }
}
if (pending) colleges.push(pending);

function search(query) {
  console.log(`\n--- SEARCH RESULTS FOR "${query}" ---`);
  const results = colleges.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
  console.log(`Found ${results.length} matches. Sample of 10:`);
  results.slice(0, 10).forEach((c, idx) => {
    console.log(`${idx + 1}. [${c.id}] Name: ${c.name} | City: ${c.city} | State: ${c.state}`);
  });
}

search("iit");
search("nit");
search("ggv");
search("gurughasidas");
search("guru ghasidas");
search("bombay");
search("delhi");
search("raipur");
