import { useTranslation } from '../../hooks/useTranslation';
import React from 'react';
import { UserCheck, Clock, Award } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export const ReferralHistory: React.FC = () => {
  const { referrals, isRTL } = useApp();

  return (
    <div className="space-y-4">
      <h4 className="font-black text-xs text-theme-text border-b border-theme-border pb-2 uppercase tracking-wider">
        {t('str_1211')}
      </h4>

      {referrals.length === 0 ? (
        <div className="text-center py-8 bg-theme-bg/30 rounded-2xl border border-theme-border border-dashed text-theme-muted font-bold text-xs">
          {t('str_1212')}
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
          {referrals.map((item) => (
            <div 
              key={item.id}
              className="p-3.5 bg-theme-card border border-theme-border rounded-2xl flex items-center justify-between transition hover:border-theme-border/80"
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary p-2.5 rounded-xl border border-primary/20 shrink-0">
                  <UserCheck size={16} />
                </div>
                <div>
                  <h5 className="font-black text-xs text-theme-text leading-tight">{item.invitedName}</h5>
                  <div className="flex items-center gap-1.5 mt-1">
                    {item.status === 'registered' ? (
                      <span className="bg-blue-500/10 text-blue-500 text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-blue-500/10">
                        <Clock size={8} />
                        {t('str_1213')}
                      </span>
                    ) : (
                      <span className="bg-green-500/10 text-green-500 text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-green-500/10">
                        <Award size={8} />
                        {t('str_1214')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right flex flex-col items-end shrink-0">
                <span className="font-black text-xs text-green-600">
                  +{item.pointsAwarded} {t('str_1186')}
                </span>
                <span className="text-[8px] text-theme-muted font-bold mt-1">
                  {new Date(item.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReferralHistory;
