import { Project, SyntaxKind, CallExpression } from 'ts-morph';

const project = new Project();
project.addSourceFilesAtPaths("src/features/**/*.tsx");
project.addSourceFilesAtPaths("src/contexts/**/*.tsx");
project.addSourceFilesAtPaths("src/hooks/**/*.ts");

const repoMap: Record<string, { importPath: string, name: string }> = {
  'stores': { importPath: '../../services/vendor/repository', name: 'storeRepository' },
  'categories': { importPath: '../../services/admin/repository', name: 'categoryRepository' },
  'banners': { importPath: '../../services/admin/repository', name: 'bannerRepository' },
  'platformSettings': { importPath: '../../services/admin/repository', name: 'platformSettingsRepository' },
  'users': { importPath: '../../services/shared/user.repository', name: 'userRepository' },
  'drivers': { importPath: '../../services/driver/repository', name: 'driverRepository' },
  'products': { importPath: '../../services/inventory/repository', name: 'productRepository' },
  'orders': { importPath: '../../services/orders/repository', name: 'orderRepository' },
  'driverwallets': { importPath: '../../services/wallet/repository', name: 'driverWalletRepository' },
  'storewallets': { importPath: '../../services/wallet/repository', name: 'storeWalletRepository' },
  'ledger': { importPath: '../../services/ledger/repository', name: 'ledgerRepository' },
  'auditlogs': { importPath: '../../services/audit/repository', name: 'auditLogRepository' },
  'financial_transactions': { importPath: '../../services/finance/repository', name: 'financialTransactionRepository' },
  'businessRules': { importPath: '../../services/business/repository', name: 'businessRuleRepository' },
};

function getCollectionNameFromDocCall(docCall: CallExpression): string | null {
  const args = docCall.getArguments();
  if (args.length >= 2) {
    const colNameArg = args[1];
    if (colNameArg.getKind() === SyntaxKind.StringLiteral) {
      return colNameArg.getText().replace(/['"]/g, '');
    }
  }
  return null;
}

function processFile(sourceFile: any) {
  let changed = false;
  const reposToAdd = new Set<string>();

  // Collect edits
  const edits: { start: number, end: number, text: string }[] = [];

  const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  
  for (const call of calls) {
    const expr = call.getExpression().getText();
    if (expr === 'updateDoc' || expr === 'setDoc' || expr === 'deleteDoc') {
      const args = call.getArguments();
      if (args.length > 0 && args[0].getKind() === SyntaxKind.CallExpression) {
        const docCall = args[0] as CallExpression;
        if (docCall.getExpression().getText() === 'doc') {
          const colName = getCollectionNameFromDocCall(docCall);
          if (colName && repoMap[colName]) {
            const docArgs = docCall.getArguments();
            const idArg = docArgs.length >= 3 ? docArgs[2].getText() : null;
            const dataArg = args.length >= 2 ? args[1].getText() : null;
            
            let newText = '';
            if (expr === 'updateDoc') {
               newText = `${repoMap[colName].name}.update(${idArg || 'undefined'}, ${dataArg})`;
            } else if (expr === 'setDoc') {
               newText = `${repoMap[colName].name}.create(${idArg || 'null'}, ${dataArg})`;
            } else if (expr === 'deleteDoc') {
               newText = `${repoMap[colName].name}.delete(${idArg})`;
            }
            
            if (newText) {
              edits.push({ start: call.getStart(), end: call.getEnd(), text: newText });
              reposToAdd.add(colName);
              changed = true;
            }
          }
        }
      }
    }
  }

  if (changed) {
    // Sort edits by start index descending to avoid offsetting issues
    edits.sort((a, b) => b.start - a.start);
    
    let fileText = sourceFile.getFullText();
    for (const edit of edits) {
      fileText = fileText.substring(0, edit.start) + edit.text + fileText.substring(edit.end);
    }
    
    sourceFile.replaceWithText(fileText);

    for (const colName of reposToAdd) {
      const repoInfo = repoMap[colName];
      const importDecl = sourceFile.getImportDeclaration(decl => decl.getModuleSpecifierValue().includes(repoInfo.name));
      if (!importDecl) {
        sourceFile.addImportDeclaration({
          namedImports: [repoInfo.name],
          moduleSpecifier: repoInfo.importPath
        });
      }
    }
    
    console.log(`Refactored ${sourceFile.getBaseName()}`);
  }
}

for (const sourceFile of project.getSourceFiles()) {
  try {
    processFile(sourceFile);
  } catch (e) {
    console.error(`Error in ${sourceFile.getBaseName()}: ${e}`);
  }
}

project.saveSync();
console.log("Refactoring complete.");
