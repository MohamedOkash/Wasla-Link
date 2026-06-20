import { Coupon } from '../types/coupon.types';

class CouponService {
  /**
   * Validates if a coupon can be applied to the current order details.
   */
  validateCoupon(
    coupon: Coupon,
    orderSubtotal: number,
    customerId: string,
    storeId: string,
    categoryIds: string[],
    isFirstOrder: boolean,
    cartItems?: { id: string; quantity: number; price: number }[]
  ): { isValid: boolean; error?: string } {
    if (!coupon.isActive) {
      return { isValid: false, error: 'كوبون الخصم غير نشط حالياً' };
    }

    // Expiration check
    const now = new Date();
    const start = new Date(coupon.startDate);
    const end = new Date(coupon.endDate);
    if (now < start || now > end) {
      return { isValid: false, error: 'عذراً، هذا الكوبون منتهي الصلاحية' };
    }

    // Usage limit check
    if (coupon.usageLimit !== undefined && coupon.usedCount >= coupon.usageLimit) {
      return { isValid: false, error: 'لقد نفدت عدد مرات استخدام هذا الكوبون' };
    }

    // Minimum subtotal check
    if (orderSubtotal < coupon.minOrder) {
      return { 
        isValid: false, 
        error: `الحد الأدنى لتطبيق هذا الكوبون هو ${coupon.minOrder} ج.م` 
      };
    }

    // First order restriction
    if (coupon.isFirstOrderOnly && !isFirstOrder) {
      return { isValid: false, error: 'هذا الكوبون مخصص للطلب الأول فقط' };
    }

    // Store restriction
    if (coupon.storeId && coupon.storeId !== storeId) {
      return { isValid: false, error: 'هذا الكوبون غير صالح لمنتجات هذا المتجر' };
    }

    // Category restriction
    if (coupon.categoryId && !categoryIds.includes(coupon.categoryId)) {
      return { isValid: false, error: 'هذا الكوبون غير صالح للأصناف المحددة في سلتك' };
    }

    // Buy X Get Y validation
    if (coupon.discountType === 'buy_x_get_y') {
      if (!coupon.buyXProductIds || !coupon.buyQty) {
        return { isValid: false, error: 'إعدادات عرض شراء منتج والحصول على آخر غير مكتملة' };
      }
      if (!cartItems || cartItems.length === 0) {
        return { isValid: false, error: 'السلة فارغة أو غير متوفرة للتحقق من شروط العرض' };
      }

      // Check if required X items are in cart
      const xItemsInCart = cartItems.filter(item => coupon.buyXProductIds!.includes(item.id));
      const totalXQty = xItemsInCart.reduce((sum, item) => sum + item.quantity, 0);
      if (totalXQty < coupon.buyQty) {
        return {
          isValid: false,
          error: `يجب شراء ${coupon.buyQty} قطع على الأقل من المنتجات المشمولة بالعرض لتطبيق الكوبون`
        };
      }

      // Check if required Y items are in cart
      if (coupon.getXProductIds && coupon.getQty) {
        const yItemsInCart = cartItems.filter(item => coupon.getXProductIds!.includes(item.id));
        const totalYQty = yItemsInCart.reduce((sum, item) => sum + item.quantity, 0);
        if (totalYQty < coupon.getQty) {
          return {
            isValid: false,
            error: `يرجى إضافة المنتج المهدى المجاني (${coupon.getQty} قطعة) إلى السلة لتطبيق الخصم`
          };
        }
      }
    }

    return { isValid: true };
  }

  /**
   * Calculates the discount value based on subtotal and coupon parameters.
   */
  calculateDiscount(
    coupon: Coupon,
    orderSubtotal: number,
    deliveryFee: number,
    cartItems?: { id: string; quantity: number; price: number }[]
  ): number {
    if (coupon.discountType === 'free_delivery') {
      return deliveryFee;
    }

    if (coupon.discountType === 'fixed') {
      return Math.min(coupon.discountValue, orderSubtotal);
    }

    if (coupon.discountType === 'buy_x_get_y') {
      if (!coupon.getXProductIds || !coupon.getQty || !cartItems) {
        return 0;
      }
      // Calculate free items discount
      const yItemsInCart = cartItems.filter(item => coupon.getXProductIds!.includes(item.id));
      let remainingGetQty = coupon.getQty;
      let discount = 0;
      // Deduct cheapest items first (safety precaution)
      const sortedYItems = [...yItemsInCart].sort((a, b) => a.price - b.price);
      for (const item of sortedYItems) {
        const qtyToDiscount = Math.min(item.quantity, remainingGetQty);
        discount += qtyToDiscount * item.price;
        remainingGetQty -= qtyToDiscount;
        if (remainingGetQty <= 0) break;
      }
      return discount;
    }

    // Percentage discount
    const calculated = orderSubtotal * (coupon.discountValue / 100);
    if (coupon.maxDiscount !== undefined) {
      return Math.min(calculated, coupon.maxDiscount);
    }
    return calculated;
  }
}

export const couponService = new CouponService();
export default couponService;
