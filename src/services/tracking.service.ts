import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

export interface TrackingState {
  driverLocation: { lat: number; lng: number } | null;
  customerLocation: { lat: number; lng: number };
  storeLocation: { lat: number; lng: number };
  status: 'preparing' | 'ready_for_pickup' | 'accepted' | 'picked_up' | 'delivering' | 'delivered' | 'arrived';
  eta: number; // in minutes
  route: [number, number][]; // static straight line or mock route for now
}

class TrackingService {
  subscribeToLiveTracking(
    driverId: string | undefined,
    orderStatus: any,
    storeCoords: { lat: number; lng: number },
    customerCoords: { lat: number; lng: number },
    onUpdate: (state: TrackingState) => void
  ): () => void {
    
    // Initial State without driver
    const initialState: TrackingState = {
      driverLocation: null,
      customerLocation: customerCoords,
      storeLocation: storeCoords,
      status: orderStatus,
      eta: 15,
      route: [[storeCoords.lat, storeCoords.lng], [customerCoords.lat, customerCoords.lng]]
    };

    onUpdate(initialState);

    if (!driverId) {
      return () => {}; // No driver assigned yet
    }

    const unsub = onSnapshot(doc(db, 'driverLocations', driverId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onUpdate({
          ...initialState,
          driverLocation: { lat: data.lat, lng: data.lng },
          eta: Math.round(data.speed ? (this.calculateDistance(data.lat, data.lng, customerCoords.lat, customerCoords.lng) / data.speed) / 60 : 15)
        });
      }
    });

    return () => unsub();
  }

  // Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in metres
  }
}

export const trackingService = new TrackingService();
export default trackingService;
