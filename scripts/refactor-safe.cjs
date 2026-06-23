const fs = require('fs');
const path = require('path');

const targetDirs = [
  'src/features',
  'src/components'
];

let enDict = {};
let arDict = {};

try {
  enDict = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
  arDict = JSON.parse(fs.readFileSync('src/locales/ar.json', 'utf8'));
} catch (e) {
  console.error("Missing dicts", e);
}

let keyCounter = Object.keys(arDict).length + 1;

function addTranslation(arabicStr) {
  const existingKey = Object.keys(arDict).find(k => arDict[k] === arabicStr);
  if (existingKey) return existingKey;

  const key = `str_${keyCounter++}`;
  arDict[key] = arabicStr;
  enDict[key] = arabicStr;
  return key;
}

// Ensure the file has t injected if it's missing
function ensureTranslationHook(c) {
  if (c.match(/\bt\(/) && !c.includes('const { t } = useTranslation();')) {
    const componentRegex = /((?:export\s+)?(?:default\s+)?(?:const|function)\s+\w+\s*(?::\s*[A-Za-z0-9_.<>]+)?\s*(?:=\s*(?:async\s*)?\([^)]*\)\s*=>\s*|\([^)]*\)\s*)\{)/;
    if (c.match(componentRegex)) {
      c = c.replace(componentRegex, (match) => {
        return match + '\n  const { t } = useTranslation();';
      });
      if (!c.includes('import { useTranslation }')) {
        c = `import { useTranslation } from '../../hooks/useTranslation';\n` + c;
      }
    }
  }
  return c;
}

let totalReplaced = 0;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. JSX text nodes: >ArabicText<
  content = content.replace(/>([^<]*[\u0600-\u06FF][^<]*)</g, (match, text) => {
    if (text.trim().length === 0) return match;
    let pre = text.substring(0, text.indexOf(text.trim()));
    let post = text.substring(text.indexOf(text.trim()) + text.trim().length);
    let key = addTranslation(text.trim());
    totalReplaced++;
    return `>${pre}{t('${key}')}${post}<`;
  });

  // 2. String attributes: placeholder="Arabic", title="Arabic", label="Arabic"
  // Make sure to only match inside tags
  const attrRegex = /\b(placeholder|label|title|alt|description|subtitle|message|error|success|text)\s*=\s*(['"])([^'"]*[\u0600-\u06FF][^'"]*)\2/g;
  content = content.replace(attrRegex, (match, attrName, quote, text) => {
    let key = addTranslation(text.trim());
    totalReplaced++;
    return `${attrName}={t('${key}')}`;
  });

  if (content !== originalContent) {
    content = ensureTranslationHook(content);
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

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

for (const dirRel of targetDirs) {
  const dirPath = path.join(__dirname, '..', dirRel);
  walk(dirPath, processFile);
}

fs.writeFileSync('src/locales/en.json', JSON.stringify(enDict, null, 2), 'utf8');
fs.writeFileSync('src/locales/ar.json', JSON.stringify(arDict, null, 2), 'utf8');

console.log(`Replaced ${totalReplaced} strings.`);
