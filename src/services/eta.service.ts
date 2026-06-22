export class ETAService {
  // Average urban speeds in m/s (e.g. 20 km/h = ~5.5 m/s)
  private readonly DEFAULT_DRIVER_SPEED_MS = 5.5;

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
  }

  calculateDriverToStoreETA(
    driverLoc: { lat: number; lng: number } | null,
    storeLoc: { lat: number; lng: number }
  ): number {
    if (!driverLoc) return 15; // default 15 mins if unknown
    const dist = this.calculateDistance(driverLoc.lat, driverLoc.lng, storeLoc.lat, storeLoc.lng);
    // distance / speed = seconds. Convert to minutes. Minimum 1 minute.
    return Math.max(1, Math.round((dist / this.DEFAULT_DRIVER_SPEED_MS) / 60));
  }

  calculateStoreToCustomerETA(
    storeLoc: { lat: number; lng: number },
    customerLoc: { lat: number; lng: number } | null
  ): number {
    if (!customerLoc) return 20; // default 20 mins if unknown
    const dist = this.calculateDistance(storeLoc.lat, storeLoc.lng, customerLoc.lat, customerLoc.lng);
    return Math.max(1, Math.round((dist / this.DEFAULT_DRIVER_SPEED_MS) / 60));
  }

  calculateTotalETA(
    driverLoc: { lat: number; lng: number } | null,
    storeLoc: { lat: number; lng: number },
    customerLoc: { lat: number; lng: number } | null,
    currentStatus: string
  ): number {
    const driverToStore = this.calculateDriverToStoreETA(driverLoc, storeLoc);
    const storeToCustomer = this.calculateStoreToCustomerETA(storeLoc, customerLoc);

    if (currentStatus === 'on_the_way') {
      // Driver is already on the way to customer
      if (driverLoc && customerLoc) {
        const dist = this.calculateDistance(driverLoc.lat, driverLoc.lng, customerLoc.lat, customerLoc.lng);
        return Math.max(1, Math.round((dist / this.DEFAULT_DRIVER_SPEED_MS) / 60));
      }
      return storeToCustomer;
    }

    if (currentStatus === 'delivered' || currentStatus === 'cancelled' || currentStatus === 'returned') {
      return 0;
    }

    // Default: waiting for driver, preparation + travel
    return driverToStore + storeToCustomer + 5; // adding 5 mins prep/handover buffer
  }
}

export const etaService = new ETAService();
export default etaService;
