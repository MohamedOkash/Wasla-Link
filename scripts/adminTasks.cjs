const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

try {
  initializeApp({
    credential: applicationDefault(),
    projectId: 'wasla-link'
  });
} catch (e) {
  console.error("Failed to initialize:", e);
  process.exit(1);
}

const db = getFirestore();

async function runTasks() {
  try {
    const uid = 'E9A35cV1utbz3bvk1rFO0xd1DCJ3';
    
    // 1. Set Admin Account
    console.log("Setting Admin role for", uid);
    await db.collection('users').doc(uid).set({
      role: "admin",
      isActive: true,
      email: "mohamed.okash1998@gmail.com"
    }, { merge: true });
    console.log("Admin account configured.");

    // 2. Fetch counts
    console.log("Fetching counts...");
    const usersCount = (await db.collection('users').count().get()).data().count;
    const storesCount = (await db.collection('stores').count().get()).data().count;
    const productsCount = (await db.collection('products').count().get()).data().count;
    const templatesCount = (await db.collection('productTemplates').count().get()).data().count;
    const categoriesCount = (await db.collection('categories').count().get()).data().count;
    const brandsCount = (await db.collection('brands').count().get()).data().count;
    const ordersCount = (await db.collection('orders').count().get()).data().count;

    console.log("--- ACTUAL COUNTS ---");
    console.log("users:", usersCount);
    console.log("stores:", storesCount);
    console.log("products:", productsCount);
    console.log("productTemplates:", templatesCount);
    console.log("categories:", categoriesCount);
    console.log("brands:", brandsCount);
    console.log("orders:", ordersCount);
    
    process.exit(0);
  } catch(e) {
    console.error("Error running tasks:", e);
    process.exit(1);
  }
}

runTasks();
