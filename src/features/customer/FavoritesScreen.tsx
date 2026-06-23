import React, { useState } from 'react';
import { Heart, Store as StoreIcon, ShoppingBag, Clock, Star } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { CustomerHeader } from '../../components/common/CustomerHeader';
import { useStores } from '../../hooks/useStores';
import { useProducts } from '../../hooks/useProducts';

interface FavoritesScreenProps {
  navigate: (name: string, params?: any) => void;
}

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({ navigate }) => {
  const { favoriteStores, favoriteProducts, toggleFavoriteStore, toggleFavoriteProduct,  isRTL } = useApp();
  const { stores } = useStores();
  const { products } = useProducts();;

  const [activeTab, setActiveTab] = useState<'stores' | 'products'>('stores');

  const favStoresList = stores.filter(s => favoriteStores.includes(s.id));
  const favProductsList = products.filter(p => favoriteProducts.includes(p.id)).map(p => ({
    ...p,
    shop: stores.find(s => s.id === p.storeId)
  }));

  return (
    <div className="bg-theme-bg h-full flex flex-col overflow-hidden animate-fade-in theme-transition">
      <CustomerHeader title={isRTL ? 'المفضلة الخاصة بي' : 'My Saved Favorites'} />

      {/* Tabs Switcher */}
      <div className="bg-theme-card border border-theme-border flex p-1 m-4 rounded-2xl shadow-sm theme-transition">
        <button
          onClick={() => setActiveTab('stores')}
          className={`flex-1 py-3 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'stores' 
              ? 'bg-primary text-white shadow-sm' 
              : 'text-theme-muted hover:text-theme-text'
          }`}
        >
          <StoreIcon size={15} />
          {isRTL ? 'المتاجر المفضلة' : 'Favorite Stores'} ({favStoresList.length})
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`flex-1 py-3 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'products' 
              ? 'bg-primary text-white shadow-sm' 
              : 'text-theme-muted hover:text-theme-text'
          }`}
        >
          <ShoppingBag size={15} />
          {isRTL ? 'المنتجات المفضلة' : 'Favorite Products'} ({favProductsList.length})
        </button>
      </div>

      {/* Tab Content scrollable */}
      <div className="flex-1 px-4 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+6.5rem)] no-scrollbar">
        {activeTab === 'stores' ? (
          favStoresList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in text-theme-muted">
              <div className="bg-theme-card p-5 rounded-full border border-theme-border shadow-md mb-4">
                <Heart size={36} className="text-primary fill-primary/10" />
              </div>
              <h3 className="font-black text-theme-text text-sm">{isRTL ? 'لا توجد متاجر مفضلة بعد' : 'No Favorite Stores'}</h3>
              <p className="text-xs text-theme-muted mt-1 max-w-[80%] font-bold leading-relaxed">
                {isRTL 
                  ? 'اضغط على رمز القلب في بطاقة أي متجر لحفظه هنا لسهولة الوصول إليه لاحقاً.'
                  : 'Tap the heart icon on any store cover to pin it here for quick access.'}
              </p>
              <button 
                onClick={() => navigate('home')}
                className="mt-5 bg-primary hover:bg-primary-hover text-white text-xs font-black py-2.5 px-6 rounded-xl shadow-md transition active:scale-95"
              >
                {isRTL ? 'تصفح المتاجر الشريكة' : 'Browse Local Stores'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {favStoresList.map(shop => (
                <div 
                  key={shop.id} 
                  onClick={() => navigate('shop', { shop })} 
                  className="bg-theme-card rounded-[24px] p-3 shadow-sm border border-theme-border cursor-pointer hover:shadow hover:border-primary/15 transition duration-300 relative animate-card-entrance"
                >
                  {/* Heart button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavoriteStore(shop.id);
                    }}
                    className="absolute top-6 left-6 z-20 bg-theme-card/95 backdrop-blur-sm p-2 rounded-xl shadow text-red-500 hover:scale-105 transition active:scale-95 border border-theme-border/50"
                  >
                    <Heart size={14} className="fill-red-500 stroke-red-500" />
                  </button>

                  <div className="w-full h-32 rounded-2xl relative overflow-hidden bg-theme-bg mb-3">
                    <img src={shop.coverUrl} className="w-full h-full object-cover" alt={shop.name} />
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className={`absolute top-2.5 ${isRTL ? 'right-2.5' : 'left-2.5'} bg-theme-card/95 backdrop-blur-sm px-2 py-0.5 rounded-xl text-[10px] font-black flex items-center text-theme-text shadow border border-theme-border/50`}>
                      <Star size={12} className="text-yellow-500 mx-1 fill-current" /> {shop.rating}
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 px-1">
                    <img 
                      src={shop.logoUrl} 
                      className="w-12 h-12 rounded-xl object-cover border-2 border-theme-card shadow-md -mt-8 relative z-10 bg-theme-card" 
                      alt={shop.name} 
                    />
                    <div className="flex-1 mt-0.5">
                      <h4 className="font-black text-theme-text text-sm">{shop.name}</h4>
                      <p className="text-[10px] text-theme-muted font-bold mt-0.5">
                        {isRTL ? 'متجر محفوظ في المفضلة' : 'Saved favorite partner store'}
                      </p>
                    </div>
                    <div className="bg-theme-bg px-2 py-1 rounded-lg flex items-center gap-1 text-[10px] font-bold text-theme-text border border-theme-border">
                      <Clock size={12} className="text-theme-muted" /> {shop.time} دقيقة
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          favProductsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in text-theme-muted">
              <div className="bg-theme-card p-5 rounded-full border border-theme-border shadow-md mb-4">
                <ShoppingBag size={36} className="text-primary fill-primary/10" />
              </div>
              <h3 className="font-black text-theme-text text-sm">{isRTL ? 'لا توجد منتجات مفضلة بعد' : 'No Favorite Products'}</h3>
              <p className="text-xs text-theme-muted mt-1 max-w-[80%] font-bold leading-relaxed">
                {isRTL 
                  ? 'اضغط على رمز القلب في بطاقة أي منتج لحفظه وتسهيل شرائه لاحقاً.'
                  : 'Tap the heart icon on any product inside shops to save it here for fast ordering.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {favProductsList.map(prod => (
                <div 
                  key={prod.id} 
                  onClick={() => navigate('product', { product: prod, shop: prod.shop })}
                  className="bg-theme-card p-3 rounded-[22px] flex items-center gap-3 border border-theme-border cursor-pointer shadow-sm hover:border-primary/20 transition duration-300 relative animate-card-entrance"
                >
                  <img src={prod.imgUrl} className="w-14 h-14 rounded-xl object-cover bg-theme-bg border border-theme-border flex-shrink-0" alt={prod.name} />
                  <div className="flex-1 min-w-0 pr-1">
                    <h4 className="font-black text-xs text-theme-text truncate leading-tight">{prod.name}</h4>
                    <p className="text-[10px] text-theme-muted font-bold truncate mt-1 leading-normal">{prod.desc}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-black text-primary">{prod.price} ج.م</span>
                      <span className="text-[9px] text-theme-muted bg-theme-bg px-2 py-0.5 rounded border border-theme-border font-bold">
                        {isRTL ? `في ${prod.shop?.name}` : `In ${prod.shop?.name}`}
                      </span>
                    </div>
                  </div>
                  
                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavoriteProduct(prod.id);
                    }}
                    className="p-2 text-red-500 hover:bg-theme-bg rounded-xl transition"
                    title={isRTL ? 'إزالة من المفضلة' : 'Remove from Favorites'}
                  >
                    <Heart size={16} className="fill-red-500 stroke-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};
export default FavoritesScreen;
