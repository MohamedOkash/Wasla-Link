import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, db } from './firebase';
import { collection, doc, addDoc, getDoc, updateDoc, Timestamp, setDoc, query, where, getDocs } from 'firebase/firestore';

class MediaService {
  private urlCache: Record<string, string> = {};

  compressImage(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.75): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas blob generation failed'));
            }
          }, 'image/webp', quality);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  }

  async uploadImage(file: File, folderPath: string = 'uploads'): Promise<string> {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image size exceeds 5MB limit');
    }

    const cacheKey = `${file.name}_${file.size}_${file.lastModified}`;
    if (this.urlCache[cacheKey]) {
      return this.urlCache[cacheKey];
    }

    const compressedBlob = await this.compressImage(file);
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.webp`;
    const storageRef = ref(storage, `${folderPath}/${fileName}`);
    await uploadBytes(storageRef, compressedBlob, { contentType: 'image/webp' });
    const url = await getDownloadURL(storageRef);
    this.urlCache[cacheKey] = url;
    return url;
  }

  async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      if (!imageUrl || !imageUrl.includes('firebasestorage')) return true;
      const fileRef = ref(storage, imageUrl);
      await deleteObject(fileRef);
      return true;
    } catch (err) {
      console.error('Error deleting image from storage:', err);
      return false;
    }
  }

  getImageUrl(key: string): string {
    return key;
  }

  // --- MEDIA SERVICE 3.0 FUNCTIONS ---

  async uploadProductImage(file: File, path: string = 'productImages'): Promise<string> {
    return this.uploadImage(file, path);
  }

  async uploadGalleryImages(files: FileList | File[], path: string = 'productImages'): Promise<string[]> {
    const list = Array.from(files);
    const urls: string[] = [];
    for (const f of list) {
      const url = await this.uploadImage(f, path);
      urls.push(url);
    }
    return urls;
  }

  async replaceAsset(oldUrl: string, newFile: File, path: string = 'productImages'): Promise<string> {
    if (oldUrl) {
      await this.deleteImage(oldUrl);
    }
    return this.uploadImage(newFile, path);
  }

  async deleteAsset(url: string): Promise<boolean> {
    return this.deleteImage(url);
  }

  async generateImageMetadata(file: File): Promise<{ size: number; width: number; height: number; type: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          resolve({
            size: file.size,
            width: img.width,
            height: img.height,
            type: 'image/webp'
          });
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  }

  /**
   * Tracks revisions and creates a version log in /assets
   */
  async createAssetVersion(
    templateId: string,
    primaryImage: string,
    galleryImages: string[],
    userId: string
  ): Promise<number> {
    // 1. Fetch current template version
    const tempRef = doc(db, 'productTemplates', templateId);
    const snap = await getDoc(tempRef);
    let currentVersion = 0;
    
    if (snap.exists()) {
      const data = snap.data();
      currentVersion = data.templateImageVersion || data.assetVersion || 0;
    }

    const nextVersion = currentVersion + 1;

    // 2. Update Template Version
    await updateDoc(tempRef, {
      templateImageVersion: nextVersion,
      assetVersion: nextVersion,
      primaryImage: primaryImage,
      imageUrl: primaryImage,
      imgUrl: primaryImage,
      galleryImages: galleryImages,
      images: galleryImages,
      gallery: galleryImages,
      assetStatus: 'ready',
      lastAssetUpdate: new Date().toISOString()
    });

    // 3. Write Revision document in /assets collection
    const assetRef = doc(collection(db, 'assets'));
    await setDoc(assetRef, {
      id: assetRef.id,
      productTemplateId: templateId,
      version: nextVersion,
      imageUrl: primaryImage,
      galleryImages: galleryImages,
      needsSync: true,
      updatedAt: Timestamp.now(),
      updatedBy: userId || 'admin'
    });

    return nextVersion;
  }

  /**
   * Sync template asset to product copy
   */
  async syncAssetVersion(productId: string, templateId: string): Promise<boolean> {
    try {
      const tempRef = doc(db, 'productTemplates', templateId);
      const tempSnap = await getDoc(tempRef);
      if (!tempSnap.exists()) return false;

      const tempData = tempSnap.data();
      const templateVersion = tempData.templateImageVersion || tempData.assetVersion || 1;
      const primaryImage = tempData.primaryImage || tempData.imageUrl || tempData.imgUrl || '';
      const galleryImages = tempData.galleryImages || tempData.images || tempData.gallery || [];

      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        primaryImage: primaryImage,
        imageUrl: primaryImage,
        imgUrl: primaryImage,
        galleryImages: galleryImages,
        images: galleryImages,
        gallery: galleryImages,
        assetVersion: templateVersion,
        syncStatus: 'synced',
        assetStatus: primaryImage ? 'ready' : 'missing',
        lastAssetUpdate: new Date().toISOString()
      });

      return true;
    } catch (err) {
      console.error('Error syncing asset version:', err);
      return false;
    }
  }
}

export const mediaService = new MediaService();
export default mediaService;
