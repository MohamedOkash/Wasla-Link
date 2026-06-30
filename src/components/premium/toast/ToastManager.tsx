import React from 'react';
import { useApp } from '../../../contexts/AppContext';
import { PremiumToast } from './PremiumToast';

export const ToastManager: React.FC = () => {
  const { toasts, removeToast, isRTL } = useApp();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div 
      className="fixed z-[9999] pointer-events-none flex flex-col items-center gap-2 p-4
                 top-safe left-0 right-0 max-h-screen overflow-hidden"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))'
      }}
    >
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto w-full flex justify-center transition-all duration-300">
          <PremiumToast 
            toast={toast} 
            onClose={removeToast} 
            isRTL={isRTL} 
          />
        </div>
      ))}
    </div>
  );
};
