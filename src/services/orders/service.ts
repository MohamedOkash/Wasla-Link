import { db } from '../firebase';
import { doc, runTransaction, collection } from 'firebase/firestore';

export interface PlaceOrderPayload {
  orderData: any;
  pointsToRedeem?: number;
  currentUserUid?: string;
  activeCouponId?: string;
}

export class OrderService {
  async placeOrder(payload: PlaceOrderPayload): Promise<void> {
    const { orderData, pointsToRedeem = 0, currentUserUid, activeCouponId } = payload;
    
    // We assume orderData already has an ID, if not, generate one.
    const orderId = orderData.id || doc(collection(db, 'orders')).id;
    orderData.id = orderId;

    await runTransaction(db, async (transaction) => {
      // 1. Read store to get current storeOrderCount
      let storeOrderNumber = 1;
      let storeRef = null;
      let storeSnap = null;
      if (orderData.shopId) {
        storeRef = doc(db, 'stores', orderData.shopId);
        storeSnap = await transaction.get(storeRef);
      }

      // 2. Read customer to get current customerOrderCount
      let customerOrderNumber = 1;
      let userRef = null;
      let userSnap = null;
      if (currentUserUid) {
        userRef = doc(db, 'users', currentUserUid);
        userSnap = await transaction.get(userRef);
      }

      // 3. Read global counter (optional, but good for general invoice)
      let globalOrderNumber = 1;
      const counterRef = doc(db, 'system', 'counters');
      const counterSnap = await transaction.get(counterRef);

      // 4. Handle Coupons Read
      let couponRef = null;
      let couponSnap = null;
      if (activeCouponId) {
        couponRef = doc(db, 'coupons', activeCouponId);
        couponSnap = await transaction.get(couponRef);
      }

      // 5. Handle Products Read
      const productSnaps = [];
      if (orderData.items && Array.isArray(orderData.items)) {
        for (const item of orderData.items) {
          if (item.id) {
            const productRef = doc(db, 'products', item.id);
            const productSnap = await transaction.get(productRef);
            productSnaps.push({ ref: productRef, snap: productSnap, quantity: item.quantity });
          }
        }
      }

      // --- ALL READS DONE, BEGIN WRITES ---

      if (storeSnap && storeSnap.exists()) {
        storeOrderNumber = (storeSnap.data().totalOrders || 0) + 1;
        transaction.update(storeRef, { totalOrders: storeOrderNumber });
      } else if (storeRef) {
        // Just in case store doesn't exist but we have ref
        transaction.set(storeRef, { totalOrders: storeOrderNumber }, { merge: true });
      }

      if (userSnap && userSnap.exists()) {
        customerOrderNumber = (userSnap.data().totalOrders || 0) + 1;
        const currentPoints = userSnap.data().points || 0;
        transaction.update(userRef, { 
           totalOrders: customerOrderNumber,
           points: Math.max(0, currentPoints - pointsToRedeem)
        });
      } else if (userRef) {
        transaction.set(userRef, { totalOrders: customerOrderNumber }, { merge: true });
      }

      if (counterSnap.exists()) {
        globalOrderNumber = (counterSnap.data().globalOrders || 0) + 1;
        transaction.update(counterRef, { globalOrders: globalOrderNumber });
      } else {
        transaction.set(counterRef, { globalOrders: 1 });
      }

      // Add numbering to orderData
      orderData.storeOrderNumber = storeOrderNumber;
      orderData.customerOrderNumber = customerOrderNumber;
      orderData.globalOrderNumber = globalOrderNumber;
      
      // Generate readable invoice ID coordinating store and customer numbers
      // e.g. S12-C5
      const invoiceId = `S${storeOrderNumber}-C${customerOrderNumber}`;
      orderData.invoiceId = invoiceId;

      // 1. Handle Payment Initialization atomically
      if (orderData.paymentMethod) {
        const paymentRef = doc(collection(db, 'payments'));
        const initialStatus = orderData.paymentMethod === 'cash_on_delivery' ? 'pending' : 'pending_verification';
        
        transaction.set(paymentRef, {
          orderId,
          method: orderData.paymentMethod,
          amount: orderData.total || 0,
          status: initialStatus,
          metadata: { receiptUrl: orderData.paymentReceipt || null },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        // Directly embed the payment info into the order before saving
        orderData.paymentStatus = initialStatus;
        orderData.paymentId = paymentRef.id;
      }

      // 2. Set the Order Document
      transaction.set(doc(db, 'orders', orderId), orderData);

      // 3. Handle Points
      if (pointsToRedeem > 0 && currentUserUid) {
        const pointsHistoryId = `${orderId}_${currentUserUid}_redeem`;
        transaction.set(doc(db, 'pointsHistory', pointsHistoryId), {
          id: pointsHistoryId,
          userId: currentUserUid,
          orderId: orderId,
          points: pointsToRedeem,
          type: 'redeem',
          createdAt: new Date().toISOString()
        });
      }

      // 4. Handle Coupons
      if (couponSnap && couponSnap.exists()) {
        transaction.update(couponRef, { usageCount: (couponSnap.data().usageCount || 0) + 1 });
      }

      // 5. Atomic Inventory Updates
      for (const p of productSnaps) {
        if (p.snap.exists()) {
          const newStock = Math.max(0, (p.snap.data().currentStock || 0) - p.quantity);
          transaction.update(p.ref, { currentStock: newStock });
        }
      }
    });
  }
}

export const orderService = new OrderService();
