const fs = require('fs');
const path = require('path');

const targetFiles = [
  'src/features/auth/AuthScreen.tsx'
];

const arJsonPath = path.join(__dirname, '../src/locales/ar.json');
const enJsonPath = path.join(__dirname, '../src/locales/en.json');

const arDict = JSON.parse(fs.readFileSync(arJsonPath, 'utf8'));
const enDict = JSON.parse(fs.readFileSync(enJsonPath, 'utf8'));

let keyCounter = Object.keys(arDict).length;

const results = {};

for (const fileRel of targetFiles) {
  const filePath = path.join(__dirname, '..', fileRel);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');
  let stringsReplaced = 0;
  
  const ternaryRegex = /(?:lang|language|isRTL)[^?]*\?\s*(['"`])([^'"\`\n]*)\1\s*:\s*(['"`])([^'"\`\n]*)\3/g;
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

  if (stringsReplaced > 0) {
    if (!content.includes('useTranslation')) {
      content = `import { useTranslation } from '../../hooks/useTranslation';\n` + content;
    }
    const funcRegex = /(export\s+function\s+\w+\s*\([^)]*\)\s*\{|const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{)/;
    if (!content.includes('const { t } = useTranslation()') && content.match(funcRegex)) {
      content = content.replace(funcRegex, `$1\n  const { t } = useTranslation();\n`);
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  results[fileRel] = { stringsReplaced };
}

fs.writeFileSync(arJsonPath, JSON.stringify(arDict, null, 2), 'utf8');
fs.writeFileSync(enJsonPath, JSON.stringify(enDict, null, 2), 'utf8');

console.log(JSON.stringify(results, null, 2));
