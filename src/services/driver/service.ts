import { db } from '../../services/firebase';
import { doc, writeBatch, runTransaction, collection, addDoc, updateDoc } from 'firebase/firestore';

export class DriverService {
  async acceptOrder(driverId: string, orderId: string) {
    const batch = writeBatch(db);
    batch.update(doc(db, 'orders', orderId), {
      status: 'accepted',
      driverId: driverId,
    });
    batch.update(doc(db, 'drivers', driverId), {
      availability: 'busy',
      currentOrderId: orderId
    });
    await batch.commit();
  }

  async updateOrderStatus(driverId: string, orderId: string, newStatus: string, fee: number) {
    const batch = writeBatch(db);
    batch.update(doc(db, 'orders', orderId), { status: newStatus });

    if (newStatus === 'delivered') {
      // Need runTransaction to read driver stats accurately, or use increment
      await runTransaction(db, async (transaction) => {
        const driverRef = doc(db, 'drivers', driverId);
        const dSnap = await transaction.get(driverRef);
        if (!dSnap.exists()) return;
        const data = dSnap.data();
        
        transaction.update(doc(db, 'orders', orderId), { status: newStatus });
        transaction.update(driverRef, {
          availability: 'online',
          currentOrderId: null,
          completedOrders: (data.completedOrders || 0) + 1,
          totalDeliveries: (data.totalDeliveries || 0) + 1,
          totalEarnings: (data.totalEarnings || 0) + fee
        });
      });
    } else {
      await batch.commit();
    }
  }

  async rejectOrder(driverId: string, orderId: string) {
    await runTransaction(db, async (transaction) => {
      const orderRef = doc(db, 'orders', orderId);
      const docSnap = await transaction.get(orderRef);
      if (!docSnap.exists()) return;
      const o = docSnap.data();
      const rejectedBy = o.rejectedBy || [];
      rejectedBy.push(driverId);
      
      transaction.update(orderRef, {
         status: 'ready_for_delivery',
         assignedDriverId: null,
         rejectedBy: rejectedBy
      });
      
      transaction.update(doc(db, 'users', driverId), {
         currentOrderId: null
      });
    });
  }

  async updateDriverLocationAndStatus(driverId: string, coords: any, isOnline: boolean) {
    await runTransaction(db, async (transaction) => {
      const driverRef = doc(db, 'drivers', driverId);
      const locRef = doc(db, 'driverLocations', driverId);
      transaction.update(driverRef, { isOnline });
      transaction.set(locRef, {
        driverId,
        coords,
        isOnline,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    });
  }

  async requestSettlement(userId: string, amount: number, details: any) {
    await addDoc(collection(db, 'settlementRequests'), {
      userId,
      amount,
      details,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    });
  }

  async assignDriverToOrder(orderId: string, driverId: string) {
    const batch = writeBatch(db);
    batch.update(doc(db, 'orders', orderId), {
      status: 'accepted',
      driverId: driverId,
    });
    batch.update(doc(db, 'drivers', driverId), {
      availability: 'busy',
      currentOrderId: orderId
    });
    await batch.commit();
  }
}

export const driverService = new DriverService();
