import { Project } from 'ts-morph';
import path from 'path';

const project = new Project();
project.addSourceFilesAtPaths("src/**/*.tsx");
project.addSourceFilesAtPaths("src/**/*.ts");

function getRelativePath(fromPath: string, toPath: string) {
  let rel = path.relative(path.dirname(fromPath), toPath).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel.replace('.ts', '');
}

const repoMap: Record<string, string> = {
  'storeRepository': 'src/services/vendor/repository.ts',
  'categoryRepository': 'src/services/admin/repository.ts',
  'bannerRepository': 'src/services/admin/repository.ts',
  'platformSettingsRepository': 'src/services/admin/repository.ts',
  'userRepository': 'src/services/shared/user.repository.ts',
  'driverRepository': 'src/services/driver/repository.ts',
  'productRepository': 'src/services/inventory/repository.ts',
  'orderRepository': 'src/services/orders/repository.ts',
  'driverWalletRepository': 'src/services/wallet/repository.ts',
  'storeWalletRepository': 'src/services/wallet/repository.ts',
  'ledgerRepository': 'src/services/ledger/repository.ts',
  'auditLogRepository': 'src/services/audit/repository.ts',
  'financialTransactionRepository': 'src/services/finance/repository.ts',
  'businessRuleRepository': 'src/services/business/repository.ts',
};

for (const sourceFile of project.getSourceFiles()) {
  let changed = false;
  const filePath = sourceFile.getFilePath();
  
  // Find missing imports
  const undefinedNames = [
    'storeRepository', 'categoryRepository', 'bannerRepository', 'platformSettingsRepository', 
    'userRepository', 'driverRepository', 'productRepository', 'orderRepository',
    'driverWalletRepository', 'storeWalletRepository', 'ledgerRepository', 'auditLogRepository',
    'financialTransactionRepository', 'businessRuleRepository'
  ];
  
  for (const name of undefinedNames) {
    if (sourceFile.getFullText().includes(name + '.')) {
      const importDecl = sourceFile.getImportDeclaration(decl => {
        return decl.getNamedImports().some(ni => ni.getName() === name);
      });
      if (!importDecl) {
        // Check if there is an import with wrong path (e.g. '../../services/vendor/repository' in AppContext)
        const wrongImport = sourceFile.getImportDeclaration(decl => decl.getModuleSpecifierValue().includes(name));
        if (wrongImport) wrongImport.remove();
        
        const targetPath = getRelativePath(filePath, path.join(process.cwd(), repoMap[name]));
        
        // Also check if an import from this target path already exists
        const existingImport = sourceFile.getImportDeclaration(decl => decl.getModuleSpecifierValue() === targetPath);
        if (existingImport) {
          existingImport.addNamedImport(name);
        } else {
          sourceFile.addImportDeclaration({
            namedImports: [name],
            moduleSpecifier: targetPath
          });
        }
        changed = true;
      } else {
        // Fix path if it's wrong
        const currentPath = importDecl.getModuleSpecifierValue();
        const targetPath = getRelativePath(filePath, path.join(process.cwd(), repoMap[name]));
        if (currentPath !== targetPath) {
          importDecl.setModuleSpecifier(targetPath);
          changed = true;
        }
      }
    }
  }
  
  if (changed) {
    console.log(`Fixed imports in ${sourceFile.getBaseName()}`);
  }
}

project.saveSync();
console.log("Imports fixed.");
