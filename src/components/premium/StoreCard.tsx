import { useTranslation } from '../../hooks/useTranslation';
import React from 'react';
import { Star, Clock, Heart } from 'lucide-react';
import { Store } from '../../types/store.types';

interface StoreCardProps {
  shop: Store;
  onClick: () => void;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  avgRating: string | number;
  openStatus: { label: string; color: string; status: string };
  isRTL: boolean;
  t: (key: string) => string;
}

export const StoreCard: React.FC<StoreCardProps> = ({
  shop,
  onClick,
  isFavorite,
  onToggleFavorite,
  avgRating,
  openStatus,
  isRTL }) => {
  const { t } = useTranslation();
  return (
    <div 
      onClick={onClick}
      className="bg-theme-card border border-theme-border/60 rounded-[28px] overflow-hidden shadow-sm hover:shadow-md hover:border-primary/20 cursor-pointer transition-all duration-300 group flex flex-col h-48 relative animate-card-entrance"
    >
      {/* Cover Image */}
      <div className="h-28 w-full bg-theme-bg relative overflow-hidden flex-shrink-0">
        <img 
          src={shop.coverUrl} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
          alt={shop.name} 
        />
        
        {/* Dark overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(e);
          }}
          className="absolute top-3 left-3 p-2 bg-black/40 backdrop-blur-md hover:bg-black/60 text-white rounded-full shadow-sm active:scale-90 transition z-10"
        >
          <Heart 
            size={12} 
            className={isFavorite ? 'fill-red-500 stroke-red-500 text-red-500' : 'text-white'} 
          />
        </button>

        {/* Store Open/Closed Badge */}
        <span className={`absolute top-3 right-3 text-[8px] font-black px-2 py-0.5 rounded-lg shadow-sm border ${
          openStatus.status === 'closed'
            ? 'bg-red-500 text-white border-red-600'
            : openStatus.status === 'closing_soon'
            ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
            : 'bg-green-500 text-white border-green-600'
        }`}>
          {openStatus.label}
        </span>
      </div>

      {/* Profile info overlay on cover */}
      <div className="absolute top-[80px] left-4 right-4 flex items-end gap-3 z-10">
        <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-theme-card shadow bg-white flex-shrink-0">
          <img src={shop.logoUrl} className="w-full h-full object-cover" alt={shop.name} />
        </div>
        <div className="flex-1 pb-1 text-white">
          <h4 className="text-xs font-black truncate drop-shadow-md">{shop.name}</h4>
          <span className="text-[8px] opacity-90 block truncate drop-shadow-sm">
            {shop.catId} {shop.village ? `• ${shop.village}` : ''}
          </span>
        </div>
      </div>

      {/* Metadata Bottom panel */}
      <div className="flex-1 bg-theme-card px-4 pt-8 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5 text-amber-500 bg-amber-500/10 border border-amber-500/10 px-1.5 py-0.5 rounded-lg">
            <Star size={10} className="fill-amber-500" />
            <span className="text-[9px] font-black font-sans">{avgRating}</span>
          </div>
          
          <span className="text-[9px] text-theme-muted font-bold">
            {shop.time || 30} {t('mins')}
          </span>
        </div>

        <div className="text-[9px] font-bold text-theme-text flex items-center gap-1">
          <Clock size={10} className="text-primary" />
          <span>{shop.fee} ج.م</span>
        </div>
      </div>
    </div>
  );
};

export default StoreCard;
