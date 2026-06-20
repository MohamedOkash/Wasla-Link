import React, { useState } from 'react';
import { ChevronRight, Search, Filter, Star, Clock, Heart } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface CategoryScreenProps {
  catId: string;
  navigate: (name: string, params?: any) => void;
  goBack: () => void;
  openSearch: () => void;
}

export const CategoryScreen: React.FC<CategoryScreenProps> = ({ catId, navigate, goBack, openSearch }) => {
  const { categories, stores, t, isRTL, favoriteStores, toggleFavoriteStore } = useApp();
  const category = categories.find(c => c.id === catId);
  const [filter, setFilter] = useState('all'); // all, top, fast, free, open

  const checkStoreOpen = (store: any) => {
    if (store.isTemporarilyClosed) return false;
    if (!store.openingHours || !store.closingHours) return store.isOpen;
    const now = new Date();
    const currentDay = now.getDay();
    if (store.workingDays && !store.workingDays.includes(currentDay)) return false;
    
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTimeVal = currentHour * 60 + currentMin;

    const [opHour, opMin] = store.openingHours.split(':').map(Number);
    const [clHour, clMin] = store.closingHours.split(':').map(Number);

    const openTimeVal = opHour * 60 + opMin;
    let closeTimeVal = clHour * 60 + clMin;

    if (closeTimeVal < openTimeVal) {
      return currentTimeVal >= openTimeVal || currentTimeVal < closeTimeVal;
    } else {
      return currentTimeVal >= openTimeVal && currentTimeVal < closeTimeVal;
    }
  };

  let catShops = stores.filter(s => s.catId === catId && s.status === 'approved');
  
  if (filter === 'top') catShops = [...catShops].sort((a, b) => b.rating - a.rating);
  if (filter === 'fast') catShops = [...catShops].sort((a, b) => a.time - b.time);
  if (filter === 'free') catShops = catShops.filter(s => s.fee === 0);
  if (filter === 'open') catShops = catShops.filter(s => checkStoreOpen(s));

  return (
    <div className="bg-theme-bg h-full flex flex-col overflow-hidden animate-slide-in-right theme-transition">
      {/* Category header respecting top Safe Area */}
      <div className="bg-theme-card px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 shadow-sm border-b border-theme-border/60 flex flex-col gap-3.5 theme-transition">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center">
            <button 
              onClick={goBack} 
              className="p-2 text-theme-text bg-theme-bg hover:bg-theme-border/50 rounded-full transition"
            >
              <ChevronRight size={20} className={isRTL ? '' : 'rotate-180'} />
            </button>
            <h1 className="text-base font-black text-theme-text mx-2.5">
              {isRTL ? category?.name.ar : category?.name.en}
            </h1>
          </div>
          <button 
            onClick={openSearch} 
            className="p-2 text-theme-text bg-theme-bg hover:bg-theme-border/50 rounded-full transition"
          >
            <Search size={18} />
          </button>
        </div>

        {/* Filter Badges scroll */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
           <div className="bg-primary text-white px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm flex-shrink-0">
             <Filter size={13} strokeWidth={2.5} /> <span>{t('filters')}</span>
           </div>
           {[
             { id: 'all', label: isRTL ? 'تصفح الكل' : 'All Stores' }, 
             { id: 'top', label: t('topRated') }, 
             { id: 'fast', label: t('fastest') }, 
             { id: 'open', label: t('openNow') }, 
             { id: 'free', label: t('freeDelivery') }
           ].map(f => (
             <button 
               key={f.id} 
               onClick={() => setFilter(f.id)} 
               className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 border transition-all duration-200 ${
                 filter === f.id 
                   ? 'bg-primary/15 text-primary border-primary/20 font-black' 
                   : 'bg-theme-card border-theme-border text-theme-muted hover:text-theme-text'
               }`}
             >
               {f.label}
             </button>
           ))}
        </div>
      </div>

      {/* Independent Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+6.5rem)] no-scrollbar p-4">
        {/* Category Header banner */}
        <div className="w-full h-28 rounded-[24px] overflow-hidden relative shadow-sm mb-5 border border-theme-border">
           <img src={category?.imgUrl} className="w-full h-full object-cover" alt="" />
           <div className="absolute inset-0 bg-black/45 flex items-center justify-center p-4">
             <h2 className="text-white text-base font-black drop-shadow-md text-center leading-normal">
               {isRTL ? 'تصفح أفضل العروض والمتاجر المجاورة لك' : 'Discover Great Local Stores Nearby'}
             </h2>
           </div>
        </div>

        {/* Stores list */}
        <div className="flex flex-col gap-3.5">
          {catShops.length === 0 ? (
            <div className="text-center text-theme-muted py-10 font-bold text-xs">
              {t('noResults')}
            </div>
          ) : (
            catShops.map(shop => {
              const openStatus = (() => {
                if (shop.isTemporarilyClosed) {
                  return { label: isRTL ? 'مغلق مؤقتاً' : 'Temporarily Closed', color: 'bg-red-500/15 text-red-500 border border-red-500/20' };
                }
                if (!shop.openingHours || !shop.closingHours) {
                  return shop.isOpen 
                    ? { label: isRTL ? 'مفتوح الآن' : 'Open Now', color: 'bg-green-500/15 text-green-500 border border-green-500/20' }
                    : { label: isRTL ? 'مغلق' : 'Closed', color: 'bg-red-500/15 text-red-500 border border-red-500/20' };
                }
                const now = new Date();
                const currentDay = now.getDay();
                if (shop.workingDays && !shop.workingDays.includes(currentDay)) {
                  return { label: isRTL ? 'مغلق (عطلة)' : 'Closed (Holiday)', color: 'bg-red-500/15 text-red-500 border border-red-500/20' };
                }
                const currentHour = now.getHours();
                const currentMin = now.getMinutes();
                const currentTimeVal = currentHour * 60 + currentMin;

                const [opHour, opMin] = shop.openingHours.split(':').map(Number);
                const [clHour, clMin] = shop.closingHours.split(':').map(Number);

                const openTimeVal = opHour * 60 + opMin;
                let closeTimeVal = clHour * 60 + clMin;

                let isStoreOpen = false;
                if (closeTimeVal < openTimeVal) {
                  isStoreOpen = currentTimeVal >= openTimeVal || currentTimeVal < closeTimeVal;
                } else {
                  isStoreOpen = currentTimeVal >= openTimeVal && currentTimeVal < closeTimeVal;
                }

                if (!isStoreOpen) {
                  return { label: isRTL ? 'مغلق' : 'Closed', color: 'bg-red-500/15 text-red-500 border border-red-500/20' };
                }

                let minsToClose = 0;
                if (closeTimeVal < openTimeVal) {
                  minsToClose = currentTimeVal >= openTimeVal ? (1440 - currentTimeVal) + closeTimeVal : closeTimeVal - currentTimeVal;
                } else {
                  minsToClose = closeTimeVal - currentTimeVal;
                }

                if (minsToClose > 0 && minsToClose <= 60) {
                  return { label: isRTL ? 'يغلق خلال ساعة' : 'Closes in an hour', color: 'bg-amber-500/15 text-amber-500 border border-amber-500/20' };
                }

                return { label: isRTL ? 'مفتوح الآن' : 'Open Now', color: 'bg-green-500/15 text-green-500 border border-green-500/20' };
              })();

              return (
                <div 
                  key={shop.id} 
                  onClick={() => navigate('shop', { shop, from: 'category' })} 
                  className="bg-theme-card rounded-[24px] p-3 shadow-sm border border-theme-border cursor-pointer hover:shadow-md hover:border-primary/20 transition-all duration-300 animate-card-entrance"
                >
                  <div className="w-full h-32 rounded-2xl relative overflow-hidden bg-theme-bg mb-3">
                    <img src={shop.coverUrl} className="w-full h-full object-cover" alt={shop.name} />
                    <div className="absolute inset-0 bg-black/10"></div>
                    
                    {/* Heart button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteStore(shop.id);
                      }}
                      className="absolute bottom-2.5 right-2.5 bg-theme-card/95 backdrop-blur-sm p-2 rounded-xl text-theme-muted hover:text-red-500 hover:scale-105 active:scale-95 transition shadow-sm z-10"
                      title="حفظ في المفضلة"
                    >
                      <Heart size={14} className={favoriteStores.includes(shop.id) ? 'fill-red-500 stroke-red-500 text-red-500' : 'text-theme-text'} />
                    </button>

                    <div className="absolute top-2.5 right-2.5 bg-theme-card/95 backdrop-blur-sm px-2 py-0.5 rounded-xl text-[10px] font-black flex items-center text-theme-text shadow-sm border border-theme-border/50">
                      <Star size={12} className="text-yellow-500 mx-1 fill-current" /> {shop.rating}
                    </div>

                    <div className={`absolute top-2.5 left-2.5 backdrop-blur-sm px-2 py-0.5 rounded-lg text-[9px] font-black shadow-sm ${openStatus.color}`}>
                      {openStatus.label}
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
                        {isRTL ? category?.name.ar : category?.name.en}
                      </p>
                    </div>
                    <div className="bg-theme-bg px-2 py-1 rounded-lg flex items-center gap-1 text-[10px] font-bold text-theme-text border border-theme-border">
                      <Clock size={12} className="text-theme-muted" /> {shop.time} {t('min')}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
export default CategoryScreen;
