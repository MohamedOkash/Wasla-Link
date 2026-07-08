import { db } from '../../services/firebase';
import { doc, collection, addDoc, updateDoc, setDoc } from 'firebase/firestore';

export class DriverService {
  async acceptOrder(driverId: string, orderId: string, driverName?: string) {
    const { functions } = await import('../../services/firebase');
    const { httpsCallable } = await import('firebase/functions');
    const updateOrderStatusFn = httpsCallable(functions, 'updateOrderStatus');
    
    await updateOrderStatusFn({
      orderId,
      nextStatus: 'accepted',
      driverId,
      driverName: driverName || ''
    });

    await updateDoc(doc(db, 'drivers', driverId), {
      availability: 'busy',
      currentOrderId: orderId
    });
  }

  async updateOrderStatus(driverId: string, orderId: string, newStatus: string, fee?: number, otp?: string) {
    const { functions } = await import('../../services/firebase');
    const { httpsCallable } = await import('firebase/functions');
    const updateOrderStatusFn = httpsCallable(functions, 'updateOrderStatus');
    
    await updateOrderStatusFn({
      orderId,
      nextStatus: newStatus,
      driverId,
      otp: otp || null
    });

    if (newStatus === 'delivered') {
      await updateDoc(doc(db, 'drivers', driverId), {
        availability: 'available',
        currentOrderId: null
      });
    } else {
      await updateDoc(doc(db, 'drivers', driverId), {
        availability: newStatus === 'picked_up' ? 'delivering' : 'busy'
      });
    }
  }

  async rejectOrder(driverId: string, orderId: string) {
    const { functions } = await import('../../services/firebase');
    const { httpsCallable } = await import('firebase/functions');
    const updateOrderStatusFn = httpsCallable(functions, 'updateOrderStatus');
    
    await updateOrderStatusFn({
      orderId,
      nextStatus: 'ready_for_delivery',
      driverId
    });

    await updateDoc(doc(db, 'drivers', driverId), {
      currentOrderId: null,
      availability: 'online'
    });
  }

  async updateDriverLocationAndStatus(driverId: string, coords: any, isOnline: boolean) {
    const driverRef = doc(db, 'drivers', driverId);
    const locRef = doc(db, 'driverLocations', driverId);
    
    await updateDoc(driverRef, { 
      availability: isOnline ? 'online' : 'offline'
    });

    await setDoc(locRef, {
      driverId,
      coords,
      isOnline,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }

  async requestSettlement(userId: string, amount: number, details: any) {
    const { functions } = await import('../../services/firebase');
    const { httpsCallable } = await import('firebase/functions');
    const requestSettlementFn = httpsCallable(functions, 'requestWalletSettlement');
    await requestSettlementFn({ amount, details });
  }

  async assignDriverToOrder(orderId: string, driverId: string, driverName?: string) {
    const { functions } = await import('../../services/firebase');
    const { httpsCallable } = await import('firebase/functions');
    const updateOrderStatusFn = httpsCallable(functions, 'updateOrderStatus');
    
    await updateOrderStatusFn({
      orderId,
      nextStatus: 'accepted',
      driverId,
      driverName: driverName || ''
    });

    await updateDoc(doc(db, 'drivers', driverId), {
      availability: 'busy',
      currentOrderId: orderId
    });
  }
}

export const driverService = new DriverService();
