import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { initialCategories } from '../src/data/categories';
import { initialStores } from '../src/data/stores';
import { initialProducts } from '../src/data/products';
import { initialBanners } from '../src/data/banners';

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

const coupons = [
  {
    id: 'cp1',
    code: 'SOUQ20',
    discountType: 'percentage',
    discountValue: 20,
    minOrder: 100,
    maxDiscount: 30,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    usageLimit: 100,
    usedCount: 12,
    isActive: true
  },
  {
    id: 'cp2',
    code: 'FREEFEE',
    discountType: 'free_delivery',
    discountValue: 0,
    minOrder: 50,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    usageLimit: 200,
    usedCount: 45,
    isActive: true
  },
  {
    id: 'cp3',
    code: 'EGP50',
    discountType: 'fixed',
    discountValue: 50,
    minOrder: 200,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    usageLimit: 50,
    usedCount: 2,
    isActive: true
  }
];

const deliveryZones = [
  { id: 'z1', name: 'ميت غراب', fee: 5, eta: '10-15 دقيقة' },
  { id: 'z2', name: 'السنبلاوين', fee: 15, eta: '20-30 دقيقة' },
  { id: 'z3', name: 'المنصورة', fee: 30, eta: '45-60 دقيقة' },
  { id: 'z4', name: 'تمي الأمديد', fee: 20, eta: '30-40 دقيقة' }
];

async function seed() {
  console.log('Starting seed process...');

  const adminEmail = 'admin@demo.com';
  const adminPass = 'admin123';
  let uid = '';

  try {
    console.log(`Attempting to sign in admin user: ${adminEmail}`);
    const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPass);
    uid = userCredential.user.uid;
    console.log(`Admin user signed in successfully (UID: ${uid})`);
  } catch (err: any) {
    console.log('Admin user sign in failed, attempting to create account...');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
      uid = userCredential.user.uid;
      console.log(`Admin user created successfully (UID: ${uid})`);
    } catch (createErr: any) {
      console.error('Failed to create admin user:', createErr);
      process.exit(1);
    }
  }

  // Create admin profile in users collection
  console.log('Creating admin profile document in users collection...');
  await setDoc(doc(db, 'users', uid), {
    uid,
    name: 'المدير العام',
    email: adminEmail,
    phone: '01011112222',
    role: 'admin',
    createdAt: new Date().toISOString()
  });

  // Seed categories
  console.log('Seeding categories...');
  for (const cat of initialCategories) {
    await setDoc(doc(db, 'categories', cat.id), cat);
  }

  // Seed stores
  console.log('Seeding stores...');
  for (const store of initialStores) {
    await setDoc(doc(db, 'stores', store.id), {
      ...store,
      coveredVillages: store.coveredVillages || ['ميت غراب', 'السنبلاوين', 'المنصورة', 'تمي الأمديد'],
      coveredCenters: store.coveredCenters || ['السنبلاوين', 'المنصورة'],
      deliveryFees: store.deliveryFees || { 'ميت غراب': 15, 'السنبلاوين': 20, 'المنصورة': 40, 'تمي الأمديد': 25 },
      etas: store.etas || { 'ميت غراب': '15 دقيقة', 'السنبلاوين': '25 دقيقة', 'المنصورة': '45 دقيقة', 'تمي الأمديد': '35 دقيقة' },
      breakTimes: store.breakTimes || [{ start: '14:00', end: '15:30' }],
      fridaySchedule: store.fridaySchedule || { isOpen: true, openTime: '13:00', closeTime: '23:00' },
      holidayMode: store.holidayMode !== undefined ? store.holidayMode : false,
      followersCount: store.followersCount || 0
    });
  }

  // Seed products
  console.log('Seeding products...');
  for (const prod of initialProducts) {
    await setDoc(doc(db, 'products', prod.id), prod);
  }

  // Seed banners
  console.log('Seeding banners...');
  for (const banner of initialBanners) {
    await setDoc(doc(db, 'banners', String(banner.id)), banner);
  }

  // Seed coupons
  console.log('Seeding coupons...');
  for (const coupon of coupons) {
    await setDoc(doc(db, 'coupons', coupon.id), coupon);
  }

  // Seed delivery zones
  console.log('Seeding delivery zones...');
  for (const zone of deliveryZones) {
    await setDoc(doc(db, 'deliveryZones', zone.id), zone);
  }

  console.log('Seeding completed successfully!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding process failed:', err);
  process.exit(1);
});
