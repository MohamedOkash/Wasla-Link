import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface DeliveryFeeConfig {
  sameVillageFee: number;
  nearVillageFee: number;
  farVillageFee: number;
  sameVillageEta: string;
  nearVillageEta: string;
  farVillageEta: string;
  villageClassifications: Record<string, 'same' | 'near' | 'far'>;
}

export const DEFAULT_DELIVERY_FEE_CONFIG: DeliveryFeeConfig = {
  sameVillageFee: 5,
  nearVillageFee: 15,
  farVillageFee: 25,
  sameVillageEta: '15-20 دقيقة',
  nearVillageEta: '25-35 دقيقة',
  farVillageEta: '40-60 دقيقة',
  villageClassifications: {
    'ميت غراب': 'same',
    'السنبلاوين': 'near',
    'برقين': 'near',
    'البوها': 'far',
    'طماي الزهايرة': 'far',
    'ميت علي': 'far'
  }
};

class DeliveryFeeService {
  private config: DeliveryFeeConfig | null = null;

  async getConfig(): Promise<DeliveryFeeConfig> {
    if (this.config) return this.config;
    try {
      const docRef = doc(db, 'config', 'deliveryFees');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        this.config = docSnap.data() as DeliveryFeeConfig;
      } else {
        await setDoc(docRef, DEFAULT_DELIVERY_FEE_CONFIG);
        this.config = DEFAULT_DELIVERY_FEE_CONFIG;
      }
      return this.config;
    } catch (err) {
      console.error('Error fetching delivery fee config:', err);
      return DEFAULT_DELIVERY_FEE_CONFIG;
    }
  }

  async saveConfig(newConfig: DeliveryFeeConfig): Promise<void> {
    const docRef = doc(db, 'config', 'deliveryFees');
    await setDoc(docRef, newConfig);
    this.config = newConfig;
  }

  calculateFeeAndEta(
    storeVillage: string,
    customerVillage: string,
    storeBaseFee: number,
    storeBaseEta: string,
    config: DeliveryFeeConfig
  ): { fee: number; eta: string } {
    if (!customerVillage) {
      return { fee: storeBaseFee, eta: storeBaseEta };
    }

    if (storeVillage === customerVillage) {
      return {
        fee: config.sameVillageFee,
        eta: config.sameVillageEta
      };
    }

    const classification = config.villageClassifications[customerVillage];
    if (classification === 'same') {
      return {
        fee: config.sameVillageFee,
        eta: config.sameVillageEta
      };
    } else if (classification === 'near') {
      return {
        fee: config.nearVillageFee,
        eta: config.nearVillageEta
      };
    } else if (classification === 'far') {
      return {
        fee: config.farVillageFee,
        eta: config.farVillageEta
      };
    }

    // Default fallback
    return {
      fee: storeBaseFee || config.nearVillageFee,
      eta: storeBaseEta || config.nearVillageEta
    };
  }
}

export const deliveryFeeService = new DeliveryFeeService();
