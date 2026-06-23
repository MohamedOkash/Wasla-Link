import fs from 'fs';
import path from 'path';

const SRC_DIR = path.join(process.cwd(), 'src');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  // Check if it imports useApp
  if (!content.includes('useApp')) return;

  // Match destructuring: const { ..., products, ... } = useApp();
  // We need to look for useApp() and see what it destructures.
  const useAppRegex = /const\s+\{([^}]+)\}\s*=\s*useApp\(\);/g;
  let match;
  while ((match = useAppRegex.exec(content)) !== null) {
    const destructured = match[1];
    const vars = destructured.split(',').map(v => v.trim());
    
    const needsProducts = vars.includes('products');
    const needsStores = vars.includes('stores');
    const needsReviews = vars.includes('reviews');
    
    if (!needsProducts && !needsStores && !needsReviews) continue;
    
    // Remove them from useApp
    const newVars = vars.filter(v => v !== 'products' && v !== 'stores' && v !== 'reviews' && v !== '');
    let newDestructure = '';
    if (newVars.length > 0) {
      newDestructure = `const { ${newVars.join(', ')} } = useApp();\n`;
    } else {
      // It ONLY destructured products/stores/reviews
      newDestructure = '';
    }

    // Add hook calls
    if (needsStores) newDestructure += `  const { stores } = useStores();\n`;
    if (needsProducts) newDestructure += `  const { products } = useProducts();\n`;
    if (needsReviews) newDestructure += `  const { reviews } = useReviews();\n`;

    content = content.replace(match[0], newDestructure.trimEnd() + ';');
    changed = true;
    
    // Add imports
    const importsToAdd = [];
    if (needsStores) importsToAdd.push(`import { useStores } from '../../hooks/useStores';`); // path might be wrong, need to fix based on depth
    if (needsProducts) importsToAdd.push(`import { useProducts } from '../../hooks/useProducts';`);
    if (needsReviews) importsToAdd.push(`import { useReviews } from '../../hooks/useReviews';`);
    
    if (importsToAdd.length > 0) {
      // Calculate relative path to src/hooks
      const depth = filePath.split(path.sep).length - SRC_DIR.split(path.sep).length - 1;
      const relativePrefix = depth === 0 ? './' : '../'.repeat(depth);
      
      let importStatements = '';
      if (needsStores) importStatements += `import { useStores } from '${relativePrefix}hooks/useStores';\n`;
      if (needsProducts) importStatements += `import { useProducts } from '${relativePrefix}hooks/useProducts';\n`;
      if (needsReviews) importStatements += `import { useReviews } from '${relativePrefix}hooks/useReviews';\n`;
      
      // Insert after last import
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
