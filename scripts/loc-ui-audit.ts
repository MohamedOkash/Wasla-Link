const fs = require('fs');
const path = require('path');

function countArabicStrings(dir: string): number {
  let count = 0;
  function walk(currentDir: string) {
    if (!fs.existsSync(currentDir)) return;
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        walk(fullPath);
      } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const matches = content.match(/[\u0600-\u06FF]+/g);
        if (matches) {
          count += matches.length;
        }
      }
    }
  }
  walk(dir);
  return count;
}

const uiPath = path.join(__dirname, '../src/components');
const featuresPath = path.join(__dirname, '../src/features');
const customerPath = path.join(__dirname, '../src/features/customer');
const adminPath = path.join(__dirname, '../src/features/admin');
const vendorPath = path.join(__dirname, '../src/features/vendor');
const driverPath = path.join(__dirname, '../src/features/driver');

const adminCount = countArabicStrings(adminPath);
const vendorCount = countArabicStrings(vendorPath);
const driverCount = countArabicStrings(driverPath);

// For overall UI, we can count components + customer + other generic features (auth, cart) minus admin, vendor, driver
let totalFeatures = countArabicStrings(featuresPath);
let totalComponents = countArabicStrings(uiPath);
let otherUI = totalFeatures - adminCount - vendorCount - driverCount + totalComponents;

console.log('--- Localization String Audit ---');
console.log(`UI Screens (Customer/Components): ${otherUI}`);
console.log(`Admin Screens: ${adminCount}`);
console.log(`Vendor Screens: ${vendorCount}`);
console.log(`Driver Screens: ${driverCount}`);
console.log(`Total Remaining: ${otherUI + adminCount + vendorCount + driverCount}`);
