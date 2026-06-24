import * as fs from 'fs';
import * as path from 'path';

const vendorDir = path.join(process.cwd(), 'src/features/vendor');
const files = fs.readdirSync(vendorDir).filter(f => f.endsWith('.tsx'));

let totalArabicMatches = 0;
let totalCurrencyMatches = 0;
const arabicRegex = /[\u0600-\u06FF]/g;
const currencyRegex = /ج\.م/g;

let gapReport = '# Translation Gap Report\n\n';
let localizedScreens = 0;

files.forEach(file => {
  const filePath = path.join(vendorDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const lines = content.split('\n');
  let fileHasArabic = false;
  
  lines.forEach((line, idx) => {
    // Ignore comments
    if (line.trim().startsWith('//')) return;
    
    const hasArabic = arabicRegex.test(line);
    const hasCurrency = currencyRegex.test(line);
    
    if (hasArabic || hasCurrency) {
      if (!fileHasArabic) {
        gapReport += `## ${file}\n`;
        fileHasArabic = true;
      }
      
      if (hasArabic) {
        const matches = line.match(arabicRegex);
        totalArabicMatches += matches ? matches.length : 0;
        gapReport += `- Line ${idx + 1}: \`${line.trim()}\`\n`;
      }
      if (hasCurrency) {
        const matches = line.match(currencyRegex);
        totalCurrencyMatches += matches ? matches.length : 0;
      }
    }
  });
  
  if (!fileHasArabic) {
    localizedScreens++;
  }
});

console.log(JSON.stringify({
  totalArabicMatches,
  totalCurrencyMatches,
  localizedScreens,
  totalFiles: files.length,
  gapReport
}));
