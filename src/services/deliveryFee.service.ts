import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { PlatformSettings } from '../types/financial';

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  commissionPercent: 10,
  driverBonusPercent: 0,
  freeDeliveryEnabled: false,
  promotionSubsidyEnabled: false,
  maintenanceRevenueLock: false,
  baseDeliveryFee: 10,
  pricePerKm: 3,
  minimumDeliveryFee: 10,
  maximumDeliveryFee: 100,
  peakHourMultiplier: 5, // Flat fee added
  nightMultiplier: 5,    // Flat fee added
  holidayMultiplier: 10,  // Flat fee added
  rainMultiplier: 15,    // Flat fee added
  remoteAreaMultiplier: 10, // Flat fee added
  freeDeliveryThreshold: 250,
  roadFactor: 1.35,
  averageSpeed: 30
};

class DeliveryFeeService {
  private settings: PlatformSettings | null = null;

  async getSettings(): Promise<PlatformSettings> {
    if (this.settings) return this.settings;
    try {
      const docRef = doc(db, 'platformSettings', 'default');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        this.settings = { ...DEFAULT_PLATFORM_SETTINGS, ...docSnap.data() } as PlatformSettings;
      } else {
        await setDoc(docRef, DEFAULT_PLATFORM_SETTINGS);
        this.settings = DEFAULT_PLATFORM_SETTINGS;
      }
      return this.settings;
    } catch (err) {
      console.error('Error fetching platform settings:', err);
      return DEFAULT_PLATFORM_SETTINGS;
    }
  }

  async saveSettings(newSettings: PlatformSettings): Promise<void> {
    const docRef = doc(db, 'platformSettings', 'default');
    await setDoc(docRef, newSettings);
    this.settings = newSettings;
  }

  // Retain for fallback / backwards compatibility
  calculateFeeAndEta(
    storeVillage: string,
    customerVillage: string,
    storeBaseFee: number,
    storeBaseEta: string,
    config: any
  ): { fee: number; eta: string } {
    const baseFee = storeBaseFee || 15;
    const eta = storeBaseEta || '25-35 دقيقة';
    return { fee: baseFee, eta };
  }

  calculateSmartFee(
    roadDistanceKm: number,
    settings: PlatformSettings,
    conditions: {
      isPeak?: boolean;
      isNight?: boolean;
      isHoliday?: boolean;
      isRain?: boolean;
      isRemote?: boolean;
      orderSubtotal?: number;
    } = {}
  ): number {
    if (settings.freeDeliveryEnabled) return 0;
    if (
      conditions.orderSubtotal !== undefined &&
      settings.freeDeliveryThreshold > 0 &&
      conditions.orderSubtotal >= settings.freeDeliveryThreshold
    ) {
      return 0;
    }

    // Formula: Base Fee + (Road Distance * Price Per KM)
    let fee = settings.baseDeliveryFee + (roadDistanceKm * settings.pricePerKm);

    // Apply flat additions for Peak, Night, Holiday, Rain, Remote
    if (conditions.isPeak) {
      fee += settings.peakHourMultiplier || 0;
    }
    if (conditions.isNight) {
      fee += settings.nightMultiplier || 0;
    }
    if (conditions.isHoliday) {
      fee += settings.holidayMultiplier || 0;
    }
    if (conditions.isRain) {
      fee += settings.rainMultiplier || 0;
    }
    if (conditions.isRemote) {
      fee += settings.remoteAreaMultiplier || 0;
    }

    // Constrain between min and max fees
    fee = Math.max(settings.minimumDeliveryFee, Math.min(settings.maximumDeliveryFee, fee));

    return Math.round(fee);
  }
}

export const deliveryFeeService = new DeliveryFeeService();
export default deliveryFeeService;
