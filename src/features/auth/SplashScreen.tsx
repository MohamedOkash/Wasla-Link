import { useTranslation } from '../../hooks/useTranslation';
import React from 'react';
import { useApp } from '../../contexts/AppContext';

export const SplashScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useApp();
  
  return (
    <div className="flex-1 bg-gradient-to-br from-primary via-primary-hover to-theme-bg/95 flex flex-col items-center justify-center animate-fade-in relative overflow-hidden theme-transition">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-white/5 blur-[80px] pointer-events-none animate-pulse-slow"></div>
      
      <img 
        src="/logo.jpg" 
        alt={t('appName')} 
        className="w-32 h-32 object-cover rounded-[40px] shadow-[0_12px_40px_rgba(0,0,0,0.3)] mb-6 relative z-10 animate-bounce border border-white/20 scale-100 hover:scale-105 transition-transform duration-300"
      />
      <h1 className="text-5xl font-black text-white tracking-tight relative z-10 font-sans">{t('appName')}</h1>
      <p className="text-sm font-black text-white/80 mt-2 relative z-10 font-sans">{t('tagline')}</p>
      
      {/* Premium bouncing dots loader (Component 13) */}
      <div className="absolute bottom-16 flex gap-2.5 z-10">
        <span className="w-2.5 h-2.5 bg-white/90 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-2.5 h-2.5 bg-white/90 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-2.5 h-2.5 bg-white/90 rounded-full animate-bounce"></span>
      </div>
    </div>
  );
};
export default SplashScreen;
