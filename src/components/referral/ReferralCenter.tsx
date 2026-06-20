import React, { useState } from 'react';
import { Share2, Copy, Check, Users2, Gift, Info } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { ReferralHistory } from './ReferralHistory';

export const ReferralCenter: React.FC = () => {
  const { currentUser, referrals, isRTL, showToast } = useApp();
  const [copied, setCopied] = useState(false);

  const referralCode = currentUser?.referralCode || 'WASLA101';
  const totalEarnedPoints = referrals.reduce((sum, r) => sum + r.pointsAwarded, 0);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    showToast(isRTL ? 'تم نسخ كود الإحالة بنجاح!' : 'Referral code copied successfully!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: isRTL ? 'سوق البلد - دعوة صديق' : 'Souq El Balad - Invite Friend',
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
        <h3 className="text-base font-black text-theme-text">{isRTL ? 'ادعُ أصدقاءك واكسب نقاط خصم!' : 'Invite Friends & Earn Points!'}</h3>
        <p className="text-xs text-theme-muted font-bold mt-2 max-w-xs mx-auto leading-relaxed">
          {isRTL 
            ? 'احصل على 500 نقطة (25 ج.م) لكل صديق يسجل باستخدام كودك، ويحصل صديقك على 100 نقطة (5 ج.م) ترحيبية فوراً!' 
            : 'Get 500 points (25 EGP) for every friend registering with your code, and your friend gets 100 points (5 EGP) instantly!'}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-theme-card p-4 rounded-3xl border border-theme-border shadow-sm flex flex-col justify-between h-24 theme-transition">
          <span className="text-[9px] font-black text-theme-muted uppercase tracking-wider">{isRTL ? 'إجمالي الدعوات الناجحة' : 'Successful Invites'}</span>
          <p className="text-lg font-black text-theme-text flex items-center gap-1">
            <Users2 size={16} className="text-primary shrink-0" />
            {referrals.length} {isRTL ? 'صديق' : 'friends'}
          </p>
        </div>

        <div className="bg-theme-card p-4 rounded-3xl border border-theme-border shadow-sm flex flex-col justify-between h-24 theme-transition">
          <span className="text-[9px] font-black text-theme-muted uppercase tracking-wider">{isRTL ? 'أرباح الدعوات الكلية' : 'Total Referral Earnings'}</span>
          <p className="text-lg font-black text-primary">
            +{totalEarnedPoints} {isRTL ? 'نقطة' : 'pts'}
          </p>
        </div>
      </div>

      {/* Share Widget */}
      <div className="bg-theme-card border border-theme-border rounded-[28px] p-5 shadow-sm space-y-4 theme-transition">
        <span className="text-[10px] font-black text-theme-muted uppercase tracking-wider block text-center">
          {isRTL ? 'كود الدعوة الخاص بك' : 'Your Unique Invite Code'}
        </span>
        
        <div className="flex items-center justify-between bg-theme-bg border border-theme-border rounded-2xl p-2.5">
          <span className="font-mono font-black text-lg text-theme-text pl-4 select-all uppercase">
            {referralCode}
          </span>
          <button
            onClick={handleCopyCode}
            className="p-3 bg-theme-card border border-theme-border hover:bg-theme-border/50 text-theme-text rounded-xl transition flex items-center justify-center shrink-0 active:scale-95"
            title={isRTL ? 'نسخ الكود' : 'Copy Code'}
          >
            {copied ? <Check size={16} className="text-green-500" strokeWidth={3} /> : <Copy size={16} />}
          </button>
        </div>

        <button
          onClick={handleShare}
          className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-black rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-xs"
        >
          <Share2 size={15} />
          {isRTL ? 'مشاركة رابط كود الدعوة' : 'Share Invitation Link'}
        </button>
      </div>

      {/* Rules warning */}
      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 rounded-2xl p-3.5 flex gap-2.5 items-start">
        <Info size={16} className="shrink-0 mt-0.5" />
        <div className="text-[10px] font-bold leading-normal">
          <h5 className="font-black mb-0.5">{isRTL ? 'شروط الحماية والأمان:' : 'Loyalty & Safety Rules:'}</h5>
          <p>{isRTL ? 'يمنع مشاركة الكود مع حساباتك الخاصة أو الإحالة الذاتية. سيتم تجميد أي حسابات تسجل عمليات احتيال للحصول على نقاط مكررة بشكل فوري.' : 'Self-referral and multiple accounts farming are strictly prohibited. Violating accounts will have their loyalty points frozen instantly.'}</p>
        </div>
      </div>

      {/* Referral History Directory */}
      <ReferralHistory />
    </div>
  );
};

export default ReferralCenter;
