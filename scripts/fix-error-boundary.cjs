const fs = require('fs');
let c = fs.readFileSync('src/components/common/ErrorBoundary.tsx', 'utf8');
c = c.replace(/\{t\('str_1156'\)\}/g, "Unexpected Error")
     .replace(/t\('str_1522'\)/g, "'Please try again later or contact support'")
     .replace(/\{t\('str_1157'\)\}/g, "Reload")
     .replace(/\{t\('str_1158'\)\}/g, "Go to Home");
fs.writeFileSync('src/components/common/ErrorBoundary.tsx', c);
