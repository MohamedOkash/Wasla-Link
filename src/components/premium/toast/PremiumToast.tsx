import React, { useEffect, useState } from 'react';
import { CheckCircle, Info, AlertTriangle, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface PremiumToastProps {
  toast: ToastItem;
  onClose: (id: string) => void;
  isRTL: boolean;
}

export const PremiumToast: React.FC<PremiumToastProps> = ({ toast, onClose, isRTL }) => {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Requirements:
    // Success toast duration: 3000ms
    // Info toast duration: 3000ms
    // Warning toast duration: 5000ms
    // Error toast duration: 7000ms
    let duration = 3000;
    if (toast.type === 'warning') duration = 5000;
    if (toast.type === 'error') duration = 7000;

    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 300); // animation duration
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return <CheckCircle size={20} className="text-emerald-500" />;
      case 'info': return <Info size={20} className="text-blue-500" />;
      case 'warning': return <AlertTriangle size={20} className="text-amber-500" />;
      case 'error': return <XCircle size={20} className="text-red-500" />;
    }
  };

  const getBgClass = () => {
    switch (toast.type) {
      case 'success': return 'bg-emerald-500/10 border-emerald-500/30';
      case 'info': return 'bg-blue-500/10 border-blue-500/30';
      case 'warning': return 'bg-amber-500/10 border-amber-500/30';
      case 'error': return 'bg-red-500/10 border-red-500/30';
    }
  };

  return (
    <div 
      className={`
        relative w-fit max-w-[95%] overflow-hidden
        rounded-full border backdrop-blur-2xl shadow-sm
        flex items-center gap-2.5 px-4 py-2.5
        transition-all duration-300 ease-in-out
        ${getBgClass()}
        ${isLeaving ? 'opacity-0 -translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100'}
      `}
      style={{ animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
    >
      <div className="flex-shrink-0 scale-90">
        {getIcon()}
      </div>
      
      <p className="flex-1 text-[12px] font-black text-theme-text text-center px-1" dir={isRTL ? 'rtl' : 'ltr'}>
        {toast.message}
      </p>

      <button 
        onClick={handleClose}
        className="flex-shrink-0 p-1 rounded-full hover:bg-theme-bg/50 text-theme-muted hover:text-theme-text transition-colors opacity-80 hover:opacity-100"
      >
        <X size={14} />
      </button>
      
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};
