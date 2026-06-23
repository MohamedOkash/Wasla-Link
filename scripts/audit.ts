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

async function audit() {
  console.log('Auditing Firestore...');
  
  const productsSnap = await getDocs(collection(db, 'products'));
  console.log(`Current Products Count: ${productsSnap.size}`);

  const templatesSnap = await getDocs(collection(db, 'productTemplates'));
  console.log(`Current Product Templates Count: ${templatesSnap.size}`);

  const storesSnap = await getDocs(collection(db, 'stores'));
  console.log(`Current Stores Count: ${storesSnap.size}`);

  const categoriesSnap = await getDocs(collection(db, 'categories'));
  console.log(`Current Categories Count: ${categoriesSnap.size}`);

  process.exit(0);
}

audit().catch(console.error);
