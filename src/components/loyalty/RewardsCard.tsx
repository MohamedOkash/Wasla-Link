import React from 'react';
import { Award, Shield, Sparkles, Flame } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export const RewardsCard: React.FC = () => {
  const { currentUser, isRTL } = useApp();
  const points = currentUser?.points || 0;

  const getTierDetails = (pts: number) => {
    if (pts >= 15000) {
      return {
        name: isRTL ? 'البلاتيني المميز' : 'Platinum Premium',
        gradient: 'from-slate-800 via-neutral-900 to-slate-900',
        textColor: 'text-slate-100',
        badgeColor: 'bg-slate-500/25 border-slate-400 text-slate-300',
        icon: Sparkles,
        benefits: isRTL ? 'توصيل مجاني لجميع الطلبات + 5% خصم إضافي' : 'Free delivery on all orders + 5% extra cash discount'
      };
    } else if (pts >= 5000) {
      return {
        name: isRTL ? 'العضوية الذهبية' : 'Gold Membership',
        gradient: 'from-amber-500 via-yellow-600 to-amber-700',
        textColor: 'text-amber-50',
        badgeColor: 'bg-amber-400/20 border-amber-300 text-amber-200',
        icon: Flame,
        benefits: isRTL ? 'توصيل بنصف السعر + هدايا حصرية شهرياً' : 'Half price delivery + exclusive monthly gifts'
      };
    } else if (pts >= 1000) {
      return {
        name: isRTL ? 'العضوية الفضية' : 'Silver Membership',
        gradient: 'from-slate-400 via-zinc-500 to-slate-600',
        textColor: 'text-slate-50',
        badgeColor: 'bg-slate-300/20 border-slate-200 text-slate-200',
        icon: Shield,
        benefits: isRTL ? 'أولوية التوصيل في أوقات الذروة' : 'Priority delivery during rush hours'
      };
    } else {
      return {
        name: isRTL ? 'العضوية البرونزية' : 'Bronze Member',
        gradient: 'from-orange-700 via-amber-800 to-orange-950',
        textColor: 'text-orange-100',
        badgeColor: 'bg-orange-500/20 border-orange-400/30 text-orange-300',
        icon: Award,
        benefits: isRTL ? '1 نقطة مقابل كل جنيه تنفقه على المنصة' : 'Earn 1 point for every 1 EGP spent'
      };
    }
  };

  const tier = getTierDetails(points);
  const TierIcon = tier.icon;

  return (
    <div className={`relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br ${tier.gradient} shadow-2xl border border-white/10 text-white min-h-[180px] flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:shadow-primary/10`}>
      {/* Glossy Overlay */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-xl -ml-10 -mb-10"></div>

      <div className="flex justify-between items-start z-10">
        <div>
          <span className="text-[10px] font-black text-white/60 uppercase tracking-widest block">
            {isRTL ? 'نادي ولاء سوق البلد' : 'Souq El Balad Loyalty Club'}
          </span>
          <h3 className="text-lg font-black mt-1 flex items-center gap-1.5">
            <TierIcon size={18} className="animate-pulse" />
            {tier.name}
          </h3>
        </div>
        <div className={`px-2.5 py-1 rounded-xl text-[9px] font-black border backdrop-blur-md ${tier.badgeColor}`}>
          {isRTL ? 'عضو نشط' : 'Active Member'}
        </div>
      </div>

      <div className="mt-8 z-10">
        <p className="text-[10px] text-white/50 font-bold">{isRTL ? 'رصيد نقاط الولاء الحالي:' : 'Current Loyalty Balance:'}</p>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-3xl font-black tracking-tight">{points}</span>
          <span className="text-xs font-bold text-white/70">{isRTL ? 'نقطة' : 'pts'}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-[10px] z-10 text-white/80">
        <span className="font-bold">{tier.benefits}</span>
        <span className="font-black text-right opacity-60">
          {currentUser?.name}
        </span>
      </div>
    </div>
  );
};

export default RewardsCard;
