import { db } from './firebase';
import { collection, query, where, getDocs, doc, runTransaction, getDoc } from 'firebase/firestore';
import { Order } from '../types/order.types';
import etaService from './eta.service';
import * as geofire from 'geofire-common';

export interface DriverAssignmentCandidate {
  id: string;
  lat: number;
  lng: number;
  distance: number;
}

class DispatchService {
  private readonly MAX_ASSIGNMENT_ATTEMPTS = 3;

  async getAvailableDrivers(storeLat: number, storeLng: number, rejectedBy: string[] = [], radiusKm: number = 5): Promise<DriverAssignmentCandidate[]> {
    const radiusInMeters = radiusKm * 1000;
    const center: [number, number] = [storeLat, storeLng];
    const bounds = geofire.geohashQueryBounds(center, radiusInMeters);
    const promises = [];

    // 1. Get drivers within geohash bounds
    for (const b of bounds) {
      const q = query(
        collection(db, 'driverLocations'),
        where('geohash', '>=', b[0]),
        where('geohash', '<=', b[1])
      );
      promises.push(getDocs(q));
    }
    
    const snapshots = await Promise.all(promises);
    const candidates: DriverAssignmentCandidate[] = [];

    // 2. We need to check their locations and availability
    for (const snap of snapshots) {
      for (const docSnap of snap.docs) {
        const locData = docSnap.data();
        const driverId = locData.driverId || docSnap.id;
        
        if (locData.status !== 'online') continue;
        if (rejectedBy.includes(driverId)) continue;

        // Double check exact distance (geohash boxes are larger than the circle)
        const distance = etaService.calculateDistance(storeLat, storeLng, locData.lat, locData.lng);
        if (distance > radiusInMeters) continue;

        // Check user document for availability
        const driverDoc = await getDoc(doc(db, 'users', driverId));
        if (!driverDoc.exists()) continue;
        
        const driverData = driverDoc.data();
        if (driverData.role !== 'driver' || !driverData.isOnline || driverData.status !== 'approved') continue;
        if (driverData.currentOrderId) continue;
        if (driverData.batteryLevel !== undefined && driverData.batteryLevel < 15) continue;

        candidates.push({
          id: driverId,
          lat: locData.lat,
          lng: locData.lng,
          distance: distance
        });
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

        // Find nearest available driver with expanding radius
        const radiusLevels = [5, 10, 20];
        let candidates: DriverAssignmentCandidate[] = [];
        
        for (const radius of radiusLevels) {
          candidates = await this.getAvailableDrivers(storeLat, storeLng, rejectedBy, radius);
          if (candidates.length > 0) {
            break; // Found drivers, stop expanding radius
          }
        }
        
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
