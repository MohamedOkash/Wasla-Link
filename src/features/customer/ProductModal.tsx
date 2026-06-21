import React, { useState, useEffect } from 'react';
import { ChevronRight, Plus, Minus, Check, Heart, Tag, Star, Reply, ShoppingBag, Sparkles, Share2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { db } from '../../services/firebase';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { Product } from '../../types/product.types';
import { recommendationService } from '../../services/recommendation.service';
import { Store } from '../../types/store.types';
import { ProductGalleryPro } from '../../components/premium/ProductGalleryPro';
import { calculateDiscountedPrice, getPromoLabel } from '../../utils/promo';

// Premium Rebuild Imports
import { ProductCard } from '../../components/premium/ProductCard';
import { PremiumSection } from '../../components/premium/PremiumSection';
import { PremiumBadge } from '../../components/premium/PremiumBadge';
import { PremiumButton } from '../../components/premium/PremiumButton';
import { PremiumCard } from '../../components/premium/PremiumCard';

interface ProductModalProps {
  product: Product;
  shop: Store;
  goBack: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product: initialProduct, shop: initialShop, goBack }) => {
  const { cart, setCart, t, isRTL, favoriteProducts, toggleFavoriteProduct, products, orders, stores, showToast } = useApp();
  
  const [product, setProduct] = useState(initialProduct);
  const [shop, setShop] = useState(initialShop);

  useEffect(() => {
    setProduct(initialProduct);
    setShop(initialShop);
  }, [initialProduct, initialShop]);
  
  const initialQty = (cart.shopId === shop.id 
    ? cart.items.find(i => i.id === product.id)?.quantity 
    : 0) || 1;

  const [quantity, setQuantity] = useState(initialQty);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'reviews'), where('productId', '==', product.id));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReviews(list);
    });
    return unsub;
  }, [product.id]);

  const averageRating = reviews.length > 0
    ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
    : (product.averageRating || 0);

  const similarProducts = recommendationService.getSimilarProducts(product, products, 6);
  const frequentlyBought = recommendationService.getFrequentlyBoughtTogether(product, products, orders, 6);

  const handleConfirm = () => {
    setCart(prev => {
      const isDifferentStore = prev.shopId !== shop.id;
      const items = isDifferentStore ? [] : [...prev.items];
      
      const idx = items.findIndex(item => item.id === product.id);
      if (idx !== -1) {
        items[idx].quantity = quantity;
      } else {
        items.push({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity,
          imgUrl: product.imgUrl
        });
      }

      return {
        shopId: shop.id,
        shopName: shop.name,
        items
      };
    });
    
    showToast(isRTL ? 'تم تحديث السلة بنجاح' : 'Shopping cart updated');
    goBack();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.desc,
        url: window.location.href,
      }).catch(console.error);
    } else {
      // Fallback copy to clipboard
      navigator.clipboard.writeText(`${product.name} - SOUQ EL BALAD`);
      showToast(isRTL ? 'تم نسخ رابط المنتج' : 'Product link copied to clipboard');
    }
  };

  const discountedPrice = calculateDiscountedPrice(product, 1);
  const hasDiscount = discountedPrice < product.price;
  const promoLabel = getPromoLabel(product, isRTL);

  return (
    <div className="bg-theme-bg min-h-screen flex flex-col justify-between animate-fade-in relative z-40 theme-transition pb-[calc(env(safe-area-inset-bottom)+120px)]">
      
      {/* Product Image Panel */}
      <div className="relative bg-theme-bg px-4 pt-16 pb-4">
        {/* Navigation Actions Row */}
        <div className="absolute top-[calc(env(safe-area-inset-top)+0.5rem)] left-4 right-4 flex justify-between items-center z-[100]">
          <button 
            onClick={goBack} 
            className="p-2.5 bg-theme-card/90 backdrop-blur border border-theme-border/30 shadow-md rounded-full text-theme-text hover:bg-theme-card active:scale-95 transition"
          >
            <ChevronRight size={18} className={isRTL ? '' : 'rotate-180'} />
          </button>
          
          <div className="flex gap-2">
            <button 
              onClick={handleShare}
              className="p-2.5 bg-theme-card/90 backdrop-blur border border-theme-border/30 shadow-md rounded-full text-theme-text hover:bg-theme-card active:scale-95 transition"
              title={isRTL ? 'مشاركة' : 'Share'}
            >
              <Share2 size={15} />
            </button>
            <button 
              onClick={() => toggleFavoriteProduct(product.id)}
              className="p-2.5 bg-theme-card/90 backdrop-blur border border-theme-border/30 shadow-md rounded-full text-red-500 hover:bg-theme-card active:scale-95 transition"
              title={isRTL ? 'حفظ في المفضلة' : 'Add to Favorites'}
            >
              <Heart 
                size={15} 
                className={favoriteProducts.includes(product.id) ? 'fill-red-500 stroke-red-500 text-red-500' : 'text-theme-text'} 
              />
            </button>
          </div>
        </div>

        <ProductGalleryPro 
          primaryImage={product.primaryImage || product.imageUrl || product.imgUrl} 
          galleryImages={product.galleryImages || product.images || product.gallery || []} 
          productName={product.name} 
          categoryName={product.categoryName || product.cat} 
        />
      </div>

      {/* Info & Details Body Panel (Slide up over Cover) */}
      <div className="flex-1 bg-theme-card rounded-t-[36px] -mt-8 relative z-20 px-5 pt-6 flex flex-col justify-between shadow-[0_-12px_36px_rgba(0,0,0,0.06)] border-t border-theme-border/50 theme-transition">
        
        {/* Scrollable details container */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-6 pr-0.5">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <PremiumBadge variant="primary" pill={true}>
              {product.cat}
            </PremiumBadge>
            
            {product.isOffer && (
              <PremiumBadge variant="danger" pill={true} className="flex items-center gap-0.5">
                <Tag size={8} />
                {isRTL ? 'خصم خاص' : 'SPECIAL OFFER'}
              </PremiumBadge>
            )}

            {promoLabel && (
              <PremiumBadge variant="warning" pill={true}>
                {promoLabel}
              </PremiumBadge>
            )}
          </div>

          <h2 className="text-lg font-black text-theme-text leading-tight mb-1">{product.name}</h2>
          
          <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-[10px] font-bold text-theme-muted mb-4 border-b border-theme-border/50 pb-3">
            <span>{isRTL ? `المتجر: ${shop.name}` : `Store: ${shop.name}`}</span>
            {product.productBrand && (
              <>
                <span>•</span>
                <span>{isRTL ? `العلامة التجارية: ${product.productBrand}` : `Brand: ${product.productBrand}`}</span>
              </>
            )}
            {product.productWeight && (
              <>
                <span>•</span>
                <span>{product.productWeight} {product.unit}</span>
              </>
            )}
          </div>

          {/* Offer Visualization */}
          {hasDiscount && (
            <div className="bg-gradient-to-r from-red-500/10 to-rose-500/5 border border-red-500/10 p-3.5 rounded-2xl mb-4 animate-pop-in">
              <span className="text-[10px] font-black text-red-500 block mb-1 uppercase tracking-wider">
                {isRTL ? 'تفاصيل العرض والتخفيض' : 'Campaign details'}
              </span>
              <p className="text-[11px] font-medium text-theme-text leading-relaxed">
                {isRTL 
                  ? `اشتري هذا المنتج بخصم رائع الآن! السعر المخفض ${discountedPrice} ج.م بدلاً من ${product.price} ج.م`
                  : `Save on this item! Discounted price is EGP ${discountedPrice} instead of EGP ${product.price}`
                }
              </p>
            </div>
          )}

          <p className="text-theme-muted text-xs font-medium leading-relaxed mb-6.5">
            {product.desc}
          </p>

          {/* Product Reviews & Ratings (Ratings Summary & Reviews Preview) */}
          <div className="border-t border-theme-border/60 pt-6 mt-6">
            <h3 className="text-xs font-black text-theme-text mb-4 uppercase tracking-wider flex items-center gap-1.5">
              <Star size={14} className="text-amber-500 fill-amber-500" />
              {isRTL ? 'تقييمات المنتج وآراء العملاء' : 'Product Reviews & Ratings'}
            </h3>
            
            {/* Average rating and distribution */}
            {reviews.length > 0 ? (
              <PremiumCard hoverable={false} className="mb-5 flex flex-col md:flex-row gap-5 items-center p-4 bg-theme-bg/15">
                <div className="text-center md:border-l md:border-theme-border/40 md:pl-5 flex flex-col items-center">
                  <span className="text-3xl font-black text-theme-text leading-none">{averageRating}</span>
                  <div className="flex gap-0.5 text-amber-500 my-2">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} size={12} fill={idx < Math.round(averageRating) ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                  <span className="text-[9px] text-theme-muted font-bold">
                    {reviews.length} {isRTL ? 'تقييم' : 'reviews'}
                  </span>
                </div>
                
                <div className="flex-1 w-full space-y-1.5">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = reviews.filter(r => r.rating === stars).length;
                    const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-2 text-[9px] font-bold text-theme-muted">
                        <span className="w-3 text-right">{stars}</span>
                        <Star size={8} fill="currentColor" className="text-amber-500" />
                        <div className="flex-1 h-1 bg-theme-bg/25 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                        <span className="w-6 text-left">{Math.round(pct)}%</span>
                      </div>
                    );
                  })}
                </div>
              </PremiumCard>
            ) : (
              <div className="text-center py-6 border border-dashed border-theme-border/60 rounded-2xl mb-5">
                <p className="text-[11px] text-theme-muted font-bold">{isRTL ? 'لا توجد تقييمات بعد لهذا المنتج' : 'No reviews yet for this product'}</p>
              </div>
            )}

            {/* List of reviews */}
            {reviews.length > 0 && (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-3.5 border border-theme-border/60 rounded-2xl bg-theme-bg/5 space-y-2.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-black text-theme-text">{rev.userName || (isRTL ? 'عميل' : 'Customer')}</h4>
                        <span className="text-[9px] text-theme-muted font-bold">
                          {new Date(rev.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
                        </span>
                      </div>
                      <div className="flex gap-0.5 text-amber-500">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star key={idx} size={9} fill={idx < rev.rating ? 'currentColor' : 'none'} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-theme-muted leading-relaxed font-bold">
                      {rev.comment}
                    </p>
                    {rev.images && rev.images.length > 0 && (
                      <div className="flex gap-1.5 pt-1">
                        {rev.images.map((img: string, idx: number) => (
                          <a key={idx} href={img} target="_blank" rel="noopener noreferrer">
                            <img src={img} className="w-11 h-11 object-cover rounded-xl border border-theme-border" alt="review upload" />
                          </a>
                        ))}
                      </div>
                    )}
                    {rev.vendorReply && (
                      <div className="bg-primary/5 border border-primary/10 p-2.5 rounded-lg mt-2 text-[10px] font-bold text-theme-muted">
                        <p className="font-black text-primary mb-0.5 flex items-center gap-1">
                          <Reply size={10} />
                          {isRTL ? 'رد المتجر:' : 'Store Reply:'}
                        </p>
                        <p>{rev.vendorReply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Similar Products */}
            {similarProducts.length > 0 && (
              <div className="mt-8 border-t border-theme-border/60 pt-6">
                <h3 className="text-xs font-black text-theme-text mb-4 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-purple-500" />
                  {isRTL ? 'منتجات مشابهة قد تنال إعجابك' : 'Similar Products You Might Like'}
                </h3>
                <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-2 px-0.5">
                  {similarProducts.map(p => {
                    const pStore = stores.find(s => s.id === p.storeId);
                    return (
                      <ProductCard 
                        key={p.id}
                        product={p}
                        shop={pStore}
                        onProductClick={(prod, shop) => {
                          if (pStore) {
                            setProduct(prod);
                            setShop(pStore);
                            setQuantity(1);
                          }
                        }}
                        onAddToCart={(prod, e) => {
                          e.stopPropagation();
                          setCart(prev => {
                            const isDifferentStore = prev.shopId !== prod.storeId;
                            const items = isDifferentStore ? [] : [...prev.items];
                            const idx = items.findIndex(item => item.id === prod.id);
                            if (idx !== -1) {
                              items[idx].quantity += 1;
                            } else {
                              items.push({ id: prod.id, name: prod.name, price: prod.price, quantity: 1, imgUrl: prod.imgUrl });
                            }
                            return { shopId: prod.storeId, shopName: pStore ? pStore.name : '', items };
                          });
                          showToast(isRTL ? 'تم الإضافة للسلة' : 'Added to cart');
                        }}
                        isFavorite={favoriteProducts.includes(p.id)}
                        onToggleFavorite={(id, e) => {
                          e.stopPropagation();
                          toggleFavoriteProduct(id);
                        }}
                        isRTL={isRTL}
                        t={t}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Frequently Bought Together */}
            {frequentlyBought.length > 0 && (
              <div className="mt-8 border-t border-theme-border/60 pt-6">
                <h3 className="text-xs font-black text-theme-text mb-4 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag size={14} className="text-primary" />
                  {isRTL ? 'يُشترى عادة معاً' : 'Frequently Bought Together'}
                </h3>
                <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-2 px-0.5">
                  {frequentlyBought.map(p => {
                    const pStore = stores.find(s => s.id === p.storeId);
                    return (
                      <ProductCard 
                        key={p.id}
                        product={p}
                        shop={pStore}
                        onProductClick={(prod, shop) => {
                          if (pStore) {
                            setProduct(prod);
                            setShop(pStore);
                            setQuantity(1);
                          }
                        }}
                        onAddToCart={(prod, e) => {
                          e.stopPropagation();
                          setCart(prev => {
                            const isDifferentStore = prev.shopId !== prod.storeId;
                            const items = isDifferentStore ? [] : [...prev.items];
                            const idx = items.findIndex(item => item.id === prod.id);
                            if (idx !== -1) {
                              items[idx].quantity += 1;
                            } else {
                              items.push({ id: prod.id, name: prod.name, price: prod.price, quantity: 1, imgUrl: prod.imgUrl });
                            }
                            return { shopId: prod.storeId, shopName: pStore ? pStore.name : '', items };
                          });
                          showToast(isRTL ? 'تم الإضافة للسلة' : 'Added to cart');
                        }}
                        isFavorite={favoriteProducts.includes(p.id)}
                        onToggleFavorite={(id, e) => {
                          e.stopPropagation();
                          toggleFavoriteProduct(id);
                        }}
                        isRTL={isRTL}
                        t={t}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Bottom CTA Bar */}
        <div className="fixed bottom-0 left-0 right-0 max-w-[400px] mx-auto w-full bg-theme-card border-t border-theme-border/60 p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] z-30 shadow-[0_-12px_30px_rgba(0,0,0,0.06)] flex items-center justify-between gap-5 theme-transition">
          <div>
            <span className="text-[10px] text-theme-muted font-black leading-none block mb-1 uppercase tracking-wide">
              {t('total')}
            </span>
            <div className="flex items-baseline gap-2.5">
              <span className="text-base font-black text-primary font-sans leading-none">
                {calculateDiscountedPrice(product, quantity)} ج.م
              </span>
              {hasDiscount && (
                <span className="text-[10px] text-theme-muted line-through font-black font-sans leading-none">
                  {product.price * quantity} ج.م
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Quantity adjust */}
            <div className="flex items-center bg-theme-bg border border-theme-border/70 rounded-xl overflow-hidden p-0.5 shadow-inner">
              <button 
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                className="p-2 bg-theme-card text-theme-text rounded-lg shadow-sm hover:bg-theme-bg transition active:scale-90"
              >
                <Minus size={12} strokeWidth={2.5} />
              </button>
              <span className="text-xs font-black text-theme-text px-4 font-sans">{quantity}</span>
              <button 
                onClick={() => setQuantity(prev => prev + 1)}
                className="p-2 bg-theme-card text-theme-text rounded-lg shadow-sm hover:bg-theme-bg transition active:scale-90"
              >
                <Plus size={12} strokeWidth={2.5} />
              </button>
            </div>

            <PremiumButton 
              onClick={handleConfirm}
              variant="primary"
              size="md"
              className="px-5 rounded-2xl shadow shadow-primary/25 font-black text-xs h-10 flex items-center gap-1.5"
            >
              <Check size={14} strokeWidth={3} />
              <span>{isRTL ? 'إضافة' : 'Confirm'}</span>
            </PremiumButton>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductModal;
