import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, writeBatch } from 'firebase/firestore';

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

const dict: Record<string, string> = {
  'سوبر ماركت': 'Supermarket',
  'بقالة': 'Grocery',
  'صيدلية': 'Pharmacy',
  'مكتبة': 'Stationery',
  'كهرباء': 'Electrical',
  'مطعم': 'Restaurant',
  'كافيه': 'Cafe',
  'ألبان وأجبان': 'Dairy & Cheese',
  'مشروبات': 'Beverages',
  'سناكس وشيبسي': 'Snacks & Chips',
  'أرز ومكرونة': 'Rice & Pasta',
  'زيوت وسمن': 'Oils & Ghee',
  'مجمدات': 'Frozen Foods',
  'منظفات': 'Detergents',
  'مسكنات': 'Painkillers',
  'نزلات برد': 'Cold & Flu',
  'فيتامينات': 'Vitamins',
  'إسعافات أولية': 'First Aid',
  'عناية شخصية': 'Personal Care',
  'أطفال': 'Kids',
  'مخبوزات': 'Bakery',
  'أدوات مكتبية': 'Office Supplies',
  'أدوات مدرسية': 'School Supplies',
  'معدات كهربائية': 'Electrical Equipment',
  'منتج': 'Product',
  'قالب': 'Template',
  'جهينة': 'Juhayna',
  'دومتي': 'Domty',
  'كوكاكولا': 'Coca-Cola',
  'نستله': 'Nestle',
  'شيبسي': 'Chipsy',
  'كادبوري': 'Cadbury',
  'الضحى': 'Al-Doha',
  'ريجينا': 'Regina',
  'كريستال': 'Crystal',
  'بسمة': 'Basma',
  'أريال': 'Ariel',
  'دوف': 'Dove',
  'بنادول': 'Panadol',
  'بامبرز': 'Pampers',
  'لوريال': 'Loreal',
  'فابر كاستل': 'Faber-Castell',
  'روترنج': 'Rotring',
  'شنايدر': 'Schneider',
  'فينوس': 'Venus',
  'السويدي': 'El Sewedy',
  'حليب': 'Milk',
  'قهوة': 'Coffee',
  'أرز': 'Rice'
};

function translateText(text: string): string {
  if (!text) return '';
  let eng = text;
  Object.keys(dict).forEach(key => {
    eng = eng.replace(new RegExp(key, 'g'), dict[key]);
  });
  // Replace anything that is still arabic with a generic placeholder or keep it if we can't translate
  // To avoid fully unreadable English, we just map what we can.
  return eng;
}

function generateKeywords(p: any): string[] {
  const words = new Set<string>();
  const addTokens = (str: string) => {
    if (str) {
      str.toLowerCase().split(/[\s-]+/).forEach(w => {
        if (w.length > 2) words.add(w);
      });
    }
  };
  addTokens(p.nameAr);
  addTokens(p.nameEn);
  addTokens(p.categoryAr);
  addTokens(p.categoryEn);
  addTokens(p.brandAr);
  addTokens(p.brandEn);
  return Array.from(words);
}

function slugify(text: string): string {
  if (!text) return '';
  return text.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^\w\u0600-\u06FF-]/g, '');
}

async function run() {
  await signInWithEmailAndPassword(auth, 'admin@demo.com', 'admin123');

  const productsSnap = await getDocs(collection(db, 'products'));
  const products = productsSnap.docs.map(d => ({id: d.id, ...d.data()}));
  const beforeCount = products.length;

  let batch = writeBatch(db);
  let patchedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < products.length; i++) {
    const p: any = products[i];
    
    // Existing values fallback
    const baseName = p.name || p.nameAr || p.nameEn || '';
    const baseDesc = p.desc || p.description || p.descriptionAr || p.descriptionEn || p.descEn || '';
    const baseCat = p.cat || p.category || p.categoryAr || p.categoryEn || p.catEn || '';
    const baseBrand = p.brand || p.brandAr || p.brandEn || 'Generic';

    const update: any = {};
    let needsPatch = false;

    // nameAr / nameEn
    if (!p.nameAr) { update.nameAr = baseName; needsPatch = true; }
    if (!p.nameEn) { update.nameEn = translateText(baseName); needsPatch = true; }

    // descriptionAr / descriptionEn
    if (!p.descriptionAr) { update.descriptionAr = baseDesc; needsPatch = true; }
    if (!p.descriptionEn) { update.descriptionEn = translateText(baseDesc); needsPatch = true; }

    // categoryAr / categoryEn
    if (!p.categoryAr) { update.categoryAr = baseCat; needsPatch = true; }
    if (!p.categoryEn) { update.categoryEn = translateText(baseCat); needsPatch = true; }

    // brandAr / brandEn
    if (!p.brandAr) { update.brandAr = baseBrand; needsPatch = true; }
    if (!p.brandEn) { update.brandEn = translateText(baseBrand); needsPatch = true; }

    // slug & keywords
    if (!p.slug) { 
      update.slug = slugify(p.nameEn || update.nameEn || baseName); 
      needsPatch = true; 
    }
    
    // We will regenerate searchKeywords if it's missing or if we just added English fields
    if (!p.searchKeywords || p.searchKeywords.length === 0 || needsPatch) {
      update.searchKeywords = generateKeywords({ ...p, ...update });
      needsPatch = true;
    }

    if (needsPatch) {
      try {
        const docRef = doc(db, 'products', p.id);
        batch.update(docRef, update);
        patchedCount++;
      } catch (err) {
        failedCount++;
      }
    }

    if (patchedCount > 0 && patchedCount % 400 === 0) {
      await batch.commit();
      batch = writeBatch(db);
    }
  }

  if (patchedCount % 400 !== 0) {
    await batch.commit();
  }

  const finalSnap = await getDocs(collection(db, 'products'));
  const afterCount = finalSnap.size;

  console.log('--- Catalog Migration Report ---');
  console.log(`Products Scanned: ${beforeCount}`);
  console.log(`Products Patched: ${patchedCount}`);
  console.log(`Products Failed: ${failedCount}`);
  console.log(`Firestore Count Before: ${beforeCount}`);
  console.log(`Firestore Count After: ${afterCount}`);

  process.exit(0);
}

run().catch(console.error);
