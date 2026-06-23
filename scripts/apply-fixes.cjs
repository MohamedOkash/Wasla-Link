const fs=require('fs'); 
let c; 

c=fs.readFileSync('src/features/admin/CatalogManagement.tsx', 'utf8'); 
c=c.replace(/templates\.map\(t =>/g, 'templates.map(template =>')
   .replace(/\{t\./g, '{template.')
   .replace(/t\.id/g, 'template.id')
   .replace(/catemplate\.id/g, 'cat.id')
   .replace(/setTemplates\(prev => prev\.map\(t => template\.id === tempId \? payload : t\)\);/g, 'setTemplates(prev => prev.map(item => item.id === tempId ? payload : item));')
   .replace(/setTemplates\(prev => prev\.filter\(t => template\.id !== id\)\);/g, 'setTemplates(prev => prev.filter(item => item.id !== id));')
   .replace(/handleOpenEditTemplate\(t\)/g, 'handleOpenEditTemplate(template)')
   .replace(/templatesMap\.get\(p\.templateId!\)/g, 'templatesMap.get(p.templateId!)')
   .replace(/filteredTemplates\.map\(t =>/g, 'filteredTemplates.map(template =>');
fs.writeFileSync('src/features/admin/CatalogManagement.tsx', c); 

c=fs.readFileSync('src/features/auth/AuthScreen.tsx', 'utf8'); 
c=c.replace(/onSubmit=\{handleLogin\}/g, 'onSubmit={handleEmailLogin}'); 
fs.writeFileSync('src/features/auth/AuthScreen.tsx', c); 

['src/features/driver/DriverWallet.tsx', 'src/features/vendor/VendorSettlements.tsx'].forEach(f => { 
  c=fs.readFileSync(f, 'utf8'); 
  c=c.replace(/AuthContext/g, 'AppContext').replace(/useAuth/g, 'useApp').replace(/const \{ user \} = useApp\(\);/g, 'const { currentUser: user } = useApp();'); 
  fs.writeFileSync(f, c); 
}); 

c=fs.readFileSync('src/components/common/ErrorBoundary.tsx', 'utf8'); 
c=c.replace(/\{t\('str_1156'\)\}/g, 'Unexpected Error').replace(/t\('str_1522'\)/g, "'Please try again later or contact support'").replace(/\{t\('str_1157'\)\}/g, 'Reload').replace(/\{t\('str_1158'\)\}/g, 'Go to Home'); 
fs.writeFileSync('src/components/common/ErrorBoundary.tsx', c);

c=fs.readFileSync('src/services/revenue.service.ts', 'utf8');
if (!c.includes('collection')) {
  c=c.replace(/import \{([^\}]+)\} from 'firebase\/firestore';/, "import {$1, collection, query, where, getDocs} from 'firebase/firestore';");
  fs.writeFileSync('src/services/revenue.service.ts', c);
}
