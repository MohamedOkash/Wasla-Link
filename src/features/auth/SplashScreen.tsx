import { useTranslation } from '../../hooks/useTranslation';
import React from 'react';
import { Store } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export const SplashScreen: React.FC = () => {
  const { t } = useTranslation();
  const {} = useApp();
  
  return (
    <div className="flex-1 bg-orange-500 flex flex-col items-center justify-center animate-fade-in relative overflow-hidden">
      <img 
        src="/logo.jpg" 
        alt="WaslaLink Logo" 
        className="w-32 h-32 object-cover rounded-[40px] shadow-2xl mb-6 relative z-10 animate-bounce border border-white/20"
      />
      <h1 className="text-5xl font-black text-white tracking-tight relative z-10">{t('appName')}</h1>
      <p className="text-sm font-bold text-white/90 mt-2 relative z-10">{t('tagline')}</p>
      <div className="absolute bottom-12 w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};
export default SplashScreen;
