import React, { useState } from 'react';
import { ChevronRight, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Tag, Sparkles } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { calculateDiscountedPrice, getPromoLabel } from '../../utils/promo';
import { Product } from '../../types/product.types';
import { couponService } from '../../services/coupon.service';

// Premium Rebuild Imports
import { PremiumButton } from '../../components/premium/PremiumButton';
import { PremiumInput } from '../../components/premium/PremiumInput';
import { PremiumCard } from '../../components/premium/PremiumCard';
import { PremiumBadge } from '../../components/premium/PremiumBadge';
import { PremiumEmptyState } from '../../components/premium/PremiumEmptyState';

interface CustomerCartProps {
  goBack: () => void;
  goToCheckout: () => void;
}

export const CustomerCart: React.FC<CustomerCartProps> = ({ goBack, goToCheckout }) => {
  const { cart, setCart, stores, t, isRTL, products, coupons, activeCoupon, setActiveCoupon, currentUser, orders, showToast } = useApp();

  const handleIncrement = (id: string) => {
    setCart(prev => {
      const items = prev.items.map(item => {
        if (item.id === id) return { ...item, quantity: item.quantity + 1 };
        return item;
      });
      return { ...prev, items };
    });
  };

  const handleDecrement = (id: string) => {
    setCart(prev => {
      const items = prev.items.map(item => {
        if (item.id === id) return { ...item, quantity: item.quantity - 1 };
        return item;
      }).filter(item => item.quantity > 0);
      
      return {
        shopId: items.length > 0 ? prev.shopId : null,
        shopName: items.length > 0 ? prev.shopName : '',
        items
      };
    });
  };

  const handleRemove = (id: string) => {
    setCart(prev => {
      const items = prev.items.filter(item => item.id !== id);
      return {
        shopId: items.length > 0 ? prev.shopId : null,
        shopName: items.length > 0 ? prev.shopName : '',
        items
      };
    });
  };

  const [couponCode, setCouponCode] = useState(activeCoupon ? activeCoupon.code : '');
  const [couponError, setCouponError] = useState<string | null>(null);

  // Find store to get its actual delivery fee
  const store = stores.find(s => s.id === cart.shopId);
  const deliveryFee = store ? store.fee : 0;
  
  // Apply actual dynamic discount calculations
  const subtotal = cart.items.reduce((sum, item) => {
    const prod = (products.find(p => p.id === item.id) || { ...item, price: item.price }) as Product;
    return sum + calculateDiscountedPrice(prod, item.quantity);
  }, 0);

  const discountAmount = activeCoupon ? couponService.calculateDiscount(activeCoupon, subtotal, deliveryFee, cart.items.map(i => ({ id: i.id, quantity: i.quantity, price: i.price }))) : 0;
  const total = Math.max(0, subtotal - discountAmount) + deliveryFee;

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    const coupon = coupons.find(c => c.code.toUpperCase() === couponCode.trim().toUpperCase());
    if (!coupon) {
      setCouponError(isRTL ? 'كود الخصم غير صحيح' : 'Invalid coupon code');
      setActiveCoupon(null);
      return;
    }
    
    const isFirstOrder = orders.filter(o => o.customerId === currentUser?.id).length === 0;
    const categoryIds = cart.items.map(i => {
      const p = products.find(prod => prod.id === i.id);
      return p ? p.cat : '';
    });

    const validation = couponService.validateCoupon(
      coupon,
      subtotal,
      currentUser?.id || 'guest',
      cart.shopId || '',
      categoryIds,
      isFirstOrder,
      cart.items.map(i => ({ id: i.id, quantity: i.quantity, price: i.price }))
    );

    if (!validation.isValid) {
      setCouponError(validation.error || 'كوبون غير صالح');
      setActiveCoupon(null);
    } else {
      setActiveCoupon(coupon);
      setCouponError(null);
      showToast(isRTL ? 'تم تطبيق كود الخصم بنجاح' : 'Coupon applied successfully');
    }
  };

  const handleRemoveCoupon = () => {
    setActiveCoupon(null);
    setCouponCode('');
    setCouponError(null);
    showToast(isRTL ? 'تم إزالة كود الخصم' : 'Coupon removed');
  };

  if (cart.items.length === 0) {
    return (
      <div className="bg-theme-bg min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in theme-transition">
        <PremiumEmptyState 
          title={t('emptyCart')}
          description={isRTL ? 'سلتك فارغة تماماً حالياً. قم بإضافة المنتجات الطازجة والسلع التي تحتاجها!' : 'Your cart is completely empty. Add fresh goods and local items to start!'}
          icon={<ShoppingBag size={36} />}
          action={
            <PremiumButton onClick={goBack} variant="primary" size="md" className="shadow-md">
              {isRTL ? 'ابدأ التسوق الآن' : 'Start Shopping Now'}
            </PremiumButton>
          }
        />
      </div>
    );
  }

  return (
    <div className="bg-theme-bg h-full flex flex-col overflow-hidden animate-slide-in-right theme-transition pb-[calc(env(safe-area-inset-bottom)+12rem)]">
      
      {/* Header Panel */}
      <div className="bg-theme-card px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 shadow-sm border-b border-theme-border/60 flex items-center gap-3.5 z-20 theme-transition">
        <button 
          onClick={goBack} 
          className="p-2.5 text-theme-text bg-theme-bg hover:bg-theme-border/50 rounded-full transition flex items-center justify-center border border-theme-border/30"
        >
          <ChevronRight size={18} className={isRTL ? '' : 'rotate-180'} />
        </button>
        <h1 className="text-sm font-black text-theme-text flex items-center gap-2">
          <span>{t('cart')}</span>
          <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-lg border border-primary/15 font-sans">
            {cart.shopName}
          </span>
        </h1>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-theme-bg/30 no-scrollbar">
        {cart.items.map(item => {
          const prod = (products.find(p => p.id === item.id) || { ...item, price: item.price }) as Product;
          const discountedUnit = calculateDiscountedPrice(prod, 1);
          const hasDiscount = discountedUnit < prod.price;
          const promoLabel = getPromoLabel(prod, isRTL);

          return (
            <PremiumCard 
              key={item.id} 
              hoverable={false}
              className="p-3.5 flex gap-3 relative group animate-card-entrance"
            >
              <img src={item.imgUrl} className="w-20 h-20 rounded-2xl object-cover bg-theme-bg flex-shrink-0 border border-theme-border/30" alt={item.name} />
              
              <div className="flex-1 flex flex-col justify-between py-0.5">
                <div>
                  <h3 className="font-black text-xs text-theme-text line-clamp-1">{item.name}</h3>
                  
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <span className="text-xs font-black text-primary font-sans">
                      {discountedUnit} ج.م
                    </span>
                    {hasDiscount && (
                      <span className="text-[9px] text-theme-muted line-through font-bold font-sans">
                        {prod.price} ج.م
                      </span>
                    )}
                    {promoLabel && (
                      <PremiumBadge variant="danger" pill={true}>
                        {promoLabel}
                      </PremiumBadge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2.5">
                  {/* Quantity adjust */}
                  <div className="flex items-center bg-theme-bg border border-theme-border/80 rounded-xl p-0.5 shadow-inner">
                    <button onClick={() => handleDecrement(item.id)} className="p-1.5 text-theme-text hover:bg-theme-border rounded-lg transition active:scale-90">
                      <Minus size={9} strokeWidth={3} />
                    </button>
                    <span className="text-xs font-black text-theme-text px-3 font-sans">{item.quantity}</span>
                    <button onClick={() => handleIncrement(item.id)} className="p-1.5 text-theme-text hover:bg-theme-border rounded-lg transition active:scale-90">
                      <Plus size={9} strokeWidth={3} />
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => handleRemove(item.id)} 
                    className="text-theme-muted hover:text-red-500 transition p-2 bg-theme-bg border border-theme-border/60 rounded-xl"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </PremiumCard>
          );
        })}
      </div>

      {/* Premium Coupon Integration */}
      <div className="bg-theme-card border-t border-theme-border/60 p-5 space-y-3 theme-transition">
        <div className="flex gap-2.5 items-end">
          <PremiumInput 
            label={isRTL ? 'كوبون الخصم' : 'Promo Coupon Code'}
            type="text" 
            value={couponCode}
            disabled={!!activeCoupon}
            onChange={(e) => { setCouponCode(e.target.value); setCouponError(null); }}
            placeholder={isRTL ? 'مثال: SOUQ20' : 'e.g. SOUQ20'} 
            leftIcon={<Tag size={14} />}
            wrapperClassName="flex-1"
          />
          {activeCoupon ? (
            <PremiumButton 
              onClick={handleRemoveCoupon}
              variant="danger"
              size="md"
              className="h-10 text-xs font-black rounded-xl"
            >
              {isRTL ? 'إلغاء' : 'Remove'}
            </PremiumButton>
          ) : (
            <PremiumButton 
              onClick={handleApplyCoupon}
              variant="primary"
              size="md"
              className="h-10 text-xs font-black rounded-xl"
            >
              {isRTL ? 'تطبيق' : 'Apply'}
            </PremiumButton>
          )}
        </div>
        {couponError && (
          <p className="text-[10px] font-bold text-red-500 animate-fade-in">{couponError}</p>
        )}
        {activeCoupon && (
          <p className="text-[10px] font-black text-green-500 flex items-center gap-1 animate-pop-in">
            <Sparkles size={11} className="text-green-500 animate-pulse" />
            {isRTL ? 'كود خصم فعال! تم توفير:' : 'Coupon active! Discount saved:'} {discountAmount} ج.م
          </p>
        )}
      </div>

      {/* Sticky Bottom Order Summary Panel */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[400px] mx-auto w-full bg-theme-card border-t border-theme-border p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] rounded-t-[32px] shadow-[0_-12px_28px_rgba(0,0,0,0.06)] z-30 theme-transition space-y-4">
        <h3 className="font-black text-sm text-theme-text">{isRTL ? 'ملخص الطلب' : 'Order Summary'}</h3>
        <div className="space-y-2.5 text-xs bg-theme-bg/50 p-3.5 rounded-2xl border border-theme-border/50">
          <div className="flex justify-between text-theme-muted font-semibold">
            <span>{isRTL ? 'عدد المنتجات' : 'Product Count'}</span>
            <span className="font-sans">{cart.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </div>
          <div className="flex justify-between text-theme-muted font-semibold">
            <span>{t('subtotal')}</span>
            <span className="font-sans font-bold text-theme-text">{subtotal} ج.م</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-green-500 font-bold animate-fade-in bg-green-500/10 p-2 rounded-lg mt-1">
              <span>{isRTL ? 'خصم الكوبون:' : 'Coupon Discount:'}</span>
              <span className="font-sans">-{discountAmount} ج.م</span>
            </div>
          )}
          <div className="flex justify-between text-theme-muted font-semibold">
            <span>{t('deliveryFee')}</span>
            <span className="font-sans font-bold text-theme-text">{deliveryFee} ج.م</span>
          </div>
          <div className="border-t border-theme-border/80 my-2 pt-3 flex justify-between items-center text-theme-text font-black">
            <span className="text-sm">{t('total')}</span>
            <span className="text-primary font-sans font-black text-lg">{total} ج.م</span>
          </div>
        </div>

        <PremiumButton
          onClick={goToCheckout}
          variant="primary"
          size="lg"
          className="w-full shadow-lg shadow-primary/20 rounded-2xl flex items-center justify-center gap-2 font-black text-xs h-12"
          rightIcon={<ArrowRight size={15} strokeWidth={3} className={isRTL ? 'rotate-180' : ''} />}
        >
          {isRTL ? 'الذهاب لصفحة الدفع' : 'Proceed to Checkout'}
        </PremiumButton>
      </div>

    </div>
  );
};

export default CustomerCart;
