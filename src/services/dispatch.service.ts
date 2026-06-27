import { db } from './firebase';
import { collection, query, where, getDocs, doc, runTransaction, getDoc } from 'firebase/firestore';
import { Order } from '../types/order.types';
import { PlatformSettings } from '../types/financial';
import { DEFAULT_PLATFORM_SETTINGS } from './deliveryFee.service';
import etaService from './eta.service';
import * as geofire from 'geofire-common';

export interface DriverAssignmentCandidate {
  id: string;
  lat: number;
  lng: number;
  distance: number;
  score?: number;
  eta?: number;
}

class DispatchService {
  private readonly MAX_ASSIGNMENT_ATTEMPTS = 3;

  async getAvailableDrivers(storeLat: number, storeLng: number, rejectedBy: string[] = [], radiusKm: number | null = 5): Promise<DriverAssignmentCandidate[]> {
    const promises = [];

    // 1. Get driver locations within geohash bounds or query all online if radiusKm is null
    if (radiusKm === null) {
      const q = query(
        collection(db, 'driverLocations'),
        where('status', '==', 'online')
      );
      promises.push(getDocs(q));
    } else {
      const radiusInMeters = radiusKm * 1000;
      const center: [number, number] = [storeLat, storeLng];
      const bounds = geofire.geohashQueryBounds(center, radiusInMeters);
      for (const b of bounds) {
        const q = query(
          collection(db, 'driverLocations'),
          where('geohash', '>=', b[0]),
          where('geohash', '<=', b[1])
        );
        promises.push(getDocs(q));
      }
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

        // Double check exact distance if radius filter is active
        const distance = etaService.calculateDistance(storeLat, storeLng, locData.lat, locData.lng);
        if (radiusKm !== null && distance > (radiusKm * 1000)) continue;

        // Check user document for availability
        const userDoc = await getDoc(doc(db, 'users', driverId));
        if (!userDoc.exists()) continue;
        
        const userData = userDoc.data();
        if (userData.role !== 'driver' || !userData.isOnline || userData.status !== 'approved') continue;
        if (userData.currentOrderId) continue;
        if (userData.batteryLevel !== undefined && userData.batteryLevel < 15) continue;

        // Fetch statistics from the 'drivers' collection for weighted ranking
        const driverDoc = await getDoc(doc(db, 'drivers', driverId));
        const driverStats = driverDoc.exists() ? driverDoc.data() : {};

        const rating = driverStats.rating !== undefined ? Number(driverStats.rating) : 5.0;
        const acceptanceRate = driverStats.acceptanceRate !== undefined ? Number(driverStats.acceptanceRate) : 100;
        const completedDeliveries = driverStats.completedOrders !== undefined ? Number(driverStats.completedOrders) : 0;
        const workload = userData.currentOrderId ? 1 : 0;
        
        const distanceKm = distance / 1000;
        const etaMins = Math.max(3, Math.ceil(distanceKm * 2)); // Estimated travel time (2 mins per KM, min 3 mins)

        // Weighted Ranking Formula
        const score = (rating * 15) + (acceptanceRate * 0.1) + (completedDeliveries * 0.05) - (distanceKm * 3) - (etaMins * 1) - (workload * 50);

        candidates.push({
          id: driverId,
          lat: locData.lat,
          lng: locData.lng,
          distance: distance,
          eta: etaMins,
          score: Number(score.toFixed(2))
        });
      }
    }

    // 3. Sort by score descending (highest score first)
    candidates.sort((a, b) => (b.score || 0) - (a.score || 0));
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
          return false;
        }

        // Find nearest available driver with expanding radius: 5km -> 10km -> 20km -> 40km -> nearest available driver (null)
        const radiusLevels: (number | null)[] = [5, 10, 20, 40, null];
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

        const settingsRef = doc(db, 'platformSettings', 'default');
        const settingsSnap = await transaction.get(settingsRef);
        const settings = settingsSnap.exists() ? (settingsSnap.data() as PlatformSettings) : DEFAULT_PLATFORM_SETTINGS;
        const driverBonus = settings.driverBonusPercent > 0 ? ((order.deliveryFee || 0) * (settings.driverBonusPercent / 100)) : 0;
        const fallbackEarnings = Math.round((order.deliveryFee || 0) + driverBonus);

        // Apply Assignment!
        const now = new Date().toISOString();
        
        transaction.update(orderRef, {
          status: 'driver_assigned',
          assignedDriverId: selectedDriver.id,
          assignedAt: now,
          assignmentDistance: selectedDriver.distance,
          assignmentAttempts: attempts + 1,
          estimatedDriverEarnings: order.estimatedDriverEarnings || fallbackEarnings
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
