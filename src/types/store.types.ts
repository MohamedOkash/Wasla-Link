export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  eta: string;
}

export interface Store {
  id: string;
  vendorId?: string;
  catId: string;
  name: string;
  logoUrl: string;
  coverUrl: string;
  rating: number;
  time: number;
  fee: number;
  minOrder: number;
  isOpen: boolean;
  promoBanner?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  followersCount?: number;
  paymentInfo?: {
    vodafone?: string;
    instapay?: string;
  };
  deliveryZones?: DeliveryZone[];
  openingHours?: string;
  closingHours?: string;
  workingDays?: number[];
  isTemporarilyClosed?: boolean;
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
  tiktok?: string;
  website?: string;
  coveredVillages?: string[];
  coveredCenters?: string[];
  deliveryFees?: Record<string, number>;
  etas?: Record<string, string>;
  breakTimes?: Array<{ start: string; end: string }>;
  fridaySchedule?: { isOpen: boolean; openTime: string; closeTime: string };
  holidayMode?: boolean;
  village?: string;

  // Phase 12C: Unified Offers Engine
  offers?: Array<{
    id: string;
    title: string;
    discountPercent: number;
    expiresAt: string;
  }>;
  campaigns?: Array<{
    id: string;
    bannerUrl: string;
    linkUrl?: string;
  }>;
  featuredProducts?: string[]; // Array of product IDs
}
