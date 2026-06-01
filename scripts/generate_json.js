const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'AICTE-APPROVED-16-17.csv');
const jsonOutputPath = path.join(__dirname, '..', 'src', 'lib', 'colleges.json');

// Helper to convert names to standard premium title-case
function toTitleCase(str) {
  if (!str) return '';
  
  // List of words to keep in lowercase
  const lowerWords = new Set([
    'of', 'and', 'in', 'for', 'the', 'on', 'at', 'by', 'with', 'to', 'a', 'an', 'or', 'nor', 'but', 'so', 'yet'
  ]);

  // List of words/acronyms to keep in uppercase
  const upperWords = new Set([
    'IIT', 'NIT', 'IIIT', 'COEP', 'MIT', 'VIT', 'ICT', 'VJTI', 'DTU', 'BITS', 'BIT', 'RVCE', 
    'PES', 'PSG', 'SSN', 'LPU', 'SRM', 'GGV', 'MCA', 'MBA', 'B.TECH', 'M.TECH', 'B.PHARM', 
    'M.PHARM', 'PH.D', 'B.SC', 'M.SC', 'B.A', 'M.A', 'B.COM', 'M.COM', 'PG', 'UG', 'IIEST', 
    'ISM', 'BHU', 'AMU', 'DU', 'JNU', 'JNTU', 'OU', 'AU', 'CG', 'C.G.', 'IITT', 'KIIT', 'VIIT',
    'SSR', 'HOC', 'JSPM', 'SVKM', 'MAR', 'IGTR', 'RITEE', 'MCA', 'MBA', 'B-SCHOOL'
  ]);

  // Roman numerals
  const romanNumerals = /^(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV)$/i;

  return str
    .toLowerCase()
    .split(/([\s,.\-&()/]+)/) // split keeping separators
    .map((word, index, arr) => {
      if (!word) return '';
      
      // If it's a separator, return as is
      if (/^[\s,.\-&()/]+$/.test(word)) return word;

      const upperWord = word.toUpperCase();
      
      // If it is in the acronyms list, keep it uppercase
      if (upperWords.has(upperWord) || romanNumerals.test(upperWord)) {
        return upperWord;
      }

      // If it's the first or last word of the title, capitalize it
      if (index === 0 || index === arr.length - 1) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }

      // If it's in the lowercase list, keep it lowercase
      if (lowerWords.has(word)) {
        return word;
      }

      // Otherwise capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('');
}

const rawData = fs.readFileSync(csvPath, 'utf8');
const lines = rawData.split(/\r?\n/);

const collegesMap = new Map();

// Standard premium institutes to prepend so they are always found first
const premiumColleges = [
  { name: "IIT Bombay", city: "Mumbai", state: "Maharashtra" },
  { name: "IIT Delhi", city: "New Delhi", state: "Delhi" },
  { name: "IIT Madras", city: "Chennai", state: "Tamil Nadu" },
  { name: "IIT Kharagpur", city: "Kharagpur", state: "West Bengal" },
  { name: "IIT Kanpur", city: "Kanpur", state: "Uttar Pradesh" },
  { name: "IIT Roorkee", city: "Roorkee", state: "Uttarakhand" },
  { name: "IIT Guwahati", city: "Guwahati", state: "Assam" },
  { name: "IIT Hyderabad", city: "Hyderabad", state: "Telangana" },
  { name: "IIT BHU", city: "Varanasi", state: "Uttar Pradesh" },
  { name: "IIT ISM Dhanbad", city: "Dhanbad", state: "Jharkhand" },
  { name: "IIT Ropar", city: "Ropar", state: "Punjab" },
  { name: "IIT Mandi", city: "Mandi", state: "Himachal Pradesh" },
  { name: "IIT Gandhinagar", city: "Gandhinagar", state: "Gujarat" },
  { name: "IIT Patna", city: "Patna", state: "Bihar" },
  { name: "IIT Bhubaneswar", city: "Bhubaneswar", state: "Odisha" },
  { name: "IIT Jodhpur", city: "Jodhpur", state: "Rajasthan" },
  { name: "IIT Tirupati", city: "Tirupati", state: "Andhra Pradesh" },
  { name: "IIT Palakkad", city: "Palakkad", state: "Kerala" },
  { name: "IIT Bhilai", city: "Bhilai", state: "Chhattisgarh" },
  { name: "IIT Dharwad", city: "Dharwad", state: "Karnataka" },
  { name: "IIT Jammu", city: "Jammu", state: "Jammu and Kashmir" },
  { name: "IIT Goa", city: "Ponda", state: "Goa" },
  { name: "GGV Bilaspur", city: "Bilaspur", state: "Chhattisgarh" },
  { name: "NIT Raipur", city: "Raipur", state: "Chhattisgarh" },
  { name: "NIT Trichy", city: "Tiruchirappalli", state: "Tamil Nadu" },
  { name: "NIT Surathkal", city: "Mangalore", state: "Karnataka" },
  { name: "NIT Warangal", city: "Warangal", state: "Telangana" },
  { name: "NIT Rourkela", city: "Rourkela", state: "Odisha" },
  { name: "NIT Calicut", city: "Calicut", state: "Kerala" },
  { name: "NIT Kurukshetra", city: "Kurukshetra", state: "Haryana" },
  { name: "NIT Silchar", city: "Silchar", state: "Assam" },
  { name: "NIT Allahabad (MNNIT)", city: "Allahabad", state: "Uttar Pradesh" },
  { name: "NIT Jaipur (MNIT)", city: "Jaipur", state: "Rajasthan" },
  { name: "NIT Bhopal (MANIT)", city: "Bhopal", state: "Madhya Pradesh" },
  { name: "NIT Nagpur (VNIT)", city: "Nagpur", state: "Maharashtra" },
  { name: "NIT Jalandhar", city: "Jalandhar", state: "Punjab" },
  { name: "NIT Hamirpur", city: "Hamirpur", state: "Himachal Pradesh" },
  { name: "NIT Patna", city: "Patna", state: "Bihar" },
  { name: "NIT Srinagar", city: "Srinagar", state: "Jammu and Kashmir" },
  { name: "NIT Surat (SVNIT)", city: "Surat", state: "Gujarat" },
  { name: "NIT Agartala", city: "Agartala", state: "Tripura" },
  { name: "NIT Meghalaya", city: "Shillong", state: "Meghalaya" },
  { name: "NIT Nagaland", city: "Dimapur", state: "Nagaland" },
  { name: "NIT Goa", city: "Farmagudi", state: "Goa" },
  { name: "NIT Puducherry", city: "Karaikal", state: "Puducherry" },
  { name: "NIT Manipur", city: "Imphal", state: "Manipur" },
  { name: "NIT Mizoram", city: "Aizawl", state: "Mizoram" },
  { name: "NIT Sikkim", city: "Ravangla", state: "Sikkim" },
  { name: "NIT Uttarakhand", city: "Srinagar", state: "Uttarakhand" },
  { name: "NIT Andhra Pradesh", city: "Tadepalligudem", state: "Andhra Pradesh" },
  { name: "IIIT Hyderabad", city: "Hyderabad", state: "Telangana" },
  { name: "IIIT Bangalore", city: "Bangalore", state: "Karnataka" },
  { name: "IIIT Delhi", city: "New Delhi", state: "Delhi" },
  { name: "IIIT Allahabad", city: "Allahabad", state: "Uttar Pradesh" },
  { name: "IIIT Gwalior", city: "Gwalior", state: "Madhya Pradesh" },
  { name: "IIIT Pune", city: "Pune", state: "Maharashtra" }
];

// Pre-fill the map with custom premium institutions to make sure they are unique
premiumColleges.forEach(c => {
  collegesMap.set(c.name.toLowerCase(), c);
});

let pending = null;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  line = line.replace(/^"|"$/g, '').trim();
  if (!line) continue;
  
  if (line.includes("List of AICTE approved institutions") || line.includes("Institute Permanent ID") || line.includes("List of AICTE approved")) {
    continue;
  }
  
  if (/^\d+-\d+/.test(line)) {
    if (pending) {
      addCollege(pending);
      pending = null;
    }
    
    const parts = line.split(/\s{2,}/).map(p => p.trim());
    if (parts.length >= 5) {
      addCollege({
        name: parts[1],
        state: parts[2],
        city: parts[4]
      });
    } else {
      pending = {
        name: parts[1] || "",
        state: parts[2] || "",
        district: parts[3] || "",
        city: parts[4] || "",
        partsCount: parts.length
      };
    }
  } else if (pending) {
    const parts = line.split(/\s{2,}/).map(p => p.trim());
    if (pending.partsCount === 2) {
      if (parts.length === 3) {
        pending.state = parts[0];
        pending.city = parts[2];
        addCollege(pending);
        pending = null;
      } else if (parts.length === 2) {
        pending.state = parts[0];
        pending.partsCount = 4;
      } else if (parts.length === 1) {
        if (parts[0].toLowerCase().includes("pradesh") || parts[0].toLowerCase().includes("bengal") || parts[0].toLowerCase().includes("maharashtra") || parts[0].toLowerCase().includes("karnataka") || parts[0].toLowerCase().includes("kerala") || parts[0].toLowerCase().includes("tamil nadu") || parts[0].toLowerCase().includes("delhi") || parts[0].toLowerCase().includes("gujarat")) {
          pending.state = parts[0];
          pending.partsCount = 3;
        } else {
          pending.name += " " + parts[0];
        }
      }
    } else if (pending.partsCount === 3) {
      if (parts.length === 2) {
        pending.city = parts[1];
        addCollege(pending);
        pending = null;
      } else if (parts.length === 1) {
        pending.partsCount = 4;
      }
    } else if (pending.partsCount === 4) {
      pending.city = parts[0];
      addCollege(pending);
      pending = null;
    }
  }
}

if (pending) {
  addCollege(pending);
}

function addCollege(c) {
  if (!c.name || c.name.length < 5) return;
  
  // Format fields
  const formattedName = toTitleCase(c.name);
  const formattedCity = toTitleCase(c.city || '');
  const formattedState = toTitleCase(c.state || '');
  
  const key = formattedName.toLowerCase();
  
  // Skip duplicates or weird symbols
  if (key.includes('list of aicte') || key.includes('permanent id')) return;
  
  collegesMap.set(key, {
    name: formattedName,
    city: formattedCity,
    state: formattedState
  });
}

// Convert to sorted array
const collegesArray = Array.from(collegesMap.values());

// Ensure the target directory exists
const dir = path.dirname(jsonOutputPath);
if (!fs.existsSync(dir)){
  fs.mkdirSync(dir, { recursive: true });
}

// Save as a structured JSON
fs.writeFileSync(jsonOutputPath, JSON.stringify(collegesArray, null, 2), 'utf8');

console.log(`Successfully generated colleges.json!`);
console.log(`Total colleges saved: ${collegesArray.length}`);
console.log(`Sample output path: ${jsonOutputPath}`);
