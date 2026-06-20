import { db } from './firebase';
import { collection, doc, getDoc, getDocs, updateDoc, query, where, writeBatch, Timestamp } from 'firebase/firestore';
import { Product } from '../types/product.types';

class CatalogSyncService {
  /**
   * Syncs a template's metadata and media to all its product copies in stores
   */
  async syncTemplateToProducts(templateId: string): Promise<number> {
    try {
      const templateRef = doc(db, 'productTemplates', templateId);
      const tempSnap = await getDoc(templateRef);
      if (!tempSnap.exists()) return 0;

      const template = { id: tempSnap.id, ...tempSnap.data() } as Product;
      const templateVersion = template.templateImageVersion || template.assetVersion || 1;

      // Find all vendor product copies
      const productsQuery = query(
        collection(db, 'products'),
        where('templateId', '==', templateId)
      );
      const productsSnap = await getDocs(productsQuery);
      
      let syncedCount = 0;
      const batch = writeBatch(db);

      for (const d of productsSnap.docs) {
        const prodRef = doc(db, 'products', d.id);
        const data = d.data();

        // Prepare sync payload (strictly overwriting master fields only)
        const updateData: Partial<Product> = {
          name: template.name || data.name,
          nameAr: template.nameAr || data.nameAr || template.name,
          nameEn: template.nameEn || data.nameEn || template.name,
          brand: template.brand || data.brand,
          productBrand: template.brand || data.productBrand,
          desc: template.desc || data.desc,
          description: template.description || data.description || template.desc,
          primaryImage: template.primaryImage || template.imageUrl || template.imgUrl || '',
          imageUrl: template.primaryImage || template.imageUrl || template.imgUrl || '',
          imgUrl: template.primaryImage || template.imageUrl || template.imgUrl || '',
          galleryImages: template.galleryImages || template.images || template.gallery || [],
          images: template.galleryImages || template.images || template.gallery || [],
          gallery: template.galleryImages || template.images || template.gallery || [],
          assetVersion: templateVersion,
          syncStatus: 'synced',
          lastAssetUpdate: new Date().toISOString()
        };

        batch.update(prodRef, updateData);
        syncedCount++;
      }

      if (syncedCount > 0) {
        await batch.commit();
      }

      // Mark the asset revision sync status inside /assets
      const assetsQuery = query(
        collection(db, 'assets'),
        where('productTemplateId', '==', templateId),
        where('version', '==', templateVersion)
      );
      const assetsSnap = await getDocs(assetsQuery);
      if (!assetsSnap.empty) {
        const assetDocRef = doc(db, 'assets', assetsSnap.docs[0].id);
        await updateDoc(assetDocRef, { needsSync: false, updatedAt: Timestamp.now() });
      }

      return syncedCount;
    } catch (err) {
      console.error('Error syncing template to products:', err);
      return 0;
    }
  }

  /**
   * Marks products outdated if their version is less than the template version
   */
  async markOutdatedProducts(templateId: string, templateVersion: number): Promise<number> {
    try {
      const q = query(
        collection(db, 'products'),
        where('templateId', '==', templateId)
      );
      const snap = await getDocs(q);
      let count = 0;
      const batch = writeBatch(db);

      for (const d of snap.docs) {
        const prod = d.data() as Product;
        const currentVer = prod.assetVersion || 0;
        if (currentVer < templateVersion) {
          batch.update(doc(db, 'products', d.id), {
            syncStatus: 'outdated'
          });
          count++;
        }
      }

      if (count > 0) {
        await batch.commit();
      }
      return count;
    } catch (err) {
      console.error('Error marking products outdated:', err);
      return 0;
    }
  }

  /**
   * Syncs a single product instance to its master template
   */
  async syncSingleProduct(productId: string, templateId: string): Promise<boolean> {
    try {
      const tempSnap = await getDoc(doc(db, 'productTemplates', templateId));
      if (!tempSnap.exists()) return false;

      const template = { id: tempSnap.id, ...tempSnap.data() } as Product;
      const templateVersion = template.templateImageVersion || template.assetVersion || 1;

      const prodRef = doc(db, 'products', productId);
      const prodSnap = await getDoc(prodRef);
      if (!prodSnap.exists()) return false;
      const prodData = prodSnap.data();

      const updateData: Partial<Product> = {
        name: template.name || prodData.name,
        nameAr: template.nameAr || prodData.nameAr || template.name,
        nameEn: template.nameEn || prodData.nameEn || template.name,
        brand: template.brand || prodData.brand,
        productBrand: template.brand || prodData.productBrand,
        desc: template.desc || prodData.desc,
        description: template.description || prodData.description || template.desc,
        primaryImage: template.primaryImage || template.imageUrl || template.imgUrl || '',
        imageUrl: template.primaryImage || template.imageUrl || template.imgUrl || '',
        imgUrl: template.primaryImage || template.imageUrl || template.imgUrl || '',
        galleryImages: template.galleryImages || template.images || template.gallery || [],
        images: template.galleryImages || template.images || template.gallery || [],
        gallery: template.galleryImages || template.images || template.gallery || [],
        assetVersion: templateVersion,
        syncStatus: 'synced',
        lastAssetUpdate: new Date().toISOString()
      };

      await updateDoc(prodRef, updateData);
      return true;
    } catch (err) {
      console.error('Error syncing single product:', err);
      return false;
    }
  }

  /**
   * Scans all templates and syncs outdated product documents
   */
  async syncAllProducts(): Promise<{ totalTemplates: number; totalSynced: number }> {
    try {
      const templatesSnap = await getDocs(collection(db, 'productTemplates'));
      let totalTemplates = 0;
      let totalSynced = 0;

      for (const tDoc of templatesSnap.docs) {
        totalTemplates++;
        const temp = tDoc.data() as Product;
        const templateVersion = temp.templateImageVersion || temp.assetVersion || 1;

        // Sync outdated copies of this template
        const outdatedQuery = query(
          collection(db, 'products'),
          where('templateId', '==', tDoc.id)
        );
        const productsSnap = await getDocs(outdatedQuery);

        for (const pDoc of productsSnap.docs) {
          const prod = pDoc.data() as Product;
          const currentVer = prod.assetVersion || 0;
          if (currentVer < templateVersion || prod.syncStatus === 'outdated') {
            const success = await this.syncSingleProduct(pDoc.id, tDoc.id);
            if (success) {
              totalSynced++;
            }
          }
        }
      }

      return { totalTemplates, totalSynced };
    } catch (err) {
      console.error('Error in syncAllProducts:', err);
      return { totalTemplates: 0, totalSynced: 0 };
    }
  }
}

export const catalogSyncService = new CatalogSyncService();
export default catalogSyncService;
