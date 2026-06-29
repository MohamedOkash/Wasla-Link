import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getCountFromServer, query, where } from 'firebase/firestore';

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
const db = getFirestore(app);

async function runAudit() {
  try {
    const colls = ['users', 'stores', 'products', 'orders', 'notifications', 'driverEarnings'];
    for (const c of colls) {
      const snap = await getCountFromServer(collection(db, c));
      console.log(c + ': ' + snap.data().count);
    }

    // Drivers count
    const driversQuery = query(collection(db, 'users'), where('role', '==', 'driver'));
    const dSnap = await getCountFromServer(driversQuery);
    console.log('drivers: ' + dSnap.data().count);

    // orderHistory count
    const hSnap = await getCountFromServer(collection(db, 'orderHistory'));
    console.log('orderHistory: ' + hSnap.data().count);
    
  } catch (err) {
    console.error(err.message);
  }
}

runAudit();
