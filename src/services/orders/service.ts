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
    batch.set(doc(db, 'orders', orderId), orderData);

    if (pointsToRedeem > 0 && currentUserUid) {
      batch.update(doc(db, 'users', currentUserUid), {
        points: increment(-pointsToRedeem)
      });

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

    if (activeCouponId) {
      batch.update(doc(db, 'coupons', activeCouponId), {
        usageCount: increment(1)
      });
    }

    // Atomic Inventory Updates
    if (orderData.items && Array.isArray(orderData.items)) {
      orderData.items.forEach((item: any) => {
        if (item.id) {
          batch.update(doc(db, 'products', item.id), {
            currentStock: increment(-item.quantity)
          });
        }
      });
    }

    await batch.commit();
  }
}

export const orderService = new OrderService();
