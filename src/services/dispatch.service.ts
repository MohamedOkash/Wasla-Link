import { db } from './firebase';
import { collection, query, where, getDocs, doc, runTransaction, getDoc } from 'firebase/firestore';
import { Order } from '../types/order.types';
import etaService from './eta.service';

export interface DriverAssignmentCandidate {
  id: string;
  lat: number;
  lng: number;
  distance: number;
}

class DispatchService {
  private readonly MAX_ASSIGNMENT_ATTEMPTS = 3;

  async getAvailableDrivers(storeLat: number, storeLng: number, rejectedBy: string[] = []): Promise<DriverAssignmentCandidate[]> {
    // 1. Get all drivers who are online, available, and have enough battery
    const driversRef = collection(db, 'users');
    const q = query(
      driversRef, 
      where('role', '==', 'driver'),
      where('isOnline', '==', true),
      where('status', '==', 'approved')
    );
    
    const driverDocs = await getDocs(q);
    const candidates: DriverAssignmentCandidate[] = [];

    // 2. We need to check their locations
    for (const d of driverDocs.docs) {
      const driverId = d.id;
      const driverData = d.data();

      // Skip if they already rejected this order
      if (rejectedBy.includes(driverId)) continue;
      
      // In a real app, 'available' might be a separate flag updated by Driver Dashboard
      // Here we assume if currentOrderId is missing/null, they are available.
      if (driverData.currentOrderId) continue;

      // Check battery level if available
      if (driverData.batteryLevel !== undefined && driverData.batteryLevel < 15) continue;

      const locDoc = await getDoc(doc(db, 'driverLocations', driverId));
      if (locDoc.exists()) {
        const locData = locDoc.data();
        if (locData.status === 'online') {
          const distance = etaService.calculateDistance(storeLat, storeLng, locData.lat, locData.lng);
          candidates.push({
            id: driverId,
            lat: locData.lat,
            lng: locData.lng,
            distance: distance
          });
        }
      }
    }

    // 3. Sort by distance (nearest first)
    candidates.sort((a, b) => a.distance - b.distance);
    return candidates;
  }

  async assignDriverToOrder(orderId: string, storeLat: number, storeLng: number): Promise<boolean> {
    try {
      return await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await transaction.get(orderRef);

        if (!orderDoc.exists()) {
          throw new Error('Order does not exist!');
        }

        const order = orderDoc.data() as Order;
        
        // Prevent assigning if it's already assigned or cancelled
        if (order.status !== 'ready_for_delivery' && order.status !== 'driver_assigned') {
          throw new Error(`Cannot assign driver to order in status: ${order.status}`);
        }

        const attempts = order.assignmentAttempts || 0;
        const rejectedBy = order.rejectedBy || [];

        if (attempts >= this.MAX_ASSIGNMENT_ATTEMPTS) {
          // Max attempts reached, order stays in ready_for_delivery but unassigned
          transaction.update(orderRef, {
            status: 'ready_for_delivery',
            assignedDriverId: null,
            assignedAt: null
          });
          // Note: In a full app, this would trigger a vendor notification.
          return false;
        }

        // Find nearest available driver
        const candidates = await this.getAvailableDrivers(storeLat, storeLng, rejectedBy);
        
        if (candidates.length === 0) {
          // No drivers available right now
          return false;
        }

        const selectedDriver = candidates[0];

        // Double check the driver is STILL available using a read in this transaction
        const driverRef = doc(db, 'users', selectedDriver.id);
        const driverDoc = await transaction.get(driverRef);
        
        if (!driverDoc.exists() || driverDoc.data().currentOrderId || !driverDoc.data().isOnline) {
          throw new Error('Selected driver became unavailable during assignment.');
        }

        // Apply Assignment!
        const now = new Date().toISOString();
        
        transaction.update(orderRef, {
          status: 'driver_assigned',
          assignedDriverId: selectedDriver.id,
          assignedAt: now,
          assignmentDistance: selectedDriver.distance,
          assignmentAttempts: attempts + 1
        });

        // Also update the driver so they are locked to this order
        transaction.update(driverRef, {
          currentOrderId: orderId
        });

        return true;
      });
    } catch (e) {
      console.error("Assignment transaction failed:", e);
      return false;
    }
  }

  async handleDriverRejection(orderId: string, driverId: string, storeLat: number, storeLng: number): Promise<void> {
    await runTransaction(db, async (transaction) => {
      const orderRef = doc(db, 'orders', orderId);
      const driverRef = doc(db, 'users', driverId);
      
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists()) return;
      
      const order = orderDoc.data() as Order;
      
      // Free the driver
      transaction.update(driverRef, {
        currentOrderId: null
      });

      // Update order
      const rejectedBy = order.rejectedBy || [];
      rejectedBy.push(driverId);
      
      transaction.update(orderRef, {
        status: 'ready_for_delivery',
        assignedDriverId: null,
        assignedAt: null,
        rejectedBy: rejectedBy
      });
    });

    // Try to assign the next driver immediately
    await this.assignDriverToOrder(orderId, storeLat, storeLng);
  }
}

export const dispatchService = new DispatchService();
export default dispatchService;
