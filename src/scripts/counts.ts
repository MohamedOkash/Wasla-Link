import { app } from '../services/firebase';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const db = getFirestore(app);

async function getCounts() {
  try {
    const usersCount = (await getDocs(collection(db, 'users'))).size;
    const storesCount = (await getDocs(collection(db, 'stores'))).size;
    const productsCount = (await getDocs(collection(db, 'products'))).size;
    const productTemplatesCount = (await getDocs(collection(db, 'productTemplates'))).size;
    const categoriesCount = (await getDocs(collection(db, 'categories'))).size;
    const brandsCount = (await getDocs(collection(db, 'brands'))).size;
    const ordersCount = (await getDocs(collection(db, 'orders'))).size;

    console.log("=== FIREBASE ACTUAL COUNTS ===");
    console.log(`users: ${usersCount}`);
    console.log(`stores: ${storesCount}`);
    console.log(`products: ${productsCount}`);
    console.log(`productTemplates: ${productTemplatesCount}`);
    console.log(`categories: ${categoriesCount}`);
    console.log(`brands: ${brandsCount}`);
    console.log(`orders: ${ordersCount}`);
    console.log("==============================");
    process.exit(0);
  } catch (error) {
    console.error("Error fetching counts:", error);
    process.exit(1);
  }
}

getCounts();
