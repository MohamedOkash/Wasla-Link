import { db } from '../../services/firebase';
import { doc, writeBatch, updateDoc, addDoc, collection, deleteDoc, setDoc } from 'firebase/firestore';

export class VendorService {
  async bulkDeleteProducts(productIds: string[]) {
    const batch = writeBatch(db);
    productIds.forEach(id => batch.delete(doc(db, 'products', id)));
    await batch.commit();
  }

  async bulkArchiveProducts(productIds: string[]) {
    const batch = writeBatch(db);
    productIds.forEach(id => batch.update(doc(db, 'products', id), { availabilityStatus: 'archived' }));
    await batch.commit();
  }

  async bulkUpdateCategory(productIds: string[], category: string) {
    const batch = writeBatch(db);
    productIds.forEach(id => batch.update(doc(db, 'products', id), { cat: category }));
    await batch.commit();
  }

  async bulkUpdateStock(updates: { id: string, currentStock: number, availabilityStatus: string }[]) {
    const batch = writeBatch(db);
    updates.forEach(u => batch.update(doc(db, 'products', u.id), { 
      currentStock: u.currentStock, 
      availabilityStatus: u.availabilityStatus 
    }));
    await batch.commit();
  }

  async createCampaign(campaignData: any) {
    await addDoc(collection(db, 'campaigns'), campaignData);
  }

  async updateCampaign(campaignId: string, campaignData: any) {
    await updateDoc(doc(db, 'campaigns', campaignId), campaignData);
  }

  async requestSettlement(userId: string, amount: number, details: any) {
    await addDoc(collection(db, 'settlementRequests'), {
      userId,
      amount,
      ...details,
      status: 'pending',
      requestedAt: new Date().toISOString()
    });
  }

  async updateReviewReply(reviewId: string, reply: string) {
    await updateDoc(doc(db, 'reviews', reviewId), { vendorReply: reply, vendorReplyCreatedAt: new Date().toISOString() });
  }

  async importProductsWithLedger(validRows: any[], existingProducts: any[], storeId: string, addStockMovement: any, t: any) {
    const batch = writeBatch(db);

    validRows.forEach(row => {
      const matchedProduct = existingProducts.find(p => 
        p.storeId === storeId && (p.sku === row.sku || p.barcode === row.barcode || (p.name || '').toLowerCase() === (row.name || '').toLowerCase())
      );

      const priceNum = row.price;
      const pPriceNum = row.costPrice;

      const newProd = {
        id: matchedProduct ? matchedProduct.id : `p_g_v_import_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        storeId: storeId,
        cat: row.cat,
        name: row.name,
        desc: row.desc,
        price: priceNum,
        purchasePrice: pPriceNum,
        costPrice: pPriceNum,
        profitMargin: priceNum > pPriceNum ? Math.round(((priceNum - pPriceNum) / priceNum) * 100) : 0,
        currentStock: row.currentStock,
        reservedStock: matchedProduct ? (matchedProduct.reservedStock || 0) : 0,
        lowStockThreshold: matchedProduct ? (matchedProduct.lowStockThreshold || 10) : 10,
        sku: row.sku,
        barcode: row.barcode,
        productBrand: row.productBrand,
        productWeight: row.productWeight,
        unit: row.unit,
        imgUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80',
        images: [],
        availabilityStatus: row.currentStock === 0 ? 'out_of_stock' : 'in_stock'
      };

      if (matchedProduct) {
        batch.update(doc(db, 'products', newProd.id), { ...newProd });
      } else {
        batch.set(doc(db, 'products', newProd.id), newProd);
      }

      if (row.currentStock > 0) {
        addStockMovement(newProd.id, row.currentStock, 'Purchase', t('str_684'));
      }
    });

    await batch.commit();
  }

  async createCatalogItem(colName: string, id: string, payload: any) {
    await setDoc(doc(db, colName, id), payload);
  }

  async deleteCatalogItem(colName: string, id: string) {
    await deleteDoc(doc(db, colName, id));
  }
}

export const vendorService = new VendorService();
