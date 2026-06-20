const admin = require('firebase-admin');
const fs = require('fs');

// Check if we have service account key
const serviceAccountPath = './scripts/serviceAccountKey.json';
let serviceAccount = null;
if (fs.existsSync(serviceAccountPath)) {
    serviceAccount = require(serviceAccountPath);
}

if (!serviceAccount) {
    console.log("No serviceAccountKey.json found. Cannot connect to Firestore natively without credentials. Please provide credentials.");
    process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkCollections() {
  const collections = [
    'users', 'stores', 'products', 'orders', 'reviews', 'notifications', 
    'drivers', 'campaigns', 'coupons', 'productTemplates', 'assets',
    'returnRequests', 'refundRequests', 'replacementRequests', 'walletTransactions',
    'walletSettlements', 'driverMetrics', 'config'
  ];

  for (const col of collections) {
    try {
      const snap = await db.collection(col).count().get();
      console.log(`Collection: ${col} - Count: ${snap.data().count}`);
    } catch (err) {
      console.log(`Collection: ${col} - Error: ${err.message}`);
    }
  }
}

checkCollections().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
