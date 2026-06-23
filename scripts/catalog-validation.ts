import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
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
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  await signInWithEmailAndPassword(auth, 'admin@demo.com', 'admin123');
  const storesSnap = await getDocs(collection(db, 'stores'));
  const validStores = new Set(storesSnap.docs.map(d => d.id));

  const productsSnap = await getDocs(collection(db, 'products'));
  const products = productsSnap.docs.map(d => ({id: d.id, ...d.data()}));

  let visible = 0;
  let searchable = 0;
  let assigned = 0;
  let missingStore = 0;
  let missingCat = 0;
  let missingImg = 0;
  let purchasable = 0;

  products.forEach(p => {
    if (p.isActive !== false) visible++;
    if (p.name || p.nameEn || p.nameAr) searchable++;
    if (p.storeId) {
      if (validStores.has(p.storeId)) {
        assigned++;
      } else {
        missingStore++;
      }
    } else {
      missingStore++;
    }
    if (!p.cat) missingCat++;
    if (!p.imageUrl && (!p.gallery || p.gallery.length === 0)) missingImg++;
    if (p.price > 0 && p.isActive !== false && p.storeId && validStores.has(p.storeId)) purchasable++;
  });

  console.log('--- Functional Validation ---');
  console.log(`Total Products: ${products.length}`);
  console.log(`Visible: ${visible}`);
  console.log(`Searchable: ${searchable}`);
  console.log(`Assigned To Stores: ${assigned}`);
  console.log(`Missing Store Links: ${missingStore}`);
  console.log(`Missing Categories: ${missingCat}`);
  console.log(`Missing Images: ${missingImg}`);
  console.log(`Purchasable: ${purchasable}`);

  process.exit(0);
}

run().catch(console.error);
