import { useTranslation } from '../../hooks/useTranslation';
import React, { useState, useEffect, useRef } from 'react';
import { Search, LayoutGrid, Flame, Clock, Heart, Tag, TrendingUp, Sparkles, Navigation } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { PremiumHeader } from '../../components/common/PremiumHeader';
import { deliveryService } from '../../services/delivery.service';
import { getStoreStatus } from '../../utils/storeUtils';
import { recommendationService } from '../../services/recommendation.service';

// Premium Rebuild Imports
import { ProductCard } from '../../components/premium/ProductCard';
import { StoreCard } from '../../components/premium/StoreCard';
import { CampaignCard } from '../../components/premium/CampaignCard';
import { PremiumSection } from '../../components/premium/PremiumSection';
import { PremiumSkeleton } from '../../components/premium/PremiumSkeleton';
import { useStores } from '../../hooks/useStores';
import { useProducts } from '../../hooks/useProducts';

interface HomeScreenProps {
  navigate: (name: string, params?: any) => void;
  openSearch: () => void;
  openMap: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigate, openSearch, openMap }) => {
  const { isRTL, categories, banners, favoriteStores, toggleFavoriteStore, favoriteProducts, toggleFavoriteProduct, setShowNotifications, orders, cart, setCart, addToCartGlobal, showToast } = useApp();
  const { stores } = useStores();
  const { products } = useProducts();;

  const [currentBanner, setCurrentBanner] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Simulate premium skeleton loader entrance
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Slide interval for Hero Banner
  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setInterval(() => setCurrentBanner((prev) => (prev + 1) % banners.length), 4000);
    return () => clearTimeout(timer);
  }, [banners.length]);

  // Recommendation & Segment lists
  const featuredPromotions = products.filter(p => p.isOffer).slice(0, 8);
  const bestSellers = [...products].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0)).slice(0, 8);
  const newArrivals = [...products].slice().reverse().slice(0, 8);
  const trendingNow = recommendationService.getTrendingNow(products, 8);
  const youMayLike = recommendationService.getYouMayLike(products, orders, favoriteStores, 8);

  const getProductQuantity = (productId: string) => {
  const {} = useTranslation();

    const item = cart.items.find(i => i.id === productId);
    return item ? item.quantity : 0;
  };

  const handleAddToCart = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const shop = stores.find(s => s.id === product.storeId);
    if (!shop) return;
    
    // Check open status
    const businessHours = {
      openingHours: shop.openingHours || '08:00',
      closingHours: shop.closingHours || '23:00',
      breakTimes: shop.breakTimes || [],
      fridaySchedule: shop.fridaySchedule || { isOpen: true, openTime: '13:00', closeTime: '23:00' },
      holidayMode: !!shop.holidayMode,
      temporaryClosure: !!shop.isTemporarilyClosed
    };
    const check = deliveryService.checkStoreOpenStatus(businessHours);
    if (check.status === 'closed') {
      showToast(t('str_5'), 'info');
    }

    addToCartGlobal(product, shop, 1, false);
  };

  const handleRemoveFromCart = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCart(prev => {
      const items = prev.items.map(item => {
        if (item.id === productId) {
          return { ...item, quantity: item.quantity - 1 };
        }
        return item;
      }).filter(item => item.quantity > 0);

      const hasItems = items.length > 0;
      return {
        shopId: hasItems ? prev.shopId : null,
        shopName: hasItems ? prev.shopName : '',
        items
      };
    });
  };

  const renderProductSlider = (title: string, icon: React.ReactNode, list: typeof products) => {
    if (list.length === 0) return null;
    return (
      <PremiumSection title={title} icon={icon}>
        {isLoading ? (
          <PremiumSkeleton variant="card" count={4} />
        ) : (
          <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-2 pt-1 px-0.5">
            {list.map(product => {
              const shop = stores.find(s => s.id === product.storeId);
              return (
                <ProductCard 
                  key={product.id}
                  product={product}
                  shop={shop}
                  onProductClick={(p, s) => {
                    if (s) navigate('product', { product: p, shop: s });
                  }}
                  onAddToCart={handleAddToCart}
                  onRemoveFromCart={handleRemoveFromCart}
                  quantityInCart={getProductQuantity(product.id)}
                  isFavorite={favoriteProducts.includes(product.id)}
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
        )}
      </PremiumSection>
    );
  };

  const approvedStores = stores.filter(s => s.status === 'approved');

  return (
    <div className="bg-theme-bg theme-transition h-full flex flex-col overflow-hidden animate-fade-in">
      {/* Premium Header */}
      <PremiumHeader 
        openMap={openMap}
        openNotifications={() => setShowNotifications(true)}
        openFavorites={() => navigate('favorites')}
        openCart={() => navigate('cart')}
        onLogoClick={() => {
          scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Scrollable container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+7rem)] no-scrollbar"
      >
        {/* Floating Search Entry */}
        <div className="px-5 mt-4.5">
          <div className="relative" onClick={openSearch}>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-primary">
              <Search size={18} />
            </div>
            <div className="w-full bg-theme-card border border-theme-border/80 hover:border-primary/30 rounded-2xl py-3.5 pr-12 pl-5 text-xs text-theme-muted font-black flex items-center shadow-sm cursor-pointer hover:bg-theme-card/90 transition-all duration-200 theme-transition">
              {t('searchPlaceholder')}
            </div>
          </div>
        </div>

        {/* 1. Hero Banner Carousel */}
        {banners.length > 0 && (
          <div className="px-5 mt-5.5 mb-6 relative">
            <CampaignCard 
              banner={banners[currentBanner]} 
              onClick={() => navigate('category', { catId: 'restaurant' })}
              t={t}
            />
            {/* Banner Dots */}
            <div className="flex justify-center mt-3 gap-1.5">
              {banners.map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setCurrentBanner(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === currentBanner ? 'w-5.5 bg-primary shadow-sm' : 'w-1.5 bg-theme-border/60'}`} 
                />
              ))}
            </div>
          </div>
        )}

        {/* 2. Featured Campaigns (Categories Grid) */}
        <PremiumSection title={t('categories')} icon={<LayoutGrid size={15} />}>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => {
              const storeCount = approvedStores.filter(s => s.catId === cat.id).length;
              return (
                <div 
                  key={cat.id} 
                  onClick={() => navigate('category', { catId: cat.id })} 
                  className="bg-theme-card rounded-[22px] shadow-sm border border-theme-border/50 overflow-hidden cursor-pointer hover:shadow hover:border-primary/30 transition-all duration-300 group flex flex-col h-28 relative animate-card-entrance"
                >
                   <img src={cat.imgUrl} className="absolute inset-0 w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" alt={cat.name.ar} />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>
                   <div className="relative z-10 mt-auto p-3 flex flex-col">
                     <span className="text-white font-black text-[11px] mb-0.5">{isRTL ? cat.name.ar : cat.name.en}</span>
                     <span className="bg-white/20 backdrop-blur-md text-white text-[8px] font-black px-1.5 py-0.5 rounded-md leading-none w-max">
                       {storeCount} {t('store')}
                     </span>
                   </div>
                </div>
              );
            })}
          </div>
        </PremiumSection>

        {/* 3. Featured Campaigns (Product Offers) */}
        {renderProductSlider(t('str_6'), <Tag size={15} />, featuredPromotions)}

        {/* 4. Trending Now */}
        {renderProductSlider(t('str_7'), <Flame size={15} />, trendingNow)}

        {/* 5. Recommended For You */}
        {renderProductSlider(t('str_8'), <Sparkles size={15} />, youMayLike)}

        {/* 6. New Arrivals */}
        {renderProductSlider(t('str_9'), <Sparkles size={15} />, newArrivals)}

        {/* 6. Best Sellers */}
        {renderProductSlider(t('str_10'), <TrendingUp size={15} />, bestSellers)}

        {/* 7. Nearby Stores */}
        <PremiumSection title={t('nearbyStores')} icon={<Navigation size={15} />}>
          {isLoading ? (
            <div className="space-y-3.5">
              <PremiumSkeleton variant="list-item" count={3} />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {approvedStores.slice(0, 8).map(shop => {
                const openStatus = getStoreStatus(shop, isRTL);
                const storeReviews = orders.filter(o => o.shopId === shop.id && o.status === 'delivered');
                const avgRating = storeReviews.length > 0 ? (shop.rating || 4.5) : 4.5;

                return (
                  <StoreCard 
                    key={shop.id}
                    shop={shop}
                    onClick={() => navigate('shop', { shop })}
                    isFavorite={favoriteStores.includes(shop.id)}
                    onToggleFavorite={(e) => {
                      e.stopPropagation();
                      toggleFavoriteStore(shop.id);
                    }}
                    avgRating={avgRating}
                    openStatus={openStatus}
                    isRTL={isRTL}
                    t={t}
                  />
                );
              })}
            </div>
          )}
        </PremiumSection>
      </div>
    </div>
  );
};

export default HomeScreen;
