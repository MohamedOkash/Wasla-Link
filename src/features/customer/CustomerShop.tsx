import React, { useState } from 'react';
import { ChevronRight, Search, Star, Clock, ShoppingBag, Plus, Minus, Heart, ShieldAlert, Facebook, Instagram, Globe, Link, Phone, Sparkles, Tag, ShoppingCart, Flame } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Store } from '../../types/store.types';
import { deliveryService } from '../../services/delivery.service';
import { recommendationService } from '../../services/recommendation.service';

// Premium Rebuild Imports
import { ProductCard } from '../../components/premium/ProductCard';
import { PremiumSection } from '../../components/premium/PremiumSection';
import { PremiumSkeleton } from '../../components/premium/PremiumSkeleton';
import { PremiumButton } from '../../components/premium/PremiumButton';
import { PremiumBadge } from '../../components/premium/PremiumBadge';
import { PremiumInput } from '../../components/premium/PremiumInput';

interface CustomerShopProps {
  shop: Store;
  navigate: (name: string, params?: any) => void;
  goBack: () => void;
  openSearch: () => void;
}

export const CustomerShop: React.FC<CustomerShopProps> = ({ shop, navigate, goBack, openSearch }) => {
  const { 
    products, 
    cart, 
    setCart, 
    t, 
    isRTL, 
    favoriteProducts, 
    toggleFavoriteProduct,
    favoriteStores,
    toggleFavoriteStore,
    followedStores,
    toggleFollowStore,
    location,
    reviews,
    orders,
    showToast
  } = useApp();

  const [selectedSubCat, setSelectedSubCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get products belonging to this store
  const storeProducts = products.filter(p => p.storeId === shop.id);
  const storeRecommendations = recommendationService.getYouMayLike(
    storeProducts,
    orders,
    favoriteStores,
    8
  );

  // Filter lists for sections
  const bestSellers = storeProducts.filter(p => p.isBestSeller).slice(0, 8);
  const offersList = storeProducts.filter(p => p.isOffer).slice(0, 8);

  // Get unique sub-categories in this store's products
  const subCategories = ['all', ...Array.from(new Set(storeProducts.map(p => p.cat)))];

  // Filter products by sub-category and search query
  const filteredProducts = storeProducts.filter(p => {
    const matchesCat = selectedSubCat === 'all' || p.cat === selectedSubCat;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const cartItemsForStore = cart.shopId === shop.id ? cart.items : [];
  const totalQuantity = cartItemsForStore.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItemsForStore.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const activeZone = shop.deliveryZones?.find(z => 
    location.name.toLowerCase().includes(z.name.toLowerCase())
  );
  const isDeliverable = !location.isVerified || !shop.deliveryZones || activeZone !== undefined;

  const getOpenStatus = () => {
    const businessHours = {
      openingHours: shop.openingHours || '08:00',
      closingHours: shop.closingHours || '23:00',
      breakTimes: shop.breakTimes || [],
      fridaySchedule: shop.fridaySchedule || { isOpen: true, openTime: '13:00', closeTime: '23:00' },
      holidayMode: !!shop.holidayMode,
      temporaryClosure: !!shop.isTemporarilyClosed
    };
    const check = deliveryService.checkStoreOpenStatus(businessHours);
    
    let color = 'bg-green-500/15 text-green-500 border border-green-500/20';
    if (check.status === 'closed') {
      color = 'bg-red-500/15 text-red-500 border border-red-500/20';
    } else if (check.status === 'closing_soon') {
      color = 'bg-amber-500/15 text-amber-500 border border-amber-500/20 animate-pulse';
    }
    
    let label = check.label;
    if (isRTL) {
      if (check.status === 'closed') {
        if (shop.isTemporarilyClosed) label = 'مغلق مؤقتاً';
        else if (shop.holidayMode) label = 'مغلق (عطلة رسمية)';
        else label = check.label;
      } else if (check.status === 'closing_soon') {
        label = 'يغلق قريباً';
      } else {
        label = 'مفتوح الآن';
      }
    } else {
      if (check.status === 'closed') {
        if (shop.isTemporarilyClosed) label = 'Temporarily Closed';
        else if (shop.holidayMode) label = 'Closed (Holiday)';
        else label = 'Closed';
      } else if (check.status === 'closing_soon') {
        label = 'Closing Soon';
      } else {
        label = 'Open Now';
      }
    }
    
    return { status: check.status, label, color };
  };

  const openStatus = getOpenStatus();

  const storeReviews = reviews.filter(r => r.storeId === shop.id);
  const avgRating = storeReviews.length > 0
    ? (storeReviews.reduce((sum, r) => sum + r.ratingStore, 0) / storeReviews.length).toFixed(1)
    : shop.rating || 4.5;

  const handleAddToCart = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDeliverable) {
      showToast(isRTL ? 'عذراً، هذا المتجر لا يوصل إلى منطقتك حالياً' : 'Sorry, this store does not deliver to your region currently');
      return;
    }
    if (openStatus.status === 'closed') {
      showToast(isRTL ? 'هذا المتجر مغلق حالياً ولا يستقبل طلبات' : 'This store is closed and cannot accept orders now');
      return;
    }
    setCart(prev => {
      const isDifferentStore = prev.shopId !== null && prev.shopId !== shop.id;
      const items = isDifferentStore ? [] : [...prev.items];
      
      const existingItem = items.find(item => item.id === product.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        items.push({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          imgUrl: product.imgUrl
        });
      }

      return {
        shopId: shop.id,
        shopName: shop.name,
        items
      };
    });
    showToast(isRTL ? `تمت إضافة ${product.name}` : `Added ${product.name}`);
  };

  const handleRemoveFromCart = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCart(prev => {
      if (prev.shopId !== shop.id) return prev;
      
      const items = prev.items.map(item => {
        if (item.id === productId) {
          return { ...item, quantity: item.quantity - 1 };
        }
        return item;
      }).filter(item => item.quantity > 0);

      return {
        shopId: items.length > 0 ? shop.id : null,
        shopName: items.length > 0 ? shop.name : '',
        items
      };
    });
  };

  const getProductQuantity = (productId: string) => {
    const item = cartItemsForStore.find(i => i.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="bg-theme-bg h-full flex flex-col overflow-hidden animate-slide-in-right theme-transition">
      
      {/* Premium Sticky Header Bar */}
      <div className="bg-theme-card px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-3.5 shadow-sm border-b border-theme-border/60 flex items-center justify-between z-20 theme-transition relative">
        <div className="flex items-center gap-2.5 max-w-[50%]">
          <button 
            onClick={goBack} 
            className="p-2.5 text-theme-text bg-theme-bg hover:bg-theme-border/50 rounded-full transition flex items-center justify-center border border-theme-border/30"
          >
            <ChevronRight size={18} className={isRTL ? '' : 'rotate-180'} />
          </button>
          <span className="text-xs font-black text-theme-text truncate">{shop.name}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Follow Store Button */}
          <PremiumButton 
            onClick={() => toggleFollowStore(shop.id)}
            variant={followedStores.includes(shop.id) ? 'outline' : 'primary'}
            size="sm"
            className="h-8.5 rounded-xl font-black text-[10px]"
          >
            {followedStores.includes(shop.id) ? (isRTL ? 'متابع ✓' : 'Following ✓') : (isRTL ? 'متابعة' : 'Follow')}
          </PremiumButton>

          {/* Toggle Favorite Store */}
          <button
            onClick={() => toggleFavoriteStore(shop.id)}
            className="p-2 text-theme-text bg-theme-bg hover:bg-theme-border/50 rounded-full transition flex items-center justify-center border border-theme-border/30 h-8.5 w-8.5"
          >
            <Heart 
              size={15} 
              className={favoriteStores.includes(shop.id) ? 'fill-red-500 stroke-red-500 text-red-500' : 'text-theme-muted'} 
            />
          </button>

          <button 
            onClick={openSearch} 
            className="p-2.5 text-theme-text bg-theme-bg hover:bg-theme-border/50 rounded-full transition flex items-center justify-center border border-theme-border/30 h-8.5 w-8.5"
          >
            <Search size={15} />
          </button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+9rem)] no-scrollbar">
        {/* Cover Header */}
        <div className="relative h-48 bg-theme-bg flex-shrink-0">
          <img src={shop.coverUrl} className="w-full h-full object-cover" alt={shop.name} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20"></div>

          {/* Store Profile Info */}
          <div className="absolute bottom-4.5 left-5 right-5 flex items-end gap-3.5 text-white">
            <div className="relative">
              <img 
                src={shop.logoUrl} 
                className="w-16 h-16 rounded-[20px] object-cover border-2 border-white/90 shadow-md bg-white flex-shrink-0" 
                alt={shop.name} 
              />
              <span className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-lg text-[8px] font-black shadow ${openStatus.color}`}>
                {openStatus.label}
              </span>
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black truncate drop-shadow">{shop.name}</h1>
              </div>
              
              {shop.promoBanner && (
                <p className="bg-primary text-[8px] font-black px-2 py-0.5 rounded-md w-max mt-1 animate-pulse shadow">
                  {shop.promoBanner}
                </p>
              )}
              
              <div className="flex items-center gap-2.5 mt-1.5 text-[9px] opacity-90 font-bold flex-wrap">
                <span className="flex items-center gap-0.5"><Star size={11} className="text-yellow-400 fill-current" /> {avgRating}</span>
                <span>•</span>
                <span>{shop.followersCount || 0} {isRTL ? 'متابع' : 'followers'}</span>
                <span>•</span>
                <span>{activeZone ? activeZone.eta : `${shop.time} دقيقة`}</span>
                <span>•</span>
                <span>{activeZone ? `${activeZone.fee} ج.م` : (isRTL ? 'التوصيل غير مدعوم' : 'Delivery unsupported')}</span>
              </div>

              {/* Social Media Link Badges */}
              <div className="flex gap-2 mt-2.5 flex-wrap">
                {shop.facebook && (
                  <a href={shop.facebook} target="_blank" rel="noreferrer" className="bg-white/15 hover:bg-white/25 p-1.5 rounded-lg transition" title="Facebook">
                    <Facebook size={12} className="text-white" />
                  </a>
                )}
                {shop.instagram && (
                  <a href={shop.instagram} target="_blank" rel="noreferrer" className="bg-white/15 hover:bg-white/25 p-1.5 rounded-lg transition" title="Instagram">
                    <Instagram size={12} className="text-white" />
                  </a>
                )}
                {shop.whatsapp && (
                  <a href={`https://wa.me/${shop.whatsapp}`} target="_blank" rel="noreferrer" className="bg-white/15 hover:bg-white/25 p-1.5 rounded-lg transition" title="WhatsApp">
                    <Phone size={12} className="text-white" />
                  </a>
                )}
                {shop.website && (
                  <a href={shop.website} target="_blank" rel="noreferrer" className="bg-white/15 hover:bg-white/25 p-1.5 rounded-lg transition" title="Website">
                    <Link size={12} className="text-white" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {!isDeliverable && (
          <div className="bg-red-500/10 border-b border-red-500/20 text-red-500 text-xs py-3 px-4 flex items-center justify-center gap-2 font-black animate-fade-in text-center">
            <ShieldAlert size={16} />
            <span>{isRTL ? 'عذراً، هذا المتجر لا يوصل إلى منطقتك حالياً 📍' : 'Sorry, this store does not deliver to your region currently 📍'}</span>
          </div>
        )}

        {/* Min Order warning */}
        {totalPrice > 0 && totalPrice < (shop.minOrder || 0) && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-500 text-[10px] py-2 px-4 flex items-center justify-center gap-2 font-bold animate-fade-in">
            <ShieldAlert size={14} />
            <span>{isRTL ? `الحد الأدنى للطلب ${shop.minOrder} ج.م (متبقي ${shop.minOrder - totalPrice} ج.م)` : `Min order is EGP ${shop.minOrder} (Add EGP ${shop.minOrder - totalPrice} more)`}</span>
          </div>
        )}

        {/* Search inside shop */}
        <div className="px-5 mt-4.5">
          <PremiumInput 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={16} />}
            placeholder={isRTL ? 'البحث داخل المتجر...' : 'Search inside store products...'}
          />
        </div>

        {/* Recommended for You Section slider */}
        {storeRecommendations.length > 0 && !searchQuery && selectedSubCat === 'all' && (
          <PremiumSection title={isRTL ? 'مقترحات مخصصة لك' : 'Recommended for You'} icon={<Sparkles size={15} />}>
            <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-2 pt-1 px-0.5">
              {storeRecommendations.map(product => (
                <ProductCard 
                  key={product.id}
                  product={product}
                  shop={shop}
                  onProductClick={(p) => navigate('product', { product: p, shop })}
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
              ))}
            </div>
          </PremiumSection>
        )}

        {/* Offers Section slider */}
        {offersList.length > 0 && !searchQuery && selectedSubCat === 'all' && (
          <PremiumSection title={isRTL ? 'عروض وتخفيضات المتجر' : 'Store Campaigns & Offers'} icon={<Tag size={15} />}>
            <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-2 pt-1 px-0.5">
              {offersList.map(product => (
                <ProductCard 
                  key={product.id}
                  product={product}
                  shop={shop}
                  onProductClick={(p) => navigate('product', { product: p, shop })}
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
              ))}
            </div>
          </PremiumSection>
        )}

        {/* Best Sellers Section */}
        {bestSellers.length > 0 && !searchQuery && selectedSubCat === 'all' && (
          <PremiumSection title={isRTL ? 'الأكثر مبيعاً هنا' : 'Best Sellers Here'} icon={<Flame size={15} />}>
            <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-2 pt-1 px-0.5">
              {bestSellers.map(product => (
                <ProductCard 
                  key={product.id}
                  product={product}
                  shop={shop}
                  onProductClick={(p) => navigate('product', { product: p, shop })}
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
              ))}
            </div>
          </PremiumSection>
        )}

        {/* Categories Horizontal Scroll Tabs */}
        <div className="px-5 mt-5">
          <h3 className="text-xs font-black text-theme-text mb-3 uppercase tracking-wider">{isRTL ? 'قائمة المنتجات الكاملة' : 'Full Products Catalog'}</h3>
          <div className="overflow-x-auto no-scrollbar flex gap-2 py-1">
            {subCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedSubCat(cat)}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-black whitespace-nowrap transition shadow-sm border ${
                  selectedSubCat === cat 
                    ? 'bg-primary text-white border-primary shadow-sm shadow-primary/10' 
                    : 'bg-theme-card border-theme-border text-theme-text hover:bg-theme-bg'
                }`}
              >
                {cat === 'all' ? (isRTL ? 'تصفح الكل' : 'View All') : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products list grid */}
        <div className="px-5 mt-4.5 grid grid-cols-2 gap-3.5">
          {filteredProducts.length === 0 ? (
            <div className="col-span-2 text-center text-theme-muted py-8 text-xs font-bold">{isRTL ? 'لا توجد منتجات مطابقة في هذا الصنف' : 'No matching products in this category'}</div>
          ) : (
            filteredProducts.map(product => (
              <ProductCard 
                key={product.id}
                product={product}
                shop={shop}
                onProductClick={(p) => navigate('product', { product: p, shop })}
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
            ))
          )}
        </div>
      </div>

      {/* Floating Bottom Cart Bar */}
      {totalQuantity > 0 && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] left-4 right-4 bg-gray-900 text-white p-3.5 rounded-[24px] shadow-[0_15px_30px_rgba(0,0,0,0.3)] z-49 flex justify-between items-center animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2.5 rounded-xl relative">
              <ShoppingCart size={18} />
              <span className="absolute -top-1.5 -right-1.5 bg-white text-primary text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-gray-900 leading-none">
                {totalQuantity}
              </span>
            </div>
            <div>
              <p className="text-[9px] text-gray-400 font-bold leading-none mb-1">{t('cart')}</p>
              <p className="text-xs font-black leading-none">{totalPrice} ج.م</p>
            </div>
          </div>
          <PremiumButton 
            onClick={() => navigate('cart')} 
            className="bg-primary hover:bg-primary-hover text-white font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition"
          >
            {isRTL ? 'عرض سلتك' : 'Checkout Cart'}
          </PremiumButton>
        </div>
      )}
    </div>
  );
};

export default CustomerShop;
