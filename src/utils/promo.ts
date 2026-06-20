import { Product } from '../types/product.types';

/**
 * Calculates the total cost for a specific quantity of a product,
 * taking into account its Promotion Engine 2.0 offer rules.
 */
export const calculateDiscountedPrice = (product: Product, quantity: number): number => {
  const price = product.price;
  if (!product.isOffer || !product.offerType) {
    return price * quantity;
  }

  const val = product.offerValue || 0;
  switch (product.offerType) {
    case 'percentage': {
      const discount = price * (val / 100);
      return (price - discount) * quantity;
    }
    case 'fixed': {
      const unitPrice = Math.max(0, price - val);
      return unitPrice * quantity;
    }
    case 'buyOneGetOne': {
      // Buy 1 Get 1 Free: pay for Math.ceil(quantity / 2)
      return Math.ceil(quantity / 2) * price;
    }
    case 'bundle': {
      // Bundle of 3: standard package size.
      // If offerValue is set, it represents the bundle price for 3 items.
      // Otherwise, we default to 3 items for the price of 2.25 (25% off bundle).
      const bundleSize = 3;
      const bundlePrice = val > 0 ? val : (price * bundleSize * 0.75);
      const bundles = Math.floor(quantity / bundleSize);
      const remainder = quantity % bundleSize;
      return (bundles * bundlePrice) + (remainder * price);
    }
    default:
      return price * quantity;
  }
};

/**
 * Returns a user-friendly label/description of the active discount.
 */
export const getPromoLabel = (product: Product, isRTL: boolean = true): string => {
  if (!product.isOffer || !product.offerType) return '';
  const val = product.offerValue || 0;

  switch (product.offerType) {
    case 'percentage':
      return isRTL ? `خصم ${val}%` : `${val}% OFF`;
    case 'fixed':
      return isRTL ? `خصم ${val} ج.م` : `${val} EGP OFF`;
    case 'buyOneGetOne':
      return isRTL ? 'اشترِ 1 واحصل على 1 مجاناً' : 'BOGO: Buy 1 Get 1 Free';
    case 'bundle':
      return isRTL ? `عرض الحزمة (3 قطع بسعر خاص)` : `Bundle Deal (3 Pcs Special)`;
    default:
      return isRTL ? 'عرض خاص' : 'Special Offer';
  }
};
