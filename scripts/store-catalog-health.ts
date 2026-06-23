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
  const stores = storesSnap.docs.map(d => ({id: d.id, ...d.data()}));

  const productsSnap = await getDocs(collection(db, 'products'));
  const products = productsSnap.docs.map(d => ({id: d.id, ...d.data()}));

  console.log('--- Store Catalog Health ---');
  stores.forEach(store => {
    const storeProducts = products.filter(p => p.storeId === store.id);
    let visible = 0;
    let hidden = 0;
    let outOfStock = 0;

    storeProducts.forEach(p => {
      if (p.isActive !== false) visible++;
      else hidden++;

      if (p.currentStock === 0 || p.stock === 0) outOfStock++;
    });

    console.log(`Store Name: ${store.name || store.id}`);
    console.log(`Product Count: ${storeProducts.length}`);
    console.log(`Visible Product Count: ${visible}`);
    console.log(`Hidden Product Count: ${hidden}`);
    console.log(`Out Of Stock Count: ${outOfStock}`);
    console.log('---');
  });

  process.exit(0);
}

run().catch(console.error);
