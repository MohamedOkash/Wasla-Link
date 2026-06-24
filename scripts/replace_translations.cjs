const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // VendorDashboard.tsx specific fixes
  content = content.replace(/\{`\$\{totalSales\} ج\.م`\}/g, "{`${totalSales} ${t('currencyEGP')}`}");
  content = content.replace(/\{`\$\{vendorOrders\.length\} طلب`\}/g, "{`${vendorOrders.length} ${t('ordersLabel')}`}");
  content = content.replace(/\{`\$\{vendorProducts\.length\} منتج`\}/g, "{`${vendorProducts.length} ${t('product')}`}");
  content = content.replace(/\{order\.total\} ج\.م/g, "{order.total} {t('currencyEGP')}");
  content = content.replace(/\{withdrawableBalance\} ج\.م/g, "{withdrawableBalance} {t('currencyEGP')}");
  content = content.replace(/\{pendingBalance\} ج\.م/g, "{pendingBalance} {t('currencyEGP')}");
  
  content = content.replace(/\{isRTL \? `\$\{vendorOrders\.filter\(\(o: any\) => o\.status !== 'delivered' && o\.status !== 'cancelled'\)\.length\} طلب نشط` : `\$\{vendorOrders\.filter\(\(o: any\) => o\.status !== 'delivered' && o\.status !== 'cancelled'\)\.length\} active`\}/g, 
    "{`${vendorOrders.filter((o: any) => o.status !== 'delivered' && o.status !== 'cancelled').length} ${t('active')}`}");
    
  // A bit broader just in case
  content = content.replace(/>ج\.م</g, ">{t('currencyEGP')}<");
  content = content.replace(/ ج\.م/g, " {t('currencyEGP')}");
  content = content.replace(/'ج\.م'/g, "t('currencyEGP')");
  
  fs.writeFileSync(filePath, content);
}

const files = [
  'src/features/vendor/VendorDashboard.tsx',
  'src/features/vendor/VendorProducts.tsx',
  'src/features/vendor/VendorOrders.tsx',
  'src/features/vendor/VendorCampaigns.tsx',
  'src/features/vendor/VendorOffers.tsx',
  'src/features/vendor/VendorSettings.tsx',
  'src/features/vendor/VendorDeliveryCenter.tsx',
  'src/features/vendor/VendorSettlements.tsx',
  'src/features/vendor/ProductImport.tsx'
];

files.forEach(f => {
  const fp = path.join(__dirname, '..', f);
  if (fs.existsSync(fp)) {
    replaceInFile(fp);
    console.log(`Replaced in ${f}`);
  }
});
