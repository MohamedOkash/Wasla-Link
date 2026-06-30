import { db } from '../firebase';
import { doc, runTransaction, collection } from 'firebase/firestore';

export interface PlaceOrderPayload {
  orderGroupData: any;
  storeOrdersData: any[];
  pointsToRedeem?: number;
  currentUserUid?: string;
  activeCouponId?: string;
}

export class OrderService {
  async placeOrder(payload: PlaceOrderPayload): Promise<void> {
    const { orderGroupData, storeOrdersData, pointsToRedeem = 0, currentUserUid, activeCouponId } = payload;
    
    const groupId = orderGroupData.id || doc(collection(db, 'orderGroups')).id;
    orderGroupData.id = groupId;

    await runTransaction(db, async (transaction) => {
      // 1. Read customer to get current customerOrderCount
      let customerOrderNumber = 1;
      let userRef = null;
      let userSnap = null;
      if (currentUserUid) {
        userRef = doc(db, 'users', currentUserUid);
        userSnap = await transaction.get(userRef);
      }

      // 2. Read global counter
      let globalOrderNumber = 1;
      const counterRef = doc(db, 'system', 'counters');
      const counterSnap = await transaction.get(counterRef);

      // 3. Handle Coupons Read
      let couponRef = null;
      let couponSnap = null;
      if (activeCouponId) {
        couponRef = doc(db, 'coupons', activeCouponId);
        couponSnap = await transaction.get(couponRef);
      }

      // 4. Handle Products Read
      const productSnaps = [];
      for (const storeOrder of storeOrdersData) {
        if (storeOrder.items && Array.isArray(storeOrder.items)) {
          for (const item of storeOrder.items) {
            if (item.id) {
              const productRef = doc(db, 'products', item.id);
              const productSnap = await transaction.get(productRef);
              productSnaps.push({ ref: productRef, snap: productSnap, quantity: item.quantity });
            }
          }
        }
      }

      // 5. Handle Stores Read
      const storeSnaps: any[] = [];
      for (const storeOrder of storeOrdersData) {
         if (storeOrder.shopId) {
            const storeRef = doc(db, 'stores', storeOrder.shopId);
            const storeSnap = await transaction.get(storeRef);
            storeSnaps.push({ ref: storeRef, snap: storeSnap, shopId: storeOrder.shopId });
         }
      }

      // --- ALL READS DONE, BEGIN WRITES ---

      // Customer update
      if (userSnap && userSnap.exists() && userRef) {
        customerOrderNumber = (userSnap.data().totalOrders || 0) + 1;
        const currentPoints = userSnap.data().points || 0;
        transaction.update(userRef, { 
           totalOrders: customerOrderNumber,
           points: Math.max(0, currentPoints - pointsToRedeem)
        });
      } else if (userRef) {
        transaction.set(userRef, { totalOrders: customerOrderNumber }, { merge: true });
      }

      // Global counter update
      if (counterSnap.exists()) {
        globalOrderNumber = (counterSnap.data().globalOrders || 0) + 1;
        transaction.update(counterRef, { globalOrders: globalOrderNumber });
      } else {
        transaction.set(counterRef, { globalOrders: 1 });
      }

      orderGroupData.customerOrderNumber = customerOrderNumber;
      orderGroupData.globalOrderNumber = globalOrderNumber;

      // Handle Payment Initialization atomically
      if (orderGroupData.paymentMethod) {
        const paymentRef = doc(collection(db, 'payments'));
        const initialStatus = orderGroupData.paymentMethod === 'cash_on_delivery' ? 'pending' : 'pending_verification';
        
        transaction.set(paymentRef, {
          groupId,
          method: orderGroupData.paymentMethod,
          amount: orderGroupData.total || 0,
          status: initialStatus,
          metadata: { receiptUrl: orderGroupData.paymentReceipt || null },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        orderGroupData.paymentStatus = initialStatus;
        orderGroupData.paymentId = paymentRef.id;
      }

      // Save OrderGroup
      transaction.set(doc(db, 'orderGroups', groupId), orderGroupData);

      // Save StoreOrders
      for (const storeOrder of storeOrdersData) {
         const storeSnapData = storeSnaps.find(s => s.shopId === storeOrder.shopId);
         let storeOrderNumber = 1;
         
         if (storeSnapData && storeSnapData.snap.exists()) {
           storeOrderNumber = (storeSnapData.snap.data().totalOrders || 0) + 1;
           transaction.update(storeSnapData.ref, { totalOrders: storeOrderNumber });
         } else if (storeSnapData) {
           transaction.set(storeSnapData.ref, { totalOrders: storeOrderNumber }, { merge: true });
         }

         storeOrder.groupId = groupId;
         storeOrder.storeOrderNumber = storeOrderNumber;
         storeOrder.customerOrderNumber = customerOrderNumber;
         storeOrder.globalOrderNumber = globalOrderNumber;
         storeOrder.invoiceId = `S${storeOrderNumber}-C${customerOrderNumber}`;
         
         if (orderGroupData.paymentMethod) {
            storeOrder.paymentStatus = orderGroupData.paymentStatus;
            storeOrder.paymentId = orderGroupData.paymentId;
         }

         const childOrderId = storeOrder.id || doc(collection(db, 'orders')).id;
         storeOrder.id = childOrderId;
         
         transaction.set(doc(db, 'orders', childOrderId), storeOrder);
      }

      // Handle Points
      if (pointsToRedeem > 0 && currentUserUid) {
        const pointsHistoryId = `${groupId}_${currentUserUid}_redeem`;
        transaction.set(doc(db, 'pointsHistory', pointsHistoryId), {
          id: pointsHistoryId,
          userId: currentUserUid,
          orderId: groupId, // using groupId for redeemed points
          points: pointsToRedeem,
          type: 'redeem',
          createdAt: new Date().toISOString()
        });
      }

      // Update coupon
      if (couponSnap && couponSnap.exists() && couponRef) {
        transaction.update(couponRef, { usageCount: (couponSnap.data().usageCount || 0) + 1 });
      }

      // Atomic Inventory Updates
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
