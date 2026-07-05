import { db, functions } from '../../services/firebase';
import { httpsCallable } from 'firebase/functions';
import { doc, setDoc, updateDoc, deleteDoc, writeBatch, addDoc, collection, getDoc, increment, query, where, getDocs } from 'firebase/firestore';

export class AppService {
  async addStockMovement(newMovement: any, productId: string, newStock: number, availStatus: string) {
    const updateProductStockFn = httpsCallable(functions, 'updateProductStock');
    await updateProductStockFn({
      productId,
      quantityChange: newMovement.quantity,
      type: newMovement.type,
      reason: newMovement.reason
    });
  }

  async submitReturnRequest(requestId: string, newRequest: any) {
    await setDoc(doc(db, 'returnRequests', requestId), newRequest);
  }

  async confirmReturnRequest(requestId: string, orderId: string, returnData: any, newStatus: string, refundAmount: number = 0) {
    const batch = writeBatch(db);
    batch.update(doc(db, 'returnRequests', requestId), { status: newStatus, timeline: returnData.timeline, updatedAt: returnData.updatedAt });
    await batch.commit();
  }

  async requestWalletSettlement(settleId: string, newSet: any) {
    await setDoc(doc(db, 'walletSettlements', settleId), newSet);
  }

  async markNotificationRead(id: string) {
    await updateDoc(doc(db, 'notifications', id), { isRead: true });
  }

  async markAllNotificationsRead(ids: string[]) {
    const batch = writeBatch(db);
    ids.forEach(id => batch.update(doc(db, 'notifications', id), { isRead: true }));
    await batch.commit();
  }

  async deleteNotification(id: string) {
    await deleteDoc(doc(db, 'notifications', id));
  }

  async clearAllNotifications(ids: string[]) {
    const batch = writeBatch(db);
    ids.forEach(id => batch.delete(doc(db, 'notifications', id)));
    await batch.commit();
  }

  async addCampaign(campaignId: string, campaignData: any) {
    await setDoc(doc(db, 'campaigns', campaignId), campaignData);
  }

  async dispatchNotification(notifId: string, notifData: any) {
    await setDoc(doc(db, 'notifications', notifId), notifData);
  }

  async submitMultiReview(orderId: string, ratingStore: number, ratingDriver: number, ratingProducts: number, comment: string, itemsReviews: any[], currentUser: any) {
    const batch = writeBatch(db);
    
    for (const reviewObj of itemsReviews) {
        const { item, itemReview, uploadedUrls } = reviewObj;
        const reviewId = `rev_${item.id}_${currentUser.uid}_${Date.now()}`;
        
        batch.set(doc(db, 'reviews', reviewId), {
          id: reviewId,
          productId: item.id,
          userId: currentUser.uid,
          userName: currentUser.name,
          rating: itemReview.rating,
          comment: itemReview.comment,
          images: uploadedUrls,
          createdAt: new Date().toISOString()
        });

        const reviewsQuery = query(collection(db, 'reviews'), where('productId', '==', item.id));
        const reviewsSnap = await getDocs(reviewsQuery);
        const ratingsList = reviewsSnap.docs.map(d => d.data().rating as number);
        ratingsList.push(itemReview.rating);
        const ratingsCount = ratingsList.length;
        const averageRating = parseFloat((ratingsList.reduce((sum, r) => sum + r, 0) / ratingsCount).toFixed(1));

        batch.update(doc(db, 'products', item.id), {
          averageRating,
          ratingsCount
        });
    }

    batch.update(doc(db, 'orders', orderId), {
      ratingStore,
      ratingDriver,
      ratingProducts,
      ratingComment: comment
    });

    await batch.commit();
  }
  async submitReview(reviewId: string, reviewData: any, orderId: string, ratingStore: number, ratingDriver: number, ratingProducts: number, comment?: string) {
    const batch = writeBatch(db);
    batch.set(doc(db, 'reviews', reviewId), reviewData);
    batch.update(doc(db, 'orders', orderId), {
      ratingStore,
      ratingDriver,
      ratingProducts,
      ratingComment: comment
    });
    await batch.commit();
  }

  async updateOrderStatus(orderId: string, status: string, driverId: string | undefined, driverName: string | undefined, order: any, currentUserId: string | undefined) {
    const updateOrderStatusFn = httpsCallable(functions, 'updateOrderStatus');
    await updateOrderStatusFn({
      orderId,
      nextStatus: status,
      driverId: driverId || null,
      driverName: driverName || null
    });
  }
    async registerCustomerWithReferral(uid: string, name: string, email: string, phone: string, isReferralValid: boolean, referredByUid: string | null, generatedCode: string) {
    const batch = writeBatch(db);

    const userProfile = {
      uid,
      name,
      email,
      phone: phone || '',
      role: 'customer',
      points: isReferralValid ? 100 : 0,
      referralCode: generatedCode,
      referredBy: referredByUid,
      createdAt: new Date().toISOString()
    };

    batch.set(doc(db, 'users', uid), userProfile);

    if (isReferralValid && referredByUid) {
      const refId = `ref_${uid}`;
      batch.set(doc(db, 'referrals', refId), {
        id: refId,
        inviterId: referredByUid,
        invitedId: uid,
        invitedName: name,
        pointsAwarded: 500,
        status: 'registered',
        createdAt: new Date().toISOString()
      });

      batch.update(doc(db, 'users', referredByUid), {
        points: increment(500)
      });

      const histInvId = `ref_inv_${uid}`;
      batch.set(doc(db, 'pointsHistory', histInvId), {
        id: histInvId,
        userId: referredByUid,
        points: 500,
        type: 'referral_inviter',
        createdAt: new Date().toISOString()
      });

      const histInvdId = `ref_invd_${uid}`;
      batch.set(doc(db, 'pointsHistory', histInvdId), {
        id: histInvdId,
        userId: uid,
        points: 100,
        type: 'referral_invited',
        createdAt: new Date().toISOString()
      });
    }

    await batch.commit();
  }

  async autoSeedInventory(storeId: string, templates: any[]) {
    if (templates.length === 0) return;
    const batchLimit = 400;
    for (let i = 0; i < templates.length; i += batchLimit) {
      const batch = writeBatch(db);
      const chunk = templates.slice(i, i + batchLimit);
      
      chunk.forEach(p => {
        const prodId = `prod_${storeId}_${p.id}_${Math.floor(1000 + Math.random() * 9000)}`;
        const vendorProd = {
          ...p,
          id: prodId,
          storeId: storeId,
          isTemplate: false,
          templateId: p.id,
          stock: p.stock || 100,
          price: p.sellingPrice || p.price || 10,
          costPrice: p.costPrice || Math.round((p.sellingPrice || 10) * 0.8),
          sellingPrice: p.sellingPrice || p.price || 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        batch.set(doc(db, 'products', prodId), vendorProd);
      });
      await batch.commit();
    }
  }
}

export const appService = new AppService();
