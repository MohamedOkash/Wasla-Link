import { db } from '../firebase';
import { doc, setDoc, updateDoc, deleteDoc, writeBatch, collection, getDoc } from 'firebase/firestore';

export class AdminService {
  async approveDriver(driverId: string, vehicleType: string) {
    const { functions } = await import('../firebase');
    const { httpsCallable } = await import('firebase/functions');
    const approveDriverFn = httpsCallable(functions, 'approveDriver');
    await approveDriverFn({ driverId, vehicleType });
  }

  async processSettlement(req: any, action: 'approved' | 'rejected' | 'paid') {
    const { functions } = await import('../firebase');
    const { httpsCallable } = await import('firebase/functions');
    const processSettlementFn = httpsCallable(functions, 'processSettlement');
    await processSettlementFn({ requestId: req.id, action });
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
