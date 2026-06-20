export interface EgyptianAddress {
  id?: string;
  label?: string; // e.g. "المنزل" or "العمل"
  governorate: string; // e.g. "Dakahlia"
  center: string; // e.g. "Sinbillawin"
  village: string; // e.g. "Mit Ghorab"
  street: string;
  building: string;
  floor?: string;
  apartment?: string;
  landmark?: string;
  notes?: string;
  gpsCoords?: { lat: number; lng: number } | null;
  isDefault: boolean;
}

export interface DeliveryZone {
  id: string;
  name: string; // e.g. "ميت غراب"
  fee: number;
  eta: string; // e.g. "15-20 دقيقة"
  center: string; // e.g. "السنبلاوين"
  governorate: string; // e.g. "الدقهلية"
  isActive: boolean;
}

export interface BreakTime {
  start: string; // "14:00"
  end: string;   // "16:00"
}

export interface FridaySchedule {
  isOpen: boolean;
  openTime: string; // "13:00"
  closeTime: string; // "23:00"
}

export interface BusinessHours {
  openingHours: string; // "08:00"
  closingHours: string; // "23:00"
  breakTimes: BreakTime[];
  fridaySchedule: FridaySchedule;
  holidayMode: boolean;
  temporaryClosure: boolean;
}

export interface StoreCoverage {
  coveredVillages: string[]; // List of villages covered
  coveredCenters: string[];  // List of centers covered
  deliveryFees: Record<string, number>; // village -> fee mapping
  etas: Record<string, string>; // village -> eta mapping
}
