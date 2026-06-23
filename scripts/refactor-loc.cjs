const fs = require('fs');
const path = require('path');

const targetDirs = [
  'src/features/admin',
  'src/features/vendor',
  'src/features/driver',
  'src/components'
];

const arJsonPath = path.join(__dirname, '../src/locales/ar.json');
const enJsonPath = path.join(__dirname, '../src/locales/en.json');

const arDict = JSON.parse(fs.readFileSync(arJsonPath, 'utf8'));
const enDict = JSON.parse(fs.readFileSync(enJsonPath, 'utf8'));

let keyCounter = Object.keys(arDict).length;

const results = {};

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, callback);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      callback(fullPath);
    }
  }
}

let totalReplaced = 0;
let filesActivated = 0;

for (const dirRel of targetDirs) {
  const dirPath = path.join(__dirname, '..', dirRel);
  
  walk(dirPath, (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    let stringsReplaced = 0;
    
    // Catch `lang === 'ar' ? '...' : '...'` or similar, making sure we don't cross lines
    const ternaryRegex = /(?:lang|language|isRTL)[^?\n]*\?\s*(['"`])([^'"\`\n]*)\1\s*:\s*(['"`])([^'"\`\n]*)\3/g;
    content = content.replace(ternaryRegex, (match, q1, firstText, q2, secondText) => {
      let arabic = firstText;
      let english = secondText;
      if (/[\u0600-\u06FF]/.test(english) && !/[\u0600-\u06FF]/.test(arabic)) {
        arabic = secondText;
        english = firstText;
      }
      if (!/[\u0600-\u06FF]/.test(arabic)) return match;

      let existingKey = Object.keys(arDict).find(k => arDict[k] === arabic);
      if (!existingKey) {
        existingKey = `str_${++keyCounter}`;
        arDict[existingKey] = arabic;
        enDict[existingKey] = english; 
      }
      
      stringsReplaced++;
      return `t('${existingKey}')`;
    });

    // Raw text between tags
    const tagRegex = />([\s]*[\u0600-\u06FF][\u0600-\u06FF\s0-9A-Za-z-!?,.()]*[\u0600-\u06FF]?[\s]*)</g;
    content = content.replace(tagRegex, (match, p1) => {
      const text = p1.trim();
      if (!text) return match;
      let existingKey = Object.keys(arDict).find(k => arDict[k] === text);
      if (!existingKey) {
        existingKey = `str_${++keyCounter}`;
        arDict[existingKey] = text;
        enDict[existingKey] = text; 
      }
      stringsReplaced++;
      return `>{t('${existingKey}')}<`;
    });

    // Arabic text in attributes
    const attrRegex = /(placeholder|value|label|title)="([\u0600-\u06FF][\u0600-\u06FF\s0-9A-Za-z-!?,.()]*)["']/g;
    content = content.replace(attrRegex, (match, p1, p2) => {
      const text = p2.trim();
      if (!text) return match;
      let existingKey = Object.keys(arDict).find(k => arDict[k] === text);
      if (!existingKey) {
        existingKey = `str_${++keyCounter}`;
        arDict[existingKey] = text;
        enDict[existingKey] = text; 
      }
      stringsReplaced++;
      return `${p1}={t('${existingKey}')}`;
    });

    if (stringsReplaced > 0) {
      if (!content.includes('useTranslation')) {
        content = `import { useTranslation } from '../../hooks/useTranslation';\n` + content;
      }
      const funcRegex = /(export\s+function\s+\w+\s*\([^)]*\)\s*\{|const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{|export\s+default\s+function\s+\w*\s*\([^)]*\)\s*\{)/;
      if (!content.includes('const { t } = useTranslation()') && content.match(funcRegex)) {
        content = content.replace(funcRegex, `$1\n  const { t } = useTranslation();\n`);
      }
      fs.writeFileSync(filePath, content, 'utf8');
      results[filePath] = stringsReplaced;
      totalReplaced += stringsReplaced;
      filesActivated++;
    }
  });
}

fs.writeFileSync(arJsonPath, JSON.stringify(arDict, null, 2), 'utf8');
fs.writeFileSync(enJsonPath, JSON.stringify(enDict, null, 2), 'utf8');

console.log(JSON.stringify({ totalReplaced, filesActivated, files: results }, null, 2));
