const fs = require('fs');
const files = [
  'src/components/premium/CampaignCard.tsx',
  'src/components/premium/ProductCard.tsx',
  'src/components/premium/StoreCard.tsx',
  'src/features/auth/SplashScreen.tsx',
  'src/features/customer/CategoryScreen.tsx',
  'src/features/customer/GlobalSearch.tsx'
];
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  if (!c.includes('import { useTranslation }')) {
    c = `import { useTranslation } from '../../hooks/useTranslation';\n` + c;
    fs.writeFileSync(f, c);
  }
});
