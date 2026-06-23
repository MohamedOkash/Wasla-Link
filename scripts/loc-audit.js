import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
let arabicScreens = 0;
let englishScreens = 0;
let mixedScreens = 0;
let hardcodedArabic = 0;

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const hasArabic = /[\u0600-\u06FF]/.test(content);
  const hasIsRTL = /isRTL \?/.test(content);
  
  if (hasArabic && !hasIsRTL) arabicScreens++;
  else if (!hasArabic && !hasIsRTL) englishScreens++;
  else mixedScreens++;
  
  const matches = content.match(/[\u0600-\u06FF]+/g);
  if (matches) hardcodedArabic += matches.length;
});

console.log('Arabic Screens:', arabicScreens);
console.log('English Screens:', englishScreens);
console.log('Mixed Screens:', mixedScreens);
console.log('Hardcoded Arabic Strings:', hardcodedArabic);
