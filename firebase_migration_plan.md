# Firebase Migration & Deployment Plan

This document details the step-by-step roadmap to transition Wasla Link from a client-side local storage engine to a live Firebase backend in Phase 8.

---

## Phase 8 Migration Checklist

```
[ ] STEP 1: Firebase Project Setup & CLI Init
[ ] STEP 2: Configure Firebase Authentication (Email + Phone)
[ ] STEP 3: Deploy Firestore Security Rules & Indexes
[ ] STEP 4: Deploy Storage Rules
[ ] STEP 5: Run Data Seeding Script (Local JSON -> Firestore)
[ ] STEP 6: Update Codebase Service Layer & Hooks
[ ] STEP 7: Performance Audit & Go-Live
```

---

## 1. Firebase Project Setup & CLI Init

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com).
2. Install the Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
3. Authenticate with Google:
   ```bash
   firebase login
   ```
4. Initialize Firebase in the root directory:
   ```bash
   firebase init
   ```
   * Select: `Firestore`, `Storage`, `Hosting`.
   * Bind to the newly created project.
   * Confirm configuration files: `firestore.rules`, `firestore.indexes.json`, `storage.rules`.

---

## 2. Authentication Setup

1. Open **Authentication** in the Firebase console.
2. Enable Sign-in providers:
   * **Email / Password**: For accounts, vendors, and admins.
   * **Phone Number**: Crucial for Egyptian customers and delivery drivers (using SMS OTP verification).
3. Update Auth state listeners in React (`src/contexts/AppContext.tsx`):
   ```typescript
   import { getAuth, onAuthStateChanged } from 'firebase/auth';
   
   useEffect(() => {
     const auth = getAuth();
     return onAuthStateChanged(auth, async (firebaseUser) => {
       if (firebaseUser) {
         // Load user profile document from Firestore '/users/{uid}'
       } else {
         // Set currentUser to null
       }
     });
   }, []);
   ```

---

## 3. Data Seeding (Local -> Firestore)

We will write a Node.js script in `/scripts/seed.js` using the Firebase Admin SDK to upload categories and mock products/stores to Firestore.

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const initialStores = require('../src/data/stores.json'); // Extract mock stores
const initialProducts = require('../src/data/products.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedData() {
  // 1. Seed Stores
  for (const store of initialStores) {
    await db.collection('stores').doc(store.id).set(store);
    console.log(`Seeded store: ${store.name}`);
  }
  
  // 2. Seed Products
  for (const product of initialProducts) {
    await db.collection('products').doc(product.id).set(product);
    console.log(`Seeded product: ${product.name}`);
  }
}

seedData().then(() => console.log('Seeding Complete!'));
```

---

## 4. Codebase Service Upgrades

To finalize the integration, the local implementation files must be switched to real Firebase APIs:

### 1. Media Upload (`src/services/media.service.ts`)
* **Before**: Converts file to Base64 and returns it.
* **After**: Uploads the WebP blob to Firebase Storage and returns the download URL.
```typescript
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const mediaService = {
  uploadImage: async (file: File, folderPath: string): Promise<string> => {
    const compressedBlob = await compressImage(file); // Enforces WebP, 1200px, 0.75 quality
    const storage = getStorage();
    const fileRef = ref(storage, `${folderPath}/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, compressedBlob);
    return getDownloadURL(fileRef);
  }
};
```

### 2. Live Synchronization (`src/contexts/AppContext.tsx`)
Replace local state updates with Firestore real-time queries.
```typescript
import { collection, onSnapshot, query, where } from 'firebase/firestore';

// Listen to products in real-time
useEffect(() => {
  const db = getFirestore();
  const q = query(collection(db, 'products'), where('availabilityStatus', '!=', 'archived'));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const prodsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setProducts(prodsList);
  });
  return unsubscribe;
}, []);
```
This migration design keeps interface components untouched while replacing the underlying data sync layer completely.
