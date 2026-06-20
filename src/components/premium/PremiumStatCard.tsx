import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { PremiumCard } from './PremiumCard';

interface PremiumStatCardProps {
  title: string;
  value: string | number;
  change?: string | number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  sparklinePath?: string;
  glass?: boolean;
  className?: string;
  isLoading?: boolean;
}

export const PremiumStatCard: React.FC<PremiumStatCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  sparklinePath,
  glass = false,
  className = '',
  isLoading = false
}) => {
  return (
    <PremiumCard hoverable={true} glass={glass} className={`flex flex-col justify-between min-h-[120px] ${className}`}>
      {isLoading ? (
        <div className="space-y-3 animate-pulse w-full">
          <div className="h-3 w-1/3 bg-theme-border rounded"></div>
          <div className="h-6 w-2/3 bg-theme-border rounded"></div>
          <div className="h-3 w-1/2 bg-theme-border rounded"></div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-theme-muted uppercase tracking-wider">
              {title}
            </span>
            {icon && (
              <div className="p-2 rounded-xl bg-theme-bg border border-theme-border/60 text-primary">
                {icon}
              </div>
            )}
          </div>
          
          <div className="mt-2.5">
            <h2 className="text-xl font-black text-theme-text font-sans">
              {value}
            </h2>
            
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {change !== undefined && (
                <div className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none
                  ${changeType === 'positive' 
                    ? 'bg-green-500/10 text-green-500' 
                    : changeType === 'negative' 
                    ? 'bg-red-500/10 text-red-500' 
                    : 'bg-theme-border/40 text-theme-muted'
                  }`}
                >
                  {changeType === 'positive' && <TrendingUp size={10} />}
                  {changeType === 'negative' && <TrendingDown size={10} />}
                  <span>{change}</span>
                </div>
              )}
            </div>
          </div>

          {sparklinePath && (
            <div className="h-8 w-full mt-3 opacity-80">
              <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="statGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#FF7A00" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d={sparklinePath}
                  fill="url(#statGradient)"
                  className="stroke-primary"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </>
      )}
    </PremiumCard>
  );
};

export default PremiumStatCard;
