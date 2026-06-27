import { useTranslation } from '../../hooks/useTranslation';
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

import { getStoreStatus } from '../../utils/storeUtils';
import { useProducts } from '../../hooks/useProducts';
import { useReviews } from '../../hooks/useReviews';

interface CustomerShopProps {
  shop: Store;
  navigate: (name: string, params?: any) => void;
  goBack: () => void;
  openSearch: () => void;
}

export const CustomerShop: React.FC<CustomerShopProps> = ({ shop, navigate, goBack, openSearch }) => {
  const { t } = useTranslation();
  const { cart, setCart, addToCartGlobal,  isRTL, favoriteProducts, toggleFavoriteProduct, favoriteStores, toggleFavoriteStore, followedStores, toggleFollowStore, location, orders, showToast } = useApp();
  const { products } = useProducts();
  const { reviews } = useReviews();;

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
  const discountProducts = storeProducts.filter(p => p.discountPrice).slice(0, 8);
  const offersList = storeProducts.filter(p => p.isOffer).slice(0, 8);
  const storeFeatured = shop.featuredProducts 
    ? storeProducts.filter(p => shop.featuredProducts?.includes(p.id)) 
    : [];

  // Get unique sub-categories in this store's products
  const subCategories = ['all', ...Array.from(new Set(storeProducts.map(p => p.cat)))];

  // Filter products by sub-category and search query
  const filteredProducts = storeProducts.filter(p => {
    const matchesCat = selectedSubCat === 'all' || p.cat === selectedSubCat;
    const matchesSearch = (p.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
                          (p.desc || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    return matchesCat && matchesSearch;
  });

  const cartItemsForStore = cart.shopId === shop.id ? cart.items : [];
  const totalQuantity = cartItemsForStore.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItemsForStore.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const activeZone = shop.deliveryZones?.find(z => 
    location.name.toLowerCase().includes(z.name.toLowerCase())
  );
  const isDeliverable = !location.isVerified || !shop.deliveryZones || activeZone !== undefined;

  const openStatus = getStoreStatus(shop, isRTL);

  const storeReviews = reviews.filter(r => r.storeId === shop.id);
  const avgRating = storeReviews.length > 0
    ? (storeReviews.reduce((sum, r) => sum + r.ratingStore, 0) / storeReviews.length).toFixed(1)
    : shop.rating || 4.5;

  const handleAddToCart = (product: any, e: React.MouseEvent) => {
  const {} = useTranslation();

    e.stopPropagation();
    if (!isDeliverable) {
      showToast(t('str_11'));
      return;
    }
    if (openStatus.status === 'closed') {
      showToast(t('str_5'), 'info');
    }
    addToCartGlobal(product, shop, 1, false);
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
            {followedStores.includes(shop.id) ? (t('str_12')) : (t('str_13'))}
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
      <div className="flex-1 overflow-y-auto no-scrollbar pb-[calc(env(safe-area-inset-bottom)+9rem)]">
        
        {/* Banner Hero (No absolute content inside) */}
        <div className="relative h-40 bg-theme-bg w-full shrink-0">
          <img src={shop.coverUrl} className="w-full h-full object-cover" alt={shop.name} />
          <div className="absolute inset-0 bg-gradient-to-t from-theme-bg via-transparent to-black/20"></div>
        </div>

        {/* Store Info Container (Overlaps Banner Slightly) */}
        <div className="px-5 relative -mt-8 z-10 shrink-0">
          <div className="flex items-end gap-3.5 mb-3">
            <div className="relative shrink-0">
              <img 
                src={shop.logoUrl} 
                className="w-20 h-20 rounded-[20px] object-cover border-4 border-theme-bg shadow-md bg-white" 
                alt={shop.name} 
              />
              <span className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-lg text-[9px] font-black shadow-sm ${openStatus.color}`}>
                {openStatus.label}
              </span>
            </div>
            <div className="pb-1 w-full">
              <h1 className="text-lg font-black truncate text-theme-text">{shop.name}</h1>
              {shop.promoBanner && (
                <p className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-md w-max mt-1">
                  {shop.promoBanner}
                </p>
              )}
            </div>
          </div>

          {/* Social Media Link Badges */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {shop.facebook && (
              <a href={shop.facebook} target="_blank" rel="noreferrer" className="bg-theme-card border border-theme-border/60 hover:bg-theme-border/30 p-2 rounded-xl transition" title="Facebook">
                <Facebook size={14} className="text-theme-text" />
              </a>
            )}
            {shop.instagram && (
              <a href={shop.instagram} target="_blank" rel="noreferrer" className="bg-theme-card border border-theme-border/60 hover:bg-theme-border/30 p-2 rounded-xl transition" title="Instagram">
                <Instagram size={14} className="text-theme-text" />
              </a>
            )}
            {shop.whatsapp && (
              <a href={`https://wa.me/${shop.whatsapp}`} target="_blank" rel="noreferrer" className="bg-theme-card border border-theme-border/60 hover:bg-theme-border/30 p-2 rounded-xl transition" title="WhatsApp">
                <Phone size={14} className="text-theme-text" />
              </a>
            )}
            {shop.website && (
              <a href={shop.website} target="_blank" rel="noreferrer" className="bg-theme-card border border-theme-border/60 hover:bg-theme-border/30 p-2 rounded-xl transition" title="Website">
                <Link size={14} className="text-theme-text" />
              </a>
            )}
          </div>

          {/* Store Statistics Premium Grid */}
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            <div className="bg-theme-card border border-theme-border/60 rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm">
              <Star size={18} className="text-yellow-400 fill-current mb-1" />
              <span className="text-[10px] text-theme-muted font-bold">{t('str_14')}</span>
              <span className="text-xs font-black text-theme-text">{avgRating}</span>
            </div>
            <div className="bg-theme-card border border-theme-border/60 rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm">
              <ShoppingBag size={18} className="text-primary mb-1" />
              <span className="text-[10px] text-theme-muted font-bold">{t('str_15')}</span>
              <span className="text-xs font-black text-theme-text">{storeProducts.length}</span>
            </div>
            <div className="bg-theme-card border border-theme-border/60 rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm">
              <Heart size={18} className="text-red-500 mb-1" />
              <span className="text-[10px] text-theme-muted font-bold">{t('str_16')}</span>
              <span className="text-xs font-black text-theme-text">{shop.followersCount || 0}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-4 bg-theme-card border border-theme-border/60 p-3 rounded-2xl">
             <div className="flex-1 flex flex-col items-center border-r border-theme-border/50">
               <span className="text-[10px] text-theme-muted font-bold">{t('str_17')}</span>
               <span className="text-xs font-black text-theme-text">{activeZone ? activeZone.eta : `${shop.time} ${t('str_191')}`}</span>
             </div>
             <div className="flex-1 flex flex-col items-center">
               <span className="text-[10px] text-theme-muted font-bold">{t('str_18')}</span>
               <span className="text-xs font-black text-theme-text">{activeZone ? `${activeZone.fee} ${t('currencyEGP')}` : (t('str_19'))}</span>
             </div>
          </div>

          {!isDeliverable && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs py-3 px-4 flex items-center justify-center gap-2 font-black mb-4 text-center">
              <ShieldAlert size={16} />
              <span>{t('str_20')}</span>
            </div>
          )}

          {/* Min Order warning */}
          {totalPrice > 0 && totalPrice < (shop.minOrder || 0) && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl text-[10px] py-3 px-4 flex items-center justify-center gap-2 font-bold mb-4">
              <ShieldAlert size={14} />
              <span>{t('str_21', { minOrder: shop.minOrder, remaining: (shop.minOrder || 0) - totalPrice })}</span>
            </div>
          )}
        </div>

        {/* Sticky Search Bar */}
        <div className="px-5 sticky top-0 z-10 bg-theme-bg/95 backdrop-blur-md pt-2 pb-3">
          <PremiumInput 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={16} />}
            placeholder={t('str_22')}
          />
        </div>

        {/* Unified Offers Engine (Campaigns) */}
        {shop.campaigns && shop.campaigns.length > 0 && !searchQuery && selectedSubCat === 'all' && (
          <div className="px-5 mb-6">
            <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-3 rounded-2xl">
              {shop.campaigns.map(camp => (
                <div key={camp.id} className="snap-center shrink-0 w-[90%] first:ml-0 h-32 relative rounded-2xl overflow-hidden border border-theme-border/50">
                  <img src={camp.bannerUrl} className="w-full h-full object-cover" alt="Campaign" />
                  <div className="absolute inset-0 bg-black/10"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unified Offers Engine (Special Offers) */}
        {shop.offers && shop.offers.length > 0 && !searchQuery && selectedSubCat === 'all' && (
          <div className="px-5 mb-6">
            <div className="bg-gradient-to-r from-red-500/10 to-primary/10 rounded-2xl p-4 border border-red-500/20">
               <h3 className="text-xs font-black text-red-500 flex items-center gap-2 mb-3">
                 <Tag size={16}/> {t('str_23')}
               </h3>
               <div className="grid grid-cols-2 gap-2">
                 {shop.offers.map(offer => (
                   <div key={offer.id} className="bg-theme-card rounded-xl p-3 border border-red-500/20 shadow-sm relative overflow-hidden">
                     <span className="text-lg font-black text-red-500">{offer.discountPercent}%</span>
                     <p className="text-[10px] font-bold text-theme-text mt-1">{offer.title}</p>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {/* Featured Products from Offers Engine */}
        {storeFeatured.length > 0 && !searchQuery && selectedSubCat === 'all' && (
          <PremiumSection title={t('str_24')} icon={<Sparkles size={15} />}>
            <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-2 pt-1 px-0.5">
              {storeFeatured.map(product => (
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

        {/* Discount Products Section */}
        {discountProducts.length > 0 && !searchQuery && selectedSubCat === 'all' && (
          <PremiumSection title={t('str_25')} icon={<Tag size={15} className="text-red-500"/>}>
            <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-2 pt-1 px-0.5">
              {discountProducts.map(product => (
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

        {/* Recommended for You Section slider */}
        {storeRecommendations.length > 0 && !searchQuery && selectedSubCat === 'all' && (
          <PremiumSection title={t('str_26')} icon={<Sparkles size={15} />}>
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
          <PremiumSection title={t('str_27')} icon={<Tag size={15} />}>
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
          <PremiumSection title={t('str_28')} icon={<Flame size={15} />}>
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
          <h3 className="text-xs font-black text-theme-text mb-3 uppercase tracking-wider">{t('str_29')}</h3>
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
                {cat === 'all' ? (t('str_30')) : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products list grid */}
        <div className="px-5 mt-4.5 grid grid-cols-2 gap-3.5">
          {filteredProducts.length === 0 ? (
            <div className="col-span-2 text-center text-theme-muted py-8 text-xs font-bold">{t('str_31')}</div>
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
              <span className="absolute -top-1.5 -right-1.5 bg-white text-primary text-[10px] font-black min-w-[24px] h-[24px] px-1 rounded-full flex items-center justify-center border-2 border-gray-900 leading-none shadow-sm animate-pulse">
                {totalQuantity > 99 ? '99+' : totalQuantity}
              </span>
            </div>
            <div>
              <p className="text-[9px] text-gray-400 font-bold leading-none mb-1">{t('cart')}</p>
              <p className="text-xs font-black leading-none">{totalPrice} {t('currencyEGP')}</p>
            </div>
          </div>
          <PremiumButton 
            onClick={() => navigate('cart')} 
            className="bg-primary hover:bg-primary-hover text-white font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition"
          >
            {t('str_32')}
          </PremiumButton>
        </div>
      )}
    </div>
  );
};

export default CustomerShop;
