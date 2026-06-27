import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import etaService from './eta.service';
import openSourceMapsService from './openSourceMaps.service';

export interface TrackingState {
  driverLocation: { lat: number; lng: number; heading?: number | null; speed?: number | null } | null;
  customerLocation: { lat: number; lng: number };
  storeLocation: { lat: number; lng: number };
  status: 'preparing' | 'ready_for_delivery' | 'accepted' | 'picked_up' | 'on_the_way' | 'delivered' | 'arrived';
  eta: number; // in minutes
  route: [number, number][];
  remainingDistanceKm?: number;
}

class TrackingService {
  subscribeToLiveTracking(
    driverId: string | undefined,
    orderStatus: any,
    storeCoords: { lat: number; lng: number },
    customerCoords: { lat: number; lng: number },
    onUpdate: (state: TrackingState) => void
  ): () => void {
    
    // Initial State
    const initialState: TrackingState = {
      driverLocation: null,
      customerLocation: customerCoords,
      storeLocation: storeCoords,
      status: orderStatus,
      eta: 15,
      route: [[storeCoords.lat, storeCoords.lng], [customerCoords.lat, customerCoords.lng]],
      remainingDistanceKm: 0
    };

    // First load static winding route store-to-customer
    openSourceMapsService.getDirections(storeCoords, customerCoords)
      .then((routeData) => {
        initialState.route = routeData.polyline;
        initialState.eta = routeData.durationMins;
        initialState.remainingDistanceKm = routeData.distanceKm;
        onUpdate({ ...initialState });
      })
      .catch((err) => {
        console.error("Failed to load map route directions:", err);
        onUpdate(initialState);
      });

    if (!driverId) {
      return () => {}; // No driver assigned yet
    }

    const unsub = onSnapshot(doc(db, 'driverLocations', driverId), async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const driverPos = { lat: data.lat, lng: data.lng };
        
        let targetDest = customerCoords;
        if (orderStatus === 'accepted' || orderStatus === 'preparing' || orderStatus === 'ready_for_delivery' || orderStatus === 'driver_assigned') {
          targetDest = storeCoords;
        }

        try {
          const dir = await openSourceMapsService.getDirections(driverPos, targetDest);
          onUpdate({
            ...initialState,
            driverLocation: { lat: data.lat, lng: data.lng, heading: data.heading, speed: data.speed },
            eta: dir.durationMins,
            remainingDistanceKm: dir.distanceKm,
            route: initialState.route
          });
        } catch (e) {
          // Fallback to straight line Haversine estimation
          const distanceMeters = this.calculateDistance(driverPos.lat, driverPos.lng, targetDest.lat, targetDest.lng);
          const distanceKm = Number((distanceMeters / 1000).toFixed(2));
          const eta = Math.max(3, Math.ceil(distanceKm * 2));
          onUpdate({
            ...initialState,
            driverLocation: { lat: data.lat, lng: data.lng, heading: data.heading, speed: data.speed },
            eta,
            remainingDistanceKm: distanceKm,
            route: initialState.route
          });
        }
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
