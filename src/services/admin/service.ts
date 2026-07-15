import { db } from '../firebase';
import { doc, setDoc, updateDoc, deleteDoc, writeBatch, collection, getDoc } from 'firebase/firestore';

export class AdminService {
  async approveDriver(driverId: string, vehicleType: string) {
    const batch = writeBatch(db);
    
    // 1. Update status in users collection to 'driver'
    batch.update(doc(db, 'users', driverId), {
      role: 'driver'
    });
    
    // 2. Update status in drivers collection to 'approved'
    batch.update(doc(db, 'drivers', driverId), {
      status: 'approved',
      isApproved: true,
      isActive: true,
      deliveryMethod: vehicleType,
      updatedAt: new Date().toISOString()
    });
    
    // 3. Initialize Wallet
    batch.set(doc(db, 'driverWallets', driverId), {
      driverId,
      balance: 0,
      cashCollected: 0,
      cashRemaining: 0,
      cashPending: 0,
      cashDelivered: 0,
      totalEarnings: 0,
      totalWithdrawals: 0,
      updatedAt: new Date().toISOString()
    });
    
    // 4. Initialize Ledger
    batch.set(doc(db, 'driverLedgers', driverId), {
      driverId,
      transactions: [],
      updatedAt: new Date().toISOString()
    });
    
    // 5. Initialize Stats
    batch.set(doc(db, 'driverStats', driverId), {
      driverId,
      completedToday: 0,
      completedThisWeek: 0,
      completedThisMonth: 0,
      totalDeliveries: 0,
      lateDeliveries: 0,
      cancelledDeliveries: 0,
      rating: 5.0,
      ratingCount: 0,
      score: 100,
      tier: 'bronze',
      updatedAt: new Date().toISOString()
    });

    await batch.commit();
  }

  async inviteDriver(payload: { email: string; name: string; phone: string; governorate: string; city: string; village: string; deliveryMethod: string; password?: string }) {
    const { initializeApp } = await import('firebase/app');
    const { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } = await import('firebase/auth');
    const { firebaseConfig } = await import('../firebase');
    
    const tempPassword = payload.password || (Math.random().toString(36).substring(2, 10) + 'Aa1!');
    const tempAppName = `tempApp_${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(tempAuth, payload.email, tempPassword);
      const uid = userCredential.user.uid;
      
      const batch = writeBatch(db);
      
      batch.set(doc(db, 'users', uid), {
        uid,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        role: 'customer',
        createdAt: new Date().toISOString()
      });
      
      batch.set(doc(db, 'drivers', uid), {
        uid,
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        governorate: payload.governorate,
        city: payload.city,
        village: payload.village,
        deliveryMethod: payload.deliveryMethod,
        profilePhotoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.name)}&background=FF9F00&color=fff&size=128`,
        status: 'pending_review',
        role: 'driver',
        isApproved: false,
        isActive: false,
        rating: 5.0,
        completedOrders: 0,
        totalDeliveries: 0,
        totalEarnings: 0,
        currentOrderId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        availability: 'offline',
        agreementAccepted: false,
        trainingCompleted: false,
        tier: 'bronze',
        score: 100
      });
      
      await batch.commit();
      
      if (!payload.password) {
        await sendPasswordResetEmail(tempAuth, payload.email);
      }
      
      const { deleteApp } = await import('firebase/app');
      await deleteApp(tempApp);
      
      return {
        success: true,
        password: tempPassword,
        resetLink: payload.password 
          ? `Driver created directly with password: ${tempPassword}`
          : `Password reset email sent directly to ${payload.email}`
      };
    } catch (err: any) {
      try {
        const { deleteApp } = await import('firebase/app');
        await deleteApp(tempApp);
      } catch(e){}
      throw err;
    }
  }

  async processSettlement(req: any, action: 'approved' | 'rejected' | 'paid') {
    await updateDoc(doc(db, 'settlementRequests', req.id), {
      status: action,
      updatedAt: new Date().toISOString()
    });
  }

  async createCatalogItem(colName: string, id: string, payload: any) {
    await setDoc(doc(db, colName, id), payload);
  }

  async deleteCatalogItem(colName: string, id: string) {
    await deleteDoc(doc(db, colName, id));
  }

  async importTemplates(templates: any[]) {
    const batch = writeBatch(db);
    templates.forEach(t => batch.set(doc(db, 'productTemplates', t.id), t));
    await batch.commit();
  }

  async bulkSyncCatalog(toSync: any[], templatesMap: Map<string, any>) {
    const batchLimit = 400;
    for (let i = 0; i < toSync.length; i += batchLimit) {
      const batch = writeBatch(db);
      const chunk = toSync.slice(i, i + batchLimit);
      
      chunk.forEach(p => {
        const matchingTemplate = templatesMap.get(p.templateId!);
        if (matchingTemplate) {
          batch.update(doc(db, 'products', p.id), {
            name: matchingTemplate.nameAr || matchingTemplate.name,
            nameAr: matchingTemplate.nameAr,
            nameEn: matchingTemplate.nameEn,
            brand: matchingTemplate.brand,
            desc: matchingTemplate.description || matchingTemplate.desc,
            description: matchingTemplate.description || matchingTemplate.desc,
            imgUrl: matchingTemplate.imgUrl || matchingTemplate.imageUrl,
            imageUrl: matchingTemplate.imageUrl || matchingTemplate.imgUrl,
            categoryName: matchingTemplate.categoryName,
            cat: matchingTemplate.cat,
            updatedAt: new Date().toISOString()
          });
        }
      });
      await batch.commit();
    }
  }

  async updateProductAsset(productId: string, updates: any) {
    await updateDoc(doc(db, 'products', productId), updates);
  }
  async updateTemplateAsset(templateId: string, updates: any) {
    await updateDoc(doc(db, 'productTemplates', templateId), updates);
  }
}

export const adminService = new AdminService();
