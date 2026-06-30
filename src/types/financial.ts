export type TransactionType = 'order_revenue' | 'platform_commission' | 'vendor_revenue' | 'driver_earning' | 'refund' | 'vendor_settlement' | 'driver_withdrawal' | 'manual_adjustment';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed';

export interface LedgerTransaction {
  id: string;
  type: TransactionType;
  referenceId: string; // E.g., Order ID or Settlement ID
  orderId?: string;
  vendorId?: string;
  driverId?: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  createdAt: any; // Firestore Timestamp
  metadata?: Record<string, any>;
  paymentId?: string;
}

export interface PlatformSettings {
  commissionPercent: number;
  driverBonusPercent: number;
  freeDeliveryEnabled: boolean;
  promotionSubsidyEnabled: boolean;
  maintenanceRevenueLock: boolean;
  baseDeliveryFee: number;
  pricePerKm: number;
  minimumDeliveryFee: number;
  maximumDeliveryFee: number;
  peakHourMultiplier: number;
  nightMultiplier: number;
  holidayMultiplier: number;
  rainMultiplier: number;
  remoteAreaMultiplier: number;
  freeDeliveryThreshold: number;
  roadFactor: number;
  averageSpeed: number;
  nearbyStoreRadius: number;
  nearbyExtraFee: number;
  farStoreExtraFee: number;
  maximumDeliveryRadius: number;
}

export interface SettlementRequest {
  id: string;
  userId: string;
  userType: 'vendor' | 'driver';
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  requestedAt: any;
  processedAt?: any;
  processedBy?: string;
  notes?: string;
}

export interface Wallet {
  balance: number;
  pendingBalance: number;
  paidBalance: number;
  updatedAt: any;
}
