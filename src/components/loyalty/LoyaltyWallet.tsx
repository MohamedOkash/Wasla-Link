import { useTranslation } from '../../hooks/useTranslation';
import React from 'react';
import { Gift, Wallet2, HelpCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { RewardsCard } from './RewardsCard';
import { PointsHistory } from './PointsHistory';

export const LoyaltyWallet: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser, isRTL } = useApp();
  const points = currentUser?.points || 0;
  const cashValue = Math.floor(points / 100) * 5; // 100 Points = 5 EGP

  return (
    <div className="space-y-6 text-theme-text">
      {/* Member Card */}
      <RewardsCard />

      {/* Conversion Banner */}
      <div className="bg-theme-card border border-theme-border rounded-[24px] p-5 shadow-sm theme-transition flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary p-3 rounded-2xl">
            <Wallet2 size={20} />
          </div>
          <div>
            <h4 className="font-black text-xs text-theme-text">{t('str_1168')}</h4>
            <p className="text-[10px] text-theme-muted font-bold mt-0.5">{t('str_1169')}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-black text-primary">{cashValue} {t('currencyEGP')}</span>
        </div>
      </div>

      {/* How it works info panel */}
      <div className="bg-theme-bg/40 border border-theme-border/60 rounded-2xl p-4 space-y-2">
        <h5 className="font-black text-xs text-theme-text flex items-center gap-1.5 leading-none">
          <HelpCircle size={14} className="text-primary" />
          {t('str_1170')}
        </h5>
        <ul className="text-[10px] font-bold text-theme-muted list-disc list-inside space-y-1 pl-1">
          <li>{t('str_1171')}</li>
          <li>{t('str_1172')}</li>
          <li>{t('str_1173')}</li>
          <li>{t('str_1174')}</li>
        </ul>
      </div>

      {/* Ledger History List */}
      <PointsHistory />
    </div>
  );
};

export default LoyaltyWallet;
