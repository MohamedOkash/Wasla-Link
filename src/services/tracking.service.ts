export interface TrackingState {
  driverLocation: { lat: number; lng: number };
  customerLocation: { lat: number; lng: number };
  storeLocation: { lat: number; lng: number };
  status: 'preparing' | 'outForDelivery' | 'arrived' | 'delivered';
  eta: number; // in minutes
  route: [number, number][];
}

class TrackingService {
  // Generate a mock path with smooth intermediate points
  generateRoute(start: { lat: number; lng: number }, end: { lat: number; lng: number }, steps = 15): [number, number][] {
    const route: [number, number][] = [];
    
    // Add some realistic curves to the path rather than a straight line
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      
      // Linear interpolation
      const lat = start.lat + (end.lat - start.lat) * t;
      const lng = start.lng + (end.lng - start.lng) * t;
      
      // Add slight noise/curves
      const curveOffset = Math.sin(t * Math.PI) * 0.002;
      route.push([lat + curveOffset, lng - curveOffset]);
    }
    
    return route;
  }

  // Simulate courier movement from store to customer
  subscribeToTracking(
    storeCoords: { lat: number; lng: number },
    customerCoords: { lat: number; lng: number },
    onUpdate: (state: TrackingState) => void
  ): () => void {
    const route = this.generateRoute(storeCoords, customerCoords, 20);
    let currentStep = 0;
    
    // Initial state: preparing
    onUpdate({
      driverLocation: storeCoords,
      customerLocation: customerCoords,
      storeLocation: storeCoords,
      status: 'preparing',
      eta: 15,
      route
    });

    const interval = setInterval(() => {
      currentStep++;
      
      let status: TrackingState['status'] = 'outForDelivery';
      let eta = Math.max(1, Math.round(15 * (1 - currentStep / route.length)));
      let driverLocation = { lat: route[currentStep][0], lng: route[currentStep][1] };

      if (currentStep >= route.length - 3 && currentStep < route.length) {
        status = 'arrived';
        eta = 0;
        driverLocation = customerCoords;
      } else if (currentStep >= route.length) {
        status = 'delivered';
        eta = 0;
        driverLocation = customerCoords;
        clearInterval(interval);
      }

      onUpdate({
        driverLocation,
        customerLocation: customerCoords,
        storeLocation: storeCoords,
        status,
        eta,
        route
      });
    }, 4000); // update every 4 seconds

    return () => {
      clearInterval(interval);
    };
  }
}

export const trackingService = new TrackingService();
export default trackingService;
