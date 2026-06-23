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

  const search = (query: string) => {
    const q = query.toLowerCase().split(' ');
    return products.filter((p: any) => {
      const keywords = p.searchKeywords || [];
      return q.every(token => keywords.includes(token) || (p.nameAr && p.nameAr.includes(token)) || (p.nameEn && p.nameEn.toLowerCase().includes(token)));
    }).length;
  };

  console.log('--- Search Validation Report ---');
  console.log(`Arabic (حليب): ${search('حليب')}`);
  console.log(`Arabic (قهوة): ${search('قهوة')}`);
  console.log(`Arabic (أرز): ${search('أرز')}`);
  console.log(`English (milk): ${search('milk')}`);
  console.log(`English (coffee): ${search('coffee')}`);
  console.log(`English (rice): ${search('rice')}`);
  console.log(`Mixed (milk حليب): ${search('milk حليب')}`);
  console.log(`Mixed (coffee قهوة): ${search('coffee قهوة')}`);

  process.exit(0);
}

run().catch(console.error);
