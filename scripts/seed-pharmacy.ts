import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { catalogTemplates } from '../src/data/catalogTemplates';

const firebaseConfig = {
  apiKey: "AIzaSyBaHzZUazI4qzQG1xZP2dC4sCqj4WOEpl0",
  authDomain: "wasla-link.firebaseapp.com",
  projectId: "wasla-link",
  storageBucket: "wasla-link.firebasestorage.app",
  messagingSenderId: "678233300615",
  appId: "1:678233300615:web:f956c78436006f19e6e222",
  measurementId: "G-YXBFVWN4CE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  console.log('Seeding Pharmacy Master Catalog Templates...');
  try {
    await signInWithEmailAndPassword(auth, 'admin@demo.com', 'admin123');
    const items = catalogTemplates.pharmacy || [];
    console.log(`Loaded ${items.length} Pharmacy templates. Uploading to productTemplates...`);
    
    for (const item of items) {
      await setDoc(doc(db, 'productTemplates', item.id), item);
    }
    
    console.log('Pharmacy seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Pharmacy seeding failed:', err);
    process.exit(1);
  }
}

run();
