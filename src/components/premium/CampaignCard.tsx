import { useTranslation } from '../../hooks/useTranslation';
import React from 'react';
import { Banner } from '../../types/banner.types';

interface CampaignCardProps {
  banner: Banner;
  onClick: () => void;
  t: (key: string) => string;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({
  banner,
  onClick }) => {
  const { t } = useTranslation();
  const titleText = banner.title && typeof banner.title === 'object'
    ? (banner.title as any).ar || (banner.title as any).en
    : banner.title;

  const subtitleText = banner.subtitle && typeof banner.subtitle === 'object'
    ? (banner.subtitle as any).ar || (banner.subtitle as any).en
    : banner.subtitle;

  return (
    <div 
      onClick={onClick}
      className="w-full h-44 rounded-[32px] overflow-hidden relative shadow-sm hover:shadow-md cursor-pointer transition-all duration-500 group border border-theme-border/40" 
    >
      {/* Zoom scale transition on hover */}
      <img 
        src={banner.imgUrl} 
        className="w-full h-full object-cover transition-transform duration-700 scale-100 group-hover:scale-102" 
        alt="Banner Campaign" 
      />
      
      {/* Visual elegant black gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent flex flex-col justify-center p-6 text-white">
        <span className="bg-primary/95 text-[8px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider w-max mb-2">
          {t('newOffer')}
        </span>
        <h2 className="text-base font-black mb-1 drop-shadow-md leading-tight w-2/3 line-clamp-2">
          {titleText}
        </h2>
        <p className="text-[10px] font-bold opacity-90 mb-3 drop-shadow-sm line-clamp-1">
          {subtitleText}
        </p>
        <button className="bg-white text-slate-900 text-[9px] font-black py-2 px-4 rounded-xl shadow hover:scale-105 active:scale-95 transition-all w-max leading-none">
          {t('orderNow')}
        </button>
      </div>
    </div>
  );
};

export default CampaignCard;
