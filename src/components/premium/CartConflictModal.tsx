import { useTranslation } from '../../hooks/useTranslation';
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export const CartConflictModal: React.FC = () => {
  const { cartConflictAlert, cancelCartConflict, confirmClearCartAndAdd, isRTL } = useApp();

  if (!cartConflictAlert || !cartConflictAlert.isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-sm bg-theme-bg border border-theme-border rounded-2xl p-6 shadow-2xl relative animate-pop-in"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-lg font-black text-theme-text uppercase">
            {t('str_1198')}
          </h2>
        </div>

        <p className="text-sm font-medium text-theme-text/80 mb-6 leading-relaxed whitespace-pre-wrap">
          {isRTL 
            ? 'لديك منتجات من متجر آخر داخل السلة.\nهل تريد إفراغ السلة وإضافة منتجات المتجر الجديد؟' 
            : 'You have products from another store in your cart.\nDo you want to clear the cart and add the new products?'}
        </p>

        <div className="flex gap-3">
          <button 
            onClick={cancelCartConflict}
            className="flex-1 py-3 px-4 rounded-xl border border-theme-border font-bold text-theme-text/80 hover:bg-theme-bg-alt transition-colors"
          >
            {t('str_56')}
          </button>
          <button 
            onClick={confirmClearCartAndAdd}
            className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
          >
            {t('str_1199')}
          </button>
        </div>
      </div>
    </div>
  );
};
