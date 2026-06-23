const fs = require('fs');
const path = require('path');

const targetDirs = [
  'src/features',
  'src/components'
];

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
  walk(dirPath, (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file has t( but no const { t } = useTranslation()
    if (content.match(/\bt\(/) && !content.includes('const { t } = useTranslation();') && !content.includes('const { t,') && !content.includes(', t }')) {
      
      // We need to inject const { t } = useTranslation();
      // Find the start of the component body
      // Typical patterns:
      // export const Analytics: React.FC = () => {
      // export function AdminDashboard() {
      // const UserManagement = () => {
      
      const componentRegex = /((?:export\s+)?(?:default\s+)?(?:const|function)\s+\w+\s*(?::\s*[A-Za-z0-9_.<>]+)?\s*(?:=\s*(?:async\s*)?\([^)]*\)\s*=>\s*|\([^)]*\)\s*)\{)/;
      
      if (content.match(componentRegex)) {
        content = content.replace(componentRegex, (match) => {
          return match + '\n  const { t } = useTranslation();';
        });
        
        if (!content.includes('useTranslation')) {
          content = `import { useTranslation } from '../../hooks/useTranslation';\n` + content;
        }
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed', filePath);
      } else {
        console.log('Could not find component body in', filePath);
      }
    }
  });
}
