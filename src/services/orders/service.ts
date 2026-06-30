import { db } from '../firebase';
import { doc, writeBatch, increment, collection } from 'firebase/firestore';

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

    const batch = writeBatch(db);

    // 1. Handle Payment Initialization atomically
    if (orderData.paymentMethod) {
      const paymentRef = doc(collection(db, 'payments'));
      const initialStatus = orderData.paymentMethod === 'cash_on_delivery' ? 'pending' : 'pending_verification';
      
      batch.set(paymentRef, {
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
    batch.set(doc(db, 'orders', orderId), orderData);

    // 3. Handle Points
    if (pointsToRedeem > 0 && currentUserUid) {
      batch.set(doc(db, 'users', currentUserUid), {
        points: increment(-pointsToRedeem)
      }, { merge: true });

      const pointsHistoryId = `${orderId}_${currentUserUid}_redeem`;
      batch.set(doc(db, 'pointsHistory', pointsHistoryId), {
        id: pointsHistoryId,
        userId: currentUserUid,
        orderId: orderId,
        points: pointsToRedeem,
        type: 'redeem',
        createdAt: new Date().toISOString()
      });
    }

    // 4. Handle Coupons
    if (activeCouponId) {
      batch.set(doc(db, 'coupons', activeCouponId), {
        usageCount: increment(1)
      }, { merge: true });
    }

    // 5. Atomic Inventory Updates (Safely handles missing product documents with merge: true)
    if (orderData.items && Array.isArray(orderData.items)) {
      orderData.items.forEach((item: any) => {
        if (item.id) {
          batch.set(doc(db, 'products', item.id), {
            currentStock: increment(-item.quantity)
          }, { merge: true });
        }
      });
    }

    await batch.commit();
  }
}

export const orderService = new OrderService();
