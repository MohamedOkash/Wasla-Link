import { db } from '../firebase';
import { doc, setDoc, updateDoc, deleteDoc, writeBatch, collection, getDoc } from 'firebase/firestore';

export class AdminService {
  async approveDriver(driverId: string, vehicleType: string) {
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', driverId), {
      role: 'driver',
      vehicleType: vehicleType,
    });
    batch.update(doc(db, 'drivers', driverId), {
      status: 'approved',
      isApproved: true,
      isActive: true,
      availability: 'offline'
    });
    await batch.commit();
  }

  async processSettlement(req: any, action: 'approved' | 'rejected' | 'paid') {
    const batch = writeBatch(db);
    
    const isVendor = req.userType === 'vendor';
    const walletCollection = isVendor ? 'vendorWallets' : 'driverWallets';
    const txCollection = isVendor ? 'vendorTransactions' : 'driverTransactions';

    const walletRef = doc(db, walletCollection, req.userId);
    const walletSnap = await getDoc(walletRef);
    const wData = walletSnap.exists() ? walletSnap.data() : { balance: 0, pendingBalance: 0, paidBalance: 0 };
    
    let newBalance = wData.balance || 0;
    let newPending = wData.pendingBalance || 0;
    let newPaid = wData.paidBalance || 0;

    if (action === 'approved') {
      newPending += req.amount;
      newBalance -= req.amount;
    } else if (action === 'rejected') {
      if (req.status === 'approved') {
        newPending -= req.amount;
        newBalance += req.amount;
      }
    } else if (action === 'paid') {
      if (req.status === 'approved') {
        newPending -= req.amount;
      } else {
        newBalance -= req.amount;
      }
      newPaid += req.amount;

      const txRef = doc(collection(db, txCollection));
      batch.set(txRef, {
        id: txRef.id,
        type: isVendor ? 'vendor_settlement' : 'driver_withdrawal',
        referenceId: req.id,
        [isVendor ? 'vendorId' : 'driverId']: req.userId,
        amount: -req.amount,
        currency: 'EGP',
        status: 'completed',
        createdAt: new Date().toISOString(),
        metadata: { note: 'Settlement Paid' }
      });
    }

    batch.set(walletRef, {
      balance: newBalance,
      pendingBalance: newPending,
      paidBalance: newPaid,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    batch.update(doc(db, 'settlementRequests', req.id), {
      status: action,
      processedAt: new Date().toISOString()
    });

    await batch.commit();
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
