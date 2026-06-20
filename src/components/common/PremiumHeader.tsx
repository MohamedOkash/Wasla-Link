import React from 'react';
import { MapPin, Bell, Heart, ChevronLeft, Sparkles } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface PremiumHeaderProps {
  openMap: () => void;
  openNotifications: () => void;
  openFavorites: () => void;
  onLogoClick?: () => void;
}

export const PremiumHeader: React.FC<PremiumHeaderProps> = ({
  openMap,
  openNotifications,
  openFavorites,
  onLogoClick
}) => {
  const { location, t, notifications, isRTL, currentUser } = useApp();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Smart Greeting logic based on time of day
  const getGreeting = () => {
    const hours = new Date().getHours();
    const name = currentUser?.name ? currentUser.name.split(' ')[0] : '';
    
    if (isRTL) {
      const welcome = name ? `يا ${name}` : '';
      if (hours < 12) return `صباح الخير ${welcome} 👋`;
      if (hours < 18) return `مرحباً بك ${welcome} 👋`;
      return `مساء الخير ${welcome} 👋`;
    } else {
      const welcome = name ? `, ${name}` : '';
      if (hours < 12) return `Good morning${welcome} 👋`;
      if (hours < 18) return `Hello${welcome} 👋`;
      return `Good evening${welcome} 👋`;
    }
  };

  return (
    <div className="glass-effect sticky top-0 z-50 px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4.5 rounded-b-[36px] theme-transition flex flex-col gap-4 border-b border-theme-border/50 shadow-md">
      
      {/* Smart Greeting & Notification Controls */}
      <div className="flex justify-between items-center w-full">
        {/* Brand Logo & Name */}
        <div 
          onClick={onLogoClick}
          className="flex items-center gap-3.5 cursor-pointer select-none active:scale-98 transition shrink-0"
        >
          <div className="relative">
            <img 
              src="/logo.jpg" 
              alt="WaslaLink Logo" 
              className="w-14 h-14 object-cover rounded-[20px] shadow-lg border border-theme-border/30 shrink-0"
            />
            {/* Ambient indicator glow */}
            <span className="absolute -bottom-1 -right-1 bg-green-500 w-3.5 h-3.5 rounded-full border-2 border-theme-card shadow-sm shadow-green-500/30"></span>
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <h1 className="text-base font-black tracking-tight text-theme-text leading-none font-sans">
                WaslaLink
              </h1>
              <Sparkles size={10} className="text-primary animate-pulse" />
            </div>
            <span className="text-[11px] text-theme-muted font-black leading-none mt-1">
              وصلة لينك
            </span>
            <p className="text-[9px] text-theme-muted font-bold tracking-wide mt-0.5 leading-none">
              {getGreeting()}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Favorites Shortcut */}
          <button 
            onClick={openFavorites}
            className="p-3 bg-theme-bg/60 border border-theme-border/60 hover:border-primary/20 text-theme-text rounded-2xl transition hover:scale-105 active:scale-95 shadow-sm theme-transition"
          >
            <Heart size={18} className="text-theme-text hover:text-red-500 hover:fill-red-500/20 transition-colors" strokeWidth={2.2} />
          </button>

          {/* Notifications Bell */}
          <button 
            onClick={openNotifications}
            className="p-3 bg-theme-bg/60 border border-theme-border/60 hover:border-primary/20 text-theme-text rounded-2xl relative transition hover:scale-105 active:scale-95 shadow-sm theme-transition"
          >
            <Bell size={18} className={`text-theme-text ${unreadCount > 0 ? 'animate-bounce-slight' : ''}`} strokeWidth={2.2} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-primary text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-theme-card animate-pulse shadow-sm font-sans">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Location Selector Pill */}
      <div 
        onClick={openMap}
        className="w-full bg-theme-bg/85 border border-theme-border/70 hover:border-primary/30 py-3 px-4.5 rounded-2xl flex justify-between items-center cursor-pointer transition hover:bg-theme-bg shadow-sm theme-transition animate-fade-in"
      >
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-xl text-primary">
            <MapPin size={16} fill="currentColor" className="text-primary/30" />
          </div>
          <div>
            <span className="text-[9px] text-theme-muted font-bold block leading-none mb-0.5 uppercase tracking-wide">
              {t('deliverTo')}
            </span>
            <span className="text-xs font-black text-theme-text truncate max-w-[220px] block">
              {location.isVerified 
                ? (location.name.length > 32 ? location.name.substring(0, 32) + '...' : location.name) 
                : t('selectLocation')
              }
            </span>
          </div>
        </div>
        <ChevronLeft size={16} className={`text-theme-muted transition-transform ${isRTL ? '' : 'rotate-180'}`} />
      </div>
      
    </div>
  );
};

export default PremiumHeader;
