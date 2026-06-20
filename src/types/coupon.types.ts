export interface Coupon {
  id: string;
  code: string; // e.g. "EID2026"
  discountType: 'percentage' | 'fixed' | 'free_delivery' | 'buy_x_get_y';
  discountValue: number; // e.g. 15 for 15% or 50 for 50 EGP (0 for free_delivery)
  minOrder: number; // Min subtotal required
  maxDiscount?: number; // Max discount limit for percentage discount
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  usageLimit?: number; // Total usage limit
  usedCount: number; // Total times used
  isActive: boolean;
  isFirstOrderOnly?: boolean;
  storeId?: string; // Applicable to specific store only
  categoryId?: string; // Applicable to specific category only
  customerLimit?: number; // Usage limit per customer
  buyXProductIds?: string[];
  getXProductIds?: string[];
  buyQty?: number;
  getQty?: number;
}
