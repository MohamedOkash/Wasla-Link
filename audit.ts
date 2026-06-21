import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getCountFromServer, query, where, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBaHzZUazI4qzQG1xZP2dC4sCqj4WOEpl0",
  authDomain: "wasla-link.firebaseapp.com",
  projectId: "wasla-link",
  storageBucket: "wasla-link.firebasestorage.app",
  messagingSenderId: "678233300615",
  appId: "1:678233300615:web:f956c78436006f19e6e222"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function runAudit() {
  console.log("Starting Real Production Audit...");

  const collections = ['users', 'stores', 'products', 'productTemplates', 'brands', 'categories', 'orders', 'coupons'];

  console.log("\n1. Collection Counts:");
  for (const col of collections) {
    try {
      const colRef = collection(db, col);
      const snapshot = await getCountFromServer(colRef);
      console.log(`- ${col}: ${snapshot.data().count}`);
    } catch (err: any) {
      console.log(`- ${col}: Error - ${err.message}`);
    }
  }

  console.log("\n2. Catalog Health:");
  try {
    const productsRef = collection(db, 'products');
    const productsSnap = await getDocs(productsRef);
    let withImage = 0;
    let withoutImage = 0;
    productsSnap.forEach(doc => {
      const data = doc.data();
      if (data.imageUrl && data.imageUrl.trim() !== '') {
        withImage++;
      } else {
        withoutImage++;
      }
    });
    console.log(`- Products With Primary Image: ${withImage}`);
    console.log(`- Products Without Primary Image: ${withoutImage}`);
  } catch (err: any) {
    console.log(`- Products Query Error: ${err.message}`);
  }

  console.log("\nAudit Finished!");
  process.exit(0);
}

runAudit();
