import fs from 'fs';
import path from 'path';

const SRC_DIR = path.join(process.cwd(), 'src');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  if (!content.includes('useApp')) return;

  const useAppRegex = /const\s+\{([^}]+)\}\s*=\s*useApp\(\);/g;
  let match;
  while ((match = useAppRegex.exec(content)) !== null) {
    const destructured = match[1];
    const vars = destructured.split(',').map(v => v.trim());
    
    const needsSetProducts = vars.includes('setProducts');
    const needsSetStores = vars.includes('setStores');
    const needsSetReviews = vars.includes('setReviews');
    
    if (!needsSetProducts && !needsSetStores && !needsSetReviews) continue;
    
    const newVars = vars.filter(v => v !== 'setProducts' && v !== 'setStores' && v !== 'setReviews' && v !== '');
    let newDestructure = '';
    if (newVars.length > 0) {
      newDestructure = `const { ${newVars.join(', ')} } = useApp();\n`;
    } else {
      newDestructure = '';
    }

    if (needsSetStores) newDestructure += `  const { setStores } = useStores();\n`;
    if (needsSetProducts) newDestructure += `  const { setProducts } = useProducts();\n`;
    if (needsSetReviews) newDestructure += `  const { setReviews } = useReviews();\n`;

    content = content.replace(match[0], newDestructure.trimEnd() + ';');
    changed = true;
    
    const importsToAdd = [];
    if (needsSetStores && !content.includes('useStores')) importsToAdd.push(`import { useStores } from '../../hooks/useStores';`);
    if (needsSetProducts && !content.includes('useProducts')) importsToAdd.push(`import { useProducts } from '../../hooks/useProducts';`);
    if (needsSetReviews && !content.includes('useReviews')) importsToAdd.push(`import { useReviews } from '../../hooks/useReviews';`);
    
    if (importsToAdd.length > 0) {
      const depth = filePath.split(path.sep).length - SRC_DIR.split(path.sep).length - 1;
      const relativePrefix = depth === 0 ? './' : '../'.repeat(depth);
      
      let importStatements = '';
      if (needsSetStores && !content.includes('useStores')) importStatements += `import { useStores } from '${relativePrefix}hooks/useStores';\n`;
      if (needsSetProducts && !content.includes('useProducts')) importStatements += `import { useProducts } from '${relativePrefix}hooks/useProducts';\n`;
      if (needsSetReviews && !content.includes('useReviews')) importStatements += `import { useReviews } from '${relativePrefix}hooks/useReviews';\n`;
      
      const lastImportIndex = content.lastIndexOf('import ');
      if (lastImportIndex !== -1) {
        const endOfLastImport = content.indexOf('\n', lastImportIndex);
        content = content.slice(0, endOfLastImport + 1) + importStatements + content.slice(endOfLastImport + 1);
      } else {
        content = importStatements + content;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walkDir(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      processFile(filePath);
    }
  }
}

walkDir(SRC_DIR);
