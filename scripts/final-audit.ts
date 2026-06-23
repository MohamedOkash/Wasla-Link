import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

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

async function finalAudit() {
  await signInWithEmailAndPassword(auth, 'admin@demo.com', 'admin123');
  console.log('Final Firestore Counts:');
  
  const productsSnap = await getDocs(collection(db, 'products'));
  console.log(`products: ${productsSnap.size}`);

  const templatesSnap = await getDocs(collection(db, 'productTemplates'));
  console.log(`productTemplates: ${templatesSnap.size}`);

  const storesSnap = await getDocs(collection(db, 'stores'));
  console.log(`stores: ${storesSnap.size}`);

  const categoriesSnap = await getDocs(collection(db, 'categories'));
  console.log(`categories: ${categoriesSnap.size}`);

  const usersSnap = await getDocs(collection(db, 'users'));
  console.log(`users: ${usersSnap.size}`);

  const ordersSnap = await getDocs(collection(db, 'orders'));
  console.log(`orders: ${ordersSnap.size}`);

  const driversSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'driver')));
  console.log(`drivers: ${driversSnap.size}`);

  process.exit(0);
}

finalAudit().catch(console.error);
