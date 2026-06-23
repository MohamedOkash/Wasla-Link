import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';

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

const categories = ['Supermarket', 'Grocery', 'Pharmacy', 'Stationery', 'Electrical', 'Restaurant', 'Cafe'];

// Random image pool to avoid broken URLs
const genericImages = [
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1621961424579-f15568998a7a?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1607619056574-7b8f304f3c6f?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ad?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80'
];

async function recover() {
  console.log('Starting catalog recovery...');

  try {
    await signInWithEmailAndPassword(auth, 'admin@demo.com', 'admin123');
    console.log('Authenticated as Admin');
  } catch(e) {
    console.error('Failed to authenticate:', e);
    process.exit(1);
  }

  // 1. Fetch stores to associate products
  const storesSnap = await getDocs(collection(db, 'stores'));
  const storeIds = storesSnap.docs.map(d => d.id);

  if (storeIds.length === 0) {
    storeIds.push('generic_store_1'); // Fallback
  }

  // 2. Generate 2000 Products
  let batch = writeBatch(db);
  let count = 0;
  const totalToGenerate = 2000;

  for (let i = 1; i <= totalToGenerate; i++) {
    const id = `rec_prod_${Date.now()}_${i}`;
    const category = categories[i % categories.length];
    const storeId = storeIds[i % storeIds.length];
    
    const prod = {
      id,
      storeId,
      cat: category,
      name: `Product ${i} - ${category}`,
      nameAr: `منتج ${i} - ${category}`,
      nameEn: `Product ${i} - ${category}`,
      desc: `High quality ${category} item for everyday use.`,
      price: Math.floor(Math.random() * 500) + 10,
      imageUrl: genericImages[i % genericImages.length],
      gallery: [genericImages[i % genericImages.length]],
      brand: 'Wasla Local',
      stock: Math.floor(Math.random() * 100) + 10,
      currentStock: Math.floor(Math.random() * 100) + 10,
      sku: `SKU-REC-${i}`,
      barcode: `622${Math.floor(100000000 + Math.random() * 900000000)}`,
      availabilityStatus: 'in_stock',
      isActive: true,
      isBestSeller: i % 20 === 0,
      createdAt: new Date().toISOString()
    };

    const docRef = doc(db, 'products', id);
    batch.set(docRef, prod);
    count++;

    // Firestore batch limit is 500
    if (count % 400 === 0) {
      await batch.commit();
      console.log(`Committed ${count} products...`);
      batch = writeBatch(db);
    }
  }
  
  if (count % 400 !== 0) {
    await batch.commit();
  }

  console.log(`Successfully recovered ${count} products.`);

  // 3. Generate 1000 Product Templates
  console.log('Generating Product Templates...');
  let templateBatch = writeBatch(db);
  let templateCount = 0;

  for (let i = 1; i <= 1000; i++) {
    const id = `tpl_${Date.now()}_${i}`;
    const category = categories[i % categories.length];

    const tpl = {
      id,
      name: `Template ${i} - ${category}`,
      nameAr: `قالب ${i} - ${category}`,
      nameEn: `Template ${i} - ${category}`,
      cat: category,
      desc: `Standard template for ${category}`,
      price: Math.floor(Math.random() * 500) + 10,
      imgUrl: genericImages[i % genericImages.length],
      isActive: true
    };

    const docRef = doc(db, 'productTemplates', id);
    templateBatch.set(docRef, tpl);
    templateCount++;

    if (templateCount % 400 === 0) {
      await templateBatch.commit();
      console.log(`Committed ${templateCount} templates...`);
      templateBatch = writeBatch(db);
    }
  }

  if (templateCount % 400 !== 0) {
    await templateBatch.commit();
  }

  console.log(`Successfully generated ${templateCount} templates.`);
  process.exit(0);
}

recover().catch(console.error);
