import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface CustomerHeaderProps {
  title: string;
  goBack?: () => void;
  rightAction?: React.ReactNode;
}

export const CustomerHeader: React.FC<CustomerHeaderProps> = ({ title, goBack, rightAction }) => {
  const { isRTL } = useApp();
  
  return (
    <div className="bg-theme-card px-5 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-4 shadow-sm border-b border-theme-border/60 flex items-center justify-between sticky top-0 z-30 w-full theme-transition">
      <div className="flex items-center gap-2">
        {goBack && (
          <button 
            onClick={goBack} 
            className="p-2 -mx-2 text-theme-text bg-theme-bg rounded-full hover:bg-theme-border/80 transition"
          >
            <ChevronRight size={20} className={isRTL ? '' : 'rotate-180'} />
          </button>
        )}
        <h1 className="text-base font-black text-theme-text mx-1">{title}</h1>
      </div>
      {rightAction && <div className="flex items-center">{rightAction}</div>}
    </div>
  );
};

export default CustomerHeader;
