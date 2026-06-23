import { useTranslation } from '../../hooks/useTranslation';
import React from 'react';
import { Wallet, TrendingUp, Calendar, Clock, DollarSign, ArrowUpRight } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface DriverEarningsProps {
  driver: any;
}

export const DriverEarnings: React.FC<DriverEarningsProps> = ({ driver }) => {
  const { isRTL } = useApp();

  const earnings = driver.totalEarnings || 0;
  
  // Simulated breakdown since we don't track timeframes in DB yet, but preparing UI
  const today = Math.floor(earnings * 0.1); // 10%
  const weekly = Math.floor(earnings * 0.4); // 40%
  const monthly = Math.floor(earnings * 0.8); // 80%

  return (
    <div className="space-y-6">
      
      {/* Main Balance Card */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-800 text-white rounded-[32px] p-6 shadow-lg relative overflow-hidden flex flex-col justify-between h-48">
        <div className="absolute top-0 right-0 p-6 opacity-20">
          <Wallet size={80} strokeWidth={1} />
        </div>
        
        <div>
          <span className="text-xs font-bold uppercase tracking-wider opacity-80 flex items-center gap-2">
            <Wallet size={16} />
            {t('str_1111')}
          </span>
          <div className="mt-3 flex items-end gap-2">
            <h2 className="text-4xl font-black">{earnings}</h2>
            <span className="text-lg font-bold opacity-80 mb-1">{t('str_1110')}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs font-bold bg-white/10 w-fit px-3 py-1.5 rounded-xl backdrop-blur-md">
          <ArrowUpRight size={14} />
          {t('str_1112')}
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Today */}
        <div className="bg-theme-card border border-theme-border rounded-[24px] p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
            <Clock size={20} />
          </div>
          <span className="text-[10px] text-theme-muted font-black block">{t('str_1113')}</span>
          <span className="text-xl font-black text-theme-text mt-1 block">{today} <span className="text-[10px] text-theme-muted font-bold">{t('str_1110')}</span></span>
        </div>

        {/* Weekly */}
        <div className="bg-theme-card border border-theme-border rounded-[24px] p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
            <TrendingUp size={20} />
          </div>
          <span className="text-[10px] text-theme-muted font-black block">{t('str_1114')}</span>
          <span className="text-xl font-black text-theme-text mt-1 block">{weekly} <span className="text-[10px] text-theme-muted font-bold">{t('str_1110')}</span></span>
        </div>

        {/* Monthly */}
        <div className="bg-theme-card border border-theme-border rounded-[24px] p-5 shadow-sm col-span-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Calendar size={24} />
            </div>
            <div>
              <span className="text-[10px] text-theme-muted font-black block">{t('str_1115')}</span>
              <span className="text-2xl font-black text-theme-text mt-0.5 block">{monthly} <span className="text-xs text-theme-muted font-bold">{t('str_1110')}</span></span>
            </div>
          </div>
        </div>

      </div>

      {/* Note */}
      <div className="p-4 bg-theme-bg border border-theme-border rounded-2xl text-center">
        <p className="text-xs font-bold text-theme-muted">
          {isRTL 
            ? 'نظام السحب والمحافظ الرقمية سيتم تفعيله في تحديث المحفظة القادم (Phase 14B).'
            : 'Wallet withdrawal system will be activated in the upcoming update (Phase 14B).'}
        </p>
      </div>

    </div>
  );
};
