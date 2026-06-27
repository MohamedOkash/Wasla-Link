/**
 * Wasla Link - Phase 6 Prepared Data Models
 * Prepared structures for Phase 7 backend migration.
 */

export interface Coupon {
  id: string;
  code: string; // e.g., "WASLA20"
  type: 'percentage' | 'fixed';
  value: number; // e.g., 20 for 20% or 50 for 50 EGP
  minOrderValue?: number; // Minimum order value required to apply coupon
  maxDiscountAmount?: number; // Maximum cap on percentage discount
  startDate: string; // ISO timestamp
  endDate: string; // ISO timestamp
  isActive: boolean;
  usageLimit?: number; // Total number of times this coupon can be redeemed
  usageCount: number; // Number of times already used
}

export interface DeliveryZone {
  id: string;
  name: string; // Zone name (e.g., "السنبلاوين")
  fee: number;
  eta: string; // Expected delivery duration (e.g., "20-30 دقيقة")
  polygonCoords?: { lat: number; lng: number }[]; // For geo-fenced boundaries
  isActive: boolean;
}

export interface DeliveryFee {
  id: string;
  storeId: string;
  baseFee: number;
  perKmFee?: number; // Optional distance-based charges
  freeDeliveryThreshold?: number; // Free delivery for orders above this value
  nightSurcharge?: number; // Extra charges during night hours
  isActive: boolean;
}

export interface BusinessHours {
  id: string;
  storeId: string;
  dayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
  openingTime: string; // e.g., "08:00"
  closingTime: string; // e.g., "23:00"
  isClosed: boolean; // Flag for holidays/off-days
}
