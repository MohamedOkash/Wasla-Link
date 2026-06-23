import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function run() {
  const productsSnap = await getDocs(collection(db, 'products'));
  const products = productsSnap.docs.map(d => d.data());

  let missingNameEn = 0;
  let missingDescEn = 0;
  let missingCatEn = 0;
  let missingBrandEn = 0;

  products.forEach(p => {
    if (!p.nameEn) missingNameEn++;
    if (!p.descriptionEn && !p.descEn) missingDescEn++;
    if (!p.categoryEn && !p.catEn) missingCatEn++;
    if (!p.brandEn) missingBrandEn++;
  });

  console.log('--- Catalog Localization Audit ---');
  console.log(`Total Products: ${products.length}`);
  console.log(`Products Missing nameEn: ${missingNameEn}`);
  console.log(`Products Missing descriptionEn: ${missingDescEn}`);
  console.log(`Products Missing categoryEn: ${missingCatEn}`);
  console.log(`Products Missing brandEn: ${missingBrandEn}`);

  process.exit(0);
}

run().catch(console.error);
