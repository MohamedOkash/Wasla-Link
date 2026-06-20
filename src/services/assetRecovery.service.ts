import { db } from './firebase';
import { collection, doc, getDoc, getDocs, updateDoc, query, where, addDoc, Timestamp } from 'firebase/firestore';
import { Product } from '../types/product.types';
import { placeholderService } from './placeholder.service';

class AssetRecoveryService {
  /**
   * Browser-safe check if an image URL is broken
   */
  checkBrokenAsset(url: string | undefined | null): Promise<boolean> {
    if (!url) return Promise.resolve(true);
    if (url.startsWith('data:')) return Promise.resolve(false);
    
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      // Set a timeout of 5 seconds for recovery checking
      const timer = setTimeout(() => {
        resolve(true);
      }, 5000);

      img.onload = () => {
        clearTimeout(timer);
        resolve(false);
      };
      img.onerror = () => {
        clearTimeout(timer);
        resolve(true);
      };
    });
  }

  /**
   * Recovers primary image URL using cascading fallbacks
   */
  async recoverPrimaryImage(product: Product): Promise<string> {
    // 1. Check Product Image (imgUrl or imageUrl or primaryImage)
    const primary = product.primaryImage || product.imageUrl || product.imgUrl;
    if (primary) {
      const isBroken = await this.checkBrokenAsset(primary);
      if (!isBroken) return primary;
    }

    // 2. Check Template Image (if templateId exists)
    if (product.templateId) {
      try {
        const templateRef = doc(db, 'productTemplates', product.templateId);
        const templateSnap = await getDoc(templateRef);
        if (templateSnap.exists()) {
          const temp = templateSnap.data() as Product;
          const tempImg = temp.primaryImage || temp.imageUrl || temp.imgUrl;
          if (tempImg) {
            const isBroken = await this.checkBrokenAsset(tempImg);
            if (!isBroken) return tempImg;
          }
        }
      } catch (err) {
        console.error('Error fetching template for recovery:', err);
      }
    }

    // 3. Category Placeholder
    if (product.categoryName) {
      return placeholderService.getPlaceholderForCategory(product.categoryName);
    }
    if (product.categoryId) {
      return placeholderService.getPlaceholderForCategory(product.categoryId);
    }
    if (product.cat) {
      return placeholderService.getPlaceholderForCategory(product.cat);
    }

    // 4. Global Placeholder
    return placeholderService.getPlaceholder('default', product.nameAr || product.name, product.nameEn || product.name);
  }

  /**
   * Recovers gallery images with fallbacks
   */
  async recoverGalleryImages(product: Product): Promise<string[]> {
    const gallery = product.galleryImages || product.images || product.gallery || [];
    const validImages: string[] = [];

    // Filter out broken images
    for (const url of gallery) {
      const isBroken = await this.checkBrokenAsset(url);
      if (!isBroken) {
        validImages.push(url);
      }
    }

    if (validImages.length > 0) {
      return validImages;
    }

    // Check template gallery as fallback
    if (product.templateId) {
      try {
        const templateRef = doc(db, 'productTemplates', product.templateId);
        const templateSnap = await getDoc(templateRef);
        if (templateSnap.exists()) {
          const temp = templateSnap.data() as Product;
          const tempGallery = temp.galleryImages || temp.images || temp.gallery || [];
          for (const url of tempGallery) {
            const isBroken = await this.checkBrokenAsset(url);
            if (!isBroken) {
              validImages.push(url);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching template gallery for recovery:', err);
      }
    }

    return validImages;
  }

  /**
   * Repair a specific product's missing or broken images
   */
  async repairAsset(productId: string, isTemplate = false): Promise<Product> {
    const docRef = doc(db, isTemplate ? 'productTemplates' : 'products', productId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error(`Product not found with ID: ${productId}`);
    }

    const product = { id: snap.id, ...snap.data() } as Product;
    const originalImage = product.primaryImage || product.imageUrl || product.imgUrl;
    const originalGallery = product.galleryImages || product.images || product.gallery || [];

    const recoveredPrimary = await this.recoverPrimaryImage(product);
    const recoveredGallery = await this.recoverGalleryImages(product);

    const hasChanged = 
      originalImage !== recoveredPrimary || 
      JSON.stringify(originalGallery) !== JSON.stringify(recoveredGallery);

    if (hasChanged) {
      const updateData: Partial<Product> = {
        primaryImage: recoveredPrimary,
        imageUrl: recoveredPrimary,
        imgUrl: recoveredPrimary,
        galleryImages: recoveredGallery,
        images: recoveredGallery,
        gallery: recoveredGallery,
        assetStatus: 'ready',
        lastAssetUpdate: new Date().toISOString(),
      };

      await updateDoc(docRef, updateData);
      
      // Log this recovery inside the Firestore /assets collection
      await addDoc(collection(db, 'assets'), {
        productTemplateId: isTemplate ? productId : (product.templateId || ''),
        productId: isTemplate ? '' : productId,
        imageType: 'primary',
        imageUrl: recoveredPrimary,
        uploadedBy: 'system_recovery',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        version: product.assetVersion || 1,
        description: 'Auto-repaired by Asset Recovery Service'
      });

      return { ...product, ...updateData };
    }

    return product;
  }

  /**
   * Runs a complete scan over all product templates and vendor products
   */
  async runRecoveryScan(): Promise<{ totalScanned: number; totalRepaired: number }> {
    let totalScanned = 0;
    let totalRepaired = 0;

    try {
      // 1. Scan Templates
      const templatesSnap = await getDocs(collection(db, 'productTemplates'));
      for (const d of templatesSnap.docs) {
        totalScanned++;
        const prod = { id: d.id, ...d.data() } as Product;
        const originalImage = prod.primaryImage || prod.imageUrl || prod.imgUrl;
        
        const isBroken = await this.checkBrokenAsset(originalImage);
        if (isBroken) {
          await this.repairAsset(d.id, true);
          totalRepaired++;
        }
      }

      // 2. Scan Live Products
      const productsSnap = await getDocs(collection(db, 'products'));
      for (const d of productsSnap.docs) {
        totalScanned++;
        const prod = { id: d.id, ...d.data() } as Product;
        const originalImage = prod.primaryImage || prod.imageUrl || prod.imgUrl;
        
        const isBroken = await this.checkBrokenAsset(originalImage);
        if (isBroken) {
          await this.repairAsset(d.id, false);
          totalRepaired++;
        }
      }
    } catch (err) {
      console.error('Error during recovery scan:', err);
    }

    return { totalScanned, totalRepaired };
  }
}

export const assetRecoveryService = new AssetRecoveryService();
export default assetRecoveryService;
