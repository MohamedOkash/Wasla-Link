import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface PremiumBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const PremiumBottomSheet: React.FC<PremiumBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = ''
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Drawer Container */}
      <div 
        className={`relative bg-theme-bg border-t border-theme-border/60 rounded-t-[32px] shadow-[0_-12px_40px_rgba(0,0,0,0.3)] max-h-[85%] flex flex-col overflow-hidden theme-transition animate-slide-up ${className}`}
      >
        {/* Drag handle decoration */}
        <div className="w-12 h-1 bg-theme-border rounded-full mx-auto my-3 flex-shrink-0 cursor-pointer" onClick={onClose}></div>
        
        {/* Header */}
        {title && (
          <div className="px-5 pb-3 flex items-center justify-between border-b border-theme-border/50 flex-shrink-0">
            <h2 className="text-sm font-black text-theme-text">{title}</h2>
            <button 
              onClick={onClose} 
              className="p-1.5 text-theme-muted hover:text-theme-text bg-theme-card hover:bg-theme-border/60 rounded-full transition"
            >
              <X size={16} />
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 no-scrollbar pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PremiumBottomSheet;
