import { useTranslation } from '../../hooks/useTranslation';
import React, { useState } from 'react';
import { Share2, Copy, Check, Users2, Gift, Info } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { ReferralHistory } from './ReferralHistory';

export const ReferralCenter: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser, referrals, isRTL, showToast } = useApp();
  const [copied, setCopied] = useState(false);

  const referralCode = currentUser?.referralCode || 'WASLA101';
  const totalEarnedPoints = referrals.reduce((sum, r) => sum + r.pointsAwarded, 0);

  const handleCopyCode = () => {
  const {} = useTranslation();

    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    showToast(t('str_1200'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: t('str_1201'),
        text: isRTL 
          ? `اشترك في سوق البلد واستخدم كود الدعوة الخاص بي: ${referralCode} لتحصل على 100 نقطة ولاء (خصم 5 جنيهات) ترحيبية فوراً!` 
          : `Join Souq El Balad and use my invite code: ${referralCode} to get 100 loyalty points (5 EGP discount) welcome bonus instantly!`,
        url: window.location.origin
      }).catch(console.error);
    } else {
      handleCopyCode();
    }
  };

  return (
    <div className="space-y-6 text-theme-text">
      {/* Intro Header Card */}
      <div className="bg-theme-card border border-theme-border rounded-[32px] p-6 shadow-sm text-center relative overflow-hidden theme-transition">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl -mr-6 -mt-6"></div>
        <div className="mx-auto w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
          <Gift size={24} />
        </div>
        <h3 className="text-base font-black text-theme-text">{t('str_1202')}</h3>
        <p className="text-xs text-theme-muted font-bold mt-2 max-w-xs mx-auto leading-relaxed">
          {isRTL 
            ? 'احصل على 500 نقطة (25 ج.م) لكل صديق يسجل باستخدام كودك، ويحصل صديقك على 100 نقطة (5 ج.م) ترحيبية فوراً!' 
            : 'Get 500 points (25 EGP) for every friend registering with your code, and your friend gets 100 points (5 EGP) instantly!'}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-theme-card p-4 rounded-3xl border border-theme-border shadow-sm flex flex-col justify-between h-24 theme-transition">
          <span className="text-[9px] font-black text-theme-muted uppercase tracking-wider">{t('str_1203')}</span>
          <p className="text-lg font-black text-theme-text flex items-center gap-1">
            <Users2 size={16} className="text-primary shrink-0" />
            {referrals.length} {t('str_1204')}
          </p>
        </div>

        <div className="bg-theme-card p-4 rounded-3xl border border-theme-border shadow-sm flex flex-col justify-between h-24 theme-transition">
          <span className="text-[9px] font-black text-theme-muted uppercase tracking-wider">{t('str_1205')}</span>
          <p className="text-lg font-black text-primary">
            +{totalEarnedPoints} {t('str_1186')}
          </p>
        </div>
      </div>

      {/* Share Widget */}
      <div className="bg-theme-card border border-theme-border rounded-[28px] p-5 shadow-sm space-y-4 theme-transition">
        <span className="text-[10px] font-black text-theme-muted uppercase tracking-wider block text-center">
          {t('str_1206')}
        </span>
        
        <div className="flex items-center justify-between bg-theme-bg border border-theme-border rounded-2xl p-2.5">
          <span className="font-mono font-black text-lg text-theme-text pl-4 select-all uppercase">
            {referralCode}
          </span>
          <button
            onClick={handleCopyCode}
            className="p-3 bg-theme-card border border-theme-border hover:bg-theme-border/50 text-theme-text rounded-xl transition flex items-center justify-center shrink-0 active:scale-95"
            title={t('str_1207')}
          >
            {copied ? <Check size={16} className="text-green-500" strokeWidth={3} /> : <Copy size={16} />}
          </button>
        </div>

        <button
          onClick={handleShare}
          className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-black rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-xs"
        >
          <Share2 size={15} />
          {t('str_1208')}
        </button>
      </div>

      {/* Rules warning */}
      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 rounded-2xl p-3.5 flex gap-2.5 items-start">
        <Info size={16} className="shrink-0 mt-0.5" />
        <div className="text-[10px] font-bold leading-normal">
          <h5 className="font-black mb-0.5">{t('str_1209')}</h5>
          <p>{t('str_1210')}</p>
        </div>
      </div>

      {/* Referral History Directory */}
      <ReferralHistory />
    </div>
  );
};

export default ReferralCenter;
