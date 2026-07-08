import { doc, setDoc, collection, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import * as geofire from 'geofire-common';

export type GpsStatus = 'gps_disabled' | 'permission_denied' | 'weak_signal' | 'offline' | 'online';

export interface LocationData {
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  accuracy: number;
  lastUpdated: number;
  status: GpsStatus;
}

class GeolocationService {
  private watchId: number | null = null;
  private driverId: string | null = null;
  
  private lastLat: number | null = null;
  private lastLng: number | null = null;
  private lastSyncTime: number = 0;
  private syncIntervalMs: number = 30000;

  // Configuration
  private readonly MIN_MOVEMENT_METERS = 5;
  private readonly MIN_SYNC_INTERVAL_MS = 3000;
  private readonly FORCE_SYNC_INTERVAL_MS = 3000;
  private readonly MAX_ACCURACY_METERS = 100;

  private statusCallback: ((status: GpsStatus) => void) | null = null;
  private locationCallback: ((loc: LocationData) => void) | null = null;

  // History batch buffer
  private historyBuffer: any[] = [];
  private historyFlushInterval: any = null;

  setTrackingIntervalForStatus(status: string) {
    if (status === 'delivering') {
      this.syncIntervalMs = 5000;
    } else if (status === 'busy') {
      this.syncIntervalMs = 15000;
    } else if (status === 'available' || status === 'online') {
      this.syncIntervalMs = 30000;
    } else {
      this.syncIntervalMs = 30000;
    }
  }

  startTracking(driverId: string, onStatusChange: (s: GpsStatus) => void, onLocationUpdate: (l: LocationData) => void) {
    this.driverId = driverId;
    this.statusCallback = onStatusChange;
    this.locationCallback = onLocationUpdate;

    if (!navigator.geolocation) {
      this.updateStatus('gps_disabled');
      return;
    }

    if (!navigator.onLine) {
      this.updateStatus('offline');
    }

    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Watch position with high accuracy, no cache age, and 10 second timeout
    this.watchId = navigator.geolocation.watchPosition(
      this.handlePosition.bind(this),
      this.handleError.bind(this),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      }
    );

    // Start 5-minute history flushing interval (300000 ms)
    this.historyFlushInterval = setInterval(() => {
      this.flushHistory();
    }, 300000);
  }

  async stopTracking() {
    if (this.historyFlushInterval) {
      clearInterval(this.historyFlushInterval);
      this.historyFlushInterval = null;
    }
    
    // Flush any remaining history points before stopping
    await this.flushHistory();

    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.driverId = null;
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  private handleOnline = () => {
    this.updateStatus('online');
  };

  private handleOffline = () => {
    this.updateStatus('offline');
  };

  private updateStatus(status: GpsStatus) {
    if (this.statusCallback) {
      this.statusCallback(status);
    }
  }

  private async handlePosition(position: GeolocationPosition) {
    const { latitude, longitude, accuracy, heading, speed } = position.coords;

    // Check accuracy threshold
    if (accuracy > this.MAX_ACCURACY_METERS) {
      this.updateStatus('weak_signal');
      return; // Ignore highly inaccurate reads
    }

    this.updateStatus('online');

    const now = Date.now();
    
    // Check if we need to sync based on time (syncIntervalMs) or distance (5m)
    let shouldSync = false;

    if (!this.lastLat || !this.lastLng) {
      shouldSync = true;
    } else {
      const timeSinceLastSync = now - this.lastSyncTime;
      const distance = this.calculateDistance(this.lastLat, this.lastLng, latitude, longitude);

      if (timeSinceLastSync >= this.syncIntervalMs) {
        shouldSync = true;
      } else if (distance >= this.MIN_MOVEMENT_METERS && timeSinceLastSync >= 3000) {
        shouldSync = true;
      }
    }

    const locData: LocationData = {
      lat: latitude,
      lng: longitude,
      heading,
      speed,
      accuracy,
      lastUpdated: now,
      status: 'online'
    };

    if (this.locationCallback) {
      this.locationCallback(locData);
    }

    if (shouldSync && this.driverId && navigator.onLine) {
      await this.syncToFirestore(locData);
      this.lastLat = latitude;
      this.lastLng = longitude;
      this.lastSyncTime = now;
    }
  }

  private handleError(error: GeolocationPositionError) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        this.updateStatus('permission_denied');
        break;
      case error.POSITION_UNAVAILABLE:
        this.updateStatus('gps_disabled');
        break;
      case error.TIMEOUT:
        this.updateStatus('weak_signal');
        break;
    }
  }

  public async forceSyncEvent(event: 'Shift Start' | 'Pickup' | 'Delivery' | 'Shift End' | 'Emergency Disconnect') {
    if (this.lastLat && this.lastLng) {
      await this.syncToFirestore({
        lat: this.lastLat,
        lng: this.lastLng,
        heading: null,
        speed: null,
        accuracy: 0,
        lastUpdated: Date.now(),
        status: 'online'
      }, event);
    }
  }

  private async syncToFirestore(loc: LocationData, event?: 'Shift Start' | 'Pickup' | 'Delivery' | 'Shift End' | 'Emergency Disconnect') {
    if (!this.driverId) return;

    try {
      // 1. Update Current Location in real-time
      const hash = geofire.geohashForLocation([loc.lat, loc.lng]);
      const locRef = doc(db, 'driverLocations', this.driverId);
      await setDoc(locRef, {
        driverId: this.driverId,
        ...loc,
        geohash: hash
      }, { merge: true });

      // 2. Buffer history point in memory (never write history on every update)
      this.historyBuffer.push({
        lat: loc.lat,
        lng: loc.lng,
        speed: loc.speed,
        heading: loc.heading,
        event: event || null,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error("Failed to sync location to firestore", e);
    }
  }

  public async flushHistory() {
    if (!this.driverId || this.historyBuffer.length === 0) return;

    const pointsToWrite = [...this.historyBuffer];
    this.historyBuffer = [];

    try {
      const batch = writeBatch(db);
      const historyCollectionRef = collection(db, `driverLocationHistory/${this.driverId}/points`);
      
      pointsToWrite.forEach((pt) => {
        const newDocRef = doc(historyCollectionRef);
        batch.set(newDocRef, pt);
      });

      await batch.commit();
      console.log(`Flushed ${pointsToWrite.length} history points to Firestore.`);
    } catch (e) {
      console.error("Failed to write location history batch, buffering back:", e);
      // Put them back in front of the buffer
      this.historyBuffer = [...pointsToWrite, ...this.historyBuffer];
    }
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

export const geoService = new GeolocationService();
export default geoService;
