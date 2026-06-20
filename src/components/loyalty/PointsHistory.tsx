import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Gift, ShoppingCart, UserCheck } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export const PointsHistory: React.FC = () => {
  const { pointsHistory, isRTL } = useApp();

  const getTransactionDetails = (type: string, pts: number) => {
    switch (type) {
      case 'earn':
        return {
          title: isRTL ? 'نقاط مكتسبة من طلب' : 'Points Earned from Order',
          desc: isRTL ? 'مكافأة الشراء بقيمة 1 نقطة لكل جنيه' : '1 point per EGP purchase reward',
          icon: ShoppingCart,
          color: 'text-green-500 bg-green-500/10 border-green-500/20',
          amountSign: '+'
        };
      case 'redeem':
        return {
          title: isRTL ? 'نقاط مستبدلة بخصم' : 'Points Redeemed for Discount',
          desc: isRTL ? 'خصم مالي مطبق على قيمة سلتك' : 'Cash discount applied to your checkout cart',
          icon: ArrowDownLeft,
          color: 'text-red-500 bg-red-500/10 border-red-500/20',
          amountSign: '-'
        };
      case 'referral_inviter':
        return {
          title: isRTL ? 'مكافأة دعوة صديق' : 'Friend Invitation Bonus',
          desc: isRTL ? 'تسجيل ناجح لعميل جديد باستخدام كودك' : 'Successful new customer signup using your code',
          icon: UserCheck,
          color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
          amountSign: '+'
        };
      case 'referral_invited':
        return {
          title: isRTL ? 'مكافأة التسجيل الترحيبية' : 'Welcome Signup Reward',
          desc: isRTL ? 'هدية استخدام كود دعوة صديق عند التسجيل' : 'Bonus for joining via referral invitation code',
          icon: Gift,
          color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
          amountSign: '+'
        };
      default:
        return {
          title: isRTL ? 'معاملة نقاط' : 'Points Transaction',
          desc: '',
          icon: ArrowUpRight,
          color: 'text-primary bg-primary/10 border-primary/20',
          amountSign: '+'
        };
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-black text-xs text-theme-text border-b border-theme-border pb-2 uppercase tracking-wider">
        {isRTL ? 'سجل المعاملات وحركة النقاط' : 'Points Transaction History'}
      </h4>

      {pointsHistory.length === 0 ? (
        <div className="text-center py-8 bg-theme-bg/30 rounded-2xl border border-theme-border border-dashed text-theme-muted font-bold text-xs">
          {isRTL ? 'لا توجد معاملات نقاط مسجلة حالياً.' : 'No points transactions recorded yet.'}
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
          {pointsHistory.map((item) => {
            const details = getTransactionDetails(item.type, item.points);
            const Icon = details.icon;
            
            return (
              <div 
                key={item.id}
                className="p-3.5 bg-theme-card border border-theme-border rounded-2xl flex items-center justify-between transition hover:border-theme-border/80"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border ${details.color} shrink-0`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <h5 className="font-black text-xs text-theme-text leading-tight">{details.title}</h5>
                    <p className="text-[9px] text-theme-muted font-bold mt-1 leading-none">{details.desc}</p>
                    {item.orderId && (
                      <span className="text-[8px] bg-theme-bg border border-theme-border px-1.5 py-0.5 rounded mt-1.5 inline-block font-mono font-bold text-theme-muted">
                        ID: {item.orderId}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right flex flex-col items-end shrink-0">
                  <span className={`font-black text-xs ${item.type === 'redeem' ? 'text-red-500' : 'text-green-600'}`}>
                    {details.amountSign}{item.points} {isRTL ? 'نقطة' : 'pts'}
                  </span>
                  <span className="text-[8px] text-theme-muted font-bold mt-1">
                    {new Date(item.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PointsHistory;
